import { useEffect, useMemo } from "react";
import { useWalletDiscovery } from "../hooks/useWalletDiscovery";

const LAST_KEY = "gt:lastWallet";

const GET_WALLET_LINKS = [
    { name: "MetaMask",        url: "https://metamask.io/download" },
    { name: "Phantom",         url: "https://phantom.com/download" },
    { name: "Coinbase Wallet", url: "https://www.coinbase.com/wallet" },
    { name: "Rabby",           url: "https://rabby.io" },
];

const css = `
@keyframes gt-wm-in {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
.gt-wm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
}
.gt-wm {
    width: 400px;
    max-width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    background: #ffffff;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
    animation: gt-wm-in 0.18s ease-out;
}
.gt-wm-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.gt-wm-title { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
.gt-wm-sub { margin: 4px 0 0; font-size: 14px; color: var(--text-muted); line-height: 1.5; }
.gt-wm-x {
    background: none; border: none; cursor: pointer; color: var(--text-dim);
    font-size: 22px; line-height: 1; padding: 2px 6px; border-radius: 8px;
}
.gt-wm-x:hover { background: var(--surface-alt); color: var(--text); }

.gt-wm-list { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.gt-wm-option {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 12px 14px;
    background: #ffffff;
    color: var(--text);
    border: 1px solid var(--border-strong);
    border-radius: 14px;
    cursor: pointer;
    text-align: left;
    font: inherit;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s;
}
.gt-wm-option:hover {
    border-color: var(--primary);
    background: #f0fdf4;
    box-shadow: 0 4px 14px rgba(34, 197, 94, 0.15);
    transform: translateY(-1px);
}
.gt-wm-option:focus-visible { outline: 3px solid rgba(34, 197, 94, 0.45); outline-offset: 2px; }
.gt-wm-icon { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; object-fit: cover; }
.gt-wm-icon-fallback {
    display: flex; align-items: center; justify-content: center;
    background: var(--surface-alt); color: var(--text-muted); font-weight: 800; font-size: 16px;
}
.gt-wm-name { flex: 1; font-size: 16px; font-weight: 600; }
.gt-wm-tag {
    font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px;
    background: #dcfce7; color: var(--primary-ink);
}
.gt-wm-tag-muted { background: var(--surface-alt); color: var(--text-dim); }
.gt-wm-chevron { color: var(--text-dim); font-size: 18px; }

.gt-wm-empty {
    margin-top: 18px; padding: 16px; border-radius: 14px;
    background: var(--surface-alt); color: var(--text-muted); font-size: 14px; line-height: 1.6;
}
.gt-wm-empty strong { color: var(--text); }
.gt-wm-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.gt-wm-link {
    font-size: 13px; font-weight: 600; text-decoration: none;
    color: var(--primary-ink); border: 1px solid var(--primary-ink);
    padding: 6px 12px; border-radius: 999px; background: #ffffff;
}
.gt-wm-link:hover { background: #f0fdf4; }

.gt-wm-foot { margin: 18px 0 0; font-size: 12px; color: var(--text-dim); line-height: 1.6; }
.gt-wm-cancel {
    display: block; width: 100%; margin-top: 12px; padding: 10px;
    background: none; border: none; cursor: pointer; font: inherit; font-size: 14px;
    color: var(--text-dim); border-radius: 10px;
}
.gt-wm-cancel:hover { background: var(--surface-alt); color: var(--text); }
`;

const readLast = () => {
    try { return localStorage.getItem(LAST_KEY); } catch { return null; }
};
const saveLast = (id) => {
    try { localStorage.setItem(LAST_KEY, id); } catch { /* storage unavailable */ }
};
const walletId = (w) => w.info.rdns || w.info.name;

export default function WalletModal({ open, onClose, onSelect }) {
    const wallets = useWalletDiscovery();
    const last = open ? readLast() : null;

    // last used wallet first, the rest alphabetical
    const sorted = useMemo(() => {
        return [...wallets].sort((a, b) => {
            if (last) {
                if (walletId(a) === last) return -1;
                if (walletId(b) === last) return 1;
            }
            return a.info.name.localeCompare(b.info.name);
        });
    }, [wallets, last]);

    // close on Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const pick = (w) => {
        saveLast(walletId(w));
        onSelect(w);
        onClose();
    };

    return (
        <div className="gt-wm-backdrop" onClick={onClose}>
            <style>{css}</style>
            <div
                className="gt-wm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="gt-wm-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="gt-wm-head">
                    <div>
                        <h3 className="gt-wm-title" id="gt-wm-title">Connect a wallet</h3>
                        <p className="gt-wm-sub">
                            {sorted.length > 0
                                ? "Choose one of the wallets detected in this browser."
                                : "Connect with a browser wallet to continue."}
                        </p>
                    </div>
                    <button className="gt-wm-x" onClick={onClose} aria-label="Close">×</button>
                </div>

                {sorted.length > 0 ? (
                    <div className="gt-wm-list">
                        {sorted.map((w, i) => {
                            const isLast = last && walletId(w) === last;
                            return (
                                <button key={w.info.uuid} className="gt-wm-option" onClick={() => pick(w)}>
                                    {w.info.icon ? (
                                        <img className="gt-wm-icon" src={w.info.icon} alt="" />
                                    ) : (
                                        <span className="gt-wm-icon gt-wm-icon-fallback">
                                            {w.info.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                    <span className="gt-wm-name">{w.info.name}</span>
                                    {isLast ? (
                                        <span className="gt-wm-tag">Last used</span>
                                    ) : (
                                        <span className="gt-wm-tag gt-wm-tag-muted">Detected</span>
                                    )}
                                    <span className="gt-wm-chevron" aria-hidden="true">›</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="gt-wm-empty">
                        <strong>No wallet detected in this browser.</strong>
                        <br />
                        Install one of these, then refresh the page:
                        <div className="gt-wm-links">
                            {GET_WALLET_LINKS.map((l) => (
                                <a key={l.name} className="gt-wm-link" href={l.url} target="_blank" rel="noopener noreferrer">
                                    {l.name}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <p className="gt-wm-foot">
                    Connecting only shares your public address. GivTru never has access to your
                    keys or funds. Don't see your wallet? Make sure its extension is enabled for
                    this site, then refresh.
                </p>

                <button className="gt-wm-cancel" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
}