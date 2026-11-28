import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { useContract } from "../hooks/useContract";
import { useToast } from "../context/ToastContext";
import WorkspaceHeader from "../components/WorkspaceHeader";
import SuccessDialog from "../components/SuccessDialog";
import TxLink from "../components/TxLink";
import { queryAll } from "../utils/events";
import {
    campaignState, STATE_META, percentFunded, percentLabel, formatAmount, timeLeft,
    timeAgo, formatDateTime, shortAddress, approvalsNeeded,
} from "../utils/campaign";

const css = `
.gt-bd { min-height: calc(100vh - 69px); background: #f1f5f9; }
.gt-bd-inner { max-width: 1200px; margin: 0 auto; padding: 28px var(--page-gutter) 72px; }
.gt-bd-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; align-items: start; }
.gt-bd-main { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.gt-bd-side { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 92px; min-width: 0; }
@media (max-width: 980px) { .gt-bd-layout { grid-template-columns: minmax(0, 1fr); } .gt-bd-side { position: static; } }
.gt-bd-card { background: #ffffff; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
.gt-bd-card h2 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.01em; }
.gt-bd-sechead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.gt-bd-count { font-size: 13px; font-weight: 700; color: var(--text-dim); background: var(--surface-alt); padding: 3px 10px; border-radius: 999px; }
.gt-bd-count.is-urgent { background: #fef3c7; color: #92400e; }
.gt-bd-muted { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); }

.gt-bd-notice { display: flex; gap: 12px; padding: 14px 16px; border-radius: 14px; font-size: 14px; line-height: 1.6; background: #f8fafc; border: 1px solid var(--border); color: var(--text-muted); }
.gt-bd-notice.is-warn { background: #fffbeb; border-color: #fde68a; color: #78350f; }
.gt-bd-notice.is-danger { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.gt-bd-notice.is-ok { background: #f0fdf4; border-color: #bbf7d0; color: #14532d; }
.gt-bd-notice svg { flex-shrink: 0; margin-top: 3px; }
.gt-bd-notice p { margin: 0; }
.gt-bd-notice strong { display: block; }

/* requests */
.gt-bq-list { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }
.gt-bq { border: 1px solid var(--border); border-left: 5px solid #cbd5e1; border-radius: 14px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.gt-bq[data-s="awaiting"] { border-left-color: #f59e0b; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.10); }
.gt-bq[data-s="paid"] { border-left-color: #22c55e; }
.gt-bq[data-s="rejected"] { border-left-color: #ef4444; }
.gt-bq-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.gt-bq-head > div { display: flex; align-items: center; gap: 10px; }
.gt-bq-n { font-size: 13px; font-weight: 700; color: var(--text-dim); }
.gt-bq-amt { font-size: 22px; font-weight: 800; letter-spacing: -0.01em; }
.gt-bq-desc { margin: 0; font-size: 14.5px; line-height: 1.65; overflow-wrap: anywhere; }
.gt-bq-ctx { margin: 0; font-size: 13px; color: var(--text-dim); }
.gt-bq-votes { display: flex; flex-direction: column; gap: 8px; }
.gt-bq-votes-row { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 13px; font-weight: 600; }
.gt-bq-votes-row span:last-child { font-weight: 500; color: var(--text-dim); }
.gt-bq-seg { display: flex; gap: 6px; }
.gt-bq-seg i { flex: 1; height: 8px; border-radius: 999px; background: #e2e8f0; }
.gt-bq-seg i.ok { background: #22c55e; }
.gt-bq-seg i.no { background: #ef4444; }
.gt-bq-voters { display: flex; flex-wrap: wrap; gap: 6px; }
.gt-bq-voter { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: #f8fafc; border: 1px solid var(--border); font-size: 12px; color: var(--text-muted); }
.gt-bq-voter i { width: 7px; height: 7px; border-radius: 50%; }
.gt-bq-voter.is-me { background: #fffbeb; border-color: #fde68a; color: #78350f; font-weight: 700; }
.gt-bq-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.gt-bq-actions .gt-btn { padding: 13px; font-size: 15px; border-radius: 12px; }
.gt-bq-approve { background: #22c55e; color: #052e16; }
.gt-bq-approve:hover:not(:disabled) { background: #16a34a; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35); }
.gt-bq-reject { background: #ffffff; color: #dc2626; border: 2px solid #dc2626; }
.gt-bq-reject:hover:not(:disabled) { background: #fef2f2; }
.gt-bq-foot { display: flex; flex-wrap: wrap; gap: 6px 18px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 13px; color: var(--text-dim); }
.gt-bq-fine { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--text-dim); }
.gt-bd-empty { margin-top: 16px; padding: 28px 20px; text-align: center; font-size: 14px; color: var(--text-muted); background: #f8fafc; border: 1px dashed var(--border-strong); border-radius: 14px; }
@media (max-width: 520px) { .gt-bq-actions { grid-template-columns: 1fr; } }

/* sidebar */
.gt-bd-bar { height: 10px; border-radius: 999px; background: #e2e8f0; overflow: hidden; margin: 14px 0 10px; }
.gt-bd-fill { height: 100%; border-radius: 999px; background: #22c55e; }
.gt-bd-fill.is-short { background: #f59e0b; }
.gt-bd-kv { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
.gt-bd-kv:last-of-type { border-bottom: none; }
.gt-bd-kv span { color: var(--text-dim); }
.gt-bd-kv strong { font-weight: 700; text-align: right; }
.gt-bd-bm { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
.gt-bd-bm:last-child { border-bottom: none; }
.gt-bd-bm .n { width: 20px; font-weight: 700; color: var(--text-dim); }
.gt-bd-bm code { flex: 1; min-width: 0; font-family: var(--font-mono); color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; }
.gt-bd-bm .v { font-size: 12px; color: var(--text-dim); }
.gt-bd-tag { font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: #fef3c7; color: #92400e; }

/* confirm dialog */
.gt-cf-backdrop { position: fixed; inset: 0; z-index: 9990; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); }
.gt-cf { width: 460px; max-width: 100%; max-height: 92vh; overflow-y: auto; background: #ffffff; border-radius: 22px; padding: 28px; box-shadow: 0 30px 70px rgba(15, 23, 42, 0.3); display: flex; flex-direction: column; gap: 14px; }
.gt-cf h2 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
.gt-cf-amt { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
.gt-cf-desc { margin: 0; padding: 12px 14px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--border); font-size: 14px; line-height: 1.6; color: var(--text-muted); overflow-wrap: anywhere; max-height: 140px; overflow-y: auto; }
.gt-cf-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; }
.gt-cf-actions .gt-btn { padding: 13px; font-size: 15px; border-radius: 12px; }

.gt-bd-state { max-width: 520px; margin: 72px auto; padding: 40px 28px; text-align: center; background: #ffffff; border: 1px dashed var(--border-strong); border-radius: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.gt-bd-state h2 { margin: 0; font-size: 20px; font-weight: 800; }
.gt-bd-state p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); }
.gt-bd-state .gt-btn { margin-top: 10px; }
`;

