import React, { useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import './GlobalLoading.scss';
import LOGO from './Logo/LOGO9.png';

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

    useEffect(() => {
        // Generate random code lines for background
        const generateCodeLines = () => {
            const lines = [];
            const commands = ['BUY', 'SELL', 'HOLD', 'ANALYZE', 'EXECUTE'];
            const currencies = ['EUR/USD', 'BTC/USD', 'ETH/USD', 'GBP/JPY', 'XAU/USD'];

            for (let i = 0; i < 15; i++) {
                const command = commands[Math.floor(Math.random() * commands.length)];
                const currency = currencies[Math.floor(Math.random() * currencies.length)];
                const value = (Math.random() * 1000).toFixed(4);
                lines.push(`${command} ${currency} @ ${value}`);
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

        // 10 second progress timer
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + 1;
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

    const chartPath = `M 0,50 
                    C 50,30 100,70 150,40 
                    S 200,60 250,30 
                    S 300,70 350,50 
                    S 400,20 450,60 
                    S 500,40 550,70 
                    S 600,30 650,50 
                    S 700,80 750,40 
                    S 800,60 850,30 
                    S 900,70 950,50 
                    L 1000,50`;

    return (
        <div className='global-loading'>
            {/* Matrix-style code rain background */}
            <div className='code-rain'>
                {codeLines.map((line, i) => (
                    <motion.div
                        key={i}
                        className='code-line'
                        initial={{ y: -50, opacity: 0 }}
                        animate={{
                            y: window.innerHeight + 50,
                            opacity: [0, 0.8, 0],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                        style={{ left: `${Math.random() * 100}%` }}
                    >
                        {line}
                    </motion.div>
                ))}
            </div>

            {/* Hexagon grid background */}
            <div className='hexagon-grid'>
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className='hexagon'
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 0.3, 0],
                            scale: [0, 1, 0],
                            rotate: 360,
                        }}
                        transition={{
                            duration: 8 + Math.random() * 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>

            {/* Animated binary particles */}
            <div className='binary-particles'>
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className='binary-digit'
                        initial={{ y: -20, opacity: 0 }}
                        animate={{
                            y: window.innerHeight + 20,
                            opacity: [0, 1, 0],
                            x: Math.random() * 20 - 10,
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                        }}
                    >
                        {Math.round(Math.random())}
                    </motion.div>
                ))}
            </div>

            {/* Circuit lines animation */}
            <div className='circuit-lines'>
                {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className='circuit-line'
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 0.3,
                        }}
                    />
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
                <motion.img
                    src={LOGO}
                    alt='Deriv Logo'
                    className='logo'
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ duration: 0.3 }}
                />
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

                {/* Pulsing rings around logo */}
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        className={`pulse-ring pulse-ring-${i}`}
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
                    {/* Hacking terminal text animation */}
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
                            <span className='terminal-title'>SYSTEM_INITIALIZATION</span>
                        </div>
                        <div className='terminal-content'>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <span className='prompt'>$</span> Loading trading modules...
                            </motion.div>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                            >
                                <span className='prompt'>$</span> Establishing secure connection...
                            </motion.div>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.6 }}
                            >
                                <span className='prompt'>$</span> Authenticating user credentials...
                            </motion.div>
                            <motion.div
                                className='terminal-line'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.0 }}
                            >
                                <span className='prompt'>$</span> Initializing market data feed...
                            </motion.div>
                            <motion.div
                                className='terminal-line blinking'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.4 }}
                            >
                                <span className='prompt'>$</span> _
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Animated trading terminal */}
                    <motion.div
                        className='trading-terminal'
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.7 }}
                    >
                        <div className='terminal-glitch'></div>

                        <div className='chart-container'>
                            <svg width='100%' height='160' viewBox='0 0 1000 100'>
                                <defs>
                                    <linearGradient id='chartGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                                        <stop offset='0%' stopColor='#FF444F' />
                                        <stop offset='50%' stopColor='#9C27B0' />
                                        <stop offset='100%' stopColor='#00D2FF' />
                                    </linearGradient>
                                    <filter id='glow' x='-30%' y='-30%' width='160%' height='160%'>
                                        <feGaussianBlur stdDeviation='4' result='blur' />
                                        <feComposite in='SourceGraphic' in2='blur' operator='over' />
                                    </filter>
                                </defs>
                                <motion.path
                                    d={chartPath}
                                    stroke='url(#chartGradient)'
                                    strokeWidth='3'
                                    fill='none'
                                    filter='url(#glow)'
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 3, ease: 'easeInOut' }}
                                />
                                <AnimatePresence>
                                    {progress < 100 && (
                                        <motion.circle
                                            cx='0'
                                            cy='50'
                                            r='6'
                                            fill='url(#chartGradient)'
                                            initial={{ x: 0 }}
                                            animate={{
                                                x: progress * 10,
                                                y: [
                                                    50, 30, 70, 40, 60, 30, 70, 50, 20, 60, 40, 70, 30, 50, 80, 40, 60,
                                                    30, 70, 50,
                                                ][Math.floor(progress / 5)],
                                            }}
                                            transition={{
                                                duration: 0.1,
                                                ease: 'linear',
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                            </svg>

                            {/* Candlestick animation */}
                            <div className='candlestick-animation'>
                                {Array.from({ length: 15 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className='candlestick'
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                            height: Math.random() * 30 + 10,
                                            opacity: 1,
                                            y: Math.random() * 40 - 20,
                                        }}
                                        transition={{
                                            delay: i * 0.1,
                                            duration: 0.5,
                                            repeat: Infinity,
                                            repeatType: 'reverse',
                                            repeatDelay: 15 * 0.1,
                                        }}
                                    >
                                        <div className='wick' />
                                        <div className='body' />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Market data ticker */}
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
                                transition={{ duration: 10, ease: 'linear' }}
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
                                <span className='progress-text'>{progress}%</span>
                                <span className='progress-message'>Initializing trading modules...</span>
                            </div>
                        </div>
                    </div>

                    {/* Animated trading bots */}
                    <div className='trading-bots'>
                        {['📈', '💹', '📊', '📉', '💲'].map((emoji, i) => (
                            <motion.div
                                key={i}
                                className='bot-icon'
                                initial={{ x: -100, opacity: 0, rotate: -20 }}
                                animate={{
                                    x: 0,
                                    opacity: 1,
                                    rotate: 0,
                                    y: [0, -15, 0],
                                }}
                                transition={{
                                    delay: 1.2 + i * 0.2,
                                    duration: 0.8,
                                    y: {
                                        duration: 2 + Math.random(),
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    },
                                }}
                                whileHover={{ scale: 1.2, rotate: 5 }}
                            >
                                {emoji}
                                <motion.div
                                    className='bot-trail'
                                    animate={{
                                        scale: [0.8, 1.2, 0.8],
                                        opacity: [0.4, 0.8, 0.4],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                    }}
                                />
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
                        Preparing your ultimate trading experience...
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
        </div>
    );
};

export default GlobalLoading;
