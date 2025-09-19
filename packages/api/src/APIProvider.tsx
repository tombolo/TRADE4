// APIProvider.tsx (with per-account token support + auto reauthorize on switch)
import React, {
    PropsWithChildren,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
// @ts-expect-error `@deriv/deriv-api` is not in TypeScript, Hence we ignore the TS error.
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';
import { getSocketURL, useWS } from '@deriv/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    TSocketEndpointNames,
    TSocketError,
    TSocketRequestPayload,
    TSocketResponseData,
    TSocketSubscribableEndpointNames,
} from '../types';
import { WebSocketUtils } from '@deriv-com/utils';
import { ObjectUtils } from '@deriv-com/utils';

type TSendFunction = <T extends TSocketEndpointNames>(
    name: T,
    payload?: TSocketRequestPayload<T>
) => Promise<TSocketResponseData<T> & TSocketError<T>>;

type TSubscribeFunction = <T extends TSocketSubscribableEndpointNames>(
    name: T,
    payload?: TSocketRequestPayload<T>
) => Promise<{ id: string; subscription: DerivAPIBasic['subscribe'] }>;

type TUnsubscribeFunction = (id: string) => void;

type APIContextData = {
    derivAPI: DerivAPIBasic | null;
    switchEnvironment: (loginid: string | null | undefined) => void;
    send: TSendFunction;
    subscribe: TSubscribeFunction;
    unsubscribe: TUnsubscribeFunction;
    queryClient: QueryClient;
};

const APIContext = createContext<APIContextData | null>(null);

declare global {
    interface Window {
        ReactQueryClient?: QueryClient;
        DerivAPI?: Record<string, DerivAPIBasic>;
        WSConnections?: Record<string, WebSocket>;
    }
}

const getSharedQueryClientContext = (): QueryClient => {
    if (typeof window !== 'undefined' && !window.ReactQueryClient) {
        window.ReactQueryClient = new QueryClient();
    }

    return (typeof window !== 'undefined' && window.ReactQueryClient) || new QueryClient();
};

const getWebSocketURL = () => {
    const endpoint = getSocketURL();
    const app_id = WebSocketUtils.getAppId();
    const language = (typeof window !== 'undefined' && localStorage.getItem('i18n_language')) || '';
    const brand = 'deriv';
    return `wss://${endpoint}/websockets/v3?app_id=${app_id}&l=${language}&brand=${brand}`;
};

const getWebsocketInstance = (wss_url: string, onWSClose: () => void) => {
    if (typeof window === 'undefined') throw new Error('getWebsocketInstance must run in browser');

    if (!window.WSConnections) {
        window.WSConnections = {};
    }

    const existing = window.WSConnections[wss_url];
    if (!existing || !(existing instanceof WebSocket) || [2, 3].includes(existing.readyState)) {
        window.WSConnections[wss_url] = new WebSocket(wss_url);
        window.WSConnections[wss_url].addEventListener('close', () => {
            if (typeof onWSClose === 'function') onWSClose();
        });
    }

    return window.WSConnections[wss_url];
};

export const getActiveWebsocket = () => {
    if (typeof window === 'undefined') return undefined;
    const wss_url = getWebSocketURL();
    return window?.WSConnections?.[wss_url];
};

const initializeDerivAPI = (onWSClose: () => void): DerivAPIBasic => {
    if (typeof window === 'undefined') throw new Error('initializeDerivAPI must run in browser');

    if (!window.DerivAPI) {
        window.DerivAPI = {};
    }

    const wss_url = getWebSocketURL();
    const websocketConnection = getWebsocketInstance(wss_url, onWSClose);

    if (!window.DerivAPI?.[wss_url] || window.DerivAPI?.[wss_url].isConnectionClosed()) {
        window.DerivAPI[wss_url] = new DerivAPIBasic({ connection: websocketConnection });
    }

    return window.DerivAPI?.[wss_url];
};

const queryClient = getSharedQueryClientContext();

const getEnvironment = (loginid: string | null | undefined) => {
    if (typeof window !== 'undefined') {
        const customServerURL = window.localStorage.getItem('config.server_url');
        if (customServerURL) return 'custom';
    }
    if (loginid && /^(VRT|VRW)/.test(loginid)) return 'demo';
    return 'real';
};

type TAPIProviderProps = {
    standalone?: boolean;
};

