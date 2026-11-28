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

// Policy (frontend only): the contract lets a campaigner ask for money at any time, even before the
// goal is met, while donors can still be refunded. With this on, requests open only once the goal is reached.
const REQUIRE_GOAL_BEFORE_WITHDRAWAL = true;
const DESC_MIN = 10;
const DESC_MAX = 300;

const css = `
.gt-mg { min-height: calc(100vh - 69px); background: #f1f5f9; }
.gt-mg-inner { max-width: 1200px; margin: 0 auto; padding: 28px var(--page-gutter) 72px; }
.gt-mg-layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 24px; align-items: start; }
.gt-mg-main { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.gt-mg-side { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 92px; min-width: 0; }
@media (max-width: 980px) {
    .gt-mg-layout { grid-template-columns: minmax(0, 1fr); }
    .gt-mg-side { position: static; order: -1; }
}
.gt-mg-card { background: #ffffff; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
.gt-mg-card h2 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.01em; }
.gt-mg-sechead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.gt-mg-count { font-size: 13px; font-weight: 700; color: var(--text-dim); background: var(--surface-alt); padding: 3px 10px; border-radius: 999px; }
.gt-mg-muted { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); }

/* funds breakdown */
.gt-fb { display: flex; height: 12px; margin: 18px 0 16px; border-radius: 999px; overflow: hidden; background: #e2e8f0; }
.gt-fb i { display: block; height: 100%; }
.gt-fb-legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
.gt-fb-item { display: flex; flex-direction: column; gap: 3px; font-size: 13px; color: var(--text-muted); }
.gt-fb-item span { display: flex; align-items: center; gap: 7px; }
.gt-fb-item .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.gt-fb-item b { font-size: 18px; font-weight: 800; color: var(--text); }

/* withdrawal requests */
.gt-rq-list { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }
.gt-rq { border: 1px solid var(--border); border-left: 5px solid #cbd5e1; border-radius: 14px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.gt-rq[data-s="pending"] { border-left-color: #f59e0b; }
.gt-rq[data-s="paid"] { border-left-color: #22c55e; }
.gt-rq[data-s="rejected"] { border-left-color: #ef4444; }
.gt-rq-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.gt-rq-head > div { display: flex; align-items: center; gap: 10px; }
.gt-rq-n { font-size: 13px; font-weight: 700; color: var(--text-dim); }
.gt-rq-amt { font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
.gt-rq-desc { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); overflow-wrap: anywhere; }
.gt-rq-votes { display: flex; flex-direction: column; gap: 8px; }
.gt-rq-votes-row { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 13px; font-weight: 600; }
.gt-rq-votes-row span:last-child { font-weight: 500; color: var(--text-dim); }
.gt-rq-seg { display: flex; gap: 6px; }
.gt-rq-seg i { flex: 1; height: 8px; border-radius: 999px; background: #e2e8f0; }
.gt-rq-seg i.ok { background: #22c55e; }
.gt-rq-seg i.no { background: #ef4444; }
.gt-rq-voters { display: flex; flex-wrap: wrap; gap: 6px; }
.gt-rq-voter { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: #f8fafc; border: 1px solid var(--border); font-size: 12px; color: var(--text-muted); }
.gt-rq-voter i { width: 7px; height: 7px; border-radius: 50%; }
.gt-rq-foot { display: flex; flex-wrap: wrap; gap: 6px 18px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 13px; color: var(--text-dim); }
.gt-mg-empty { margin-top: 16px; padding: 30px 20px; text-align: center; font-size: 14px; color: var(--text-muted); background: #f8fafc; border: 1px dashed var(--border-strong); border-radius: 14px; }

/* board */
.gt-bm { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
.gt-bm:last-child { border-bottom: none; }
.gt-bm .n { width: 22px; font-weight: 700; color: var(--text-dim); }
.gt-bm code { flex: 1; min-width: 0; font-family: var(--font-mono); color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; }
.gt-bm .v { font-size: 12px; font-weight: 600; color: var(--text-dim); }

/* request form */
.gt-rf { border: 2px solid #22c55e; box-shadow: 0 14px 34px rgba(34, 197, 94, 0.12); display: flex; flex-direction: column; gap: 16px; }
.gt-rf.is-closed { border: 1px solid var(--border); box-shadow: none; }
.gt-rf-label { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 14px; font-weight: 700; margin-bottom: 8px; }
.gt-rf-label span { font-size: 12px; font-weight: 500; color: var(--text-dim); }
.gt-rf-input {
    width: 100%; font: inherit; font-size: 15px; padding: 12px 14px; color: var(--text); background: #ffffff;
    border: 1px solid var(--border-strong); border-radius: 12px; transition: border-color 0.15s, box-shadow 0.15s;
}
textarea.gt-rf-input { resize: vertical; min-height: 110px; line-height: 1.6; }
.gt-rf-input::placeholder { color: #94a3b8; }
.gt-rf-input:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18); }
.gt-rf-input.is-error { border-color: #dc2626; box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1); }
.gt-rf-affix { position: relative; }
.gt-rf-affix .gt-rf-input { padding-right: 76px; font-size: 18px; font-weight: 700; }
.gt-rf-affix > span { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: var(--text-dim); pointer-events: none; }
.gt-rf-err { margin: 6px 0 0; font-size: 13px; color: #b91c1c; }
.gt-rf-hint { margin: 6px 0 0; font-size: 13px; line-height: 1.5; color: var(--text-dim); }
.gt-rf-chips { display: flex; gap: 8px; margin-top: 10px; }
.gt-rf-chip { flex: 1; font: inherit; font-size: 13px; font-weight: 700; padding: 8px 0; border-radius: 10px; background: #ffffff; color: var(--text-muted); border: 1px solid var(--border-strong); cursor: pointer; transition: all 0.15s; }
.gt-rf-chip:hover { border-color: #22c55e; color: var(--primary-ink); background: #f0fdf4; }
.gt-rf .gt-btn { width: 100%; padding: 14px; font-size: 16px; border-radius: 12px; }
.gt-rf-fine { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--text-dim); }
.gt-mg-notice { display: flex; gap: 12px; padding: 14px 16px; border-radius: 14px; font-size: 14px; line-height: 1.6; background: #fffbeb; border: 1px solid #fde68a; color: #78350f; }
.gt-mg-notice.is-info { background: #f8fafc; border-color: var(--border); color: var(--text-muted); }
.gt-mg-notice svg { flex-shrink: 0; margin-top: 3px; }
.gt-mg-notice p { margin: 0; }
.gt-mg-addr { padding: 12px 14px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--border); font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); word-break: break-all; }

.gt-mg-state { max-width: 520px; margin: 72px auto; padding: 40px 28px; text-align: center; background: #ffffff; border: 1px dashed var(--border-strong); border-radius: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.gt-mg-state h2 { margin: 0; font-size: 20px; font-weight: 800; }
.gt-mg-state p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); }
.gt-mg-state .gt-btn { margin-top: 10px; }
`;

