import { useState } from "react";
import { useWalletDiscovery } from "../hooks/useWalletDiscovery";

const styles = {
    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    },
    modal: {
        background: "#111827",
        color: "#fff",
        padding: "24px",
        borderRadius: "16px",
        width: "360px",
        maxWidth: "90vw",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        border: "1px solid #1f2937",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    },
    title: { margin: "0 0 8px", fontSize: "20px", fontWeight: 700 },
    option: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "12px",
        background: "#1f2937",
        color: "#fff",
        border: "1px solid #374151",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: 500,
        textAlign: "left",
        transition: "all 0.15s",
    },
    optionHover: {
        background: "#273449",
        border: "1px solid #22c55e",
    },
    empty: { color: "#9ca3af", fontSize: "14px", margin: "4px 0" },
    cancel: {
        background: "none",
        border: "none",
        color: "#9ca3af",
        cursor: "pointer",
        marginTop: "4px",
        fontSize: "14px",
    },
};

export default function WalletModal({ open, onClose, onSelect }) {
    const wallets = useWalletDiscovery();
    const [hovered, setHovered] = useState(null);

    if (!open) return null;

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 style={styles.title}>Connect a wallet</h3>

                {wallets.length === 0 && (
                    <p style={styles.empty}>
                        No wallet detected. Install MetaMask, Phantom or BridgeKey.
                    </p>
                )}

                {wallets.map((w) => (
                    <button
                        key={w.info.uuid}
                        style={{
                            ...styles.option,
                            ...(hovered === w.info.uuid ? styles.optionHover : {}),
                        }}
                        onMouseEnter={() => setHovered(w.info.uuid)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => {
                            onSelect(w);
                            onClose();
                        }}
                    >
                        {w.info.icon && (
                            <img
                                src={w.info.icon}
                                alt=""
                                width={28}
                                height={28}
                                style={{ borderRadius: "6px" }}
                            />
                        )}
                        <span>{w.info.name}</span>
                    </button>
                ))}

                <button style={styles.cancel} onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>
    );
}