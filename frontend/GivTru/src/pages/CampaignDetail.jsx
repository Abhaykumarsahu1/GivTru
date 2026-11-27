import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { useContract } from "../hooks/useContract";
import { useToast } from "../context/ToastContext";
import { getIPFSUrl } from "../utils/ipfs";
import TxLink from "../components/TxLink";
import {
    DEFAULT_IPFS_HASH, STATE_META, campaignState, percentFunded, percentLabel,
    formatAmount, timeLeft, timeAgo, formatDateTime, shortAddress, approvalsNeeded,
} from "../utils/campaign";

const MIN_DONATION_WEI = ethers.parseEther("0.01"); // MIN_DONATION in Campaign.sol
const QUICK_AMOUNTS = ["0.01", "0.05", "0.1", "0.5"];
const FALLBACK_GATEWAYS = ["https://ipfs.io/ipfs/", "https://dweb.link/ipfs/"];
const MAX_ROWS = 50;   // donations shown in the table (timestamps are looked up for these)
const PAGE = 10;       // rows revealed per "Show more"

const css = `
.gt-cd { min-height: calc(100vh - 69px); background: #f8fafc; color: var(--text); }
.gt-cd-inner { max-width: 1200px; margin: 0 auto; padding: 24px var(--page-gutter) 72px; }
.gt-cd-back {
    display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px;
    padding: 8px 14px 8px 8px; border: none; border-radius: 10px; background: none; cursor: pointer;
    font: inherit; font-size: 14px; font-weight: 600; color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
}
.gt-cd-back:hover { background: var(--surface-alt); color: var(--text); }

.gt-cd-layout {
    display: grid; gap: 24px; align-items: start;
    grid-template-columns: minmax(0, 1fr) 380px;
    grid-template-areas: "top side" "rest side";
}
.gt-cd-top, .gt-cd-rest { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.gt-cd-top { grid-area: top; }
.gt-cd-rest { grid-area: rest; }
.gt-cd-side { grid-area: side; display: flex; flex-direction: column; gap: 20px; position: sticky; top: 92px; min-width: 0; }
@media (max-width: 980px) {
    .gt-cd-layout { grid-template-columns: minmax(0, 1fr); grid-template-areas: "top" "side" "rest"; }
    .gt-cd-side { position: static; }
}

.gt-cd-card { background: #ffffff; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
.gt-cd-card h2 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.01em; }
.gt-cd-sechead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.gt-cd-count { font-size: 13px; font-weight: 700; color: var(--text-dim); background: var(--surface-alt); padding: 3px 10px; border-radius: 999px; }
.gt-cd-muted { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); }
.gt-cd-mono { font-family: var(--font-mono); }

/* hero */
.gt-cd-hero { padding: 0; overflow: hidden; }
.gt-cd-cover { position: relative; height: 280px; background: #f1f5f9; }
.gt-cd-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.25s; }
.gt-cd-cover img.is-loaded { opacity: 1; }
.gt-cd-cover-skel { position: absolute; inset: 0; border-radius: 0; }
.gt-cd-cover-ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #dcfce7 0%, #e0e7ff 100%); }
.gt-cd-cover-ph span { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.9); color: #16a34a; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.10); }
.gt-cd-hero-body { padding: 26px; display: flex; flex-direction: column; gap: 16px; }
.gt-cd-title { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; overflow-wrap: anywhere; }
.gt-cd-by { margin: 0; font-size: 14px; color: var(--text-muted); }
.gt-cd-by code { font-family: var(--font-mono); font-size: 13px; }
.gt-cd-desc { margin: 0; font-size: 15px; line-height: 1.75; color: var(--text-muted); white-space: pre-wrap; overflow-wrap: anywhere; }
.gt-cd-raise { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.gt-cd-raised { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: var(--primary-ink); }
.gt-cd-raised small { margin-left: 6px; font-size: 15px; font-weight: 600; color: var(--text-dim); }
.gt-cd-pct { font-size: 15px; font-weight: 800; }
.gt-cd-bar { height: 10px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.gt-cd-fill { height: 100%; border-radius: 999px; background: #22c55e; transition: width 0.5s ease; }
.gt-cd-fill.is-full { background: #16a34a; }
.gt-cd-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.gt-cd-tile { display: flex; flex-direction: column; gap: 3px; padding: 14px 16px; background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; }
.gt-cd-tile span { font-size: 12px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; }
.gt-cd-tile strong { font-size: 17px; font-weight: 800; }
@media (max-width: 640px) {
    .gt-cd-cover { height: 200px; }
    .gt-cd-title { font-size: 24px; }
    .gt-cd-hero-body { padding: 20px; }
    .gt-cd-tiles { grid-template-columns: 1fr 1fr; }
}

/* withdrawal requests */
.gt-cd-reqs { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }
.gt-cd-req { border: 1px solid var(--border); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.gt-cd-req-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.gt-cd-req-head > div { display: flex; align-items: center; gap: 10px; }
.gt-cd-req-n { font-size: 13px; font-weight: 700; color: var(--text-dim); }
.gt-cd-req-amt { font-size: 18px; font-weight: 800; }
.gt-cd-req-desc { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); overflow-wrap: anywhere; }
.gt-cd-vote { display: flex; flex-direction: column; gap: 6px; }
.gt-cd-vote-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; }
.gt-cd-vote-row span:last-child { color: var(--text-dim); font-weight: 500; }
.gt-cd-vbar { height: 6px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.gt-cd-vbar i { display: block; height: 100%; border-radius: 999px; }
.gt-cd-voters { display: flex; flex-wrap: wrap; gap: 6px; }
.gt-cd-voter { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: #f8fafc; border: 1px solid var(--border); font-size: 12px; color: var(--text-muted); }
.gt-cd-voter i { width: 7px; height: 7px; border-radius: 50%; }
.gt-cd-empty { margin-top: 14px; padding: 28px 20px; text-align: center; font-size: 14px; color: var(--text-muted); background: #f8fafc; border: 1px dashed var(--border-strong); border-radius: 14px; }

/* people */
.gt-cd-people { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 12px; }
.gt-cd-people h3 { margin: 0 0 10px; font-size: 13px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
.gt-cd-person { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
.gt-cd-person:last-child { border-bottom: none; }
.gt-cd-person .n { width: 22px; font-weight: 700; color: var(--text-dim); }
.gt-cd-person code { flex: 1; min-width: 0; font-family: var(--font-mono); color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; }
.gt-cd-tag { font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: #dcfce7; color: var(--primary-ink); }
.gt-cd-tag.is-warn { background: #fef3c7; color: #92400e; }
@media (max-width: 720px) { .gt-cd-people { grid-template-columns: 1fr; gap: 18px; } }

/* sidebar */
.gt-cd-action { border: 2px solid #22c55e; box-shadow: 0 14px 34px rgba(34, 197, 94, 0.12); display: flex; flex-direction: column; gap: 14px; }
.gt-cd-action.is-warn { border-color: #f59e0b; box-shadow: 0 14px 34px rgba(245, 158, 11, 0.12); }
.gt-cd-action.is-neutral { border: 1px solid var(--border); box-shadow: none; }
.gt-cd-label { font-size: 14px; font-weight: 700; }
.gt-cd-affix { position: relative; }
.gt-cd-input {
    width: 100%; font: inherit; font-size: 20px; font-weight: 700; padding: 13px 76px 13px 16px;
    color: var(--text); background: #ffffff; border: 1px solid var(--border-strong); border-radius: 12px;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.gt-cd-input::placeholder { color: #94a3b8; font-weight: 500; }
.gt-cd-input:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18); }
.gt-cd-input.is-error { border-color: #dc2626; box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1); }
.gt-cd-affix > span { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: var(--text-dim); pointer-events: none; }
.gt-cd-err { margin: 0; font-size: 13px; color: #b91c1c; }
.gt-cd-hint { margin: 0; font-size: 13px; color: var(--text-dim); line-height: 1.5; }
.gt-cd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.gt-cd-chip {
    font: inherit; font-size: 13px; font-weight: 600; padding: 7px 14px; border-radius: 999px;
    background: #ffffff; color: var(--text-muted); border: 1px solid var(--border-strong); cursor: pointer; transition: all 0.15s;
}
.gt-cd-chip:hover:not(:disabled) { border-color: #22c55e; color: var(--primary-ink); background: #f0fdf4; }
.gt-cd-action .gt-btn { width: 100%; padding: 14px; font-size: 16px; border-radius: 12px; }
.gt-cd-warnbtn { background: #f59e0b; color: #1c1100; }
.gt-cd-warnbtn:hover:not(:disabled) { background: #d97706; box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35); transform: translateY(-1px); }
.gt-cd-fine { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--text-dim); }

.gt-cd-notice { display: flex; gap: 12px; padding: 14px 16px; border-radius: 14px; font-size: 14px; line-height: 1.6; background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d; }
.gt-cd-notice.is-warn { background: #fffbeb; border-color: #fde68a; color: #78350f; }
.gt-cd-notice.is-info { background: #f8fafc; border-color: var(--border); color: var(--text-muted); }
.gt-cd-notice svg { flex-shrink: 0; margin-top: 3px; }
.gt-cd-notice p { margin: 0; }
.gt-cd-notice strong { display: block; }
.gt-cd-kv { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 12px 14px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--border); font-size: 14px; }
.gt-cd-kv strong { font-size: 17px; }
.gt-cd-addr { padding: 12px 14px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--border); font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); word-break: break-all; }

/* recent donors (full width) */
.gt-cd-donors { margin-top: 24px; }
.gt-cd-table { margin-top: 14px; }
.gt-cd-tr {
    display: grid; align-items: center; gap: 12px; padding: 14px 8px; border-bottom: 1px solid var(--border);
    grid-template-columns: 56px minmax(0, 1.7fr) minmax(0, 1fr) minmax(0, 1fr) 80px 120px; font-size: 14px;
}
.gt-cd-tr:last-child { border-bottom: none; }
.gt-cd-th { padding-top: 6px; padding-bottom: 10px; font-size: 12px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-strong); }
.gt-cd-tr:not(.gt-cd-th):hover { background: #f8fafc; }
.gt-cd-tr .c-n { font-weight: 700; color: var(--text-dim); }
.gt-cd-tr .c-d { display: flex; align-items: center; gap: 8px; min-width: 0; }
.gt-cd-tr .c-d code { font-family: var(--font-mono); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gt-cd-tr .c-w { color: var(--text-muted); }
.gt-cd-tr .c-a { font-weight: 800; color: var(--primary-ink); }
.gt-cd-tr .c-s { color: var(--text-muted); }
.gt-cd-more { display: flex; justify-content: center; margin-top: 14px; }
.gt-cd-note { margin: 14px 0 0; font-size: 12.5px; color: var(--text-dim); }
@media (max-width: 720px) {
    .gt-cd-th { display: none; }
    .gt-cd-tr { grid-template-columns: 28px minmax(0, 1fr) auto; grid-template-areas: "n d a" ". w t"; row-gap: 4px; }
    .gt-cd-tr .c-n { grid-area: n; } .gt-cd-tr .c-d { grid-area: d; } .gt-cd-tr .c-a { grid-area: a; }
    .gt-cd-tr .c-w { grid-area: w; font-size: 13px; } .gt-cd-tr .c-t { grid-area: t; font-size: 13px; justify-self: end; }
    .gt-cd-tr .c-s { display: none; }
}

/* full-page states + loading */
.gt-cd-state { max-width: 520px; margin: 72px auto; padding: 40px 28px; text-align: center; background: #ffffff; border: 1px dashed var(--border-strong); border-radius: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.gt-cd-state h2 { margin: 0; font-size: 20px; font-weight: 800; }
.gt-cd-state p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); }
.gt-cd-state .gt-btn { margin-top: 10px; }
.gt-cd-sk { border-radius: 12px; }
`;

