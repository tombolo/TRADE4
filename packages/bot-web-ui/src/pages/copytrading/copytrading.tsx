"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/CopyTradingPage.module.scss";
import { getAuthToken } from "@deriv/shared";

const APP_ID = 70344; // replace with your own App ID from Deriv
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

const CopyTradingPage: React.FC = () => {
    const wsRef = useRef<WebSocket | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [copierToken, setCopierToken] = useState<string | null>(null); // from localStorage
    const [traderToken, setTraderToken] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    useEffect(() => {
        // Load copier token from localStorage using the proper function
        const token = getAuthToken();
        if (token) {
            setCopierToken(token);
            setStatusMsg("✅ Auth token loaded successfully");
        } else {
            setStatusMsg("⚠️ No auth token found. Please log in first.");
        }

        // Connect WebSocket
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            setStatusMsg("✅ Connected to Deriv WebSocket");
        };

        ws.onclose = () => {
            setIsConnected(false);
            setStatusMsg("❌ Disconnected from Deriv WebSocket");
        };

        ws.onerror = (err) => {
            console.error("WS Error:", err);
            setStatusMsg("⚠️ WebSocket error");
        };

        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            console.log("WS Response:", data);

            if (data.msg_type === "authorize" && data.authorize) {
                setStatusMsg(`🔑 Authorized as ${data.authorize.loginid}`);
            }

            if (data.msg_type === "copy_start" && data.copy_start === 1) {
                setIsCopying(true);
                setStatusMsg("✅ Started copying successfully.");
            }

            if (data.msg_type === "copy_stop" && data.copy_stop === 1) {
                setIsCopying(false);
                setStatusMsg("⏹ Stopped copying successfully.");
            }

            if (data.error) {
                setStatusMsg(`❌ Error: ${data.error.message}`);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    const authorize = () => {
        if (!wsRef.current || !copierToken) return;
        wsRef.current.send(JSON.stringify({ authorize: copierToken }));
    };

    const handleStartCopy = () => {
        if (!wsRef.current) return;
        if (!copierToken) {
            alert("No copier token found. Please log in first.");
            return;
        }
        if (!traderToken) {
            alert("Please enter a Trader’s Token.");
            return;
        }

        // Authorize copier first
        authorize();

        // Wait a bit then send copy_start
        setTimeout(() => {
            wsRef.current?.send(
                JSON.stringify({
                    copy_start: traderToken,
                    // optional settings:
                    // max_trade_stake: 5,
                    // min_trade_stake: 0.35,
                    // assets: ["R_50"],
                    // trade_types: ["CALL", "PUT"],
                })
            );
        }, 1000);
    };

    const handleStopCopy = () => {
        if (!wsRef.current) return;
        if (!copierToken) {
            alert("No copier token found. Please log in first.");
            return;
        }

        authorize();

        setTimeout(() => {
            wsRef.current?.send(
                JSON.stringify({
                    copy_stop: traderToken,
                })
            );
        }, 1000);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>📊 Deriv Copy Trading</h1>

            <p className={styles.status}>{statusMsg}</p>

            {/* Trader Token */}
            <section className={styles.card}>
                <h2>👤 Trader</h2>
                <p>
                    Enter the <strong>Trader’s Read-only Token</strong> to start copying.
                </p>
                <input
                    type="text"
                    placeholder="Enter Trader Token"
                    value={traderToken}
                    onChange={(e) => setTraderToken(e.target.value)}
                    className={styles.input}
                />
            </section>

            {/* Controls */}
            <section className={styles.card}>
                <h2>⚡ Controls</h2>
                <div className={styles.actions}>
                    {!isCopying ? (
                        <button className={styles.buttonPrimary} onClick={handleStartCopy}>
                            ▶️ Start Copying
                        </button>
                    ) : (
                        <button className={styles.buttonDanger} onClick={handleStopCopy}>
                            ⏹ Stop Copying
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
};

export default CopyTradingPage;