const Svg = ({ children, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);
const IAlert = () => <Svg><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></Svg>;
const IInfo = () => <Svg><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></Svg>;

const lower = (a) => (a ? a.toLowerCase() : "");

const useNow = (ms = 60000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
};

/**
 *  core     : state read straight from the contract
 *  activity : events (who voted, when a request was made, when it was paid), loaded after the page is visible
 */
function useManageData(address) {
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
                const [title, ipfsHash, goal, raised, deadline, campaigner, donorCount, boardMembers, totalRequests, balance] =
                    await Promise.all([
                        c.title(), c.ipfsHash(), c.goalAmount(), c.totalDonated(), c.deadline(), c.campaigner(),
                        c.getDonorCount(), c.getBoardMembers(), c.getTotalRequests(), c.getContractBalance(),
                    ]);
                const reqs = await Promise.all(Array.from({ length: Number(totalRequests) }, (_, i) => c.requests(i)));
                if (cancelled) return;

                setCore({
                    status: "ready", key,
                    data: {
                        address, title, ipfsHash, goal, raised, balance, campaigner,
                        deadline: Number(deadline),
                        donorCount: Number(donorCount),
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
                    exe.events.filter((e) => e.args).forEach((e) => {
                        paidInfo[Number(e.args.requestId)] = { block: e.blockNumber, hash: e.transactionHash };
                    });

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
                    console.error("Could not read request events", err);
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

const requestMeta = (r) => {
    if (r.executed) return { s: "paid", label: "Paid out", cls: "gt-badge gt-badge-success" };
    if (r.status === 2) return { s: "rejected", label: "Rejected", cls: "gt-badge gt-badge-danger" };
    if (r.status === 1) return { s: "paid", label: "Approved", cls: "gt-badge gt-badge-success" };
    return { s: "pending", label: "Awaiting votes", cls: "gt-badge gt-badge-warning" };
};

const CampaignManage = () => {
    const { address } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { account, network, symbol, explorer, connectWallet, loading: walletLoading } = useWallet();
    const { getCampaignContract } = useContract();
    const { core, activity, reload } = useManageData(address);
    const now = useNow();

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null); // { amount, hash }

    const data = core.data;

    const funds = useMemo(() => {
        if (!data) return null;
        const withdrawn = data.requests.filter((r) => r.executed).reduce((s, r) => s + r.amount, 0n);
        const reserved = data.requests.filter((r) => r.status === 0).reduce((s, r) => s + r.amount, 0n);
        const requestable = data.balance > reserved ? data.balance - reserved : 0n;
        const reservedInBalance = data.balance - requestable;
        const total = withdrawn + data.balance;
        const pct = (x) => (total > 0n ? Number((x * 1000n) / total) / 10 : 0);
        return { withdrawn, reserved, requestable, total, segs: [pct(withdrawn), pct(reservedInBalance), pct(requestable)] };
    }, [data]);

    const stateCard = (title, text, action) => (
        <div className="gt-mg">
            <style>{css}</style>
            <div className="gt-mg-state">
                <h2>{title}</h2>
                <p>{text}</p>
                {action}
            </div>
        </div>
    );

    if (core.status === "nowallet") {
        return stateCard("Connect your wallet", "Connect the wallet that started this campaign to manage it.",
            <button className="gt-btn gt-btn-primary" onClick={connectWallet} disabled={walletLoading}>
                {walletLoading ? "Connecting..." : "Connect Wallet"}
            </button>);
    }
    if (core.status === "notfound") {
        return stateCard("Campaign not found",
            `There is no campaign at this address on ${network?.name || "this network"}. It may be on a different network. Switch networks from the navbar.`,
            <button className="gt-btn gt-btn-secondary" onClick={() => navigate("/dashboard")}>Back to my campaigns</button>);
    }
    if (core.status === "error") {
        return stateCard("Couldn't load this campaign", "Something went wrong while reading from the blockchain. Check your connection and try again.",
            <button className="gt-btn gt-btn-primary" onClick={reload}>Try again</button>);
    }
    if (core.status === "loading" || !data) {
        return (
            <div className="gt-mg">
                <style>{css}</style>
                <div className="gt-skeleton" style={{ height: 220, borderRadius: 0 }} />
                <div className="gt-mg-inner">
                    <div className="gt-mg-layout">
                        <div className="gt-skeleton" style={{ height: 420, borderRadius: 16 }} />
                        <div className="gt-skeleton" style={{ height: 420, borderRadius: 16 }} />
                    </div>
                </div>
            </div>
        );
    }
    if (lower(data.campaigner) !== lower(account)) {
        return stateCard("This campaign belongs to another wallet",
            "Only the wallet that started a campaign can manage it. You can still view its public page.",
            <button className="gt-btn gt-btn-primary" onClick={() => navigate(`/campaign/${address}`)}>View campaign</button>);
    }

    /* ── derived state ── */

    const stateKey = campaignState(data, now);
    const meta = STATE_META[stateKey];
    const open = meta.open;
    const pct = percentFunded(data.raised, data.goal);
    const boardSize = data.boardMembers.length;
    const needed = approvalsNeeded(boardSize);
    const reached = data.goal > 0n && data.raised >= data.goal;
    const endedDate = new Date(data.deadline * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

    let closedReason = null;
    if (stateKey === "failed") closedReason = "This campaign ended without reaching its goal, so its funds are reserved for donor refunds.";
    else if (REQUIRE_GOAL_BEFORE_WITHDRAWAL && !reached) closedReason = "Withdrawal requests open once the funding goal is reached. Until then donors are still entitled to refunds.";
    else if (funds.requestable <= 0n) closedReason = funds.reserved > 0n
        ? "All available funds are already reserved by pending requests. Wait for the board to decide on them."
        : "The contract holds no funds to request right now.";

    /* ── form ── */

    const setPercent = (p) => {
        const w = (funds.requestable * BigInt(p)) / 100n;
        setAmount(ethers.formatEther(w).replace(/\.0$/, ""));
        setErrors((e) => ({ ...e, amount: undefined }));
    };

    const validate = () => {
        const e = {};
        if (description.trim().length < DESC_MIN) e.description = `Explain what the funds are for (at least ${DESC_MIN} characters).`;
        let wei = null;
        try {
            if (!/^\d*\.?\d+$/.test(amount.trim())) throw new Error("bad");
            wei = ethers.parseEther(amount.trim());
        } catch { e.amount = "Enter a valid amount."; }
        if (wei !== null) {
            if (wei <= 0n) e.amount = "Enter an amount greater than 0.";
            else if (wei > funds.requestable) e.amount = `You can request up to ${formatAmount(funds.requestable)} ${symbol} right now.`;
        }
        return { e, wei };
    };

    const submit = async () => {
        const { e, wei } = validate();
        setErrors(e);
        if (Object.keys(e).length) return;

        setSubmitting(true);
        try {
            const contract = getCampaignContract(address);
            if (!contract) { toast.error("Your wallet isn't ready. Reconnect it and try again."); return; }
            const receipt = await toast.track(
                () => contract.createWithdrawalRequest(description.trim(), wei),
                { pending: "Confirm the request in your wallet...", silent: true }
            );
            if (receipt) {
                setSuccess({ amount: formatAmount(wei), hash: receipt.hash });
                setDescription("");
                setAmount("");
                reload();
            }
        } finally {
            setSubmitting(false);
        }
    };

    const copyBoardLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/board/${address}`);
            toast.success("Board link copied");
        } catch {
            toast.error("Couldn't copy the link.");
        }
    };

    const voteCount = (m) =>
        Object.values(activity.votes).flat().filter((v) => lower(v.member) === lower(m)).length;

    /* ── render ── */

    return (
        <div className="gt-mg">
            <style>{css}</style>

            {success && (
                <SuccessDialog
                    title="Request submitted"
                    headline={`${success.amount} ${symbol}`}
                    subtitle="Waiting for board approval"
                    rows={[
                        { label: "Status", value: "Awaiting board votes" },
                        { label: "Approvals needed", value: `${needed} of ${boardSize}` },
                        { label: "Transaction", value: shortAddress(success.hash), mono: true },
                    ]}
                    note="Your board members can open their board dashboard, connect their wallet and vote. Share the board link with them."
                    explorerUrl={explorer ? `${explorer}/tx/${success.hash}` : null}
                    secondary={{ label: "Copy board link", onClick: copyBoardLink }}
                    onClose={() => setSuccess(null)}
                />
            )}

            <WorkspaceHeader
                back={{ label: "All my campaigns", onClick: () => navigate("/dashboard") }}
                eyebrow="Manage campaign"
                title={data.title}
                badge={<span className={meta.badge}>{meta.label}</span>}
                subtitle={`${open ? timeLeft(data.deadline, now) : `Ended ${endedDate}`} on ${network?.name || "this network"}`}
                actions={<button className="gt-btn gt-btn-secondary" onClick={() => navigate(`/campaign/${address}`)}>View public page</button>}
                stats={[
                    { label: "Raised", value: `${formatAmount(data.raised)} ${symbol}`, hint: `${percentLabel(pct)} of ${formatAmount(data.goal)} ${symbol}` },
                    { label: "In contract", value: `${formatAmount(data.balance)} ${symbol}`, hint: "Held by the smart contract" },
                    { label: "Donors", value: data.donorCount },
                    { label: "Board approvals", value: `${needed} of ${boardSize}`, hint: "Needed per request" },
                ]}
            />

            <main className="gt-mg-inner">
                <div className="gt-mg-layout">
                    {/* ───── main ───── */}
                    <div className="gt-mg-main">
                        <section className="gt-mg-card">
                            <h2>Where the money is</h2>
                            <p className="gt-mg-muted" style={{ marginTop: 6 }}>
                                Everything the contract has received, split by what has happened to it.
                            </p>
                            <div className="gt-fb" aria-hidden="true">
                                <i style={{ width: `${funds.segs[0]}%`, background: "#64748b" }} />
                                <i style={{ width: `${funds.segs[1]}%`, background: "#f59e0b" }} />
                                <i style={{ width: `${funds.segs[2]}%`, background: "#22c55e" }} />
                            </div>
                            <div className="gt-fb-legend">
                                <div className="gt-fb-item"><span><i className="dot" style={{ background: "#64748b" }} />Withdrawn</span><b>{formatAmount(funds.withdrawn)} {symbol}</b></div>
                                <div className="gt-fb-item"><span><i className="dot" style={{ background: "#f59e0b" }} />Reserved by pending requests</span><b>{formatAmount(funds.reserved)} {symbol}</b></div>
                                <div className="gt-fb-item"><span><i className="dot" style={{ background: "#22c55e" }} />Available to request</span><b>{formatAmount(funds.requestable)} {symbol}</b></div>
                            </div>
                        </section>

                        <section className="gt-mg-card">
                            <div className="gt-mg-sechead">
                                <h2>Withdrawal requests</h2>
                                <span className="gt-mg-count">{data.requests.length}</span>
                            </div>
                            <p className="gt-mg-muted">
                                Every request needs {needed} of {boardSize} board approvals before the money is sent to your wallet.
                            </p>

                            {data.requests.length === 0 ? (
                                <div className="gt-mg-empty">No requests yet. Use the form to ask your board to release funds.</div>
                            ) : (
                                <div className="gt-rq-list">
                                    {[...data.requests].reverse().map((r) => {
                                        const m = requestMeta(r);
                                        const voters = activity.votes[r.id] || [];
                                        const requestedTs = activity.requested[r.id];
                                        const paid = activity.paid[r.id];
                                        const waiting = Math.max(0, needed - r.approvals);
                                        return (
                                            <div key={r.id} className="gt-rq" data-s={m.s}>
                                                <div className="gt-rq-head">
                                                    <div><span className="gt-rq-n">Request {r.id + 1}</span><span className={m.cls}>{m.label}</span></div>
                                                    <span className="gt-rq-amt">{formatAmount(r.amount)} {symbol}</span>
                                                </div>
                                                <p className="gt-rq-desc">{r.description}</p>

                                                <div className="gt-rq-votes">
                                                    <div className="gt-rq-votes-row">
                                                        <span>Board votes</span>
                                                        <span>
                                                            {r.approvals} approved, {r.rejections} rejected
                                                            {r.status === 0 && waiting > 0 ? `, ${waiting} more approval${waiting === 1 ? "" : "s"} needed` : ""}
                                                        </span>
                                                    </div>
                                                    <div className="gt-rq-seg" aria-hidden="true">
                                                        {Array.from({ length: boardSize }, (_, i) => (
                                                            <i key={i} className={i < r.approvals ? "ok" : i < r.approvals + r.rejections ? "no" : ""} />
                                                        ))}
                                                    </div>
                                                </div>

                                                {voters.length > 0 && (
                                                    <div className="gt-rq-voters">
                                                        {voters.map((v, i) => (
                                                            <span key={i} className="gt-rq-voter" title={v.member}>
                                                                <i style={{ background: v.approved ? "#22c55e" : "#ef4444" }} />
                                                                {shortAddress(v.member)} {v.approved ? "approved" : "rejected"}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="gt-rq-foot">
                                                    {requestedTs && <span title={formatDateTime(requestedTs)}>Requested {timeAgo(requestedTs, now)}</span>}
                                                    {r.executed && paid && (
                                                        <span>
                                                            Paid out{paid.ts ? ` ${timeAgo(paid.ts, now)}` : ""} <TxLink hash={paid.hash} label="View transaction" />
                                                        </span>
                                                    )}
                                                    {r.status === 2 && <span>The board rejected this request.</span>}
                                                    {r.status === 0 && <span>Waiting on {boardSize - r.approvals - r.rejections} board member{boardSize - r.approvals - r.rejections === 1 ? "" : "s"}.</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="gt-mg-card">
                            <div className="gt-mg-sechead">
                                <h2>Your board</h2>
                                <span className="gt-mg-count">{boardSize} members</span>
                            </div>
                            <p className="gt-mg-muted" style={{ marginBottom: 6 }}>The board was fixed when the campaign launched and cannot be changed.</p>
                            {data.boardMembers.map((m, i) => (
                                <div key={m} className="gt-bm">
                                    <span className="n">{i + 1}</span>
                                    <code title={m}>{shortAddress(m)}</code>
                                    {activity.status === "ready" && (
                                        <span className="v">Voted on {voteCount(m)} of {data.requests.length}</span>
                                    )}
                                    <TxLink type="address" hash={m} label="View" />
                                </div>
                            ))}
                        </section>
                    </div>

                    {/* ───── side ───── */}
                    <aside className="gt-mg-side">
                        <div className={`gt-mg-card gt-rf${closedReason ? " is-closed" : ""}`}>
                            <h2>New withdrawal request</h2>

                            {closedReason ? (
                                <div className="gt-mg-notice">
                                    <IAlert />
                                    <p>{closedReason}</p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="gt-rf-label" htmlFor="rf-desc">
                                            What are the funds for?<span>{description.length}/{DESC_MAX}</span>
                                        </label>
                                        <textarea
                                            id="rf-desc" className={`gt-rf-input${errors.description ? " is-error" : ""}`}
                                            placeholder="Be specific. Your board and your donors will read this."
                                            maxLength={DESC_MAX} value={description}
                                            onChange={(e) => { setDescription(e.target.value); setErrors((x) => ({ ...x, description: undefined })); }}
                                            aria-invalid={!!errors.description}
                                        />
                                        {errors.description && <p className="gt-rf-err">{errors.description}</p>}
                                    </div>

                                    <div>
                                        <label className="gt-rf-label" htmlFor="rf-amt">Amount</label>
                                        <div className="gt-rf-affix">
                                            <input
                                                id="rf-amt" className={`gt-rf-input${errors.amount ? " is-error" : ""}`}
                                                inputMode="decimal" placeholder="0.00" value={amount}
                                                onChange={(e) => { setAmount(e.target.value); setErrors((x) => ({ ...x, amount: undefined })); }}
                                                aria-invalid={!!errors.amount}
                                            />
                                            <span>{symbol}</span>
                                        </div>
                                        {errors.amount
                                            ? <p className="gt-rf-err">{errors.amount}</p>
                                            : <p className="gt-rf-hint">
                                                Available to request: {formatAmount(funds.requestable)} {symbol}
                                                {funds.reserved > 0n ? `. ${formatAmount(funds.reserved)} ${symbol} is reserved by pending requests.` : "."}
                                            </p>}
                                        <div className="gt-rf-chips">
                                            {[25, 50, 100].map((p) => (
                                                <button key={p} type="button" className="gt-rf-chip" onClick={() => setPercent(p)}>
                                                    {p === 100 ? "Max" : `${p}%`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button className="gt-btn gt-btn-primary" onClick={submit} disabled={submitting}>
                                        {submitting ? "Submitting..." : "Submit request"}
                                    </button>
                                    <p className="gt-rf-fine">
                                        Nothing moves until {needed} of {boardSize} board members approve. Requests and votes are public.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="gt-mg-card">
                            <h2>Share with your board</h2>
                            <p className="gt-mg-muted" style={{ margin: "6px 0 14px" }}>
                                Your trustees are not notified automatically. Send them this link so they can connect and vote.
                            </p>
                            <button className="gt-btn gt-btn-secondary" style={{ width: "100%" }} onClick={copyBoardLink}>Copy board link</button>
                        </div>

                        <div className="gt-mg-card">
                            <h2>Contract</h2>
                            <div className="gt-mg-addr" style={{ margin: "12px 0" }}>{address}</div>
                            <TxLink type="address" hash={address} label="View on explorer" />
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default CampaignManage;