/* ───────── small helpers ───────── */

const Svg = ({ children, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);
const IBack  = () => <Svg><path d="M19 12H5M12 19l-7-7 7-7" /></Svg>;
const ICheck = ({ size }) => <Svg size={size}><path d="M5 13l4 4L19 7" /></Svg>;
const IInfo  = () => <Svg><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></Svg>;
const IAlert = () => <Svg><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></Svg>;
const IHeart = () => <Svg size={30}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></Svg>;

const useNow = (ms = 60000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
};

function imageSources(hash) {
    if (!hash || hash === DEFAULT_IPFS_HASH) return [];
    const path = String(hash).replace(/^ipfs:\/\//, "").replace(/^\/?ipfs\//, "");
    let primary = null;
    try { primary = getIPFSUrl(hash); } catch { /* use gateways */ }
    return [...new Set([primary, ...FALLBACK_GATEWAYS.map((g) => g + path)].filter(Boolean))];
}

function Cover({ hash }) {
    const sources = useMemo(() => imageSources(hash), [hash]);
    const [idx, setIdx] = useState(0);
    const [loaded, setLoaded] = useState(false);
    if (sources.length === 0 || idx >= sources.length) {
        return <div className="gt-cd-cover-ph"><span><IHeart /></span></div>;
    }
    return (
        <>
            {!loaded && <div className="gt-cd-cover-skel gt-skeleton" />}
            <img
                key={sources[idx]} src={sources[idx]} alt="" className={loaded ? "is-loaded" : ""}
                onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setIdx((i) => i + 1); }}
            />
        </>
    );
}

