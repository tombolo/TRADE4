import { website_name } from '../config/app-config';
// ✅ Only needed if you still care about per-domain routing
// import { domain_app_ids } from '../config/config';
import { CookieStorage, isStorageSupported, LocalStore } from '../storage/storage';
import { getHubSignupUrl, urlForCurrentDomain } from '../url';
import { deriv_urls } from '../url/constants';
import { routes } from '../routes/routes';

export const redirectToLogin = (is_logged_in: boolean, language: string, has_params = true, redirect_delay = 0) => {
    if (!is_logged_in && isStorageSupported(sessionStorage)) {
        const l = window.location;
        const redirect_url = has_params ? window.location.href : `${l.protocol}//${l.host}${l.pathname}`;
        sessionStorage.setItem('redirect_url', redirect_url);
        setTimeout(() => {
            const new_href = loginUrl({ language });
            window.location.href = new_href;
        }, redirect_delay);
    }
};

export const redirectToSignUp = () => {
    const isDtraderRoute = window.location.pathname.includes(routes.trade);
    window.open(getHubSignupUrl());
};

type TLoginUrl = {
    language: string;
};

export const loginUrl = ({ language }: TLoginUrl) => {
    const server_url = LocalStore.get('config.server_url');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signup_device_cookie = new (CookieStorage as any)('signup_device');
    const signup_device = signup_device_cookie.get('signup_device');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const date_first_contact_cookie = new (CookieStorage as any)('date_first_contact');
    const date_first_contact = date_first_contact_cookie.get('date_first_contact');
    const marketing_queries = `${signup_device ? `&signup_device=${signup_device}` : ''}${date_first_contact ? `&date_first_contact=${date_first_contact}` : ''}`;

    const current_app_id = 70344;

    const getOAuthUrl = () => {
        return `https://oauth.${deriv_urls.DERIV_HOST_NAME}/oauth2/authorize?app_id=${current_app_id}&l=${language}${marketing_queries}&brand=${website_name.toLowerCase()}`;
    };

    if (server_url && /qa/.test(server_url)) {
        return `https://${server_url}/oauth2/authorize?app_id=${current_app_id}&l=${language}${marketing_queries}&brand=${website_name.toLowerCase()}`;
    }

    return urlForCurrentDomain(getOAuthUrl());
};

/**
 * Gets the current user's auth token from localStorage
 * @returns {string|null} The auth token or null if not found
 */
export const getAuthToken = (): string | null => {
    try {
        const accounts = LocalStore.get('client.accounts');
        const activeLoginid = LocalStore.get('active_loginid');
        
        if (!accounts || !activeLoginid) {
            return null;
        }
        
        const accountsData = typeof accounts === 'string' ? JSON.parse(accounts) : accounts;
        return accountsData[activeLoginid]?.token || null;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

/**
 * Stores the auth token in localStorage for the current user
 * @param {string} token - The auth token to store
 * @param {string} loginid - The login ID (optional, uses active_loginid if not provided)
 */
export const storeAuthToken = (token: string, loginid?: string): void => {
    try {
        const activeLoginid = loginid || LocalStore.get('active_loginid');
        
        if (!activeLoginid) {
            console.error('No active loginid found to store token');
            return;
        }
        
        // Get existing accounts data
        const existingAccounts = LocalStore.get('client.accounts');
        const accountsData = existingAccounts ? 
            (typeof existingAccounts === 'string' ? JSON.parse(existingAccounts) : existingAccounts) : 
            {};
        
        // Update the token for the current loginid
        if (!accountsData[activeLoginid]) {
            accountsData[activeLoginid] = {};
        }
        accountsData[activeLoginid].token = token;
        
        // Store back to localStorage
        LocalStore.set('client.accounts', JSON.stringify(accountsData));
        
        // Also store as auth_token for easy access (used by copy trading)
        LocalStore.set('auth_token', token);
        
        console.log('Auth token stored successfully for loginid:', activeLoginid);
    } catch (error) {
        console.error('Error storing auth token:', error);
    }
};

/**
 * Removes the auth token from localStorage
 */
export const removeAuthToken = (): void => {
    try {
        LocalStore.remove('auth_token');
        console.log('Auth token removed from localStorage');
    } catch (error) {
        console.error('Error removing auth token:', error);
    }
};

/**
 * Checks if user is authenticated by verifying token exists
 * @returns {boolean} True if user has a valid token
 */
export const isAuthenticated = (): boolean => {
    const token = getAuthToken();
    return !!token;
};
