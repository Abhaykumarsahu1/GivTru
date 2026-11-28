import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useContract } from "../hooks/useContract";
import WorkspaceHeader from "../components/WorkspaceHeader";
import IpfsImage from "../components/IpfsImage";
import {
    campaignState, STATE_META, percentFunded, percentLabel, formatAmount, timeLeft,
} from "../utils/campaign";

const css = `
.gt-md { min-height: calc(100vh - 69px); background: #f1f5f9; }
.gt-md-inner { max-width: 1200px; margin: 0 auto; padding: 28px var(--page-gutter) 72px; }
.gt-md-list { display: flex; flex-direction: column; gap: 14px; }
.gt-md-label { margin: 0 0 14px; font-size: 13px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; }

/* one campaign = one wide row with a status rail (very different from the Browse cards) */
.gt-mc {
    position: relative; display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; gap: 20px; align-items: center;
    padding: 18px 22px 18px 28px; background: #ffffff; border: 1px solid var(--border); border-radius: 16px;
    text-decoration: none; color: inherit; overflow: hidden;
    transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
}
.gt-mc:hover { box-shadow: 0 10px 28px rgba(15, 23, 42, 0.09); border-color: #cbd5e1; transform: translateY(-1px); }
.gt-mc:focus-visible { outline: 3px solid rgba(34, 197, 94, 0.45); outline-offset: 2px; }
.gt-mc-rail { position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: #22c55e; }
.gt-mc[data-state="funded"] .gt-mc-rail { background: #0f172a; }
.gt-mc[data-state="failed"] .gt-mc-rail { background: #f59e0b; }
.gt-mc-thumb { position: relative; width: 88px; height: 88px; border-radius: 14px; overflow: hidden; background: #f1f5f9; }
.gt-mc-ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #dcfce7 0%, #e0e7ff 100%); color: #16a34a; }
.gt-mc-main { min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.gt-mc-titlerow { display: flex; align-items: center; gap: 10px; min-width: 0; }
.gt-mc-title { margin: 0; min-width: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gt-mc-bar { height: 6px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.gt-mc-fill { height: 100%; border-radius: 999px; background: #22c55e; }
.gt-mc-fill.is-full { background: #16a34a; }
.gt-mc-meta { display: flex; flex-wrap: wrap; gap: 4px 18px; font-size: 13px; color: var(--text-muted); }
.gt-mc-meta b { font-weight: 700; color: var(--text); }
.gt-mc-side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; text-align: right; }
.gt-mc-funds span { display: block; font-size: 12px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
.gt-mc-funds strong { font-size: 18px; font-weight: 800; }
.gt-mc-chip { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.gt-mc-chip.warn { background: #fef3c7; color: #92400e; }
.gt-mc-chip.ok { background: #dcfce7; color: #15803d; }
.gt-mc-chip.muted { background: #f1f5f9; color: #475569; }
.gt-mc-cta { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; color: var(--primary-ink); }
@media (max-width: 760px) {
    .gt-mc { grid-template-columns: 64px minmax(0, 1fr); gap: 14px; padding: 16px 16px 16px 22px; }
    .gt-mc-thumb { width: 64px; height: 64px; border-radius: 12px; }
    .gt-mc-side { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; align-items: center; text-align: left; flex-wrap: wrap; }
}

.gt-md-state { max-width: 520px; margin: 56px auto; padding: 40px 28px; text-align: center; background: #ffffff; border: 1px dashed var(--border-strong); border-radius: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.gt-md-state h2 { margin: 0; font-size: 20px; font-weight: 800; }
.gt-md-state p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); }
.gt-md-state .gt-btn { margin-top: 10px; }
.gt-md-warn { margin: 0 0 16px; padding: 12px 16px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a; color: #78350f; font-size: 14px; }
.gt-md-warn button { margin-left: 6px; padding: 0; background: none; border: none; font: inherit; font-weight: 700; color: inherit; text-decoration: underline; cursor: pointer; }
`;

