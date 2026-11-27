import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "./WalletContext";
import TxLink from "../components/TxLink";
import { friendlyError } from "../utils/errors";

const ToastContext = createContext(null);
let nextId = 1;

const ICON = { success: "✓", error: "✕", info: "ℹ" };

function ToastItem({ toast, onClose }) {
    // auto-dismiss; restarts whenever the toast is updated (e.g. loading -> success)
    useEffect(() => {
        if (!toast.duration) return;
        const timer = setTimeout(() => onClose(toast.id), toast.duration);
        return () => clearTimeout(timer);
    }, [toast.id, toast.type, toast.duration, toast.message]);

    return (
        <div className={`gt-toast gt-toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
            {toast.type === "loading" ? (
                <div className="gt-spinner" />
            ) : (
                <span aria-hidden>{ICON[toast.type]}</span>
            )}
            <div className="gt-toast-body">
                <div>{toast.message}</div>
                {toast.tx && (
                    <div style={{ marginTop: 4 }}>
                        <TxLink hash={toast.tx} explorer={toast.explorer} label="View transaction" />
                    </div>
                )}
            </div>
            <button className="gt-toast-close" onClick={() => onClose(toast.id)} aria-label="Dismiss">
                ×
            </button>
        </div>
    );
}

/**
 * Mount INSIDE <WalletProvider> (it reads the current explorer from it):
 *   <WalletProvider><ToastProvider><App /></ToastProvider></WalletProvider>
 */
export function ToastProvider({ children }) {
    const wallet = useWallet();
    const explorerRef = useRef("");
    explorerRef.current = wallet?.explorer || "";

    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
    const update = useCallback(
        (id, patch) => setToasts((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x))),
        []
    );

    const push = useCallback((type, message, opts = {}) => {
        const id = nextId++;
        const toast = {
            id,
            type,
            message,
            tx: opts.tx,
            explorer: explorerRef.current, // pinned at creation time
            duration: opts.duration ?? (type === "loading" ? 0 : 5000),
        };
        setToasts((t) => [...t.slice(-4), toast]);
        return id;
    }, []);

    /**
     * Wrap any contract write. Handles wallet prompt -> submitted -> confirmed/failed.
     * Returns the receipt on success, or null on failure (error toast already shown).
     *
     *   const receipt = await toast.track(
     *       () => campaign.donate({ value: ethers.parseEther(amount) }),
     *       { success: "Donation received" }
     *   );
     *   if (receipt) refresh();
     */
    const track = useCallback(
        async (send, labels = {}) => {
            const id = push("loading", labels.pending || "Confirm in your wallet…");
            try {
                const tx = await send();
                update(id, {
                    message: labels.waiting || "Transaction submitted, waiting for confirmation…",
                    tx: tx.hash,
                });
                const receipt = await tx.wait();
                if (labels.silent) {
                    // the caller shows its own success UI (e.g. a dialog), so just clear the progress toast
                    dismiss(id);
                } else {
                    update(id, {
                        type: "success",
                        message: labels.success || "Transaction confirmed",
                        tx: tx.hash,
                        duration: 7000,
                    });
                }
                return receipt;
            } catch (err) {
                update(id, { type: "error", message: friendlyError(err), tx: undefined, duration: 8000 });
                return null;
            }
        },
        [push, update, dismiss]
    );

    const api = useMemo(
        () => ({
            success: (msg, opts) => push("success", msg, opts),
            info: (msg, opts) => push("info", msg, opts),
            // accepts a string or a raw error object
            error: (errOrMsg, opts) =>
                push("error", typeof errOrMsg === "string" ? errOrMsg : friendlyError(errOrMsg), { duration: 8000, ...opts }),
            loading: (msg) => push("loading", msg),
            update,
            dismiss,
            track,
        }),
        [push, update, dismiss, track]
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="gt-toast-viewport" aria-live="polite">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onClose={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
    return ctx;
};