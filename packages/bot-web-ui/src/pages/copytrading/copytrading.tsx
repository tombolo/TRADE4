"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./CopyTradingPage.module.scss";
import { getAuthToken } from "@deriv/shared"; // keep if your app provides this

const APP_ID = 70344; // replace with your own App ID from Deriv
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

const CopyTradingPage: React.FC = () => {
    const wsRef = useRef<WebSocket | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [copierToken, setCopierToken] = useState<string | null>(null); // loaded from getAuthToken()
    const [traderToken, setTraderToken] = useState("");
    const [statusMsg, setStatusMsg] = useState("Initializing...");
    const [authorizing, setAuthorizing] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        // Load copier token from local storage / auth helper
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
                // console.log("WS:", data);

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
        // wait a short while for authorize response (it will set authorizing false on message)
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
        // authorize then start
        await authorize();
        // small delay to ensure authorize response processed
        setTimeout(() => {
            setStatusMsg("Sending copy_start request...");
            sendJSON({
                copy_start: traderToken,
                // add optional filters here if needed:
                // max_trade_stake: 5,
                // min_trade_stake: 0.35,
                // assets: ["R_100"],
                // trade_types: ["CALL", "PUT"]
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
                    <div className={styles.logo}>CT</div>
                    <div className={styles.brandText}>
                        <h1>Copy Trading</h1>
                        <p className={styles.subtitle}>Deriv — Mirror trades, manage risk</p>
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
                        <input
                            id="traderToken"
                            className={styles.input}
                            type="text"
                            placeholder="e.g. Rb1x... (read-only token)"
                            value={traderToken}
                            onChange={(e) => setTraderToken(e.target.value.trim())}
                            aria-label="Trader read only token"
                        />

                        <div className={styles.row}>
                            <button
                                className={styles.ghost}
                                onClick={() => {
                                    navigator.clipboard?.readText().then((t) => setTraderToken(t || traderToken));
                                }}
                                title="Paste from clipboard"
                                type="button"
                            >
                                Paste token
                            </button>

                            <button className={styles.clear} onClick={clearToken} type="button">
                                Clear
                            </button>
                        </div>
                    </div>
                </section>

                <section className={`${styles.card} ${styles.controlsCard}`}>
                    <div className={styles.cardHeader}>
                        <h2>Controls</h2>
                        <p className={styles.cardSub}>Start or stop copying — operations are executed on your account</p>
                    </div>

                    <div className={styles.cardBody}>
                        <div className={styles.controls}>
                            {!isCopying ? (
                                <button
                                    className={styles.primary}
                                    onClick={handleStartCopy}
                                    disabled={!traderToken || busy || !isConnected}
                                    type="button"
                                >
                                    {busy ? "Processing…" : "Start Copying"}
                                </button>
                            ) : (
                                <button
                                    className={styles.danger}
                                    onClick={handleStopCopy}
                                    disabled={busy || !isConnected}
                                    type="button"
                                >
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
                                <span className={styles.statusValue}>{isCopying ? "Yes" : "No"}</span>
                            </div>
                            <div className={styles.statusRow}>
                                <span className={styles.statusLabel}>Authorizing</span>
                                <span className={styles.statusValue}>{authorizing ? "Yes" : "No"}</span>
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
                                <strong>Trader token must be read-only.</strong> Do not use trader tokens with trade permission.
                            </li>
                            <li>
                                Your account must be authorized (your token must have <em>trade</em> scope) for copying to place orders.
                            </li>
                            <li>Use the controls above to limit assets or trade sizes via the API (optional).</li>
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
