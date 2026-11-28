import { useEffect, useLayoutEffect } from "react";

/**
 * Reusable success popup.
 *
 *   <SuccessDialog
 *     title="Request submitted"
 *     headline="0.5 ETH"
 *     subtitle="Waiting for board approval"
 *     rows={[{ label: "Status", value: "Awaiting board votes" }, { label: "Transaction", value: "0xabc...1234", mono: true }]}
 *     note="Optional explanatory line."
 *     explorerUrl="https://.../tx/0x..."          // optional -> "View transaction" button
 *     secondary={{ label: "Copy board link", onClick: fn }}   // optional
 *     onClose={() => ...}
 *   />
 */

const css = `
@keyframes gt-sd-in { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes gt-sd-pop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
@keyframes gt-sd-draw { to { stroke-dashoffset: 0; } }
.gt-sd-backdrop { position: fixed; inset: 0; z-index: 9990; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); }
.gt-sd { width: 420px; max-width: 100%; max-height: 92vh; overflow-y: auto; background: #ffffff; border-radius: 24px; padding: 32px 28px 24px; text-align: center; box-shadow: 0 30px 70px rgba(15, 23, 42, 0.3); animation: gt-sd-in 0.22s ease-out; }
.gt-sd-icon { width: 76px; height: 76px; margin: 0 auto 14px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; animation: gt-sd-pop 0.4s ease-out; }
.gt-sd-icon svg { width: 44px; height: 44px; }
.gt-sd-icon path { fill: none; stroke: #16a34a; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 40; stroke-dashoffset: 40; animation: gt-sd-draw 0.45s 0.2s ease forwards; }
.gt-sd h2 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.01em; }
.gt-sd-headline { margin: 10px 0 0; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; color: var(--primary-ink); }
.gt-sd-sub { margin: 4px 0 0; font-size: 14px; line-height: 1.5; color: var(--text-muted); overflow-wrap: anywhere; }
.gt-sd-rows { margin: 20px 0 0; border: 1px solid var(--border); border-radius: 14px; text-align: left; }
.gt-sd-rows > div { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; font-size: 14px; border-bottom: 1px solid var(--border); }
.gt-sd-rows > div:last-child { border-bottom: none; }
.gt-sd-rows span { color: var(--text-dim); }
.gt-sd-rows strong { font-weight: 700; text-align: right; }
.gt-sd-rows code { font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); }
.gt-sd-note { margin: 14px 0 0; font-size: 13px; line-height: 1.6; color: var(--text-dim); }
.gt-sd-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
.gt-sd-actions .gt-btn { display: block; width: 100%; padding: 13px; font-size: 15px; border-radius: 12px; text-align: center; text-decoration: none; }
.gt-sd-done { background: none; border: none; padding: 10px; font: inherit; font-size: 14px; font-weight: 600; color: var(--text-muted); cursor: pointer; border-radius: 10px; }
.gt-sd-done:hover { background: var(--surface-alt); color: var(--text); }
@media (prefers-reduced-motion: reduce) { .gt-sd, .gt-sd-icon, .gt-sd-icon path { animation: none; stroke-dashoffset: 0; } }
`;

function useCss() {
    useLayoutEffect(() => {
        if (document.getElementById("gt-sd-css")) return;
        const el = document.createElement("style");
        el.id = "gt-sd-css";
        el.textContent = css;
        document.head.appendChild(el);
    }, []);
}

export default function SuccessDialog({ title, headline, subtitle, rows = [], note, explorerUrl, secondary, onClose }) {
    useCss();

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="gt-sd-backdrop" onClick={onClose}>
            <div className="gt-sd" role="dialog" aria-modal="true" aria-labelledby="gt-sd-title" onClick={(e) => e.stopPropagation()}>
                <div className="gt-sd-icon">
                    <svg viewBox="0 0 52 52" aria-hidden="true"><path d="M14 27l8 8 16-17" /></svg>
                </div>
                <h2 id="gt-sd-title">{title}</h2>
                {headline && <p className="gt-sd-headline">{headline}</p>}
                {subtitle && <p className="gt-sd-sub">{subtitle}</p>}

                {rows.length > 0 && (
                    <div className="gt-sd-rows">
                        {rows.map((r) => (
                            <div key={r.label}>
                                <span>{r.label}</span>
                                {r.mono ? <code>{r.value}</code> : <strong>{r.value}</strong>}
                            </div>
                        ))}
                    </div>
                )}

                {note && <p className="gt-sd-note">{note}</p>}

                <div className="gt-sd-actions">
                    {explorerUrl && (
                        <a className="gt-btn gt-btn-primary" href={explorerUrl} target="_blank" rel="noopener noreferrer">
                            View transaction
                        </a>
                    )}
                    {secondary && (
                        <button className="gt-btn gt-btn-secondary" onClick={secondary.onClick}>{secondary.label}</button>
                    )}
                    <button className="gt-sd-done" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}