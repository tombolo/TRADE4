"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GlobalLoading.module.scss';

// Import your logo - make sure the path is correct
import LOGO from './Logo/NILOTE.png';

export const GlobalLoading = () => {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    // Enhanced color palette - more vibrant and attractive
    const colors = {
        primary: '#6366F1',    // Vibrant Indigo
        secondary: '#8B5CF6',  // Electric Violet
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', // Gradient background
        surface: 'rgba(30, 41, 59, 0.8)',    // Glass morphism surface
        text: '#F8FAFC',      // Light text
        accent: '#06D6A0',     // Emerald green
        gold: '#FFD93D',       // Bright gold
        silver: '#F1F5F9',     // Bright silver
        neon: '#00F5FF',       // Neon cyan
        gradient1: '#FF6B6B',  // Coral
        gradient2: '#4ECDC4',  // Teal
        gradient3: '#45B7D1'   // Sky blue
    };

    // All texts displayed at once with enhanced styling
    const loadingContent = {
        partnership: { text: "In partnership with", company: "DERIV", type: "partnership" },
        powered: { text: "Powered by", company: "DERIV", type: "powered" },
        journey: { text: "Simplifying your", highlight: "trading journey", type: "journey" }
    };

    useEffect(() => {
        // Smooth progress animation with easing over 12 seconds
        const duration = 12000;
        const startTime = Date.now();
        let animationFrame;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration * 100, 100);
            
            // Custom easing function for natural feel
            const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
            const easedProgress = easeOutQuart(progress / 100) * 100;
            
            setProgress(Math.min(easedProgress, 100));
            
            if (progress < 100) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                // Add a slight delay before completing
                setTimeout(() => setIsComplete(true), 800);
            }
        };
        
        // Start the animation
        animationFrame = requestAnimationFrame(animate);
        
        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
        },
        exit: { 
            opacity: 0,
            scale: 1.05,
            transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
        }
    };

    const logoVariants = {
        initial: { scale: 0.8, opacity: 0, rotateY: -180 },
        animate: { 
            scale: 1,
            opacity: 1,
            rotateY: 0,
            y: [0, -10, 0],
            transition: { 
                y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                },
                rotateY: { duration: 1.5, ease: "easeOut" },
                scale: { duration: 0.8, ease: "easeOut" },
                opacity: { duration: 0.8 }
            }
        }
    };

    const textContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
                delayChildren: 0.5
            }
        }
    };

    const textItemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1]
            }
        }
    };

    const progressWidth = Math.max(10, progress);

    return (
        <AnimatePresence>
            {!isComplete && (
                <motion.div 
                    className={styles.globalLoading}
                    style={{
                        '--primary': colors.primary,
                        '--secondary': colors.secondary,
                        '--background': colors.background,
                        '--surface': colors.surface,
                        '--text': colors.text,
                        '--accent': colors.accent,
                        '--gold': colors.gold,
                        '--silver': colors.silver,
                        '--neon': colors.neon,
                        '--gradient1': colors.gradient1,
                        '--gradient2': colors.gradient2,
                        '--gradient3': colors.gradient3
                    }}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Enhanced background with gradient orbs */}
                    <div className={styles.backgroundElements}>
                        <div className={styles.gradientOrb1} />
                        <div className={styles.gradientOrb2} />
                        <div className={styles.gradientOrb3} />
                        <div className={styles.particleField} />
                    </div>

                    <div className={styles.loadingContainer}>
                        {/* Enhanced Logo with 3D effect */}
                        <motion.div
                            className={styles.logoContainer}
                            variants={logoVariants}
                            initial="initial"
                            animate="animate"
                        >
                            <img 
                                src={LOGO} 
                                alt="Logo" 
                                className={styles.logo}
                            />
                            {/* Multiple glow effects */}
                            <div className={styles.logoGlow1} />
                            <div className={styles.logoGlow2} />
                            <div className={styles.logoPulse} />
                        </motion.div>
                        
                        {/* All Texts Displayed At Once */}
                        <motion.div 
                            className={styles.textsContainer}
                            variants={textContainerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Partnership Section */}
                            <motion.div 
                                className={styles.textSection}
                                variants={textItemVariants}
                            >
                                <div className={styles.partnershipContent}>
                                    <span className={styles.prefix}>{loadingContent.partnership.text}</span>
                                    <motion.span 
                                        className={styles.companyName}
                                        animate={{
                                            scale: [1, 1.05, 1],
                                            textShadow: [
                                                '0 0 20px var(--gold)',
                                                '0 0 40px var(--gold)',
                                                '0 0 20px var(--gold)'
                                            ]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        {loadingContent.partnership.company}
                                    </motion.span>
                                    <motion.div 
                                        className={styles.partnershipBadge}
                                        animate={{
                                            boxShadow: [
                                                '0 0 10px var(--gold)',
                                                '0 0 20px var(--gold)',
                                                '0 0 10px var(--gold)'
                                            ]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity
                                        }}
                                    >
                                        PREMIUM PARTNER
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Powered By Section */}
                            <motion.div 
                                className={styles.textSection}
                                variants={textItemVariants}
                            >
                                <div className={styles.poweredContent}>
                                    <span className={styles.prefix}>{loadingContent.powered.text}</span>
                                    <motion.span 
                                        className={styles.techName}
                                        animate={{
                                            backgroundPosition: ['0%', '100%', '0%'],
                                            filter: [
                                                'brightness(1)',
                                                'brightness(1.3)',
                                                'brightness(1)'
                                            ]
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        {loadingContent.powered.company}
                                    </motion.span>
                                </div>
                            </motion.div>

                            {/* Journey Section */}
                            <motion.div 
                                className={styles.textSection}
                                variants={textItemVariants}
                            >
                                <div className={styles.journeyContent}>
                                    <span className={styles.journeyText}>{loadingContent.journey.text}</span>
                                    <motion.span 
                                        className={styles.highlightText}
                                        animate={{
                                            backgroundPosition: ['0%', '100%', '0%'],
                                            scale: [1, 1.08, 1],
                                            rotate: [0, 1, -1, 0]
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        {loadingContent.journey.highlight}
                                    </motion.span>
                                </div>
                            </motion.div>
                        </motion.div>
                        
                        {/* Enhanced Progress Bar */}
                        <div className={styles.progressContainer}>
                            <div className={styles.progressBar}>
                                <motion.div 
                                    className={styles.progressFill}
                                    initial={{ width: 0 }}
                                    animate={{ 
                                        width: `${progressWidth}%`,
                                        transition: {
                                            duration: 0.3,
                                            ease: [0.4, 0, 0.2, 1]
                                        }
                                    }}
                                >
                                    <div className={styles.progressTip} />
                                    {/* Enhanced particles */}
                                    <div className={styles.progressParticles}>
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className={styles.particle}
                                                animate={{
                                                    y: [0, -15, 0],
                                                    opacity: [0, 1, 0],
                                                    scale: [0.8, 1.2, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    delay: i * 0.4,
                                                    ease: "easeOut"
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {/* Shimmer overlay */}
                                    <div className={styles.progressShimmer} />
                                </motion.div>
                            </div>
                            <motion.div 
                                className={styles.progressText}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ 
                                    opacity: 1, 
                                    y: 0,
                                    transition: { delay: 0.3 }
                                }}
                            >
                                {Math.round(progress)}%
                                <motion.span 
                                    className={styles.percentSign}
                                    animate={{ 
                                        opacity: [0.6, 1, 0.6],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{ 
                                        duration: 1.5, 
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                >
                                    %
                                </motion.span>
                            </motion.div>
                        </div>

                        {/* Enhanced Loading Text */}
                        <motion.div 
                            className={styles.loadingText}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className={styles.loadingDots}>
                                <span>.</span>
                                <span>.</span>
                                <span>.</span>
                            </span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalLoading;