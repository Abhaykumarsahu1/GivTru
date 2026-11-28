import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useContract } from "../hooks/useContract";
import WorkspaceHeader from "../components/WorkspaceHeader";
import IpfsImage from "../components/IpfsImage";
import { queryAll } from "../utils/events";
import { campaignState, STATE_META, formatAmount, timeLeft, shortAddress } from "../utils/campaign";

const css = `
.gt-bh-page { min-height: calc(100vh - 69px); background: #f1f5f9; }
.gt-bh-inner { max-width: 1200px; margin: 0 auto; padding: 28px var(--page-gutter) 72px; }
.gt-bh-label { margin: 0 0 14px; font-size: 13px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; }
.gt-bh-list { display: flex; flex-direction: column; gap: 14px; }

.gt-bh {
    position: relative; display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; gap: 20px; align-items: center;
    padding: 18px 22px 18px 28px; background: #ffffff; border: 1px solid var(--border); border-radius: 16px;
    text-decoration: none; color: inherit; overflow: hidden;
    transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
}
.gt-bh:hover { box-shadow: 0 10px 28px rgba(15, 23, 42, 0.09); border-color: #cbd5e1; transform: translateY(-1px); }
.gt-bh:focus-visible { outline: 3px solid rgba(245, 158, 11, 0.5); outline-offset: 2px; }
.gt-bh-rail { position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: #cbd5e1; }
.gt-bh[data-urgent="true"] .gt-bh-rail { background: #f59e0b; }
.gt-bh[data-clear="true"] .gt-bh-rail { background: #22c55e; }
.gt-bh-thumb { position: relative; width: 72px; height: 72px; border-radius: 14px; overflow: hidden; background: #f1f5f9; }
.gt-bh-ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #fef3c7 0%, #e0e7ff 100%); color: #b45309; }
.gt-bh-main { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.gt-bh-titlerow { display: flex; align-items: center; gap: 10px; min-width: 0; }
.gt-bh-title { margin: 0; min-width: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gt-bh-meta { display: flex; flex-wrap: wrap; gap: 4px 18px; font-size: 13px; color: var(--text-muted); }
.gt-bh-meta b { font-weight: 700; color: var(--text); }
.gt-bh-meta code { font-family: var(--font-mono); font-size: 12.5px; }
.gt-bh-side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; text-align: right; }
.gt-bh-funds span { display: block; font-size: 12px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
.gt-bh-funds strong { font-size: 18px; font-weight: 800; }
.gt-bh-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
.gt-bh-chip { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.gt-bh-chip.urgent { background: #fef3c7; color: #92400e; }
.gt-bh-chip.danger { background: #fee2e2; color: #b91c1c; }
.gt-bh-chip.ok { background: #dcfce7; color: #15803d; }
.gt-bh-chip.muted { background: #f1f5f9; color: #475569; }
.gt-bh-cta { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; color: #b45309; }
@media (max-width: 760px) {
    .gt-bh { grid-template-columns: 56px minmax(0, 1fr); gap: 14px; padding: 16px 16px 16px 22px; }
    .gt-bh-thumb { width: 56px; height: 56px; border-radius: 12px; }
    .gt-bh-side { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; align-items: center; text-align: left; flex-wrap: wrap; }
    .gt-bh-chips { justify-content: flex-start; }
}

.gt-bh-state { max-width: 520px; margin: 56px auto; padding: 40px 28px; text-align: center; background: #ffffff; border: 1px dashed var(--border-strong); border-radius: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.gt-bh-state h2 { margin: 0; font-size: 20px; font-weight: 800; }
.gt-bh-state p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); }
.gt-bh-state .gt-btn { margin-top: 10px; }
.gt-bh-warn { margin: 0 0 16px; padding: 12px 16px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a; color: #78350f; font-size: 14px; }
.gt-bh-warn button { margin-left: 6px; padding: 0; background: none; border: none; font: inherit; font-weight: 700; color: inherit; text-decoration: underline; cursor: pointer; }
`;

