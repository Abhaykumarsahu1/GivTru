import { useLayoutEffect } from "react";

/**
 * Navy header band used by the campaigner workspace pages (My campaigns, Manage campaign).
 * It makes those pages look clearly different from the public Browse pages.
 *
 *   <WorkspaceHeader
 *     eyebrow="Campaigner workspace" title="My campaigns" subtitle="..."
 *     back={{ label: "All my campaigns", onClick: fn }}      // optional
 *     actions={<button className="gt-btn gt-btn-primary">New campaign</button>}
 *     badge={<span className="gt-badge">Active</span>}        // optional, shown beside the title
 *     stats={[{ label: "Raised", value: "2 ETH", hint: "of 10 ETH" }]} />
 */

const css = `
.gt-wh { background: linear-gradient(135deg, #0b1220 0%, #12203a 58%, #0f2d2a 100%); color: #ffffff; }
.gt-wh-inner { max-width: 1200px; margin: 0 auto; padding: 24px var(--page-gutter) 30px; }
.gt-wh-back {
    display: inline-flex; align-items: center; gap: 8px; margin: 0 0 14px; padding: 6px 12px 6px 6px;
    background: none; border: none; border-radius: 10px; cursor: pointer;
    font: inherit; font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.7);
    transition: background 0.15s, color 0.15s;
}
.gt-wh-back:hover { background: rgba(255, 255, 255, 0.1); color: #ffffff; }
.gt-wh-top { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.gt-wh-eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #4ade80; }
.gt-wh-titlerow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.gt-wh h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; overflow-wrap: anywhere; }
.gt-wh-sub { margin: 8px 0 0; max-width: 640px; font-size: 15px; line-height: 1.6; color: rgba(255, 255, 255, 0.7); }
.gt-wh-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.gt-wh .gt-btn-secondary { background: transparent; color: #ffffff; border-color: rgba(255, 255, 255, 0.35); }
.gt-wh .gt-btn-secondary:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); }
.gt-wh-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-top: 24px; }
.gt-wh-stat { padding: 14px 18px; border-radius: 14px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); }
.gt-wh-stat span { display: block; font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.05em; }
.gt-wh-stat strong { display: block; margin-top: 4px; font-size: 22px; font-weight: 800; letter-spacing: -0.01em; }
.gt-wh-stat small { display: block; margin-top: 2px; font-size: 12.5px; color: rgba(255, 255, 255, 0.55); }
@media (max-width: 640px) { .gt-wh h1 { font-size: 26px; } .gt-wh-actions .gt-btn { width: 100%; } .gt-wh-actions { width: 100%; } }
`;

function useCss() {
    useLayoutEffect(() => {
        if (document.getElementById("gt-wh-css")) return;
        const el = document.createElement("style");
        el.id = "gt-wh-css";
        el.textContent = css;
        document.head.appendChild(el);
    }, []);
}

export default function WorkspaceHeader({ eyebrow, title, subtitle, back, actions, badge, stats }) {
    useCss();
    return (
        <header className="gt-wh">
            <div className="gt-wh-inner">
                {back && (
                    <button className="gt-wh-back" onClick={back.onClick}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        {back.label}
                    </button>
                )}
                <div className="gt-wh-top">
                    <div>
                        {eyebrow && <p className="gt-wh-eyebrow">{eyebrow}</p>}
                        <div className="gt-wh-titlerow">
                            <h1>{title}</h1>
                            {badge}
                        </div>
                        {subtitle && <p className="gt-wh-sub">{subtitle}</p>}
                    </div>
                    {actions && <div className="gt-wh-actions">{actions}</div>}
                </div>
                {stats && stats.length > 0 && (
                    <div className="gt-wh-stats">
                        {stats.map((s) => (
                            <div key={s.label} className="gt-wh-stat">
                                <span>{s.label}</span>
                                <strong>{s.value}</strong>
                                {s.hint && <small>{s.hint}</small>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </header>
    );
}