import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Icon, Text } from '@deriv/components';
import { Localize } from '@deriv/translations';
import { getCurrencyDisplayCode } from '@deriv/shared';
import { useDevice } from '@deriv-com/ui';
import AccountInfoWrapper from '../../../../core/src/App/Components/Layout/Header/account-info-wrapper';
import AccountInfoIcon from '../../../../core/src/App/Components/Layout/Header/account-info-icon';
import DisplayAccountType from '../../../../core/src/App/Components/Layout/Header/display-account-type';
import styles from './CopyTradingPage.module.scss';

const CopyTradingPage: React.FC = () => {
    const [balance, setBalance] = useState<string>('0.00');
    const [currency, setCurrency] = useState<string>('');
    const [loginid, setLoginid] = useState<string>('');
    const [accountType, setAccountType] = useState<string>('Real');
    const [traderToken, setTraderToken] = useState<string>('');
    const [isCopyTrading, setIsCopyTrading] = useState<boolean>(false);
    const [copiedTrades, setCopiedTrades] = useState<number>(0);
    const [accountName, setAccountName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [token, setToken] = useState<string>('');

    const { isDesktop } = useDevice();

    const loadAccountData = () => {
        console.log('[CopyTrading] Loading account data...');
        
        // Get data from the new account_info object in localStorage
        const accountInfoStr = localStorage.getItem('account_info');
        console.log('[CopyTrading] Raw account_info from localStorage:', accountInfoStr);

        if (accountInfoStr) {
            try {
                const accountInfo = JSON.parse(accountInfoStr);
                console.log('[CopyTrading] Parsed account info:', accountInfo);

                // Set all the account information
                if (accountInfo.balance !== undefined) {
                    setBalance(parseFloat(accountInfo.balance).toFixed(2));
                }
                if (accountInfo.loginid) {
                    setLoginid(accountInfo.loginid);
                }
                if (accountInfo.account_type) {
                    setAccountType(accountInfo.account_type);
                }
                if (accountInfo.name) {
                    setAccountName(accountInfo.name);
                }
                if (accountInfo.email) {
                    setEmail(accountInfo.email);
                }
                if (accountInfo.token) {
                    setToken(accountInfo.token);
                }
                if (accountInfo.currency) {
                    setCurrency(accountInfo.currency);
                }

                console.log('[CopyTrading] Account data loaded successfully');
            } catch (error) {
                console.error('[CopyTrading] Error parsing account info:', error);
            }
        } else {
            console.log('[CopyTrading] No account_info found, using fallback method');
            
            // Fallback to old storage method if new method not available
            const stored_balance = localStorage.getItem('balance');
            const stored_currency = localStorage.getItem('currency');
            const stored_loginid = localStorage.getItem('active_loginid');
            const stored_type = localStorage.getItem('account_type');

            console.log('[CopyTrading] Fallback data:', {
                balance: stored_balance,
                currency: stored_currency,
                loginid: stored_loginid,
                type: stored_type
            });

            if (stored_balance) {
                // Handle case where balance might be stored as an object
                const balanceValue = typeof stored_balance === 'string' ? stored_balance : JSON.stringify(stored_balance);
                const parsedBalance = parseFloat(balanceValue);
                if (!isNaN(parsedBalance)) {
                    setBalance(parsedBalance.toFixed(2));
                } else {
                    console.warn('[CopyTrading] Invalid balance value:', stored_balance);
                    setBalance('0.00');
                }
            }
            if (stored_currency) setCurrency(stored_currency);
            if (stored_loginid) setLoginid(stored_loginid);
            if (stored_type) setAccountType(stored_type);
        }
    };

    useEffect(() => {
        loadAccountData();

        const handleStorageChange = () => {
            loadAccountData();
        };

        // Listen for storage changes
        window.addEventListener('storage', handleStorageChange);

        // Also refresh data periodically to catch updates
        const refreshInterval = setInterval(() => {
            loadAccountData();
        }, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(refreshInterval);
        };
    }, []);

    const handleStartCopyTrading = () => {
        if (traderToken.trim().length >= 15) {
            setIsCopyTrading(true);
            // Simulate trade copying
            const interval = setInterval(() => {
                setCopiedTrades(prev => prev + 1);
            }, 5000);

            return () => clearInterval(interval);
        }
    };

    const handleStopCopyTrading = () => {
        setIsCopyTrading(false);
    };

    const handleRefreshAccountData = () => {
        console.log('[CopyTrading] Manual refresh triggered');
        loadAccountData();
        
        // Also trigger a storage event to simulate data update
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'account_info',
            newValue: localStorage.getItem('account_info')
        }));
    };

    const handleFetchAccountInfo = async () => {
        console.log('[CopyTrading] Manual fetch account info triggered');
        
        try {
            // Try to manually fetch account info using the API
            const response = await fetch('/api/account-info', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('[CopyTrading] Manual fetch result:', data);
                
                // Store the data in localStorage
                localStorage.setItem('account_info', JSON.stringify(data));
                
                // Reload the data
                loadAccountData();
            } else {
                console.error('[CopyTrading] Manual fetch failed:', response.status);
            }
        } catch (error) {
            console.error('[CopyTrading] Manual fetch error:', error);
            
            // Create a mock account info for testing
            const mockAccountInfo = {
                name: 'Test User',
                email: 'test@example.com',
                balance: 1000.50,
                account_type: 'gaming',
                token: 'test_token_12345',
                loginid: localStorage.getItem('active_loginid') || 'VRTC5787615',
                currency: 'USD'
            };
            
            localStorage.setItem('account_info', JSON.stringify(mockAccountInfo));
            loadAccountData();
        }
    };

    return (
        <div className={styles.copytrading__wrapper}>
            <div className={styles.copytrading__container}>
                {/* Header */}
                <header className={styles.copytrading__header}>
                    <div className={styles.copytrading__logo}>
                        <div className={styles.copytrading__logo_icon}>
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <span className={styles.copytrading__logo_text}>CopyTrade Pro</span>
                    </div>

                    <AccountInfoWrapper is_disabled={false} disabled_message="" is_mobile={!isDesktop}>
                        <div
                            data-testid="dt_acc_info"
                            id="dt_core_account-info_acc-info"
                            className={styles.copytrading__acc_info}
                        >
                            <span className={styles.copytrading__icon}>
                                <AccountInfoIcon
                                    is_virtual={accountType.toLowerCase() === 'demo'}
                                    currency={currency.toLowerCase()}
                                />
                            </span>

                            <div className={styles.copytrading__details}>
                                <p
                                    data-testid="dt_balance"
                                    className={classNames(styles.copytrading__balance, {
                                        [styles.copytrading__balance_no_currency]: !currency,
                                    })}
                                >
                                    {!currency ? (
                                        <Localize i18n_default_text="No currency assigned" />
                                    ) : (
                                        `${balance} ${getCurrencyDisplayCode(currency)}`
                                    )}
                                </p>
                                <Text size="xxxs" line_height="s" className={styles.copytrading__account_type}>
                                    <DisplayAccountType account_type={accountType} is_eu={false} />
                                </Text>
                                {loginid && (
                                    <Text size="xxxs" line_height="s" className={styles.copytrading__loginid}>
                                        ID: {loginid}
                                    </Text>
                                )}
                            </div>

                            <Icon
                                data_testid="dt_select_arrow"
                                icon="IcChevronDownBold"
                                className={styles.copytrading__select_arrow}
                            />
                        </div>
                    </AccountInfoWrapper>
                </header>

                {/* Main Content */}
                <main className={styles.copytrading__main}>
                    {/* Trading Controls Card */}
                    <div className={classNames(styles.copytrading__card, styles.copytrading__card_controls)}>
                        <h3 className={styles.copytrading__card_title}>
                            <span className={styles.copytrading__card_icon}>📈</span>
                            Copy Trading Controls
                        </h3>

                        <div className={styles.copytrading__input_group}>
                            <label className={styles.copytrading__label}>
                                Trader API Token
                            </label>
                            <input
                                type="text"
                                placeholder="Enter trader's API token (15-32 characters)"
                                value={traderToken}
                                onChange={(e) => setTraderToken(e.target.value)}
                                disabled={isCopyTrading}
                                className={styles.copytrading__input}
                            />
                        </div>

                        <button
                            className={classNames(styles.copytrading__button, {
                                [styles.copytrading__button_active]: isCopyTrading,
                                [styles.copytrading__button_inactive]: !isCopyTrading,
                            })}
                            onClick={isCopyTrading ? handleStopCopyTrading : handleStartCopyTrading}
                            disabled={!traderToken.trim() || (traderToken.trim().length < 15 && !isCopyTrading)}
                        >
                            <span className={styles.copytrading__button_icon}>
                                {isCopyTrading ? '🛑' : '🚀'}
                            </span>
                            {isCopyTrading ? 'Stop Copy Trading' : 'Start Copy Trading'}
                        </button>

                        <div className={styles.copytrading__stats_grid}>
                            <div className={styles.copytrading__stats_item}>
                                <div className={styles.copytrading__stats_icon}>📊</div>
                                <div className={styles.copytrading__stats_value}>{copiedTrades}</div>
                                <div className={styles.copytrading__stats_label}>Copied Trades</div>
                            </div>
                            <div className={styles.copytrading__stats_item}>
                                <div className={styles.copytrading__stats_icon}>📈</div>
                                <div className={styles.copytrading__stats_value}>--%</div>
                                <div className={styles.copytrading__stats_label}>Success Rate</div>
                            </div>
                            <div className={styles.copytrading__stats_item}>
                                <div className={styles.copytrading__stats_icon}>👥</div>
                                <div className={styles.copytrading__stats_value}>1</div>
                                <div className={styles.copytrading__stats_label}>Active Traders</div>
                            </div>
                        </div>
                    </div>

                    {/* Account Info Card */}
                    <div className={classNames(styles.copytrading__card, styles.copytrading__card_account)}>
                        <div className={styles.copytrading__card_header}>
                            <h3 className={styles.copytrading__card_title}>
                                <span className={styles.copytrading__card_icon}>👤</span>
                                Account Information
                            </h3>
                            <div className={styles.copytrading__button_group}>
                                <button 
                                    className={styles.copytrading__refresh_button}
                                    onClick={handleRefreshAccountData}
                                    title="Refresh account data"
                                >
                                    🔄
                                </button>
                                <button 
                                    className={styles.copytrading__fetch_button}
                                    onClick={handleFetchAccountInfo}
                                    title="Fetch account info from API"
                                >
                                    📡
                                </button>
                            </div>
                        </div>

                        <div className={styles.copytrading__account_details}>
                            <div className={styles.copytrading__account_info_item}>
                                <div className={styles.copytrading__account_info_label}>
                                    Name
                                </div>
                                <div className={styles.copytrading__account_info_value}>
                                    {accountName || '---'}
                                </div>
                            </div>

                            <div className={styles.copytrading__account_info_item}>
                                <div className={styles.copytrading__account_info_label}>
                                    Email
                                </div>
                                <div className={styles.copytrading__account_info_value}>
                                    {email || '---'}
                                </div>
                            </div>

                            <div className={styles.copytrading__account_info_item}>
                                <div className={styles.copytrading__account_info_label}>
                                    Login ID
                                </div>
                                <div className={styles.copytrading__account_info_value}>
                                    {loginid || '---'}
                                </div>
                            </div>

                            <div className={styles.copytrading__account_info_item}>
                                <div className={styles.copytrading__account_info_label}>
                                    Balance
                                </div>
                                <div className={styles.copytrading__account_info_value}>
                                    {currency ? `${balance} ${getCurrencyDisplayCode(currency)}` : '---'}
                                </div>
                            </div>

                            <div className={styles.copytrading__account_info_item}>
                                <div className={styles.copytrading__account_info_label}>
                                    Account Type
                                </div>
                                <div className={styles.copytrading__account_info_value}>
                                    <DisplayAccountType account_type={accountType} is_eu={false} />
                                </div>
                            </div>

                            <div className={styles.copytrading__account_info_item}>
                                <div className={styles.copytrading__account_info_label}>
                                    Token
                                </div>
                                <div className={styles.copytrading__account_info_value}>
                                    {token ? `${token.substring(0, 8)}...` : '---'}
                                </div>
                            </div>

                            <div className={styles.copytrading__account_info_item}>
                                <div className={styles.copytrading__account_info_label}>
                                    Status
                                </div>
                                <div className={classNames(styles.copytrading__account_info_value, {
                                    [styles.copytrading__status_active]: isCopyTrading,
                                    [styles.copytrading__status_inactive]: !isCopyTrading,
                                })}>
                                    {isCopyTrading ? 'Active ✅' : 'Inactive'}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CopyTradingPage;