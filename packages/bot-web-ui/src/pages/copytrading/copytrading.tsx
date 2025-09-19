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

    const { isDesktop } = useDevice();

    const loadAccountData = () => {
        const stored_balance = localStorage.getItem('balance');
        const stored_currency = localStorage.getItem('currency');
        const stored_loginid = localStorage.getItem('active_loginid');
        const stored_type = localStorage.getItem('account_type');

        if (stored_balance) setBalance(parseFloat(stored_balance).toFixed(2));
        if (stored_currency) setCurrency(stored_currency);
        if (stored_loginid) setLoginid(stored_loginid);
        if (stored_type) setAccountType(stored_type);
    };

    useEffect(() => {
        loadAccountData();

        const handleStorageChange = () => {
            loadAccountData();
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
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

    return (
        <div className={styles.copytrading__wrapper}>
            <div className={styles.copytrading__container}>
                {/* Header */}
                <header className={styles.copytrading__header}>
                    <div className={styles.copytrading__logo}>
                        <div className={styles.copytrading__logo_icon}>
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" />
                                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" />
                                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" />
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
                    <div className={styles.copytrading__card}>
                        <h3 className={styles.copytrading__card_title}>
                            <span>📈</span>
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
                            className={styles.copytrading__button}
                            onClick={isCopyTrading ? handleStopCopyTrading : handleStartCopyTrading}
                            disabled={!traderToken.trim() || (traderToken.trim().length < 15 && !isCopyTrading)}
                        >
                            {isCopyTrading ? '🛑 Stop Copy Trading' : '🚀 Start Copy Trading'}
                        </button>

                        <div className={styles.copytrading__stats_grid}>
                            <div className={styles.copytrading__stat_item}>
                                <div className={styles.copytrading__stat_icon}>📊</div>
                                <div className={styles.copytrading__stat_value}>{copiedTrades}</div>
                                <div className={styles.copytrading__stat_label}>Copied Trades</div>
                            </div>
                            <div className={styles.copytrading__stat_item}>
                                <div className={styles.copytrading__stat_icon}>📈</div>
                                <div className={styles.copytrading__stat_value}>--%</div>
                                <div className={styles.copytrading__stat_label}>Success Rate</div>
                            </div>
                            <div className={styles.copytrading__stat_item}>
                                <div className={styles.copytrading__stat_icon}>👥</div>
                                <div className={styles.copytrading__stat_value}>1</div>
                                <div className={styles.copytrading__stat_label}>Active Traders</div>
                            </div>
                        </div>
                    </div>

                    {/* Account Info Card */}
                    <div className={styles.copytrading__card}>
                        <h3 className={styles.copytrading__card_title}>
                            <span>👤</span>
                            Account Information
                        </h3>

                        <div className={styles.copytrading__details}>
                            <div style={{ marginBottom: '20px' }}>
                                <Text size="xs" color="less-prominent" className={styles.copytrading__label}>
                                    Login ID
                                </Text>
                                <Text size="s" weight="bold" className={styles.copytrading__balance}>
                                    {loginid || '---'}
                                </Text>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <Text size="xs" color="less-prominent" className={styles.copytrading__label}>
                                    Balance
                                </Text>
                                <Text size="s" weight="bold" className={styles.copytrading__balance}>
                                    {currency ? `${balance} ${getCurrencyDisplayCode(currency)}` : '---'}
                                </Text>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <Text size="xs" color="less-prominent" className={styles.copytrading__label}>
                                    Account Type
                                </Text>
                                <Text size="s" weight="bold">
                                    <DisplayAccountType account_type={accountType} is_eu={false} />
                                </Text>
                            </div>

                            <div>
                                <Text size="xs" color="less-prominent" className={styles.copytrading__label}>
                                    Status
                                </Text>
                                <Text
                                    size="s"
                                    weight="bold"
                                    color={isCopyTrading ? 'profit-success' : 'less-prominent'}
                                >
                                    {isCopyTrading ? 'Active ✅' : 'Inactive'}
                                </Text>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CopyTradingPage;