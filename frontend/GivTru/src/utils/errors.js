// Turns raw ethers / wallet / RPC errors into one human sentence.
// Usage: toast.error(friendlyError(err))  — or let toast.track() do it for you.

// Revert strings from Campaign.sol and CampaignFactory.sol -> friendly text.
// Matched by substring, so keep the keys identical to the require() messages.
const REVERTS = {
    "Not the campaigner": "Only the campaigner can do this.",
    "Not a board member": "Only board members can do this.",
    "Campaign is not active": "This campaign has ended and no longer accepts donations.",
    "Minimum donation is": "The minimum donation is 0.01.",
    "Campaign deadline not reached yet": "Refunds open once the campaign deadline has passed.",
    "Goal was met": "This campaign reached its goal, so refunds aren't available.",
    "No donation to refund": "You have no donation to refund on this campaign.",
    "Refund transfer failed": "The refund transfer failed. Please try again.",
    "Amount must be > 0": "Enter an amount greater than zero.",
    "Insufficient contract balance": "The campaign doesn't hold enough funds for this request.",
    "Insufficient balance": "The campaign doesn't hold enough funds to pay this out.",
    "Invalid request ID": "That withdrawal request doesn't exist.",
    "Request already finalised": "This request has already been decided.",
    "Already voted": "You've already voted on this request.",
    "Already executed": "This request has already been paid out.",
    "Transfer failed": "The payout transfer failed.",
    "Goal must be > 0": "The funding goal must be greater than zero.",
    "Deadline must be in the future": "The deadline must be a future date.",
    "Need at least 3 board members": "A campaign needs at least 3 board members.",
    "Zero address not allowed": "One of the board member addresses is invalid.",
    "Duplicate board member": "Each board member address must be unique.",
};

const FALLBACK = "Something went wrong. Please try again.";

const isRejected = (err) =>
    err?.code === 4001 ||
    err?.code === "ACTION_REJECTED" ||
    err?.info?.error?.code === 4001 ||
    /user (rejected|denied)|rejected the request/i.test(err?.message || "");

// every place ethers/wallets tend to hide the useful text
const candidates = (err) =>
    [
        err?.reason,
        err?.revert?.args?.[0],
        err?.info?.error?.message,
        err?.error?.message,
        err?.data?.message,
        err?.shortMessage,
        err?.message,
    ].filter((s) => typeof s === "string");

export function friendlyError(err) {
    if (!err) return FALLBACK;
    if (typeof err === "string") return err;

    if (isRejected(err)) return "You cancelled the request in your wallet.";

    const texts = candidates(err);

    // known contract revert reasons first
    for (const text of texts) {
        for (const key of Object.keys(REVERTS)) {
            if (text.includes(key)) return REVERTS[key];
        }
    }

    const blob = texts.join(" ").toLowerCase();

    if (err?.code === "INSUFFICIENT_FUNDS" || blob.includes("insufficient funds"))
        return "Your wallet doesn't have enough funds to cover this plus gas.";
    if (err?.code === "NETWORK_ERROR" || err?.code === "SERVER_ERROR" || err?.code === "TIMEOUT" || blob.includes("failed to fetch"))
        return "Can't reach the network right now. Check your connection and try again.";
    if (err?.code === "NONCE_EXPIRED" || err?.code === "REPLACEMENT_UNDERPRICED" || blob.includes("nonce"))
        return "Your wallet has a pending transaction conflicting with this one. Wait for it or reset the wallet's activity.";
    if (blob.includes("chain") && blob.includes("mismatch"))
        return "Your wallet is on a different network than the app. Switch networks and try again.";
    if (err?.code === "CALL_EXCEPTION" || blob.includes("missing revert data") || blob.includes("execution reverted"))
        return "The transaction was rejected by the contract. Check the details and try again.";
    if (blob.includes("session") || blob.includes("disconnected") || blob.includes("not connected"))
        return "Your wallet connection dropped. Reconnect your wallet and try again.";

    // keep the raw error for debugging, never show it to the user
    console.error("Unmapped error:", err);
    return FALLBACK;
}