const APIProvider = ({ children, standalone = false }: PropsWithChildren<TAPIProviderProps>) => {
    const WS = useWS();
    const [reconnect, setReconnect] = useState(false);
    const [activeLoginid, setActiveLoginid] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return (
            window.sessionStorage.getItem('active_loginid') ||
            window.localStorage.getItem('active_loginid')
        );
    });
    const [environment, setEnvironment] = useState<string>(getEnvironment(activeLoginid));
    const standaloneDerivAPI = useRef<DerivAPIBasic | null>(
        standalone ? initializeDerivAPI(() => setReconnect(true)) : null
    );
    const subscriptions = useRef<Record<string, DerivAPIBasic['subscribe']>>();
    const isBrowser = typeof window !== 'undefined';

    /** Detect loginid changes */
    useEffect(() => {
        if (!isBrowser) return;
        const interval = setInterval(() => {
            const newLoginid =
                window.sessionStorage.getItem('active_loginid') ||
                window.localStorage.getItem('active_loginid');
            setActiveLoginid(prevLoginid => {
                if (newLoginid !== prevLoginid) {
                    setEnvironment(getEnvironment(newLoginid));
                    return newLoginid;
                }
                return prevLoginid;
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isBrowser]);

    /** helper */
    const getActiveDerivAPI = () => standaloneDerivAPI.current ?? WS ?? null;

    /** send */
    const send: TSendFunction = (name, payload) => {
        const api = getActiveDerivAPI();
        if (!api) return Promise.reject(new Error('No Deriv API available'));
        return api.send({ [name]: 1, ...(payload as any) });
    };

    /** subscribe */
    const subscribe: TSubscribeFunction = async (name, payload) => {
        const api = getActiveDerivAPI();
        if (!api) throw new Error('No Deriv API available for subscribe');

        const id = await ObjectUtils.hashObject({ name, payload });
        const existing = subscriptions.current?.[id];
        if (existing) return { id, subscription: existing };

        const subscription = api.subscribe({
            [name]: 1,
            subscribe: 1,
            ...(payload ?? {}),
        });

        subscriptions.current = { ...(subscriptions.current ?? {}), [id]: subscription };
        return { id, subscription };
    };

    /** unsubscribe */
    const unsubscribe: TUnsubscribeFunction = id => {
        const existing = subscriptions.current?.[id];
        if (existing) existing.unsubscribe();
    };

    /** Cleanup */
    useEffect(() => {
        const currentDerivApi = standaloneDerivAPI.current;
        const currentSubscriptions = subscriptions.current;

        return () => {
            if (currentSubscriptions) {
                Object.keys(currentSubscriptions).forEach(key => {
                    currentSubscriptions[key].unsubscribe();
                });
            }
            if (currentDerivApi && currentDerivApi.connection.readyState === 1)
                currentDerivApi.disconnect();
        };
    }, []);

    const switchEnvironment = useCallback(
        (loginid: string | null | undefined) => {
            if (!standalone) return;
            const newEnv = getEnvironment(loginid);
            if (newEnv !== 'custom' && newEnv !== environment) {
                setEnvironment(newEnv);
            }
        },
        [environment, standalone]
    );

    /** Keepalive */
    useEffect(() => {
        if (!standalone) return;
        const interval_id = setInterval(() => {
            standaloneDerivAPI.current?.send({ ping: 1 });
        }, 10000);
        return () => clearInterval(interval_id);
    }, [standalone]);

    /** Reinit API when env/loginid changes */
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (standalone || reconnect) {
            standaloneDerivAPI.current = initializeDerivAPI(() => {
                timer = setTimeout(() => setReconnect(true), 500);
            });
            setReconnect(false);
        }
        return () => clearTimeout(timer);
    }, [environment, reconnect, standalone, activeLoginid]);

    /** Core: listen to WS messages */
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const api = getActiveDerivAPI();
        if (!api || !api.connection) return;

        const ws_conn: WebSocket = api.connection;
        const handler = (evt: MessageEvent) => {
            try {
                const data = JSON.parse(evt.data);

                /** Authorize */
                if (data.msg_type === 'authorize' && data.authorize) {
                    const auth = data.authorize;
                    localStorage.setItem('active_loginid', auth.loginid);
                    localStorage.setItem('currency', auth.currency || '');
                    localStorage.setItem('is_virtual', String(!!auth.is_virtual));

                    // ✅ store fullname
                    if (auth.fullname) localStorage.setItem('name', auth.fullname);

                    // ✅ re-save token mapping
                    const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
                    if (tokens[auth.loginid]) {
                        localStorage.setItem('activeToken', tokens[auth.loginid]);
                    }
                }

                /** Balance */
                if (data.msg_type === 'balance' && data.balance) {
                    localStorage.setItem('balance', String(data.balance.balance));
                    localStorage.setItem('currency', data.balance.currency);
                }

                /** Account List */
                if (data.msg_type === 'account_list' && Array.isArray(data.account_list)) {
                    localStorage.setItem('account_list', JSON.stringify(data.account_list));
                    const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
                    const activeAcc =
                        data.account_list.find((a: any) => a.loginid === activeLoginid) ||
                        data.account_list[0];

                    if (activeAcc) {
                        localStorage.setItem('active_loginid', activeAcc.loginid);
                        localStorage.setItem('account_type', activeAcc.account_type || '');
                        localStorage.setItem('currency', activeAcc.currency || '');
                        localStorage.setItem('is_virtual', String(!!activeAcc.is_virtual));

                        // ✅ reauthorize with correct token
                        const token = tokens[activeAcc.loginid];
                        if (token) {
                            send('authorize', { authorize: token } as any);
                            localStorage.setItem('activeToken', token);
                        }
                    }
                }
            } catch {
                /* ignore non-JSON */
            }
        };

        ws_conn.addEventListener('message', handler);

        (async () => {
            const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
            const token = tokens[activeLoginid || ''];
            if (token) {
                await send('authorize', { authorize: token } as any);
                localStorage.setItem('activeToken', token);
            }
            try {
                await send('account_list' as any);
                await subscribe('balance' as any, {} as any);
            } catch { }
        })();

        return () => {
            ws_conn.removeEventListener('message', handler);
        };
    }, [WS, environment, reconnect, activeLoginid, standalone]);

    return (
        <APIContext.Provider
            value={{
                derivAPI: standalone ? standaloneDerivAPI.current : WS,
                switchEnvironment,
                send,
                subscribe,
                unsubscribe,
                queryClient,
            }}
        >
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </APIContext.Provider>
    );
};

export const useAPIContext = () => {
    const context = useContext(APIContext);
    if (!context) throw new Error('useAPIContext must be used within APIProvider');
    return context;
};

export default APIProvider;