const Svg = ({ children, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);
const IChevron = () => <Svg><path d="M9 6l6 6-6 6" /></Svg>;
const IHeart = () => <Svg size={26}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></Svg>;

const useNow = (ms = 60000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
};

/** Reads the connected wallet's campaigns from the factory, plus what each one needs from the campaigner. */
function useMyCampaigns() {
    const { account, chainId, provider } = useWallet();
    const { getFactoryContractReadOnly, getCampaignContractReadOnly } = useContract();
    const [state, setState] = useState({ status: "loading", campaigns: [], failed: 0 });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!account) { setState({ status: "nowallet", campaigns: [], failed: 0 }); return; }
            setState((s) => ({ ...s, status: "loading" }));
            try {
                const factory = getFactoryContractReadOnly();
                if (!factory) { setState({ status: "unsupported", campaigns: [], failed: 0 }); return; }

                const addresses = await factory.getCampaignsByCampaigner(account);
                const rows = await Promise.all(
                    [...addresses].map(async (address, index) => {
                        try {
                            const c = getCampaignContractReadOnly(address);
                            const [title, ipfsHash, goal, raised, deadline, donorCount, balance, totalRequests] =
                                await Promise.all([
                                    c.title(), c.ipfsHash(), c.goalAmount(), c.totalDonated(), c.deadline(),
                                    c.getDonorCount(), c.getContractBalance(), c.getTotalRequests(),
                                ]);
                            const reqs = await Promise.all(
                                Array.from({ length: Number(totalRequests) }, (_, i) => c.requests(i))
                            );
                            const pending = reqs.filter((r) => Number(r.status) === 0);
                            return {
                                address, index, title, ipfsHash, goal, raised, balance,
                                deadline: Number(deadline),
                                donorCount: Number(donorCount),
                                pendingCount: pending.length,
                                reserved: pending.reduce((s, r) => s + r.amount, 0n),
                            };
                        } catch (err) {
                            console.error("Could not load campaign", address, err);
                            return null;
                        }
                    })
                );
                if (cancelled) return;
                const ok = rows.filter(Boolean).sort((a, b) => b.index - a.index); // newest first
                setState({ status: "ready", campaigns: ok, failed: rows.length - ok.length });
            } catch (err) {
                console.error("Could not load your campaigns", err);
                if (!cancelled) setState({ status: "error", campaigns: [], failed: 0 });
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account, chainId, provider, reloadKey]);

    return { ...state, reload: () => setReloadKey((k) => k + 1) };
}

// what the campaigner should know about at a glance
function attention(c, stateKey) {
    if (c.pendingCount > 0) {
        return { cls: "warn", text: `${c.pendingCount} request${c.pendingCount === 1 ? "" : "s"} awaiting votes` };
    }
    if (stateKey === "failed") return { cls: "muted", text: "Goal missed, refunds open" };
    const free = c.balance > c.reserved ? c.balance - c.reserved : 0n;
    if ((stateKey === "funded" || stateKey === "goal_reached") && free > 0n) {
        return { cls: "ok", text: "Funds ready to withdraw" };
    }
    return null;
}

