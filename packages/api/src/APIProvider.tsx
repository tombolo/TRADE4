// APIProvider.tsx (updated)
import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
    const wss_url = `wss://${endpoint}/websockets/v3?app_id=${app_id}&l=${language}&brand=${brand}`;

    console.log('[APIProvider] getWebSocketURL:', wss_url);
    return wss_url;
};

const getWebsocketInstance = (wss_url: string, onWSClose: () => void) => {
    if (typeof window === 'undefined') throw new Error('getWebsocketInstance must run in browser');

    if (!window.WSConnections) {
        window.WSConnections = {};
    }

    const existingWebsocketInstance = window.WSConnections[wss_url];
    if (
        !existingWebsocketInstance ||
        !(existingWebsocketInstance instanceof WebSocket) ||
        [2, 3].includes(existingWebsocketInstance.readyState)
    ) {
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
        return window.sessionStorage.getItem('active_loginid') || window.localStorage.getItem('active_loginid');
    });
    const [environment, setEnvironment] = useState<string>(getEnvironment(activeLoginid));
    const standaloneDerivAPI = useRef<DerivAPIBasic | null>(standalone ? initializeDerivAPI(() => setReconnect(true)) : null);
    const subscriptions = useRef<Record<string, DerivAPIBasic['subscribe']>>();
    const isBrowser = typeof window !== 'undefined';

    useEffect(() => {
        if (!isBrowser) return;
        const interval = setInterval(() => {
            const newLoginid =
                window.sessionStorage.getItem('active_loginid') || window.localStorage.getItem('active_loginid');
            setActiveLoginid(prevLoginid => {
                if (newLoginid !== prevLoginid) {
                    console.log('[APIProvider] Detected loginid change:', newLoginid);
                    setEnvironment(getEnvironment(newLoginid));
                    return newLoginid;
                }
                return prevLoginid;
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isBrowser]);

    useEffect(() => {
        console.log('[APIProvider] Mount: activeLoginid:', activeLoginid, 'environment:', environment);
    }, []); // one-time mount log

    useEffect(() => {
        console.log('[APIProvider] Environment changed:', environment, 'activeLoginid:', activeLoginid);
    }, [environment, activeLoginid]);

    // helper to return the active DerivAPI instance (standalone OR shared WS)
    const getActiveDerivAPI = () => standaloneDerivAPI.current ?? WS ?? null;

    // make send/subcribe use the active API (standalone preferred)
    const send: TSendFunction = (name, payload) => {
        const api = getActiveDerivAPI();
        console.log('[APIProvider] send:', name, payload, 'using API?', !!api);
        if (!api) return Promise.reject(new Error('No Deriv API available'));
        // DerivAPIBasic send expects an object like { <name>: 1, ...payload }
        return api.send({ [name]: 1, ...(payload as any) });
    };

    const subscribe: TSubscribeFunction = async (name, payload) => {
        const api = getActiveDerivAPI();
        console.log('[APIProvider] subscribe:', name, payload, 'using API?', !!api);
        if (!api) throw new Error('No Deriv API available for subscribe');

        const id = await ObjectUtils.hashObject({ name, payload });
        const matchingSubscription = subscriptions.current?.[id];
        if (matchingSubscription) return { id, subscription: matchingSubscription };

        const { payload: _payload } = payload ?? {};

        const subscription = api.subscribe({
            [name]: 1,
            subscribe: 1,
            ...(_payload ?? {}),
        });

        subscriptions.current = { ...(subscriptions.current ?? {}), ...{ [id]: subscription } };
        return { id, subscription };
    };

    const unsubscribe: TUnsubscribeFunction = id => {
        console.log('[APIProvider] unsubscribe:', id);
        const matchingSubscription = subscriptions.current?.[id];
        if (matchingSubscription) matchingSubscription.unsubscribe();
    };

    useEffect(() => {
        const currentDerivApi = standaloneDerivAPI.current;
        const currentSubscriptions = subscriptions.current;

        return () => {
            console.log('[APIProvider] Cleanup: disconnecting API and unsubscribing.');
            if (currentSubscriptions) {
                Object.keys(currentSubscriptions).forEach(key => {
                    currentSubscriptions[key].unsubscribe();
                });
            }
            if (currentDerivApi && currentDerivApi.connection.readyState === 1) currentDerivApi.disconnect();
        };
    }, []);

    const switchEnvironment = useCallback(
        (loginid: string | null | undefined) => {
            if (!standalone) return;
            const currentEnvironment = getEnvironment(loginid);
            console.log('[APIProvider] switchEnvironment called with loginid:', loginid, 'currentEnvironment:', currentEnvironment, 'prevEnvironment:', environment);
            if (currentEnvironment !== 'custom' && currentEnvironment !== environment) {
                setEnvironment(currentEnvironment);
            }
        },
        [environment, standalone]
    );

    // keepalive ping (only for standalone mode)
    useEffect(() => {
        if (!standalone) return;
        let interval_id: ReturnType<typeof setInterval>;
        interval_id = setInterval(() => {
            console.log('[APIProvider] Sending ping to keep connection alive.');
            standaloneDerivAPI.current?.send({ ping: 1 });
        }, 10000);

        return () => clearInterval(interval_id);
    }, [standalone]);

    // Re-initialize API when environment/reconnect changes (existing behaviour)
    useEffect(() => {
        let reconnectTimerId: NodeJS.Timeout;
        if (standalone || reconnect) {
            console.log('[APIProvider] Re-initializing DerivAPI for environment:', environment, 'activeLoginid:', activeLoginid);
            standaloneDerivAPI.current = initializeDerivAPI(() => {
                reconnectTimerId = setTimeout(() => setReconnect(true), 500);
            });
            setReconnect(false);
        }

        return () => clearTimeout(reconnectTimerId);
    }, [environment, reconnect, standalone, activeLoginid]);

    /**
     * NEW: Listen for websocket messages (raw) and persist account / balance data into localStorage
     * Also: when API becomes available, request account_list and balance proactively and store results.
     */
    useEffect(() => {
        // run only in browser
        if (typeof window === 'undefined') return;

        const api = getActiveDerivAPI();
        if (!api || !api.connection) return;

        // Raw websocket message listener
        const ws_conn: WebSocket = api.connection;
        const messageHandler = (evt: MessageEvent) => {
            try {
                const data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;

                // --- AUTHORIZE ---
                if (data.msg_type === 'authorize' || data.authorize) {
                    const authorize_payload = data.authorize ?? data;
                    if (authorize_payload.loginid) {
                        console.log('[APIProvider] authorize -> loginid:', authorize_payload.loginid);
                        localStorage.setItem('active_loginid', String(authorize_payload.loginid));
                    }
                    if (authorize_payload.fullname) {
                        console.log('[APIProvider] authorize -> fullname:', authorize_payload.fullname);
                        localStorage.setItem('name', String(authorize_payload.fullname));
                    }
                    if (typeof authorize_payload.is_virtual !== 'undefined') {
                        localStorage.setItem('is_virtual', String(Boolean(authorize_payload.is_virtual)));
                    }
                    if (authorize_payload.currency) {
                        localStorage.setItem('currency', String(authorize_payload.currency));
                    }
                }

                // --- BALANCE ---
                if (data.msg_type === 'balance' || data.balance) {
                    const bal_payload = data.balance ?? data;
                    // balance may be inside bal_payload.balance (object) or top-level
                    const bal_value = bal_payload.balance?.balance ?? bal_payload.balance ?? bal_payload;
                    const bal_currency = bal_payload.balance?.currency ?? bal_payload.currency;
                    if (typeof bal_value !== 'undefined') {
                        console.log('[APIProvider] balance ->', bal_value, bal_currency);
                        // store numeric string
                        const bal_str = typeof bal_value === 'object' && bal_value.balance ? String(bal_value.balance) : String(bal_value);
                        localStorage.setItem('balance', bal_str);
                    }
                    if (bal_currency) localStorage.setItem('currency', String(bal_currency));
                }

                // --- ACCOUNT LIST ---
                if (data.msg_type === 'account_list' || data.account_list) {
                    const list = data.account_list ?? data.account_list;
                    try {
                        const account_list = Array.isArray(list) ? list : data.account_list;
                        if (Array.isArray(account_list)) {
                            console.log('[APIProvider] account_list ->', account_list);
                            localStorage.setItem('account_list', JSON.stringify(account_list));
                            // choose an "active" account: prefer activeLoginid, else first
                            const activeAcc =
                                account_list.find((a: any) => a.loginid === activeLoginid) || account_list[0];
                            if (activeAcc) {
                                localStorage.setItem('active_loginid', activeAcc.loginid);
                                if (activeAcc.account_type) localStorage.setItem('account_type', String(activeAcc.account_type));
                                if (activeAcc.currency) localStorage.setItem('currency', String(activeAcc.currency));
                                if (typeof activeAcc.is_virtual !== 'undefined') localStorage.setItem('is_virtual', String(Boolean(activeAcc.is_virtual)));
                                console.log('[APIProvider] active account stored:', activeAcc);
                            }
                        }
                    } catch (err) {
                        console.warn('[APIProvider] failed to parse account_list', err);
                    }
                }
            } catch (err) {
                // non-JSON or other message
                // console.debug('[APIProvider] message parse error', err);
            }
        };

        ws_conn.addEventListener('message', messageHandler);

        // Proactively request account_list and balance when API becomes available
        (async () => {
            try {
                // If there's an activeToken in localStorage, authorize first (safe to call repeatedly)
                const token = localStorage.getItem('activeToken');
                if (token) {
                    try {
                        // using our send wrapper so it picks active API
                        await send('authorize', token as any);
                    } catch (e) {
                        // some setups may already be authorized - ignore
                        console.debug('[APIProvider] authorize send error (ignored):', e);
                    }
                }

                // request account_list (one-off)
                try {
                    const account_list_res = await send('account_list' as any);
                    if (account_list_res && (account_list_res as any).account_list) {
                        const list = (account_list_res as any).account_list;
                        localStorage.setItem('account_list', JSON.stringify(list));
                        const activeAcc = list.find((a: any) => a.loginid === activeLoginid) || list[0];
                        if (activeAcc) {
                            localStorage.setItem('active_loginid', activeAcc.loginid);
                            if (activeAcc.account_type) localStorage.setItem('account_type', String(activeAcc.account_type));
                            if (activeAcc.currency) localStorage.setItem('currency', String(activeAcc.currency));
                            if (typeof activeAcc.is_virtual !== 'undefined') localStorage.setItem('is_virtual', String(Boolean(activeAcc.is_virtual)));
                            console.log('[APIProvider] account_list (send) stored active account:', activeAcc);
                        }
                    }
                } catch (err) {
                    // not fatal: maybe subscription or permission issues
                    console.debug('[APIProvider] account_list send error (ignored):', err);
                }

                // subscribe to balance to receive live updates (server will push balance messages)
                try {
                    await subscribe('balance' as any, {} as any);
                    // immediate response may include a balance object that will be handled by the message handler above
                    console.log('[APIProvider] subscribed to balance updates');
                } catch (err) {
                    console.debug('[APIProvider] subscribe(balance) error (ignored):', err);
                }
            } catch (err) {
                console.warn('[APIProvider] proactive fetch/store error:', err);
            }
        })();

        return () => {
            ws_conn.removeEventListener('message', messageHandler);
        };
        // re-run when any of these change (active API may change when env/loginid/reconnect changes)
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
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </APIContext.Provider>
    );
};

export const useAPIContext = () => {
    const context = useContext(APIContext);
    if (!context) {
        throw new Error('useAPIContext must be used within APIProvider');
    }
    return context;
};

export default APIProvider;
