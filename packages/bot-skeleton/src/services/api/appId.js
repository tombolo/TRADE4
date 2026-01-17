import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';
import { getSocketURL, website_name } from '@deriv/shared';
import { getLanguage } from '@deriv/translations';
import APIMiddleware from './api-middleware';

// Hardcoded tokens for app_id 70344 - Replace with your actual tokens
// Demo accounts typically start with VRTC, real accounts with CR/MF/VRW/etc.
const HARDCODED_TOKEN_70344_REAL = 'J89ryMINSOQy5TN'; // Token for real account
const HARDCODED_TOKEN_70344_DEMO = 'UgpxBL9Op1OjkGK'; // Token for demo account (replace if different)

export const generateDerivApiInstance = () => {
    const app_id = 70344;
    const socket_url = `wss://${getSocketURL()}/websockets/v3?app_id=${app_id}&l=${getLanguage()}&brand=${website_name.toLowerCase()}`;

    const deriv_socket = new WebSocket(socket_url);
    const deriv_api = new DerivAPIBasic({
        connection: deriv_socket,
        middleware: new APIMiddleware({}),
    });
    return deriv_api;
};

export const getLoginId = () => {
    const login_id = localStorage.getItem('active_loginid');
    if (login_id && login_id !== 'null') return login_id;
    return null;
};

export const getToken = loginid => {
    let active_loginid = loginid || getLoginId();
    
    // Check if account is demo (starts with VRTC) or real
    const is_demo_account = active_loginid && /^VRTC/.test(active_loginid);
    
    // Use appropriate token based on account type for app_id 70344
    const token = is_demo_account ? HARDCODED_TOKEN_70344_DEMO : HARDCODED_TOKEN_70344_REAL;
    
    return {
        token: token,
        account_id: active_loginid || undefined,
    };
};
