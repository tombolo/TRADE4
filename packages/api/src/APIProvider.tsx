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

// This is a temporary workaround to share a single `QueryClient` instance between all the packages.
const getSharedQueryClientContext = (): QueryClient => {
    if (!window.ReactQueryClient) {
        window.ReactQueryClient = new QueryClient();
    }

    return window.ReactQueryClient;
};

/**
 * Retrieves the WebSocket URL based on the current environment.
 * @returns {string} The WebSocket URL.
 */
const getWebSocketURL = () => {
    const endpoint = getSocketURL();
    const app_id = WebSocketUtils.getAppId();
    const language = localStorage.getItem('i18n_language');
    const brand = 'deriv';
    const wss_url = `wss://${endpoint}/websockets/v3?app_id=${app_id}&l=${language}&brand=${brand}`;

    // Add log for WebSocket URL
    console.log('[APIProvider] getWebSocketURL:', wss_url);
    return wss_url;
};

/**
 * Retrieves or initializes a WebSocket instance based on the provided URL.
 * @param {string} wss_url - The WebSocket URL.
 * @returns {WebSocket} The WebSocket instance associated with the provided URL.
 */
const getWebsocketInstance = (wss_url: string, onWSClose: () => void) => {
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

/**
 * Retrieves the active WebSocket instance.
 * @returns {WebSocket} The WebSocket instance associated with the provided URL.
 */
export const getActiveWebsocket = () => {
    const wss_url = getWebSocketURL();

    return window?.WSConnections?.[wss_url];
};

/**
 * Fetches and stores account information including name, email, balance, account type, and token
 */
const fetchAndStoreAccountInfo = async (send: TSendFunction) => {
    try {
        console.log('[APIProvider] Starting to fetch account information...');

        // Get account information
        const accountInfoResponse = await send('get_account_status');
        console.log('[APIProvider] Account Info Response:', accountInfoResponse);

        // Get account balance
        const balanceResponse = await send('balance');
        console.log('[APIProvider] Balance Response:', balanceResponse);

        // Get account settings which contains email
        const accountSettingsResponse = await send('get_settings');
        console.log('[APIProvider] Account Settings Response:', accountSettingsResponse);

        // Get profile information for name
        const profileResponse = await send('get_account_status');
        console.log('[APIProvider] Profile Response:', profileResponse);

        // Extract the required information with better error handling
        const accountInfo = {
            name: accountSettingsResponse?.get_settings?.first_name || 
                  accountSettingsResponse?.get_settings?.last_name || 
                  '',
            email: accountSettingsResponse?.get_settings?.email || '',
            balance: balanceResponse?.balance?.balance || 0,
            account_type: accountInfoResponse?.get_account_status?.status?.includes('financial') ? 'financial' : 'gaming',
            token: localStorage.getItem('client_token') || '',
            loginid: localStorage.getItem('active_loginid') || '',
            currency: balanceResponse?.balance?.currency || localStorage.getItem('currency') || 'USD'
        };

        // Print to console for debugging
        console.log('[APIProvider] Extracted Account Information:', accountInfo);
        console.log('[APIProvider] Raw responses for debugging:');
        console.log('- accountInfoResponse:', accountInfoResponse);
        console.log('- balanceResponse:', balanceResponse);
        console.log('- accountSettingsResponse:', accountSettingsResponse);

        // Store in localStorage
        localStorage.setItem('account_info', JSON.stringify(accountInfo));
        console.log('[APIProvider] Account information stored in localStorage');

        // Also store individual values for backward compatibility
        localStorage.setItem('balance', accountInfo.balance.toString());
        localStorage.setItem('currency', accountInfo.currency);
        localStorage.setItem('account_type', accountInfo.account_type);

    } catch (error) {
        console.error('[APIProvider] Error fetching account information:', error);
        
        // Store fallback data if API calls fail
        const fallbackInfo = {
            name: '',
            email: '',
            balance: 0,
            account_type: 'gaming',
            token: localStorage.getItem('client_token') || '',
            loginid: localStorage.getItem('active_loginid') || '',
            currency: localStorage.getItem('currency') || 'USD'
        };
        
        localStorage.setItem('account_info', JSON.stringify(fallbackInfo));
        console.log('[APIProvider] Stored fallback account information');
    }
};

/**
 * Initializes a DerivAPI instance for the global window. This enables a standalone connection
 * without causing race conditions with deriv-app core stores.
 * @returns {DerivAPIBasic} The initialized DerivAPI instance.
 */
const initializeDerivAPI = (onWSClose: () => void): DerivAPIBasic => {
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

/**
 * Determines the WS environment based on the login ID and custom server URL.
 * @param {string | null | undefined} loginid - The login ID (can be a string, null, or undefined).
 * @returns {string} Returns the WS environment: 'custom', 'real', or 'demo'.
 */
const getEnvironment = (loginid: string | null | undefined) => {
    const customServerURL = window.localStorage.getItem('config.server_url');
    if (customServerURL) return 'custom';

    // If loginid starts with VRT or VRW, it's demo. Otherwise, real.
    if (loginid && /^(VRT|VRW)/.test(loginid)) return 'demo';
    return 'real';
};

type TAPIProviderProps = {
    /** If set to true, the APIProvider will instantiate it's own socket connection. */
    standalone?: boolean;
};

const APIProvider = ({ children, standalone = false }: PropsWithChildren<TAPIProviderProps>) => {
    const WS = useWS();
    const [reconnect, setReconnect] = useState(false);
    const [activeLoginid, setActiveLoginid] = useState(
        window.sessionStorage.getItem('active_loginid') || window.localStorage.getItem('active_loginid')
    );
    const [environment, setEnvironment] = useState(getEnvironment(activeLoginid));

    useEffect(() => {
        const interval = setInterval(() => {
            const newLoginid =
                window.sessionStorage.getItem('active_loginid') || window.localStorage.getItem('active_loginid');
            setActiveLoginid(prevLoginid => {
                if (newLoginid !== prevLoginid) {
                    console.log('[APIProvider] Detected loginid change:', newLoginid);
                    setEnvironment(getEnvironment(newLoginid));

                    // Fetch account information when loginid changes
                    if (standalone && standaloneDerivAPI.current) {
                        fetchAndStoreAccountInfo(send);
                    }

                    return newLoginid;
                }
                return prevLoginid;
            });
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const standaloneDerivAPI = useRef(standalone ? initializeDerivAPI(() => setReconnect(true)) : null);
    const subscriptions = useRef<Record<string, DerivAPIBasic['subscribe']>>();

    useEffect(() => {
        console.log('[APIProvider] Mount: activeLoginid:', activeLoginid, 'environment:', environment);
        console.log('[APIProvider] standalone:', standalone, 'standaloneDerivAPI.current:', !!standaloneDerivAPI.current);

        // Fetch account information on initial mount if standalone
        if (standalone && standaloneDerivAPI.current) {
            console.log('[APIProvider] Calling fetchAndStoreAccountInfo on mount');
            fetchAndStoreAccountInfo(send);
        } else {
            console.log('[APIProvider] Not calling fetchAndStoreAccountInfo - standalone:', standalone, 'API available:', !!standaloneDerivAPI.current);
        }
    }, []);

    useEffect(() => {
        console.log('[APIProvider] Environment changed:', environment, 'activeLoginid:', activeLoginid);
    }, [environment, activeLoginid]);

    const send: TSendFunction = (name, payload) => {
        console.log('[APIProvider] send:', name, payload);
        console.log('[APIProvider] standaloneDerivAPI.current:', !!standaloneDerivAPI.current);
        
        if (!standaloneDerivAPI.current) {
            console.error('[APIProvider] standaloneDerivAPI.current is null!');
            return Promise.reject(new Error('API not initialized'));
        }
        
        const result = standaloneDerivAPI.current.send({ [name]: 1, ...payload });
        console.log('[APIProvider] send result:', result);
        return result;
    };

    const subscribe: TSubscribeFunction = async (name, payload) => {
        console.log('[APIProvider] subscribe:', name, payload);
        const id = await ObjectUtils.hashObject({ name, payload });
        const matchingSubscription = subscriptions.current?.[id];
        if (matchingSubscription) return { id, subscription: matchingSubscription };

        const { payload: _payload } = payload ?? {};

        const subscription = standaloneDerivAPI.current?.subscribe({
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

                // Fetch account information after environment switch
                fetchAndStoreAccountInfo(send);
            }
        },
        [environment, standalone]
    );

    useEffect(() => {
        let interval_id: ReturnType<typeof setInterval>;

        if (standalone) {
            interval_id = setInterval(() => {
                console.log('[APIProvider] Sending ping to keep connection alive.');
                standaloneDerivAPI.current?.send({ ping: 1 });
            }, 10000);
        }

        return () => clearInterval(interval_id);
    }, [standalone]);

    useEffect(() => {
        let reconnectTimerId: NodeJS.Timeout;
        if (standalone || reconnect) {
            console.log('[APIProvider] Re-initializing DerivAPI for environment:', environment, 'activeLoginid:', activeLoginid);
            standaloneDerivAPI.current = initializeDerivAPI(() => {
                reconnectTimerId = setTimeout(() => setReconnect(true), 500);
            });
            setReconnect(false);

            // Fetch account information after reconnection
            if (standalone) {
                fetchAndStoreAccountInfo(send);
            }
        }

        return () => clearTimeout(reconnectTimerId);
    }, [environment, reconnect, standalone]);

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
                {/* <ReactQueryDevtools /> */}
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