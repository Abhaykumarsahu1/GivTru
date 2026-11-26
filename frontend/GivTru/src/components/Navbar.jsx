import { useWallet } from "../context/WalletContext";
import { useNavigate, useLocation } from "react-router-dom";
import { NETWORKS } from "../contracts/networks";
import GivTru from "../assets/GivTru.png";

const LINKS = [
    { path: "/donate",    label: "Browse Campaigns" },
    { path: "/register",  label: "Start Campaign" },
    { path: "/dashboard", label: "My Campaigns" },
];

const css = `
/* logo (left) | links (centered in the free space) | wallet controls (right) */
.gt-nav {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 14px var(--page-gutter);
    background: #ffffff;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
}
.gt-logo {
    grid-column: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 24px;
    font-weight: 800;
    color: #16a34a;
    letter-spacing: -0.01em;
}
.gt-nav-links {
    grid-column: 2;
    justify-self: center;
    display: flex;
    align-items: center;
    gap: 6px;
}
.gt-nav-link {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 8px 14px;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
    white-space: nowrap;
    transition: color 0.15s, border-color 0.15s;
}
.gt-nav-link:hover { color: var(--text); border-bottom-color: var(--border-strong); }
.gt-nav-link.is-active { color: var(--primary-ink); border-bottom-color: var(--primary); }
.gt-nav-link.is-board.is-active { color: #b45309; border-bottom-color: #f59e0b; }
.gt-nav-right {
    grid-column: 3;
    display: flex;
    align-items: center;
    gap: 12px;
}

/* network pill: status dot + chain name (native select inside, so it works everywhere) */
.gt-net {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px 0 12px;
    background: #ffffff;
    border: 1px solid var(--border-strong);
    border-radius: 999px;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.gt-net:hover { border-color: var(--primary); }
.gt-net:focus-within { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25); }
.gt-net-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
.gt-net.is-bad { border-color: #f59e0b; background: #fffbeb; }
.gt-net.is-bad .gt-net-dot { background: #f59e0b; }
.gt-net select {
    border: none;
    background: transparent;
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    padding: 8px 4px;
    cursor: pointer;
    outline: none;
}

.gt-address {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 13px;
    background: var(--surface-alt);
    padding: 7px 12px;
    border-radius: var(--radius-md);
}

@media (max-width: 900px) {
    .gt-nav { display: flex; flex-wrap: wrap; justify-content: space-between; }
    .gt-nav-links { order: 3; width: 100%; justify-content: center; overflow-x: auto; }
}
@media (max-width: 560px) {
    .gt-address { display: none; }
    .gt-nav-right { gap: 8px; }
}
`;

const Navbar = () => {
    const {
        account, connectWallet, disconnectWallet, shortAddress,
        loading, isBoardMember, chainId, switchNetwork,
    } = useWallet();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;
    const unsupported = account && !NETWORKS[chainId];
    if (location.pathname === "/register") return null;

    return (
        <>
            <style>{css}</style>
            <nav className="gt-nav">
                <button className="gt-logo" onClick={() => navigate("/")} aria-label="GivTru home">
                    <img src={GivTru} alt="" height="34" style={{ display: "block" }} />
                    GivTru
                </button>

                {/* always rendered so the grid keeps its middle column */}
                <div className="gt-nav-links">
                    {account && LINKS.map((l) => (
                        <button
                            key={l.path}
                            className={`gt-nav-link${isActive(l.path) ? " is-active" : ""}`}
                            onClick={() => navigate(l.path)}
                        >
                            {l.label}
                        </button>
                    ))}
                    {account && isBoardMember && (
                        <button
                            className={`gt-nav-link is-board${isActive("/board-home") ? " is-active" : ""}`}
                            onClick={() => navigate("/board-home")}
                        >
                            Board Member
                        </button>
                    )}
                </div>

                <div className="gt-nav-right">
                    {account ? (
                        <>
                            <label className={`gt-net${unsupported ? " is-bad" : ""}`} title="Network">
                                <span className="gt-net-dot" />
                                <select
                                    value={NETWORKS[chainId] ? chainId : ""}
                                    onChange={(e) => switchNetwork(e.target.value)}
                                    aria-label="Network"
                                >
                                    {unsupported && <option value="">Unsupported network</option>}
                                    {Object.values(NETWORKS).map((n) => (
                                        <option key={n.chainId} value={n.chainId}>{n.name}</option>
                                    ))}
                                </select>
                            </label>
                            <span className="gt-address">{shortAddress(account)}</span>
                            <button className="gt-btn gt-btn-danger" onClick={disconnectWallet}>
                                Disconnect
                            </button>
                        </>
                    ) : (
                        <button
                            className="gt-btn gt-btn-primary"
                            onClick={connectWallet}
                            disabled={loading}
                        >
                            {loading ? "Connecting..." : "Connect Wallet"}
                        </button>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navbar;