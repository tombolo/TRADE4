import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import './GlobalLoading.scss';
import Logo from './Logo/ANALYTICS.png'; // Update this path

const GlobalLoading = () => {
    const [progress, setProgress] = useState(0);
    const controls = useAnimation();
    const [showElements, setShowElements] = useState(false);
    const [marketData, setMarketData] = useState({
        eurusd: `1.08${Math.floor(Math.random() * 9)}`,
        btcusd: `6${Math.floor(Math.random() * 9000) + 1000}`,
        sp500: `${Math.floor(Math.random() * 100) + 4500}.${Math.floor(Math.random() * 99)}`,
    });
    const [candleData, setCandleData] = useState([]);
    const containerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Generate initial candle data
        const generateCandleData = () => {
            const candles = [];
            let baseValue = 100;

            for (let i = 0; i < (isMobile ? 12 : 20); i++) {
                const volatility = 2 + Math.random() * 5;
                const open = baseValue;
                const close = open + (Math.random() - 0.5) * volatility;
                const high = Math.max(open, close) + Math.random() * volatility;
                const low = Math.min(open, close) - Math.random() * volatility;
                const isGrowing = close > open;

                candles.push({ open, high, low, close, isGrowing });
                baseValue = close;
            }

            return candles;
        };

        setCandleData(generateCandleData());

        // Update market data every 1.5 seconds
        const marketInterval = setInterval(() => {
            setMarketData({
                eurusd: `1.08${Math.floor(Math.random() * 9)}`,
                btcusd: `${Math.floor(Math.random() * 10) + 60},${Math.floor(Math.random() * 900) + 100}`,
                sp500: `${Math.floor(Math.random() * 100) + 4500}.${Math.floor(Math.random() * 99)}`,
            });
        }, 1500);

        // 15 second progress timer
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + 100 / 150; // 15 seconds total
                if (newProgress >= 100) {
                    clearInterval(progressInterval);
                    clearInterval(marketInterval);
                }
                return newProgress;
            });
        }, 100);

        // Animated entrance
        setTimeout(() => {
            controls.start('visible');
            setShowElements(true);
        }, 500);

        return () => {
            clearInterval(progressInterval);
            clearInterval(marketInterval);
            window.removeEventListener('resize', checkMobile);
        };
    }, [isMobile]);

    return (
        <div className='global-loading' ref={containerRef}>
            {/* Golden grid background */}
            <div className='golden-grid'>
                {Array.from({ length: isMobile ? 64 : 100 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className='grid-line'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.05 }}
                        transition={{ duration: 1, delay: i * 0.01 }}
                    />
                ))}
            </div>

            {/* Floating trading elements - reduced on mobile */}
            <div className='trading-elements'>
                {(isMobile ? ['📈', '💹', '📊', '📉'] : ['📈', '💹', '📊', '📉', '💲', '💰', '🔍', '⚖️']).map(
                    (emoji, i) => (
                        <motion.div
                            key={i}
                            className='trading-element'
                            initial={{
                                y: 100,
                                opacity: 0,
                                rotateX: -90,
                                scale: 0.5,
                            }}
                            animate={{
                                y: -100,
                                opacity: [0, 1, 1, 0],
                                rotateX: 0,
                                rotateY: isMobile ? 180 : 360,
                                rotateZ: isMobile ? 90 : 180,
                                scale: 1,
                            }}
                            transition={{
                                duration: 15,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: 'linear',
                            }}
                            style={{
                                left: `${10 + i * (isMobile ? 20 : 10)}%`,
                                color: i % 2 === 0 ? '#FFD700' : '#FFFFFF',
                                fontSize: isMobile ? '1.5rem' : '2rem',
                            }}
                        >
                            {emoji}
                        </motion.div>
                    )
                )}
            </div>

            {/* Animated candlestick chart background */}
            <div className='chart-background'>
                {candleData.map((candle, i) => (
                    <motion.div
                        key={i}
                        className='background-candle'
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{
                            scaleY: 1,
                            opacity: 0.1,
                            transition: { delay: i * 0.1, duration: 0.5 },
                        }}
                        style={{
                            left: `${i * (isMobile ? 8 : 5)}%`,
                            height: `${candle.high - candle.low}%`,
                            top: `${candle.low}%`,
                            width: isMobile ? '4px' : '8px',
                        }}
                    >
                        <div
                            className={`candle-body ${candle.isGrowing ? 'bullish' : 'bearish'}`}
                            style={{
                                height: `${Math.abs(candle.close - candle.open)}%`,
                                width: isMobile ? '3px' : '6px',
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Main content */}
            <motion.div
                className='logo-container'
                initial={{ opacity: 0, y: -50, scale: 0.8, rotate: -10 }}
                animate={controls}
                variants={{
                    visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotate: 0,
                        transition: {
                            duration: 1.2,
                            ease: [0.17, 0.67, 0.24, 0.99],
                        },
                    },
                }}
            >
                <motion.div
                    className='logo-wrapper'
                    animate={{
                        rotateY: [0, 360],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    <div className='logo'>
                        {/* Using the imported logo component */}
                        <Logo className='app-logo' />
                    </div>
                </motion.div>
                <motion.div
                    className='logo-glow'
                    animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                    }}
                />

                {/* Golden rings around logo */}
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        className={`gold-ring gold-ring-${i}`}
                        initial={{ scale: 0, opacity: 0.7 }}
                        animate={{ scale: isMobile ? 1.5 : 2, opacity: 0 }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.8,
                        }}
                    />
                ))}
            </motion.div>

            {showElements && (
                <div className='content-wrapper'>
                    {/* Trading terminal */}
                    <motion.div
                        className='trading-terminal'
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <div className='terminal-header'>
                            <div className='terminal-dots'>
                                <span className='dot red'></span>
                                <span className='dot yellow'></span>
                                <span className='dot green'></span>
                            </div>
                            <span className='terminal-title'>MARKET_DATA_STREAM</span>
                            <span className='terminal-status'>LIVE</span>
                        </div>
                        <div className='terminal-content'>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <span className='prompt'>$</span> Connecting to market data feed...
                            </motion.div>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                            >
                                <span className='prompt'>$</span> Analyzing current market conditions...
                            </motion.div>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.2 }}
                            >
                                <span className='prompt'>$</span> Loading trading algorithms...
                            </motion.div>
                            <motion.div
                                className='terminal-line blinking'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.9 }}
                            >
                                <span className='prompt'>$</span> _
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Live candlestick chart */}
                    <motion.div
                        className='live-chart'
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 1.2, duration: 0.7 }}
                    >
                        <div className='chart-header'>
                            <span className='chart-title'>BTC/USD • 5M</span>
                            <span className='chart-price'>${marketData.btcusd}</span>
                        </div>
                        <div className='chart-container'>
                            <div className='candlestick-chart'>
                                {candleData.map((candle, i) => (
                                    <motion.div
                                        key={i}
                                        className='candlestick'
                                        initial={{ scaleY: 0, opacity: 0 }}
                                        animate={{
                                            scaleY: 1,
                                            opacity: 1,
                                            transition: { delay: i * 0.1, duration: 0.5 },
                                        }}
                                        whileHover={{ scaleY: 1.05, transition: { duration: 0.2 } }}
                                    >
                                        <div
                                            className='wick'
                                            style={{
                                                height: `${candle.high - candle.low}%`,
                                                top: `${candle.low}%`,
                                            }}
                                        />
                                        <div
                                            className={`body ${candle.isGrowing ? 'bullish' : 'bearish'}`}
                                            style={{
                                                height: `${Math.abs(candle.close - candle.open)}%`,
                                                top: `${Math.min(candle.open, candle.close)}%`,
                                                width: isMobile ? '8px' : '12px',
                                            }}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div className='chart-footer'>
                            <div className='time-markers'>
                                <span>09:30</span>
                                <span>11:30</span>
                                <span>13:30</span>
                                <span>15:30</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Market data */}
                    <div className='market-data-grid'>
                        <div className='data-card'>
                            <span className='data-label'>EUR/USD</span>
                            <motion.span
                                className='data-value'
                                key={`eurusd-${marketData.eurusd}`}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {marketData.eurusd}
                            </motion.span>
                            <span className='data-change positive'>+0.12%</span>
                        </div>
                        <div className='data-card'>
                            <span className='data-label'>BTC/USD</span>
                            <motion.span
                                className='data-value'
                                key={`btcusd-${marketData.btcusd}`}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                ${marketData.btcusd}
                            </motion.span>
                            <span className='data-change negative'>-1.24%</span>
                        </div>
                        <div className='data-card'>
                            <span className='data-label'>S&P 500</span>
                            <motion.span
                                className='data-value'
                                key={`sp500-${marketData.sp500}`}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {marketData.sp500}
                            </motion.span>
                            <span className='data-change positive'>+0.68%</span>
                        </div>
                    </div>

                    {/* Progress section */}
                    <div className='progress-section'>
                        <div className='progress-container'>
                            <motion.div
                                className='progress-bar'
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 15, ease: 'linear' }}
                            >
                                <div className='progress-glow' />
                                <div className='progress-particles'>
                                    {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className='progress-particle'
                                            animate={{
                                                x: [0, Math.random() * 100],
                                                y: [0, Math.random() * 10 - 5],
                                                opacity: [0, 1, 0],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                delay: i * 0.3,
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                            <div className='progress-labels'>
                                <span className='progress-text'>{Math.round(progress)}%</span>
                                <span className='progress-message'>Loading trading dashboard...</span>
                            </div>
                        </div>
                    </div>

                    {/* Trading indicators */}
                    <div className='trading-indicators'>
                        {(isMobile ? ['RSI', 'MACD', 'VOL'] : ['RSI', 'MACD', 'VOL', 'EMA', 'BB']).map(
                            (indicator, i) => (
                                <motion.div
                                    key={i}
                                    className='indicator'
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: [0, 1, 1, 0],
                                        opacity: [0, 1, 1, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.5,
                                    }}
                                >
                                    <div className='indicator-inner'>
                                        <span>{indicator}</span>
                                    </div>
                                </motion.div>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Status message */}
            <AnimatePresence>
                <motion.div
                    className='status-message'
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: 1.0 },
                    }}
                    exit={{ opacity: 0 }}
                >
                    <motion.span
                        animate={{
                            backgroundPosition: ['0% 50%', '100% 50%'],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatType: 'reverse',
                        }}
                    >
                        Preparing your advanced trading experience...
                    </motion.span>
                </motion.div>
            </AnimatePresence>

            {/* Scanning line effect */}
            <motion.div
                className='scan-line'
                initial={{ y: '0%' }}
                animate={{ y: '100%' }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Golden particles overlay */}
            <div className='gold-overlay'></div>
        </div>
    );
};

export default GlobalLoading;
