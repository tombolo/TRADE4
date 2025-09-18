import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import './GlobalLoading.scss';
import LOGO from './Logo/ANALYTICS.png';

const GlobalLoading = () => {
    const [progress, setProgress] = useState(0);
    const controls = useAnimation();
    const [showElements, setShowElements] = useState(false);
    const [marketData, setMarketData] = useState({
        eurusd: `1.08${Math.floor(Math.random() * 9)}`,
        btcusd: `6${Math.floor(Math.random() * 9000) + 1000}`,
        volatility: `75.${Math.floor(Math.random() * 9)}%`,
    });
    const [codeLines, setCodeLines] = useState([]);
    const containerRef = useRef(null);

    useEffect(() => {
        // Generate random code lines for background
        const generateCodeLines = () => {
            const lines = [];
            const commands = ['ACCESS', 'ENCRYPT', 'DECRYPT', 'EXECUTE', 'ANALYZE', 'INITIALIZE'];
            const protocols = ['SECURE_PROTOCOL', 'TRADING_SYSTEM', 'MARKET_DATA', 'AUTH_SYSTEM'];

            for (let i = 0; i < 20; i++) {
                const command = commands[Math.floor(Math.random() * commands.length)];
                const protocol = protocols[Math.floor(Math.random() * protocols.length)];
                const value = Math.floor(Math.random() * 10000);
                lines.push(`${command} ${protocol} ${value}`);
            }
            return lines;
        };

        setCodeLines(generateCodeLines());

        // Update market data every 1.5 seconds
        const marketInterval = setInterval(() => {
            setMarketData({
                eurusd: `1.08${Math.floor(Math.random() * 9)}`,
                btcusd: `6${Math.floor(Math.random() * 9000) + 1000}`,
                volatility: `75.${Math.floor(Math.random() * 9)}%`,
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
        };
    }, []);

    return (
        <div className='global-loading' ref={containerRef}>
            {/* Golden grid background */}
            <div className='golden-grid'>
                {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className='grid-line'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        transition={{ duration: 1, delay: i * 0.02 }}
                    />
                ))}
            </div>

            {/* Binary matrix rain */}
            <div className='binary-matrix'>
                {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className='binary-column'
                        initial={{ y: -100, opacity: 0 }}
                        animate={{
                            y: window.innerHeight + 100,
                            opacity: [0, 0.8, 0],
                        }}
                        transition={{
                            duration: 8 + Math.random() * 5,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                        }}
                        style={{ left: `${Math.random() * 100}%` }}
                    >
                        {Array.from({ length: 20 }).map((_, j) => (
                            <div
                                key={j}
                                className={`binary-digit ${Math.random() > 0.7 ? 'gold' : ''}`}
                                style={{ animationDelay: `${j * 0.1}s` }}
                            >
                                {Math.round(Math.random())}
                            </div>
                        ))}
                    </motion.div>
                ))}
            </div>

            {/* Hacking particles */}
            <div className='hacking-particles'>
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className='particle'
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            scale: 0,
                        }}
                        animate={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* 3D floating elements */}
            <div className='floating-elements'>
                {['🔒', '💎', '📊', '🔑', '⚡'].map((emoji, i) => (
                    <motion.div
                        key={i}
                        className='floating-element'
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
                            rotateY: 360,
                            rotateZ: 180,
                            scale: 1,
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: 'linear',
                        }}
                        style={{
                            left: `${15 + i * 15}%`,
                            color: i % 2 === 0 ? '#FFD700' : '#FFFFFF',
                        }}
                    >
                        {emoji}
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
                    <motion.img
                        src={LOGO}
                        alt='Analytics Logo'
                        className='logo'
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        transition={{ duration: 0.3 }}
                    />
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
                        animate={{ scale: 2, opacity: 0 }}
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
                    {/* Hacking terminal */}
                    <motion.div
                        className='hacking-terminal'
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
                            <span className='terminal-title'>SECURE_SYSTEM_INIT</span>
                        </div>
                        <div className='terminal-content'>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <span className='prompt'>$</span> Initializing secure encryption protocols...
                            </motion.div>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                            >
                                <span className='prompt'>$</span> Establishing quantum-safe connection...
                            </motion.div>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.2 }}
                            >
                                <span className='prompt'>$</span> Authenticating with blockchain verification...
                            </motion.div>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.9 }}
                            >
                                <span className='prompt'>$</span> Loading market prediction algorithms...
                            </motion.div>
                            <motion.div
                                className='terminal-line blinking'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 3.6 }}
                            >
                                <span className='prompt'>$</span> _
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Candle progress chart */}
                    <motion.div
                        className='candle-chart'
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 1.2, duration: 0.7 }}
                    >
                        <div className='chart-container'>
                            <div className='candles'>
                                {Array.from({ length: 15 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className='candle'
                                        initial={{ scaleY: 0, opacity: 0 }}
                                        animate={{
                                            scaleY: [0, 1, 0.8, 1],
                                            opacity: [0, 1, 1, 1],
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            delay: i * 0.1,
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                        }}
                                    >
                                        <div className='wick'></div>
                                        <div className={`flame ${i % 3 === 0 ? 'gold' : ''}`}></div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Market data */}
                        <div className='market-ticker'>
                            <div className='ticker-item'>
                                <span className='ticker-label'>EUR/USD</span>
                                <motion.span
                                    className='ticker-value'
                                    key={`eurusd-${marketData.eurusd}`}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -10, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {marketData.eurusd}
                                </motion.span>
                            </div>
                            <div className='ticker-item'>
                                <span className='ticker-label'>BTC/USD</span>
                                <motion.span
                                    className='ticker-value'
                                    key={`btcusd-${marketData.btcusd}`}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -10, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {marketData.btcusd}
                                </motion.span>
                            </div>
                            <div className='ticker-item'>
                                <span className='ticker-label'>Volatility</span>
                                <motion.span
                                    className='ticker-value'
                                    key={`vol-${marketData.volatility}`}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -10, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {marketData.volatility}
                                </motion.span>
                            </div>
                        </div>
                    </motion.div>

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
                                    {Array.from({ length: 5 }).map((_, i) => (
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
                                <span className='progress-message'>Initializing secure trading environment...</span>
                            </div>
                        </div>
                    </div>

                    {/* Hacking indicators */}
                    <div className='hacking-indicators'>
                        {Array.from({ length: 5 }).map((_, i) => (
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
                                <div className='indicator-inner'></div>
                            </motion.div>
                        ))}
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
                        Securing your financial analytics environment...
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