const Svg = ({ children, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);
const IChevron = () => <Svg><path d="M9 6l6 6-6 6" /></Svg>;
const IShield = () => <Svg size={24}><path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></Svg>;

const useNow = (ms = 60000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
};

/**
 * The contract has no index of "campaigns where address X is on the board", so we ask every campaign
 * (one cheap isBoardMember call each) and load details only for the ones that match.
 */
function useBoardCampaigns() {
    const { account, chainId, provider } = useWallet();
    const { getFactoryContractReadOnly, getCampaignContractReadOnly } = useContract();
    const [state, setState] = useState({ status: "loading", campaigns: [], failed: 0, approx: false });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!account) { setState({ status: "nowallet", campaigns: [], failed: 0, approx: false }); return; }
            setState((s) => ({ ...s, status: "loading" }));
            try {
                const factory = getFactoryContractReadOnly();
                if (!factory) { setState({ status: "unsupported", campaigns: [], failed: 0, approx: false }); return; }

                const all = [...(await factory.getAllCampaigns())];
                const flags = await Promise.all(
                    all.map((a) => getCampaignContractReadOnly(a).isBoardMember(account).catch(() => false))
                );
                const mine = all.map((address, index) => ({ address, index })).filter((_, i) => flags[i]);

                let approx = false;
                const rows = await Promise.all(mine.map(async ({ address, index }) => {
                    try {
                        const c = getCampaignContractReadOnly(address);
                        const [title, ipfsHash, goal, raised, deadline, campaigner, balance, boardMembers, totalRequests] =
                            await Promise.all([
                                c.title(), c.ipfsHash(), c.goalAmount(), c.totalDonated(), c.deadline(), c.campaigner(),
                                c.getContractBalance(), c.getBoardMembers(), c.getTotalRequests(),
                            ]);
                        const reqs = await Promise.all(Array.from({ length: Number(totalRequests) }, (_, i) => c.requests(i)));
                        const pendingIds = reqs.map((r, id) => ({ id, status: Number(r.status) })).filter((r) => r.status === 0).map((r) => r.id);

                        // which pending requests have I already voted on? (the contract hides its hasVoted mapping, so read events)
                        let awaiting = pendingIds.length;
                        if (pendingIds.length > 0) {
                            try {
                                const { events } = await queryAll(c, c.filters.RequestVoted(null, account), provider);
                                const mineVoted = new Set(events.filter((e) => e.args).map((e) => Number(e.args.requestId)));
                                awaiting = pendingIds.filter((id) => !mineVoted.has(id)).length;
                            } catch { approx = true; }
                        }

                        return {
                            address, index, title, ipfsHash, goal, raised, balance, campaigner,
                            deadline: Number(deadline),
                            boardSize: boardMembers.length,
                            requestCount: reqs.length,
                            pending: pendingIds.length,
                            awaiting,
                        };
                    } catch (err) {
                        console.error("Could not load campaign", address, err);
                        return null;
                    }
                }));

                if (cancelled) return;
                const ok = rows.filter(Boolean).sort((a, b) => b.awaiting - a.awaiting || b.index - a.index);
                setState({ status: "ready", campaigns: ok, failed: rows.length - ok.length, approx });
            } catch (err) {
                console.error("Could not load board campaigns", err);
                if (!cancelled) setState({ status: "error", campaigns: [], failed: 0, approx: false });
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account, chainId, provider, reloadKey]);

    return { ...state, reload: () => setReloadKey((k) => k + 1) };
}