// Event log queries. Some RPCs refuse very wide block ranges, so fall back to recent windows.
async function queryAll(contract, filter, provider) {
    try {
        return { events: await contract.queryFilter(filter, 0, "latest"), partial: false };
    } catch {
        const latest = await provider.getBlockNumber();
        const WINDOW = 50000;
        const jobs = Array.from({ length: 10 }, (_, i) => {
            const to = latest - i * WINDOW;
            if (to < 0) return Promise.resolve([]);
            return contract.queryFilter(filter, Math.max(0, to - WINDOW + 1), to);
        });
        return { events: (await Promise.all(jobs)).flat(), partial: true };
    }
}

const lower = (a) => (a ? a.toLowerCase() : "");

/**
 * All chain reads live here.
 *  - `core`     : state read straight from the contract (fast, always available)
 *  - `activity` : events (donation list, votes, refunds); loaded after the page is already visible
 */
function useCampaignData(address) {
    const { account, provider, chainId } = useWallet();
    const { getCampaignContractReadOnly } = useContract();
    const [core, setCore] = useState({ status: "loading", data: null, key: "" });
    const [activity, setActivity] = useState({ status: "loading", donations: [], votes: {}, refunds: {}, partial: false, key: "" });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const key = `${chainId}:${address}:${lower(account)}`;

        (async () => {
            if (!provider) { setCore({ status: "nowallet", data: null, key }); return; }
            if (!ethers.isAddress(address)) { setCore({ status: "notfound", data: null, key }); return; }

            // keep the old data on screen while refreshing the same campaign
            setCore((s) => (s.key === key ? s : { status: "loading", data: null, key }));
            setActivity((a) => (a.key === key ? a : { status: "loading", donations: [], votes: {}, refunds: {}, partial: false, key }));

            try {
                const code = await provider.getCode(address);
                if (cancelled) return;
                if (code === "0x") { setCore({ status: "notfound", data: null, key }); return; }

                const c = getCampaignContractReadOnly(address);
                const [title, description, ipfsHash, goal, raised, deadline, campaigner,
                    donorCount, boardMembers, totalRequests, balance, mine] = await Promise.all([
                    c.title(), c.description(), c.ipfsHash(), c.goalAmount(), c.totalDonated(), c.deadline(),
                    c.campaigner(), c.getDonorCount(), c.getBoardMembers(), c.getTotalRequests(), c.getContractBalance(),
                    account ? c.donations(account) : Promise.resolve(0n),
                ]);
                const total = Number(totalRequests);
                const reqs = await Promise.all(Array.from({ length: total }, (_, i) => c.requests(i)));
                if (cancelled) return;

                const data = {
                    address, title, description, ipfsHash, goal, raised, balance, mine, campaigner,
                    deadline: Number(deadline),
                    donorCount: Number(donorCount),
                    boardMembers: [...boardMembers],
                    requests: reqs.map((r, id) => ({
                        id, description: r.description, amount: r.amount,
                        approvals: Number(r.approvalCount), rejections: Number(r.rejectionCount),
                        status: Number(r.status), executed: r.executed,
                    })),
                };
                setCore({ status: "ready", data, key });

                // ── events (donation list with times, who voted, refunds) ──
                try {
                    const [don, vot, ref] = await Promise.all([
                        queryAll(c, c.filters.DonationReceived(), provider),
                        queryAll(c, c.filters.RequestVoted(), provider),
                        queryAll(c, c.filters.RefundClaimed(), provider),
                    ]);

                    const donations = don.events
                        .filter((e) => e.args)
                        .sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index)
                        .slice(0, MAX_ROWS)
                        .map((e) => ({
                            key: `${e.transactionHash}:${e.index}`, donor: e.args.donor, amount: e.args.amount,
                            block: e.blockNumber, hash: e.transactionHash, ts: null,
                        }));

                    // block timestamps for the rows we show
                    const blocks = [...new Set(donations.map((d) => d.block))];
                    const stamps = {};
                    await Promise.all(blocks.map(async (b) => {
                        try { stamps[b] = (await provider.getBlock(b))?.timestamp ?? null; } catch { stamps[b] = null; }
                    }));
                    donations.forEach((d) => { d.ts = stamps[d.block] ?? null; });

                    const votes = {};
                    vot.events.filter((e) => e.args).forEach((e) => {
                        const id = Number(e.args.requestId);
                        (votes[id] ||= []).push({ member: e.args.boardMember, approved: e.args.approved });
                    });

                    const refunds = {};
                    ref.events.filter((e) => e.args).forEach((e) => {
                        refunds[lower(e.args.donor)] = { amount: e.args.amount, hash: e.transactionHash };
                    });

                    if (!cancelled) {
                        setActivity({ status: "ready", donations, votes, refunds, partial: don.partial || vot.partial || ref.partial, key });
                    }
                } catch (err) {
                    console.error("Could not read campaign events", err);
                    // fall back to contract state: donor addresses and cumulative amounts, no times
                    let donations = [];
                    try {
                        const n = Math.min(Number(donorCount), 20);
                        const addrs = await Promise.all(Array.from({ length: n }, (_, i) => c.donorList(i)));
                        const amts = await Promise.all(addrs.map((a) => c.donations(a)));
                        donations = addrs.map((a, i) => ({ key: a, donor: a, amount: amts[i], ts: null, hash: null })).reverse();
                    } catch { /* leave empty */ }
                    if (!cancelled) setActivity({ status: "unavailable", donations, votes: {}, refunds: {}, partial: false, key });
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

const requestBadge = (r) => {
    if (r.executed) return { label: "Paid out", cls: "gt-badge gt-badge-success" };
    if (r.status === 2) return { label: "Rejected", cls: "gt-badge gt-badge-danger" };
    if (r.status === 1) return { label: "Approved", cls: "gt-badge gt-badge-success" };
    return { label: "Voting", cls: "gt-badge gt-badge-warning" };
};

/* ───────── page ───────── */

const CampaignDetail = () => {
    const { address } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { account, network, symbol, connectWallet, loading: walletLoading } = useWallet();
    const { getCampaignContract } = useContract();
    const { core, activity, reload } = useCampaignData(address);
    const now = useNow();

    const [amount, setAmount] = useState("");
    const [amountError, setAmountError] = useState("");
    const [donating, setDonating] = useState(false);
    const [lastDonation, setLastDonation] = useState(null); // { amount, hash }
    const [claiming, setClaiming] = useState(false);
    const [claimed, setClaimed] = useState(null);           // { amount, hash } right after claiming
    const [shown, setShown] = useState(PAGE);

    const data = core.data;

    /* ── actions ── */

    const handleDonate = async () => {
        if (!account) { toast.info("Connect your wallet to donate."); connectWallet(); return; }
        const v = amount.trim();
        let wei;
        try {
            if (!/^\d*\.?\d+$/.test(v)) throw new Error("bad");
            wei = ethers.parseEther(v);
        } catch {
            setAmountError("Enter a valid amount.");
            return;
        }
        if (wei < MIN_DONATION_WEI) { setAmountError(`The minimum donation is 0.01 ${symbol}.`); return; }

        setDonating(true);
        try {
            const contract = getCampaignContract(address);
            if (!contract) { toast.error("Your wallet isn't ready. Reconnect it and try again."); return; }
            const receipt = await toast.track(() => contract.donate({ value: wei }), {
                pending: "Confirm the donation in your wallet...", success: "Donation received",
            });
            if (receipt) { setLastDonation({ amount: v, hash: receipt.hash }); setAmount(""); reload(); }
        } finally {
            setDonating(false);
        }
    };

    const handleClaim = async () => {
        if (!account) { toast.info("Connect your wallet to claim a refund."); connectWallet(); return; }
        setClaiming(true);
        try {
            const contract = getCampaignContract(address);
            if (!contract) { toast.error("Your wallet isn't ready. Reconnect it and try again."); return; }
            const owed = data.mine;
            const receipt = await toast.track(() => contract.claimRefund(), {
                pending: "Confirm the refund in your wallet...", success: "Refund claimed",
            });
            if (receipt) { setClaimed({ amount: owed, hash: receipt.hash }); reload(); }
        } finally {
            setClaiming(false);
        }
    };

    /* ── full-page states ── */

    const stateCard = (title, text, action) => (
        <div className="gt-cd">
            <style>{css}</style>
            <div className="gt-cd-state">
                <h2>{title}</h2>
                <p>{text}</p>
                {action}
            </div>
        </div>
    );

    if (core.status === "nowallet") {
        return stateCard("Connect your wallet", "Connect a wallet to read this campaign from the blockchain.",
            <button className="gt-btn gt-btn-primary" onClick={connectWallet} disabled={walletLoading}>
                {walletLoading ? "Connecting..." : "Connect Wallet"}
            </button>);
    }
    if (core.status === "notfound") {
        return stateCard("Campaign not found",
            `There is no campaign at this address on ${network?.name || "this network"}. If you were sent this link, it may be on a different network. Switch networks from the navbar.`,
            <button className="gt-btn gt-btn-secondary" onClick={() => navigate("/donate")}>Back to campaigns</button>);
    }
    if (core.status === "error") {
        return stateCard("Couldn't load this campaign", "Something went wrong while reading from the blockchain. Check your connection and try again.",
            <button className="gt-btn gt-btn-primary" onClick={reload}>Try again</button>);
    }
    if (core.status === "loading" || !data) {
        return (
            <div className="gt-cd">
                <style>{css}</style>
                <div className="gt-cd-inner">
                    <div className="gt-skeleton gt-cd-sk" style={{ height: 36, width: 160, marginBottom: 16 }} />
                    <div className="gt-cd-layout">
                        <div className="gt-cd-top">
                            <div className="gt-skeleton gt-cd-sk" style={{ height: 520 }} />
                        </div>
                        <div className="gt-cd-side">
                            <div className="gt-skeleton gt-cd-sk" style={{ height: 340 }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── derived state (from deadline + totals, never the contract's stale `status` field) ── */

    const stateKey = campaignState(data, now);
    const meta = STATE_META[stateKey];
    const open = meta.open;
    const pct = percentFunded(data.raised, data.goal);
    const me = lower(account);
    const isCampaigner = !!me && lower(data.campaigner) === me;
    const isBoard = !!me && data.boardMembers.some((m) => lower(m) === me);
    const needed = approvalsNeeded(data.boardMembers.length);
    const deadlineText = formatDateTime(data.deadline);
    const endedDate = new Date(data.deadline * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

    const myRefund = claimed || activity.refunds[me] || null;
    const refundable = stateKey === "failed" && data.mine > 0n;
    const alreadyClaimed = stateKey === "failed" && data.mine === 0n && !!myRefund;
    const refundBlocked = refundable && data.balance < data.mine; // contract holds less than the donor is owed
    const withdrawn = data.requests.filter((r) => r.executed).reduce((s, r) => s + r.amount, 0n);

    const rows = activity.donations.slice(0, shown);
    const totalRows = activity.donations.length;

    /* ── sidebar card ── */

    const donateCard = (
        <div className="gt-cd-card gt-cd-action">
            <h2>Make a donation</h2>

            {lastDonation && (
                <div className="gt-cd-notice">
                    <ICheck size={18} />
                    <div>
                        <strong>Thank you. {lastDonation.amount} {symbol} received.</strong>
                        <TxLink hash={lastDonation.hash} label="View transaction" />
                    </div>
                </div>
            )}

            {stateKey === "goal_reached" && (
                <div className="gt-cd-notice is-info">
                    <IInfo />
                    <p>The goal has been reached. Donations stay open until the deadline.</p>
                </div>
            )}

            {data.mine > 0n && (
                <div className="gt-cd-kv"><span>You have donated</span><strong>{formatAmount(data.mine)} {symbol}</strong></div>
            )}

            <div>
                <label className="gt-cd-label" htmlFor="amount">Amount</label>
                <div className="gt-cd-affix" style={{ marginTop: 8 }}>
                    <input
                        id="amount" className={`gt-cd-input${amountError ? " is-error" : ""}`}
                        inputMode="decimal" placeholder="0.01" value={amount}
                        onChange={(e) => { setAmount(e.target.value); setAmountError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && !donating && handleDonate()}
                        aria-invalid={!!amountError}
                    />
                    <span>{symbol}</span>
                </div>
                {amountError ? <p className="gt-cd-err" style={{ marginTop: 6 }}>{amountError}</p>
                             : <p className="gt-cd-hint" style={{ marginTop: 6 }}>Minimum 0.01 {symbol}.</p>}
            </div>

            <div className="gt-cd-chips">
                {QUICK_AMOUNTS.map((a) => (
                    <button key={a} className="gt-cd-chip" onClick={() => { setAmount(a); setAmountError(""); }}>
                        {a} {symbol}
                    </button>
                ))}
            </div>

            <button className="gt-btn gt-btn-primary" onClick={handleDonate} disabled={donating}>
                {donating ? "Processing..." : account ? "Donate now" : "Connect wallet to donate"}
            </button>

            <p className="gt-cd-fine">
                Funds go directly to the smart contract, never to a person. Withdrawals need {needed} of {data.boardMembers.length} board
                approvals. If the goal isn't reached by {deadlineText}, you can claim a refund. Transactions are irreversible.
            </p>
        </div>
    );

    const fundedCard = (
        <div className="gt-cd-card gt-cd-action is-neutral">
            <h2>Campaign funded</h2>
            <div className="gt-cd-notice">
                <ICheck size={18} />
                <p>This campaign reached its goal and ended on {endedDate}. Donations are closed. Funds leave the contract only when the board approves a withdrawal.</p>
            </div>
            {data.mine > 0n && (
                <div className="gt-cd-kv"><span>You donated</span><strong>{formatAmount(data.mine)} {symbol}</strong></div>
            )}
        </div>
    );

    const failedCard = (
        <div className={`gt-cd-card gt-cd-action ${refundable ? "is-warn" : "is-neutral"}`}>
            <h2>{alreadyClaimed ? "Refund claimed" : "Campaign ended"}</h2>
            <p className="gt-cd-muted">
                This campaign ended on {endedDate} without reaching its goal of {formatAmount(data.goal)} {symbol}. Donors can claim their donation back.
            </p>

            {!account && (
                <>
                    <p className="gt-cd-hint">Connect your wallet to check whether you can claim a refund.</p>
                    <button className="gt-btn gt-btn-secondary" onClick={connectWallet} disabled={walletLoading}>
                        {walletLoading ? "Connecting..." : "Connect Wallet"}
                    </button>
                </>
            )}

            {account && refundable && (
                <>
                    <div className="gt-cd-kv"><span>Your refundable donation</span><strong>{formatAmount(data.mine)} {symbol}</strong></div>
                    {withdrawn > 0n && (
                        <div className="gt-cd-notice is-warn">
                            <IAlert />
                            <p>The board approved withdrawals of {formatAmount(withdrawn)} {symbol} from this campaign. The contract now holds {formatAmount(data.balance)} {symbol}.</p>
                        </div>
                    )}
                    {refundBlocked ? (
                        <div className="gt-cd-notice is-warn">
                            <IAlert />
                            <p>The contract holds less than you are owed, so this refund cannot be paid out in full right now.</p>
                        </div>
                    ) : (
                        <button className="gt-btn gt-cd-warnbtn" onClick={handleClaim} disabled={claiming}>
                            {claiming ? "Processing..." : "Claim my refund"}
                        </button>
                    )}
                </>
            )}

            {account && alreadyClaimed && (
                <div className="gt-cd-notice">
                    <ICheck size={18} />
                    <div>
                        <strong>You already claimed your refund of {formatAmount(myRefund.amount)} {symbol}.</strong>
                        <TxLink hash={myRefund.hash} label="View transaction" />
                    </div>
                </div>
            )}

            {account && !refundable && !alreadyClaimed && (
                <p className="gt-cd-hint">You have no donation to refund on this campaign.</p>
            )}
        </div>
    );

    const sideAction = open ? donateCard : stateKey === "funded" ? fundedCard : failedCard;

    /* ── render ── */

    return (
        <div className="gt-cd">
            <style>{css}</style>
            <div className="gt-cd-inner">
                <button className="gt-cd-back" onClick={() => navigate("/donate")}>
                    <IBack /> Back to campaigns
                </button>

                <div className="gt-cd-layout">
                    {/* ───── top: hero ───── */}
                    <div className="gt-cd-top">
                        <section className="gt-cd-card gt-cd-hero">
                            <div className="gt-cd-cover"><Cover hash={data.ipfsHash} /></div>
                            <div className="gt-cd-hero-body">
                                <div><span className={meta.badge}>{meta.label}</span></div>
                                <h1 className="gt-cd-title">{data.title}</h1>
                                <p className="gt-cd-by">
                                    Started by <code title={data.campaigner}>{shortAddress(data.campaigner)}</code>
                                    {isCampaigner && <> <span className="gt-cd-tag">You</span></>}
                                </p>
                                <p className="gt-cd-desc">{data.description}</p>

                                <div>
                                    <div className="gt-cd-raise">
                                        <span className="gt-cd-raised">{formatAmount(data.raised)} {symbol}<small>raised of {formatAmount(data.goal)} {symbol}</small></span>
                                        <span className="gt-cd-pct">{percentLabel(pct)} funded</span>
                                    </div>
                                    <div className="gt-cd-bar" style={{ marginTop: 10 }}>
                                        <div className={`gt-cd-fill${pct >= 100 ? " is-full" : ""}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                </div>

                                <div className="gt-cd-tiles">
                                    <div className="gt-cd-tile"><span>Donors</span><strong>{data.donorCount}</strong></div>
                                    <div className="gt-cd-tile"><span>{open ? "Time left" : "Ended on"}</span><strong>{open ? timeLeft(data.deadline, now) : endedDate}</strong></div>
                                    <div className="gt-cd-tile"><span>Held in contract</span><strong>{formatAmount(data.balance)} {symbol}</strong></div>
                                    <div className="gt-cd-tile"><span>Withdrawal requests</span><strong>{data.requests.length}</strong></div>
                                    <div className="gt-cd-tile"><span>Board members</span><strong>{data.boardMembers.length}</strong></div>
                                    <div className="gt-cd-tile"><span>Approvals needed</span><strong>{needed} of {data.boardMembers.length}</strong></div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ───── side: action ───── */}
                    <aside className="gt-cd-side">
                        {sideAction}

                        {isBoard && (
                            <div className="gt-cd-card gt-cd-action is-neutral">
                                <h2>You are on the board</h2>
                                <p className="gt-cd-muted">You can vote on withdrawal requests for this campaign.</p>
                                <button className="gt-btn gt-btn-secondary" onClick={() => navigate(`/board/${address}`)}>Open board dashboard</button>
                            </div>
                        )}
                        {isCampaigner && (
                            <div className="gt-cd-card gt-cd-action is-neutral">
                                <h2>You started this campaign</h2>
                                <p className="gt-cd-muted">Create withdrawal requests and track votes from your campaigns page.</p>
                                <button className="gt-btn gt-btn-secondary" onClick={() => navigate("/dashboard")}>Manage campaign</button>
                            </div>
                        )}

                        <div className="gt-cd-card">
                            <h2>Contract</h2>
                            <p className="gt-cd-hint" style={{ margin: "6px 0 10px" }}>Deployed on {network?.name || "this network"}. Anyone can verify every transaction.</p>
                            <div className="gt-cd-addr">{address}</div>
                            <div style={{ marginTop: 10 }}><TxLink type="address" hash={address} label="View on explorer" /></div>
                        </div>
                    </aside>

                    {/* ───── rest: requests + people ───── */}
                    <div className="gt-cd-rest">
                        <section className="gt-cd-card">
                            <div className="gt-cd-sechead">
                                <h2>Withdrawal requests</h2>
                                <span className="gt-cd-count">{data.requests.length}</span>
                            </div>
                            <p className="gt-cd-muted">
                                The campaigner cannot move funds alone. A request passes with {needed} of {data.boardMembers.length} board approvals, and the same number of rejections blocks it.
                            </p>

                            {data.requests.length === 0 ? (
                                <div className="gt-cd-empty">No withdrawal requests yet. All donated funds are still held by the contract.</div>
                            ) : (
                                <div className="gt-cd-reqs">
                                    {data.requests.map((r) => {
                                        const b = requestBadge(r);
                                        const size = data.boardMembers.length;
                                        const voters = activity.votes[r.id] || [];
                                        return (
                                            <div key={r.id} className="gt-cd-req">
                                                <div className="gt-cd-req-head">
                                                    <div>
                                                        <span className="gt-cd-req-n">Request {r.id + 1}</span>
                                                        <span className={b.cls}>{b.label}</span>
                                                    </div>
                                                    <span className="gt-cd-req-amt">{formatAmount(r.amount)} {symbol}</span>
                                                </div>
                                                <p className="gt-cd-req-desc">{r.description}</p>

                                                <div className="gt-cd-vote">
                                                    <div className="gt-cd-vote-row"><span>Approvals</span><span>{r.approvals} of {size}, needs {needed}</span></div>
                                                    <div className="gt-cd-vbar"><i style={{ width: `${Math.min(100, (r.approvals / size) * 100)}%`, background: "#22c55e" }} /></div>
                                                </div>
                                                <div className="gt-cd-vote">
                                                    <div className="gt-cd-vote-row"><span>Rejections</span><span>{r.rejections} of {size}, needs {needed}</span></div>
                                                    <div className="gt-cd-vbar"><i style={{ width: `${Math.min(100, (r.rejections / size) * 100)}%`, background: "#ef4444" }} /></div>
                                                </div>

                                                {voters.length > 0 && (
                                                    <div className="gt-cd-voters">
                                                        {voters.map((v, i) => (
                                                            <span key={i} className="gt-cd-voter" title={v.member}>
                                                                <i style={{ background: v.approved ? "#22c55e" : "#ef4444" }} />
                                                                {shortAddress(v.member)} {v.approved ? "approved" : "rejected"}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="gt-cd-card">
                            <h2>People</h2>
                            <div className="gt-cd-people">
                                <div>
                                    <h3>Campaigner</h3>
                                    <div className="gt-cd-person">
                                        <code title={data.campaigner}>{data.campaigner}</code>
                                        {isCampaigner && <span className="gt-cd-tag">You</span>}
                                        <TxLink type="address" hash={data.campaigner} label="View" />
                                    </div>
                                </div>
                                <div>
                                    <h3>Board members</h3>
                                    {data.boardMembers.map((m, i) => (
                                        <div key={m} className="gt-cd-person">
                                            <span className="n">{i + 1}</span>
                                            <code title={m}>{shortAddress(m)}</code>
                                            {lower(m) === me && <span className="gt-cd-tag">You</span>}
                                            <TxLink type="address" hash={m} label="View" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* ───── recent donors: full width ───── */}
                <section className="gt-cd-card gt-cd-donors">
                    <div className="gt-cd-sechead">
                        <h2>Recent donors</h2>
                        <span className="gt-cd-count">{data.donorCount} donor{data.donorCount === 1 ? "" : "s"}</span>
                    </div>

                    {activity.status === "loading" ? (
                        <div className="gt-cd-table">
                            {[0, 1, 2].map((i) => <div key={i} className="gt-skeleton gt-cd-sk" style={{ height: 44, marginBottom: 10 }} />)}
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="gt-cd-empty">
                            {open ? "No donations yet. Be the first to donate." : "This campaign received no donations."}
                        </div>
                    ) : (
                        <>
                            <div className="gt-cd-table" role="table">
                                <div className="gt-cd-tr gt-cd-th" role="row">
                                    <span className="c-n">No.</span><span className="c-d">Donor</span><span className="c-w">When</span>
                                    <span className="c-a">Amount</span><span className="c-s">Share</span><span className="c-t">Transaction</span>
                                </div>
                                {rows.map((d, i) => {
                                    const share = data.raised > 0n ? Number((d.amount * 1000n) / data.raised) / 10 : 0;
                                    const refunded = stateKey === "failed" && !!activity.refunds[lower(d.donor)];
                                    return (
                                        <div key={d.key} className="gt-cd-tr" role="row">
                                            <span className="c-n">{i + 1}</span>
                                            <span className="c-d">
                                                <code title={d.donor}>{shortAddress(d.donor)}</code>
                                                {lower(d.donor) === me && <span className="gt-cd-tag">You</span>}
                                                {refunded && <span className="gt-cd-tag is-warn">Refunded</span>}
                                            </span>
                                            <span className="c-w" title={d.ts ? formatDateTime(d.ts) : ""}>{d.ts ? timeAgo(d.ts, now) : "-"}</span>
                                            <span className="c-a">{formatAmount(d.amount)} {symbol}</span>
                                            <span className="c-s">{d.hash ? percentLabel(share) : "-"}</span>
                                            <span className="c-t">{d.hash ? <TxLink hash={d.hash} label="View" /> : "-"}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {shown < totalRows && (
                                <div className="gt-cd-more">
                                    <button className="gt-btn gt-btn-secondary" onClick={() => setShown((s) => s + PAGE)}>
                                        Show more
                                    </button>
                                </div>
                            )}
                            {totalRows >= MAX_ROWS && <p className="gt-cd-note">Showing the latest {MAX_ROWS} donations.</p>}
                            {activity.status === "unavailable" && (
                                <p className="gt-cd-note">Donation times and transaction links are unavailable from this network right now. Amounts are each donor's total.</p>
                            )}
                            {activity.partial && (
                                <p className="gt-cd-note">This network limits history queries, so only recent activity is shown.</p>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default CampaignDetail;