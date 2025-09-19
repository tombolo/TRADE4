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

    // Initialize tokens storage
    useEffect(() => {
        if (!isBrowser) return;

        if (!localStorage.getItem('tokens')) {
            localStorage.setItem('tokens', JSON.stringify({}));
        }

        // Store current token for active loginid
        const currentToken = localStorage.getItem('activeToken');
        const currentLoginid = localStorage.getItem('active_loginid');

        if (currentToken && currentLoginid) {
            const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
            tokens[currentLoginid] = currentToken;
            localStorage.setItem('tokens', JSON.stringify(tokens));
        }
    }, [isBrowser]);

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
                // Preserve the token before switching
                const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
                const currentToken = localStorage.getItem('activeToken');
                const currentLoginid = localStorage.getItem('active_loginid');

                if (currentToken && currentLoginid) {
                    tokens[currentLoginid] = currentToken;
                    localStorage.setItem('tokens', JSON.stringify(tokens));
                }

                // Set new loginid and environment
                if (loginid) {
                    localStorage.setItem('active_loginid', loginid);
                    setActiveLoginid(loginid);
                }

                setEnvironment(newEnv);

                // Force reconnection to apply new environment
                setReconnect(true);
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
            console.log('Reinitializing API for environment:', environment, 'loginid:', activeLoginid);

            standaloneDerivAPI.current = initializeDerivAPI(() => {
                timer = setTimeout(() => setReconnect(true), 1000);
            });

            setReconnect(false);

            // Reauthorize after reconnection
            if (standaloneDerivAPI.current) {
                const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
                const token = tokens[activeLoginid || ''];

                if (token) {
                    setTimeout(() => {
                        standaloneDerivAPI.current?.send({ authorize: token });
                        localStorage.setItem('activeToken', token);
                    }, 100);
                }
            }
        }

        return () => clearTimeout(timer);
    }, [environment, reconnect, standalone, activeLoginid]);

    /** Core: listen to WS messages and handle authentication */
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const api = getActiveDerivAPI();
        if (!api || !api.connection) return;

        const ws_conn: WebSocket = api.connection;

        const messageHandler = (evt: MessageEvent) => {
            try {
                const data = JSON.parse(evt.data);

                // Handle authorize response
                if (data.msg_type === 'authorize' && data.authorize) {
                    const auth = data.authorize;
                    localStorage.setItem('active_loginid', auth.loginid);
                    localStorage.setItem('currency', auth.currency || '');
                    localStorage.setItem('is_virtual', String(!!auth.is_virtual));

                    if (auth.fullname) localStorage.setItem('name', auth.fullname);

                    // Store token for this specific loginid
                    const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
                    const currentToken = localStorage.getItem('activeToken');
                    if (currentToken) {
                        tokens[auth.loginid] = currentToken;
                        localStorage.setItem('tokens', JSON.stringify(tokens));
                    }
                }

                // Handle balance updates
                if (data.msg_type === 'balance' && data.balance) {
                    localStorage.setItem('balance', String(data.balance.balance));
                    if (data.balance.currency) {
                        localStorage.setItem('currency', data.balance.currency);
                    }
                }

                // Handle account list
                if (data.msg_type === 'account_list' && Array.isArray(data.account_list)) {
                    localStorage.setItem('account_list', JSON.stringify(data.account_list));

                    const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
                    const activeAcc = data.account_list.find((a: any) => a.loginid === activeLoginid) || data.account_list[0];

                    if (activeAcc) {
                        localStorage.setItem('active_loginid', activeAcc.loginid);
                        localStorage.setItem('account_type', activeAcc.account_type || '');
                        localStorage.setItem('currency', activeAcc.currency || '');
                        localStorage.setItem('is_virtual', String(!!activeAcc.is_virtual));

                        // Get token for this specific account
                        const token = tokens[activeAcc.loginid];
                        if (token) {
                            localStorage.setItem('activeToken', token);
                            // Reauthorize with the correct token
                            send('authorize', { authorize: token } as any);
                        }
                    }
                }
            } catch (error) {
                // Ignore non-JSON messages or parse errors
                console.debug('Message parse error:', error);
            }
        };

        const reauthorizeConnection = async () => {
            try {
                const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
                const token = tokens[activeLoginid || ''];

                if (token) {
                    await send('authorize', { authorize: token } as any);
                    localStorage.setItem('activeToken', token);
                }

                // Refresh account data
                await send('account_list' as any);
                await subscribe('balance' as any, {} as any);
            } catch (error) {
                console.debug('Reauthorization error:', error);
            }
        };

        ws_conn.addEventListener('message', messageHandler);

        // Reauthorize when connection opens or when activeLoginid changes
        if (ws_conn.readyState === WebSocket.OPEN) {
            reauthorizeConnection();
        } else {
            ws_conn.addEventListener('open', reauthorizeConnection);
        }

        return () => {
            ws_conn.removeEventListener('message', messageHandler);
            ws_conn.removeEventListener('open', reauthorizeConnection);
        };
    }, [WS, environment, reconnect, activeLoginid, standalone, send, subscribe]);

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