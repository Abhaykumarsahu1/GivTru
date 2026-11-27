import { ethers } from "ethers";

// Placeholder hash stored on-chain when a campaign has no image
export const DEFAULT_IPFS_HASH = "QmDefaultHash";

/**
 * Campaign state is derived from the deadline and the totals, never from the
 * contract's `status` field (that field is never flipped to Expired on-chain,
 * because the write is rolled back when the lazy-expiry require() reverts).
 *
 *   active        before the deadline, goal not reached yet
 *   goal_reached  before the deadline, goal already reached (still accepts donations)
 *   funded        deadline passed, goal reached
 *   failed        deadline passed, goal missed (donors can claim refunds)
 */
export function campaignState({ goal, raised, deadline }, now = Date.now()) {
    const ended = now >= deadline * 1000;
    const reached = goal > 0n && raised >= goal;
    if (!ended) return reached ? "goal_reached" : "active";
    return reached ? "funded" : "failed";
}

export const STATE_META = {
    active:       { label: "Active",       badge: "gt-badge gt-badge-success", open: true },
    goal_reached: { label: "Goal reached", badge: "gt-badge gt-badge-success", open: true },
    funded:       { label: "Funded",       badge: "gt-badge",                  open: false },
    failed:       { label: "Ended",        badge: "gt-badge gt-badge-warning", open: false },
};

// percent funded with one decimal, using BigInt so large wei values don't lose precision
export const percentFunded = (raised, goal) =>
    goal > 0n ? Number((raised * 1000n) / goal) / 10 : 0;

export const percentLabel = (pct) =>
    pct === 0 ? "0%" : pct < 10 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`;

// wei -> "1,234.5678" (max 4 decimals), "<0.0001" for dust
export function formatAmount(wei, maxDecimals = 4) {
    const n = Number(ethers.formatEther(wei));
    if (n === 0) return "0";
    const min = 10 ** -maxDecimals;
    if (n < min) return `<${min.toFixed(maxDecimals)}`;
    return n.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

export function timeLeft(deadlineSec, now = Date.now()) {
    const ms = deadlineSec * 1000 - now;
    if (ms <= 0) {
        const d = new Date(deadlineSec * 1000).toLocaleDateString(undefined, {
            day: "numeric", month: "short", year: "numeric",
        });
        return `Ended ${d}`;
    }
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d >= 1) return `${d}d ${h % 24}h left`;
    if (h >= 1) return `${h}h ${m % 60}m left`;
    return `${Math.max(m, 1)}m left`;
}

export const shortAddress = (a) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "");

// "5 min ago", "3 hours ago", "2 days ago", then a plain date
export function timeAgo(tsSec, now = Date.now()) {
    if (!tsSec) return "-";
    const s = Math.max(0, Math.floor(now / 1000 - tsSec));
    if (s < 45) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${Math.max(m, 1)} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
    return new Date(tsSec * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export const formatDateTime = (tsSec) =>
    new Date(tsSec * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// same formula as Campaign.sol: (2 * boardSize + 2) / 3, integer division
export const approvalsNeeded = (n) => Math.floor((2 * n + 2) / 3);