function BoardRow({ c, symbol, now }) {
    const stateKey = campaignState(c, now);
    const meta = STATE_META[stateKey];
    const reached = c.goal > 0n && c.raised >= c.goal;
    const open = meta.open;
    const urgent = c.awaiting > 0;

    return (
        <Link to={`/board/${c.address}`} className="gt-bh" data-urgent={urgent} data-clear={!urgent && c.pending === 0}>
            <span className="gt-bh-rail" />
            <div className="gt-bh-thumb">
                <IpfsImage hash={c.ipfsHash} fallback={<div className="gt-bh-ph"><IShield /></div>} />
            </div>

            <div className="gt-bh-main">
                <div className="gt-bh-titlerow">
                    <h3 className="gt-bh-title" title={c.title}>{c.title}</h3>
                    <span className={meta.badge}>{meta.label}</span>
                </div>
                <div className="gt-bh-meta">
                    <span>Started by <code title={c.campaigner}>{shortAddress(c.campaigner)}</code></span>
                    <span><b>{formatAmount(c.raised)} {symbol}</b> raised of {formatAmount(c.goal)}</span>
                    <span>{c.requestCount} request{c.requestCount === 1 ? "" : "s"}</span>
                    <span>{open ? timeLeft(c.deadline, now) : `Ended ${new Date(c.deadline * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}</span>
                </div>
            </div>

            <div className="gt-bh-side">
                <div className="gt-bh-funds"><span>In contract</span><strong>{formatAmount(c.balance)} {symbol}</strong></div>
                <div className="gt-bh-chips">
                    {urgent && <span className="gt-bh-chip urgent">{c.awaiting} need{c.awaiting === 1 ? "s" : ""} your vote</span>}
                    {urgent && !reached && <span className="gt-bh-chip danger">Goal not reached</span>}
                    {!urgent && c.pending > 0 && <span className="gt-bh-chip muted">Waiting on other members</span>}
                    {!urgent && c.pending === 0 && <span className="gt-bh-chip ok">All caught up</span>}
                </div>
                <span className="gt-bh-cta">{urgent ? "Review and vote" : "Open"} <IChevron /></span>
            </div>
        </Link>
    );
}

const BoardHome = () => {
    const navigate = useNavigate();
    const { account, symbol, network, connectWallet, loading: walletLoading } = useWallet();
    const { status, campaigns, failed, approx, reload } = useBoardCampaigns();
    const now = useNow();

    const totals = useMemo(() => ({
        awaiting: campaigns.reduce((s, c) => s + c.awaiting, 0),
        active: campaigns.filter((c) => STATE_META[campaignState(c, now)].open).length,
    }), [campaigns, now]);

    const ready = status === "ready";
    const stats = [
        { label: "Campaigns you oversee", value: ready ? campaigns.length : "-" },
        { label: "Awaiting your vote", value: ready ? totals.awaiting : "-", hint: ready && totals.awaiting > 0 ? "Requests are waiting on you" : undefined },
        { label: "Still running", value: ready ? totals.active : "-" },
    ];

    let body;
    if (status === "nowallet") {
        body = (
            <div className="gt-bh-state">
                <h2>Connect your wallet</h2>
                <p>Connect the wallet that was added as a board member.</p>
                <button className="gt-btn gt-btn-primary" onClick={connectWallet} disabled={walletLoading}>
                    {walletLoading ? "Connecting..." : "Connect Wallet"}
                </button>
            </div>
        );
    } else if (status === "unsupported") {
        body = (
            <div className="gt-bh-state">
                <h2>GivTru isn't on this network yet</h2>
                <p>Use the network switcher in the navbar to pick Arbitrum Sepolia or MST.</p>
            </div>
        );
    } else if (status === "error") {
        body = (
            <div className="gt-bh-state">
                <h2>Couldn't load your board campaigns</h2>
                <p>Something went wrong while reading from the blockchain. Check your connection and try again.</p>
                <button className="gt-btn gt-btn-primary" onClick={reload}>Try again</button>
            </div>
        );
    } else if (status === "loading") {
        body = (
            <div className="gt-bh-list">
                {[0, 1, 2].map((i) => <div key={i} className="gt-skeleton" style={{ height: 112, borderRadius: 16 }} />)}
            </div>
        );
    } else if (campaigns.length === 0) {
        body = (
            <div className="gt-bh-state">
                <h2>You're not on any board on {network?.name || "this network"}</h2>
                <p>When a campaigner adds your wallet as a board member, the campaign shows up here. Check that you're connected with the right wallet and network.</p>
                <button className="gt-btn gt-btn-secondary" onClick={() => navigate("/donate")}>Browse campaigns</button>
            </div>
        );
    } else {
        body = (
            <>
                {failed > 0 && (
                    <p className="gt-bh-warn">{failed} campaign{failed === 1 ? "" : "s"} couldn't be loaded.<button onClick={reload}>Retry</button></p>
                )}
                {approx && (
                    <p className="gt-bh-warn">Vote history couldn't be read from this network, so the "awaiting your vote" counts may include requests you already voted on.</p>
                )}
                <p className="gt-bh-label">Campaigns on {network?.name}</p>
                <div className="gt-bh-list">
                    {campaigns.map((c) => <BoardRow key={c.address} c={c} symbol={symbol} now={now} />)}
                </div>
            </>
        );
    }

    return (
        <div className="gt-bh-page">
            <style>{css}</style>
            <WorkspaceHeader
                eyebrow="Board member portal"
                title="Campaigns you oversee"
                subtitle={account ? "You decide when a campaign can spend its funds. Every vote is public and final." : "Connect a wallet to see the campaigns where you are a trustee."}
                stats={stats}
            />
            <main className="gt-bh-inner">{body}</main>
        </div>
    );
};

export default BoardHome;