"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./CopyTradingPage.module.scss";
import { getAuthToken } from "@deriv/shared";

const APP_ID = 70344;
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

const CopyTradingPage: React.FC = () => {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [copierToken, setCopierToken] = useState<string | null>(null);
    const [traderToken, setTraderToken] = useState("");
    const [statusMsg, setStatusMsg] = useState("Initializing...");
    const [authorizing, setAuthorizing] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        // Load copier token
        try {
            const token = getAuthToken ? getAuthToken() : localStorage.getItem("auth_token");
            if (token) {
                setCopierToken(token);
                setStatusMsg("Auth token loaded ✓");
            } else {
                setStatusMsg("No auth token found — please log in.");
            }
        } catch (e) {
            const fallback = localStorage.getItem("auth_token");
            if (fallback) {
                setCopierToken(fallback);
                setStatusMsg("Auth token loaded from localStorage ✓");
            } else {
                setStatusMsg("No auth token found — please log in.");
            }
        }

        // Open websocket
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            setStatusMsg("Connected to Deriv WebSocket");
        };

        ws.onclose = () => {
            setIsConnected(false);
            setStatusMsg("Connection closed");
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            setStatusMsg("WebSocket error — check console");
        };

        ws.onmessage = (evt) => {
            try {
                const data = JSON.parse(evt.data);

                if (data.msg_type === "authorize" && data.authorize) {
                    setAuthorizing(false);
                    setStatusMsg(`Authorized: ${data.authorize.loginid}`);
                }

                if (data.msg_type === "copy_start") {
                    if (data.copy_start === 1) {
                        setIsCopying(true);
                        setBusy(false);
                        setStatusMsg("Copying started successfully");
                    } else {
                        setBusy(false);
                        setStatusMsg(`copy_start response: ${JSON.stringify(data)}`);
                    }
                }

                if (data.msg_type === "copy_stop") {
                    if (data.copy_stop === 1) {
                        setIsCopying(false);
                        setBusy(false);
                        setStatusMsg("Copying stopped successfully");
                    } else {
                        setBusy(false);
                        setStatusMsg(`copy_stop response: ${JSON.stringify(data)}`);
                    }
                }

                if (data.error) {
                    setAuthorizing(false);
                    setBusy(false);
                    setStatusMsg(`Error: ${data.error.message || JSON.stringify(data.error)}`);
                }
            } catch (err) {
                console.error("Failed parse message:", err);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    const sendJSON = (obj: object) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            setStatusMsg("WebSocket not open. Waiting for connection...");
            return false;
        }
        ws.send(JSON.stringify(obj));
        return true;
    };

    const authorize = async (): Promise<boolean> => {
        if (!copierToken) {
            setStatusMsg("No copier token available — please log in.");
            return false;
        }
        setAuthorizing(true);
        setStatusMsg("Authorizing...");
        const ok = sendJSON({ authorize: copierToken });
        if (!ok) {
            setAuthorizing(false);
            return false;
        }
        return true;
    };

    const handleStartCopy = async () => {
        if (!traderToken) {
            alert("Please enter Trader's read-only token.");
            return;
        }
        if (!wsRef.current) {
            alert("WebSocket not initialized.");
            return;
        }
        setBusy(true);
        setStatusMsg("Preparing to start copy...");
        await authorize();
        setTimeout(() => {
            setStatusMsg("Sending copy_start request...");
            sendJSON({
                copy_start: traderToken,
            });
        }, 600);
    };

    const handleStopCopy = async () => {
        if (!wsRef.current) return;
        setBusy(true);
        setStatusMsg("Preparing to stop copy...");
        await authorize();
        setTimeout(() => {
            setStatusMsg("Sending copy_stop request...");
            sendJSON({
                copy_stop: traderToken,
            });
        }, 600);
    };

    const clearToken = () => {
        setTraderToken("");
        setStatusMsg("Trader token cleared");
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <div className={styles.logo}>
                        <svg width="33" height="33" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="16" fill="#D4AF37" />
                            <path d="M16 7L19.468 13.432L26.5 14.836L21.5 20.024L22.936 27.064L16 23.872L9.064 27.064L10.5 20.024L5.5 14.836L12.532 13.432L16 7Z" fill="white" />
                        </svg>
                    </div>
                    <div className={styles.brandText}>
                        <h1>Copy Trading</h1>
                        <p className={styles.subtitle}>Mirror trades with precision</p>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.connection}>
                        <span className={`${styles.dot} ${isConnected ? styles.online : styles.offline}`} />
                        <span className={styles.connText}>{isConnected ? "Connected" : "Offline"}</span>
                    </div>
                    <div className={styles.loginInfo}>
                        <span className={styles.small}>Auth</span>
                        <strong className={styles.loginLabel}>
                            {copierToken ? "Token present" : "Not logged in"}
                        </strong>
                    </div>
                </div>
            </header>

            <main className={styles.grid}>
                <section className={`${styles.card} ${styles.traderCard}`}>
                    <div className={styles.cardHeader}>
                        <h2>Trader Token</h2>
                        <p className={styles.cardSub}>Paste the trader's <strong>read-only</strong> token</p>
                    </div>

                    <div className={styles.cardBody}>
                        <label htmlFor="traderToken" className={styles.label}>
                            Trader Read-only Token
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                id="traderToken"
                                className={styles.input}
                                type="text"
                                placeholder="e.g. Rb1x... (read-only token)"
                                value={traderToken}
                                onChange={(e) => setTraderToken(e.target.value.trim())}
                                aria-label="Trader read only token"
                            />
                            <div className={styles.inputBorder}></div>
                        </div>

                        <div className={styles.row}>
                            <button
                                className={styles.ghost}
                                onClick={() => {
                                    navigator.clipboard?.readText().then((t) => setTraderToken(t || traderToken));
                                }}
                                title="Paste from clipboard"
                                type="button"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="#D4AF37" />
                                </svg>
                                Paste token
                            </button>

                            <button className={styles.clear} onClick={clearToken} type="button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#888" />
                                </svg>
                                Clear
                            </button>
                        </div>
                    </div>
                </section>

                <section className={`${styles.card} ${styles.controlsCard}`}>
                    <div className={styles.cardHeader}>
                        <h2>Controls</h2>
                        <p className={styles.cardSub}>Start or stop copying trades</p>
                    </div>

                    <div className={styles.cardBody}>
                        <div className={styles.controls}>
                            {!isCopying ? (
                                <button
                                    className={`${styles.primary} ${busy ? styles.pulse : ''}`}
                                    onClick={handleStartCopy}
                                    disabled={!traderToken || busy || !isConnected}
                                    type="button"
                                >
                                    {busy ? (
                                        <div className={styles.spinner}></div>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M8 5V19L19 12L8 5Z" fill="white" />
                                        </svg>
                                    )}
                                    {busy ? "Processing…" : "Start Copying"}
                                </button>
                            ) : (
                                <button
                                    className={`${styles.danger} ${busy ? styles.pulse : ''}`}
                                    onClick={handleStopCopy}
                                    disabled={busy || !isConnected}
                                    type="button"
                                >
                                    {busy ? (
                                        <div className={styles.spinner}></div>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M6 6H18V18H6V6Z" fill="white" />
                                        </svg>
                                    )}
                                    {busy ? "Processing…" : "Stop Copying"}
                                </button>
                            )}

                            <button
                                className={styles.secondary}
                                onClick={() => {
                                    setStatusMsg("Refreshing auth...");
                                    try {
                                        const t = getAuthToken ? getAuthToken() : localStorage.getItem("auth_token");
                                        setCopierToken(t || null);
                                        setStatusMsg(t ? "Auth refreshed" : "No auth token found");
                                    } catch {
                                        setStatusMsg("Failed to refresh auth");
                                    }
                                }}
                                type="button"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="#D4AF37" />
                                </svg>
                                Refresh Auth
                            </button>
                        </div>

                        <div className={styles.statusBox}>
                            <div className={styles.statusRow}>
                                <span className={styles.statusLabel}>Status</span>
                                <span className={styles.statusValue}>{statusMsg}</span>
                            </div>
                            <div className={styles.statusRow}>
                                <span className={styles.statusLabel}>Copying</span>
                                <span className={`${styles.statusValue} ${isCopying ? styles.copyingActive : ''}`}>
                                    {isCopying ? "Active" : "Inactive"}
                                    {isCopying && <span className={styles.livePulse}></span>}
                                </span>
                            </div>
                            <div className={styles.statusRow}>
                                <span className={styles.statusLabel}>Authorizing</span>
                                <span className={styles.statusValue}>{authorizing ? "In Progress" : "Complete"}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={`${styles.card} ${styles.infoCard}`}>
                    <div className={styles.cardHeader}>
                        <h2>Notes & Safety</h2>
                        <p className={styles.cardSub}>Important reminders and settings</p>
                    </div>

                    <div className={styles.cardBody}>
                        <ul className={styles.notes}>
                            <li>
                                <span className={styles.noteIcon}>⚠️</span>
                                <strong>Trader token must be read-only.</strong> Do not use trader tokens with trade permission.
                            </li>
                            <li>
                                <span className={styles.noteIcon}>🔒</span>
                                Your account must be authorized (your token must have <em>trade</em> scope) for copying to place orders.
                            </li>
                            <li>
                                <span className={styles.noteIcon}>⚙️</span>
                                Use the controls above to limit assets or trade sizes via the API (optional).
                            </li>
                        </ul>
                    </div>
                </section>
            </main>

            <footer className={styles.footer}>
                <small>© {new Date().getFullYear()} Your Company • Secure copy trading interface</small>
            </footer>
        </div>
    );
};

export default CopyTradingPage;