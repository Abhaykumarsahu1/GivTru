import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import CryptoBackdrop from "../components/CryptoBackdrop";

const STATS = [
    { value: "100%", label: "On-chain transparency" },
    { value: "2/3",  label: "Board supermajority required" },
    { value: "0",    label: "Middlemen" },
];

const css = `
.gt-landing {
    position: relative;
    overflow: hidden;
    min-height: calc(100vh - 69px); /* viewport minus navbar */
    display: flex;
}
.gt-landing-main {
    position: relative;
    z-index: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 56px;
    padding: 48px var(--page-gutter) 40px;
}
.gt-hero {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    text-align: left;
}
.gt-hero-title {
    margin: 0;
    font-size: clamp(36px, 5.2vw, 60px);
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text);
}
.gt-hero-title span { color: #16a34a; }
.gt-hero-sub {
    margin: 0;
    max-width: 560px;
    font-size: 18px;
    line-height: 1.7;
    color: var(--text-muted);
}
.gt-hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 8px; }
.gt-btn-lg { padding: 14px 28px; font-size: 16px; border-radius: 10px; }
.gt-landing .gt-btn-secondary {
    background: rgba(255, 255, 255, 0.85);
    color: var(--primary-ink);
    border-color: var(--primary-ink);
}
.gt-landing .gt-btn-secondary:hover:not(:disabled) { background: #f0fdf4; }

.gt-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}
.gt-stat {
    padding: 26px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
}
.gt-stat + .gt-stat { border-left: 1px solid var(--border); }
.gt-stat-value { font-size: 30px; font-weight: 800; color: var(--primary-ink); }
.gt-stat-label { font-size: 13px; color: var(--text-dim); }

@media (max-width: 720px) {
    .gt-landing-main { gap: 36px; padding-top: 32px; }
    .gt-hero-sub { font-size: 16px; }
    .gt-hero-actions .gt-btn { width: 100%; }
    .gt-stats { grid-template-columns: 1fr; }
    .gt-stat + .gt-stat { border-left: none; border-top: 1px solid var(--border); }
}
`;

const Landing = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { account, connectWallet } = useWallet();

    // Not connected: open the wallet picker instead of an alert()
    const go = (path) => {
        if (!account) {
            toast.info("Connect your wallet to continue.");
            connectWallet();
            return;
        }
        navigate(path);
    };

    return (
        <div className="gt-landing">
            <style>{css}</style>
            <CryptoBackdrop />

            <main className="gt-landing-main">
                <section className="gt-hero">
                    <h1 className="gt-hero-title">
                        Transparent Giving,
                        <br />
                        <span>Powered by Blockchain</span>
                    </h1>
                    <p className="gt-hero-sub">
                        GivTru is a decentralized charity platform where every donation
                        is tracked on-chain and every withdrawal requires board approval.
                        No middlemen. No blind trust.
                    </p>

                    <div className="gt-hero-actions">
                        <button className="gt-btn gt-btn-primary gt-btn-lg" onClick={() => go("/register")}>
                            Start a Campaign
                        </button>
                        <button className="gt-btn gt-btn-secondary gt-btn-lg" onClick={() => go("/donate")}>
                            Browse Campaigns
                        </button>
                    </div>
                </section>

                <section className="gt-stats" aria-label="Platform guarantees">
                    {STATS.map((s) => (
                        <div key={s.label} className="gt-stat">
                            <span className="gt-stat-value">{s.value}</span>
                            <span className="gt-stat-label">{s.label}</span>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
};

export default Landing;