function CampaignRow({ c, symbol, now }) {
    const stateKey = campaignState(c, now);
    const meta = STATE_META[stateKey];
    const pct = percentFunded(c.raised, c.goal);
    const note = attention(c, stateKey);

    return (
        <Link to={`/dashboard/${c.address}`} className="gt-mc" data-state={stateKey}>
            <span className="gt-mc-rail" />
            <div className="gt-mc-thumb">
                <IpfsImage hash={c.ipfsHash} fallback={<div className="gt-mc-ph"><IHeart /></div>} />
            </div>

            <div className="gt-mc-main">
                <div className="gt-mc-titlerow">
                    <h3 className="gt-mc-title" title={c.title}>{c.title}</h3>
                    <span className={meta.badge}>{meta.label}</span>
                </div>
                <div className="gt-mc-bar">
                    <div className={`gt-mc-fill${pct >= 100 ? " is-full" : ""}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="gt-mc-meta">
                    <span><b>{formatAmount(c.raised)} {symbol}</b> of {formatAmount(c.goal)} ({percentLabel(pct)})</span>
                    <span>{c.donorCount} donor{c.donorCount === 1 ? "" : "s"}</span>
                    <span>{stateKey === "active" || stateKey === "goal_reached" ? timeLeft(c.deadline, now) : `Ended ${new Date(c.deadline * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}</span>
                </div>
            </div>

            <div className="gt-mc-side">
                <div className="gt-mc-funds"><span>In contract</span><strong>{formatAmount(c.balance)} {symbol}</strong></div>
                {note && <span className={`gt-mc-chip ${note.cls}`}>{note.text}</span>}
                <span className="gt-mc-cta">Manage <IChevron /></span>
            </div>
        </Link>
    );
}

const CampaignerDashboard = () => {
    const navigate = useNavigate();
    const { symbol, network, connectWallet, loading: walletLoading } = useWallet();
    const { status, campaigns, failed, reload } = useMyCampaigns();
    const now = useNow();

    const totals = useMemo(() => ({
        raised: campaigns.reduce((s, c) => s + c.raised, 0n),
        pending: campaigns.reduce((s, c) => s + c.pendingCount, 0),
    }), [campaigns]);

    const ready = status === "ready";
    const stats = [
        { label: "Campaigns", value: ready ? campaigns.length : "-" },
        { label: "Total raised", value: ready ? `${formatAmount(totals.raised)} ${symbol}` : "-" },
        { label: "Awaiting board votes", value: ready ? totals.pending : "-", hint: ready && totals.pending > 0 ? "Needs your trustees" : undefined },
    ];

    let body;
    if (status === "nowallet") {
        body = (
            <div className="gt-md-state">
                <h2>Connect your wallet</h2>
                <p>Connect the wallet you used to start your campaigns.</p>
                <button className="gt-btn gt-btn-primary" onClick={connectWallet} disabled={walletLoading}>
                    {walletLoading ? "Connecting..." : "Connect Wallet"}
                </button>
            </div>
        );
    } else if (status === "unsupported") {
        body = (
            <div className="gt-md-state">
                <h2>GivTru isn't on this network yet</h2>
                <p>Use the network switcher in the navbar to pick Arbitrum Sepolia or MST.</p>
            </div>
        );
    } else if (status === "error") {
        body = (
            <div className="gt-md-state">
                <h2>Couldn't load your campaigns</h2>
                <p>Something went wrong while reading from the blockchain. Check your connection and try again.</p>
                <button className="gt-btn gt-btn-primary" onClick={reload}>Try again</button>
            </div>
        );
    } else if (status === "loading") {
        body = (
            <div className="gt-md-list">
                {[0, 1, 2].map((i) => <div key={i} className="gt-skeleton" style={{ height: 124, borderRadius: 16 }} />)}
            </div>
        );
    } else if (campaigns.length === 0) {
        body = (
            <div className="gt-md-state">
                <h2>No campaigns on {network?.name || "this network"} yet</h2>
                <p>Campaigns you start with this wallet will show up here. Switch networks if you started one elsewhere.</p>
                <button className="gt-btn gt-btn-primary" onClick={() => navigate("/register")}>Start a campaign</button>
            </div>
        );
    } else {
        body = (
            <>
                {failed > 0 && (
                    <p className="gt-md-warn">
                        {failed} campaign{failed === 1 ? "" : "s"} couldn't be loaded.<button onClick={reload}>Retry</button>
                    </p>
                )}
                <p className="gt-md-label">Your campaigns on {network?.name}</p>
                <div className="gt-md-list">
                    {campaigns.map((c) => <CampaignRow key={c.address} c={c} symbol={symbol} now={now} />)}
                </div>
            </>
        );
    }

    return (
        <div className="gt-md">
            <style>{css}</style>
            <WorkspaceHeader
                eyebrow="Campaigner workspace"
                title="My campaigns"
                subtitle="Track funding, manage withdrawals and see what needs your attention."
                actions={<button className="gt-btn gt-btn-primary" onClick={() => navigate("/register")}>New campaign</button>}
                stats={stats}
            />
            <main className="gt-md-inner">{body}</main>
        </div>
    );
};

export default CampaignerDashboard;