const Svg = ({ children, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);
const IAlert = () => <Svg><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></Svg>;
const IInfo = () => <Svg><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></Svg>;
const ICheck = () => <Svg><path d="M5 13l4 4L19 7" /></Svg>;

const lower = (a) => (a ? a.toLowerCase() : "");

const useNow = (ms = 60000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
};

function useBoardData(address) {
    const { account, provider, chainId } = useWallet();
    const { getCampaignContractReadOnly } = useContract();
    const [core, setCore] = useState({ status: "loading", data: null, key: "" });
    const [activity, setActivity] = useState({ status: "loading", votes: {}, requested: {}, paid: {}, key: "" });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const key = `${chainId}:${address}:${lower(account)}`;

        (async () => {
            if (!provider || !account) { setCore({ status: "nowallet", data: null, key }); return; }
            if (!ethers.isAddress(address)) { setCore({ status: "notfound", data: null, key }); return; }

            setCore((s) => (s.key === key ? s : { status: "loading", data: null, key }));
            setActivity((a) => (a.key === key ? a : { status: "loading", votes: {}, requested: {}, paid: {}, key }));

            try {
                const code = await provider.getCode(address);
                if (cancelled) return;
                if (code === "0x") { setCore({ status: "notfound", data: null, key }); return; }

                const c = getCampaignContractReadOnly(address);
                const [title, goal, raised, deadline, campaigner, boardMembers, totalRequests, balance, isMember] =
                    await Promise.all([
                        c.title(), c.goalAmount(), c.totalDonated(), c.deadline(), c.campaigner(),
                        c.getBoardMembers(), c.getTotalRequests(), c.getContractBalance(), c.isBoardMember(account),
                    ]);
                const reqs = await Promise.all(Array.from({ length: Number(totalRequests) }, (_, i) => c.requests(i)));
                if (cancelled) return;

                setCore({
                    status: "ready", key,
                    data: {
                        address, title, goal, raised, balance, campaigner, isMember,
                        deadline: Number(deadline),
                        boardMembers: [...boardMembers],
                        requests: reqs.map((r, id) => ({
                            id, description: r.description, amount: r.amount,
                            approvals: Number(r.approvalCount), rejections: Number(r.rejectionCount),
                            status: Number(r.status), executed: r.executed,
                        })),
                    },
                });

                try {
                    const [vot, req, exe] = await Promise.all([
                        queryAll(c, c.filters.RequestVoted(), provider),
                        queryAll(c, c.filters.WithdrawalRequested(), provider),
                        queryAll(c, c.filters.RequestExecuted(), provider),
                    ]);

                    const votes = {};
                    vot.events.filter((e) => e.args).forEach((e) => {
                        const id = Number(e.args.requestId);
                        (votes[id] ||= []).push({ member: e.args.boardMember, approved: e.args.approved });
                    });
                    const requestedBlock = {};
                    req.events.filter((e) => e.args).forEach((e) => { requestedBlock[Number(e.args.requestId)] = e.blockNumber; });
                    const paidInfo = {};
                    exe.events.filter((e) => e.args).forEach((e) => { paidInfo[Number(e.args.requestId)] = { block: e.blockNumber, hash: e.transactionHash }; });

                    const blocks = [...new Set([...Object.values(requestedBlock), ...Object.values(paidInfo).map((p) => p.block)])].slice(0, 60);
                    const stamps = {};
                    await Promise.all(blocks.map(async (b) => {
                        try { stamps[b] = (await provider.getBlock(b))?.timestamp ?? null; } catch { stamps[b] = null; }
                    }));

                    const requested = {};
                    Object.entries(requestedBlock).forEach(([id, b]) => { requested[id] = stamps[b] ?? null; });
                    const paid = {};
                    Object.entries(paidInfo).forEach(([id, p]) => { paid[id] = { ts: stamps[p.block] ?? null, hash: p.hash }; });

                    if (!cancelled) setActivity({ status: "ready", votes, requested, paid, key });
                } catch (err) {
                    console.error("Could not read vote events", err);
                    if (!cancelled) setActivity({ status: "unavailable", votes: {}, requested: {}, paid: {}, key });
                }
            } catch (err) {
                console.error("Could not load campaign", err);
                if (!cancelled) setCore({ status: "error", data: null, key });
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address, chainId, provider, account, reloadKey]);

    return { core, activity, reload: () => setReloadKey((k) => k + 1) };
}

const BoardDashboard = () => {
    const { address } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { account, network, symbol, explorer, connectWallet, loading: walletLoading } = useWallet();
    const { getCampaignContract } = useContract();
    const { core, activity, reload } = useBoardData(address);
    const now = useNow();

    const [confirm, setConfirm] = useState(null);   // { r, approve }
    const [voting, setVoting] = useState(false);
    const [justVoted, setJustVoted] = useState(() => new Set()); // hides buttons until the new vote shows up in events
    const [success, setSuccess] = useState(null);

    const data = core.data;
    const me = lower(account);

    useEffect(() => {
        if (!confirm) return;
        const onKey = (e) => e.key === "Escape" && !voting && setConfirm(null);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [confirm, voting]);

    const stateCard = (title, text, action) => (
        <div className="gt-bd">
            <style>{css}</style>
            <div className="gt-bd-state">
                <h2>{title}</h2>
                <p>{text}</p>
                {action}
            </div>
        </div>
    );

    if (core.status === "nowallet") {
        return stateCard("Connect your wallet", "Connect the wallet that was added as a board member to vote.",
            <button className="gt-btn gt-btn-primary" onClick={connectWallet} disabled={walletLoading}>
                {walletLoading ? "Connecting..." : "Connect Wallet"}
            </button>);
    }
    if (core.status === "notfound") {
        return stateCard("Campaign not found",
            `There is no campaign at this address on ${network?.name || "this network"}. It may be on a different network. Switch networks from the navbar.`,
            <button className="gt-btn gt-btn-secondary" onClick={() => navigate("/board-home")}>Back to board portal</button>);
    }
    if (core.status === "error") {
        return stateCard("Couldn't load this campaign", "Something went wrong while reading from the blockchain. Check your connection and try again.",
            <button className="gt-btn gt-btn-primary" onClick={reload}>Try again</button>);
    }
    if (core.status === "loading" || !data) {
        return (
            <div className="gt-bd">
                <style>{css}</style>
                <div className="gt-skeleton" style={{ height: 220, borderRadius: 0 }} />
                <div className="gt-bd-inner">
                    <div className="gt-bd-layout">
                        <div className="gt-skeleton" style={{ height: 380, borderRadius: 16 }} />
                        <div className="gt-skeleton" style={{ height: 380, borderRadius: 16 }} />
                    </div>
                </div>
            </div>
        );
    }
    if (!data.isMember) {
        return stateCard("You're not on this board",
            "Only the board members chosen when this campaign launched can vote on its requests. You can still follow it on the public page.",
            <button className="gt-btn gt-btn-primary" onClick={() => navigate(`/campaign/${address}`)}>View campaign</button>);
    }

    /* ── derived state ── */

    const stateKey = campaignState(data, now);
    const meta = STATE_META[stateKey];
    const open = meta.open;
    const pct = percentFunded(data.raised, data.goal);
    const reached = data.goal > 0n && data.raised >= data.goal;
    const boardSize = data.boardMembers.length;
    const needed = approvalsNeeded(boardSize);
    const endedDate = new Date(data.deadline * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

    const myVoteOn = (id) => (activity.votes[id] || []).find((v) => lower(v.member) === me) || null;
    const iVoted = (id) => !!myVoteOn(id) || justVoted.has(id);

    const awaiting = data.requests.filter((r) => r.status === 0 && !iVoted(r.id));
    const history = data.requests.filter((r) => !(r.status === 0 && !iVoted(r.id))).reverse();

    const voteCount = (m) => Object.values(activity.votes).flat().filter((v) => lower(v.member) === lower(m)).length;

    /* ── voting ── */

    const outcomeOf = (r, approve) => ({
        executes: approve && r.approvals + 1 >= needed,
        closes: !approve && r.rejections + 1 >= needed,
        blocked: approve && r.approvals + 1 >= needed && r.amount > data.balance,
    });

    const submitVote = async () => {
        const { r, approve } = confirm;
        const outcome = outcomeOf(r, approve);
        setVoting(true);
        try {
            const contract = getCampaignContract(address);
            if (!contract) { toast.error("Your wallet isn't ready. Reconnect it and try again."); return; }
            const receipt = await toast.track(() => contract.voteOnRequest(r.id, approve), {
                pending: "Confirm your vote in your wallet...", silent: true,
            });
            setConfirm(null);
            if (receipt) {
                setJustVoted((s) => new Set(s).add(r.id));
                setSuccess({ r, approve, outcome, hash: receipt.hash });
                reload();
            }
        } finally {
            setVoting(false);
        }
    };

    /* ── request card ── */

    const RequestCard = ({ r, actionable }) => {
        const voters = activity.votes[r.id] || [];
        const mine = myVoteOn(r.id);
        const requestedTs = activity.requested[r.id];
        const paid = activity.paid[r.id];
        const s = r.executed ? "paid" : r.status === 2 ? "rejected" : actionable ? "awaiting" : "pending";
        const badge = r.executed ? { l: "Paid out", c: "gt-badge gt-badge-success" }
            : r.status === 2 ? { l: "Rejected", c: "gt-badge gt-badge-danger" }
            : { l: actionable ? "Needs your vote" : "Voting", c: "gt-badge gt-badge-warning" };
        const approveOutcome = outcomeOf(r, true);

        return (
            <div className="gt-bq" data-s={s}>
                <div className="gt-bq-head">
                    <div><span className="gt-bq-n">Request {r.id + 1}</span><span className={badge.c}>{badge.l}</span></div>
                    <span className="gt-bq-amt">{formatAmount(r.amount)} {symbol}</span>
                </div>
                <p className="gt-bq-desc">{r.description}</p>
                <p className="gt-bq-ctx">
                    {requestedTs ? `Requested ${timeAgo(requestedTs, now)}. ` : ""}
                    The contract currently holds {formatAmount(data.balance)} {symbol}.
                </p>

                {actionable && !reached && (
                    <div className="gt-bd-notice is-danger">
                        <IAlert />
                        <div>
                            <strong>This campaign has not reached its goal.</strong>
                            <p>If it ends short, donors can claim refunds from this same pool. Approving this request reduces what they can get back.</p>
                        </div>
                    </div>
                )}
                {actionable && approveOutcome.blocked && (
                    <div className="gt-bd-notice is-warn">
                        <IAlert />
                        <p>An approval now would release the funds, but the contract holds less than the amount requested. Approving is disabled until it holds enough.</p>
                    </div>
                )}

                <div className="gt-bq-votes">
                    <div className="gt-bq-votes-row">
                        <span>Board votes</span>
                        <span>{r.approvals} approved, {r.rejections} rejected, {needed} of {boardSize} decides</span>
                    </div>
                    <div className="gt-bq-seg" aria-hidden="true">
                        {Array.from({ length: boardSize }, (_, i) => (
                            <i key={i} className={i < r.approvals ? "ok" : i < r.approvals + r.rejections ? "no" : ""} />
                        ))}
                    </div>
                </div>

                {voters.length > 0 && (
                    <div className="gt-bq-voters">
                        {voters.map((v, i) => (
                            <span key={i} className={`gt-bq-voter${lower(v.member) === me ? " is-me" : ""}`} title={v.member}>
                                <i style={{ background: v.approved ? "#22c55e" : "#ef4444" }} />
                                {lower(v.member) === me ? "You" : shortAddress(v.member)} {v.approved ? "approved" : "rejected"}
                            </span>
                        ))}
                    </div>
                )}

                {actionable ? (
                    <>
                        <div className="gt-bq-actions">
                            <button className="gt-btn gt-bq-approve" disabled={approveOutcome.blocked} onClick={() => setConfirm({ r, approve: true })}>Approve</button>
                            <button className="gt-btn gt-bq-reject" onClick={() => setConfirm({ r, approve: false })}>Reject</button>
                        </div>
                        <p className="gt-bq-fine">Votes are public and final. You can't change a vote after you confirm it.</p>
                    </>
                ) : (
                    <div className="gt-bq-foot">
                        {mine ? <span>You {mine.approved ? "approved" : "rejected"} this request.</span>
                              : justVoted.has(r.id) ? <span>Your vote was just recorded.</span>
                              : <span>This request was decided before you voted.</span>}
                        {r.executed && paid && (
                            <span>Paid out{paid.ts ? ` ${timeAgo(paid.ts, now)}` : ""} <TxLink hash={paid.hash} label="View transaction" /></span>
                        )}
                        {r.status === 0 && <span>Waiting on {Math.max(0, boardSize - r.approvals - r.rejections)} more board member(s).</span>}
                    </div>
                )}
            </div>
        );
    };

    /* ── render ── */

    const c = confirm;
    const cOutcome = c ? outcomeOf(c.r, c.approve) : null;

    return (
        <div className="gt-bd">
            <style>{css}</style>

            {c && (
                <div className="gt-cf-backdrop" onClick={() => !voting && setConfirm(null)}>
                    <div className="gt-cf" role="dialog" aria-modal="true" aria-labelledby="gt-cf-title" onClick={(e) => e.stopPropagation()}>
                        <h2 id="gt-cf-title">{c.approve ? "Approve this request?" : "Reject this request?"}</h2>
                        <div className="gt-cf-amt">{formatAmount(c.r.amount)} {symbol}</div>
                        <p className="gt-cf-desc">{c.r.description}</p>

                        {c.approve && cOutcome.executes && (
                            <div className="gt-bd-notice is-warn">
                                <IAlert />
                                <p>Your approval completes the vote. {formatAmount(c.r.amount)} {symbol} will be sent to the campaigner immediately.</p>
                            </div>
                        )}
                        {c.approve && !reached && (
                            <div className="gt-bd-notice is-danger">
                                <IAlert />
                                <p>The goal has not been reached. Approving reduces the money available for donor refunds.</p>
                            </div>
                        )}
                        {!c.approve && cOutcome.closes && (
                            <div className="gt-bd-notice">
                                <IInfo />
                                <p>Your rejection reaches the threshold and closes this request for good.</p>
                            </div>
                        )}
                        <p className="gt-bq-fine">This is recorded on-chain with your address. It can't be undone.</p>

                        <div className="gt-cf-actions">
                            <button className="gt-btn gt-btn-secondary" onClick={() => setConfirm(null)} disabled={voting}>Cancel</button>
                            <button
                                className={`gt-btn ${c.approve ? "gt-bq-approve" : "gt-bq-reject"}`}
                                onClick={submitVote} disabled={voting}
                            >
                                {voting ? "Waiting for wallet..." : c.approve ? "Confirm approval" : "Confirm rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {success && (
                <SuccessDialog
                    title="Vote recorded"
                    headline={success.approve ? "Approved" : "Rejected"}
                    subtitle={`Request ${success.r.id + 1} for ${formatAmount(success.r.amount)} ${symbol}`}
                    rows={[
                        { label: "Your vote", value: success.approve ? "Approve" : "Reject" },
                        {
                            label: "Result",
                            value: success.outcome.executes ? "Funds released"
                                : success.outcome.closes ? "Request closed"
                                : "Waiting for other members",
                        },
                        { label: "Transaction", value: shortAddress(success.hash), mono: true },
                    ]}
                    note={success.outcome.executes
                        ? "Your approval reached the threshold, so the funds were sent to the campaigner."
                        : success.outcome.closes
                            ? "Enough members rejected this request, so it can no longer be paid."
                            : "The request stays open until enough board members have voted."}
                    explorerUrl={explorer ? `${explorer}/tx/${success.hash}` : null}
                    onClose={() => setSuccess(null)}
                />
            )}

            <WorkspaceHeader
                back={{ label: "All board campaigns", onClick: () => navigate("/board-home") }}
                eyebrow="Board member"
                title={data.title}
                badge={<span className={meta.badge}>{meta.label}</span>}
                subtitle={`Started by ${shortAddress(data.campaigner)}. ${open ? timeLeft(data.deadline, now) : `Ended ${endedDate}`} on ${network?.name || "this network"}.`}
                actions={<button className="gt-btn gt-btn-secondary" onClick={() => navigate(`/campaign/${address}`)}>View public page</button>}
                stats={[
                    { label: "Awaiting your vote", value: awaiting.length, hint: awaiting.length > 0 ? "Needs a decision" : "You're up to date" },
                    { label: "Raised", value: `${formatAmount(data.raised)} ${symbol}`, hint: `${percentLabel(pct)} of ${formatAmount(data.goal)} ${symbol}` },
                    { label: "In contract", value: `${formatAmount(data.balance)} ${symbol}` },
                    { label: "Votes to decide", value: `${needed} of ${boardSize}` },
                ]}
            />

            <main className="gt-bd-inner">
                <div className="gt-bd-layout">
                    <div className="gt-bd-main">
                        <section className="gt-bd-card">
                            <div className="gt-bd-sechead">
                                <h2>Needs your vote</h2>
                                <span className={`gt-bd-count${awaiting.length ? " is-urgent" : ""}`}>{awaiting.length}</span>
                            </div>
                            <p className="gt-bd-muted">
                                The campaigner can't move funds alone. A request is paid once {needed} of {boardSize} board members approve it.
                            </p>
                            {awaiting.length === 0 ? (
                                <div className="gt-bd-empty">
                                    {data.requests.length === 0
                                        ? "No withdrawal requests yet. You'll see them here when the campaigner submits one."
                                        : "Nothing is waiting on you right now."}
                                </div>
                            ) : (
                                <div className="gt-bq-list">
                                    {awaiting.map((r) => <RequestCard key={r.id} r={r} actionable />)}
                                </div>
                            )}
                        </section>

                        {history.length > 0 && (
                            <section className="gt-bd-card">
                                <div className="gt-bd-sechead">
                                    <h2>History</h2>
                                    <span className="gt-bd-count">{history.length}</span>
                                </div>
                                <p className="gt-bd-muted">Requests you've voted on or that were decided without you.</p>
                                <div className="gt-bq-list">
                                    {history.map((r) => <RequestCard key={r.id} r={r} actionable={false} />)}
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className="gt-bd-side">
                        <div className="gt-bd-card">
                            <h2>Campaign</h2>
                            <div className="gt-bd-bar"><div className={`gt-bd-fill${reached ? "" : " is-short"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                            <div className="gt-bd-kv"><span>Raised</span><strong>{formatAmount(data.raised)} {symbol}</strong></div>
                            <div className="gt-bd-kv"><span>Goal</span><strong>{formatAmount(data.goal)} {symbol}</strong></div>
                            <div className="gt-bd-kv"><span>Goal reached</span><strong>{reached ? "Yes" : "Not yet"}</strong></div>
                            <div className="gt-bd-kv"><span>{open ? "Time left" : "Ended"}</span><strong>{open ? timeLeft(data.deadline, now) : endedDate}</strong></div>
                            <div className="gt-bd-kv"><span>Deadline</span><strong>{formatDateTime(data.deadline)}</strong></div>
                            {!reached && (
                                <div className="gt-bd-notice is-warn" style={{ marginTop: 14 }}>
                                    <IAlert />
                                    <p>Until the goal is reached, donors are still entitled to refunds. Be careful with early withdrawals.</p>
                                </div>
                            )}
                            {reached && (
                                <div className="gt-bd-notice is-ok" style={{ marginTop: 14 }}>
                                    <ICheck />
                                    <p>The goal was reached, so donors can no longer claim refunds. Withdrawals are decided by the board.</p>
                                </div>
                            )}
                            <div style={{ marginTop: 14 }}><TxLink type="address" hash={address} label="View contract on explorer" /></div>
                        </div>

                        <div className="gt-bd-card">
                            <div className="gt-bd-sechead"><h2>The board</h2><span className="gt-bd-count">{boardSize}</span></div>
                            {data.boardMembers.map((m, i) => (
                                <div key={m} className="gt-bd-bm">
                                    <span className="n">{i + 1}</span>
                                    <code title={m}>{shortAddress(m)}</code>
                                    {lower(m) === me && <span className="gt-bd-tag">You</span>}
                                    {activity.status === "ready" && <span className="v">{voteCount(m)}/{data.requests.length}</span>}
                                    <TxLink type="address" hash={m} label="View" />
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default BoardDashboard;