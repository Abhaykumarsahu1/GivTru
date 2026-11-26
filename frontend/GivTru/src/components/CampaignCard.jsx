import { useLayoutEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getIPFSUrl } from "../utils/ipfs";
import {
    DEFAULT_IPFS_HASH, STATE_META, campaignState, percentFunded,
    percentLabel, formatAmount, timeLeft, shortAddress,
} from "../utils/campaign";

// If the primary gateway is slow or down, try these in order before giving up
const FALLBACK_GATEWAYS = ["https://ipfs.io/ipfs/", "https://dweb.link/ipfs/"];

const css = `
.gt-cc {
    display: flex; flex-direction: column;
    background: #ffffff; border: 1px solid var(--border); border-radius: 16px;
    overflow: hidden; text-decoration: none; color: inherit;
    transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
}
.gt-cc:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(15, 23, 42, 0.10); border-color: #bbf7d0; }
.gt-cc:focus-visible { outline: 3px solid rgba(34, 197, 94, 0.45); outline-offset: 2px; }

.gt-cc-media { position: relative; height: 176px; flex-shrink: 0; overflow: hidden; background: #f1f5f9; }
.gt-cc-media img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; opacity: 0; transition: opacity 0.25s;
}
.gt-cc-media img.is-loaded { opacity: 1; }
.gt-cc-skel { position: absolute; inset: 0; border-radius: 0; }
.gt-cc-ph {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #dcfce7 0%, #e0e7ff 100%);
}
.gt-cc-ph span {
    width: 56px; height: 56px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255, 255, 255, 0.9); color: #16a34a;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.10);
}
.gt-cc-badge { position: absolute; top: 12px; left: 12px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12); }

.gt-cc-body { flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 18px; }
.gt-cc-title {
    margin: 0; font-size: 18px; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; overflow-wrap: anywhere;
}
.gt-cc-desc {
    margin: 0; font-size: 14px; line-height: 1.55; color: var(--text-muted);
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    overflow: hidden; overflow-wrap: anywhere;
}
.gt-cc-bar { height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.gt-cc-fill { height: 100%; border-radius: 999px; background: #22c55e; transition: width 0.5s ease; }
.gt-cc-fill.is-full { background: #16a34a; }
.gt-cc-amounts { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 13px; color: var(--text-dim); }
.gt-cc-amounts strong { font-size: 15px; color: var(--primary-ink); }
.gt-cc-pct { font-weight: 700; color: var(--text); }
.gt-cc-meta { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; color: var(--text-muted); }
.gt-cc-meta span { display: inline-flex; align-items: center; gap: 6px; }
.gt-cc-note { margin: 0; font-size: 12.5px; color: #92400e; }

.gt-cc-foot { margin-top: auto; padding-top: 4px; display: flex; flex-direction: column; gap: 10px; }
.gt-cc-by { font-size: 12.5px; color: var(--text-dim); }
.gt-cc-by code { font-family: var(--font-mono); color: var(--text-muted); }
.gt-cc-cta {
    display: block; text-align: center; padding: 11px; border-radius: 10px;
    font-size: 14px; font-weight: 700; color: var(--text);
    background: #ffffff; border: 1px solid var(--border-strong);
    transition: background 0.15s, border-color 0.15s;
}
.gt-cc:hover .gt-cc-cta { background: var(--surface-alt); }
.gt-cc-cta.is-primary { background: #22c55e; border-color: #22c55e; color: #052e16; }
.gt-cc:hover .gt-cc-cta.is-primary { background: #16a34a; border-color: #16a34a; }

.gt-cc-sk-line { height: 14px; }
`;

// inject the card CSS once, no matter how many cards are on screen
function useCardCss() {
    useLayoutEffect(() => {
        if (document.getElementById("gt-campaign-card-css")) return;
        const el = document.createElement("style");
        el.id = "gt-campaign-card-css";
        el.textContent = css;
        document.head.appendChild(el);
    }, []);
}

const Svg = ({ children, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);
const IUsers = () => (
    <Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Svg>
);
const IClock = () => (
    <Svg><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Svg>
);
const IHeart = () => (
    <Svg size={26}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></Svg>
);

function imageSources(hash) {
    if (!hash || hash === DEFAULT_IPFS_HASH) return [];
    const path = String(hash).replace(/^ipfs:\/\//, "").replace(/^\/?ipfs\//, "");
    let primary = null;
    try { primary = getIPFSUrl(hash); } catch { /* fall through to gateways */ }
    return [...new Set([primary, ...FALLBACK_GATEWAYS.map((g) => g + path)].filter(Boolean))];
}

function CampaignImage({ hash }) {
    const sources = useMemo(() => imageSources(hash), [hash]);
    const [idx, setIdx] = useState(0);
    const [loaded, setLoaded] = useState(false);

    if (sources.length === 0 || idx >= sources.length) {
        return <div className="gt-cc-ph"><span><IHeart /></span></div>;
    }
    return (
        <>
            {!loaded && <div className="gt-cc-skel gt-skeleton" />}
            <img
                key={sources[idx]}
                src={sources[idx]}
                alt=""
                loading="lazy"
                className={loaded ? "is-loaded" : ""}
                onLoad={() => setLoaded(true)}
                onError={() => { setLoaded(false); setIdx((i) => i + 1); }}
            />
        </>
    );
}

export default function CampaignCard({ campaign, symbol, now = Date.now() }) {
    useCardCss();

    const state = campaignState(campaign, now);
    const meta = STATE_META[state];
    const pct = percentFunded(campaign.raised, campaign.goal);

    return (
        <Link to={`/campaign/${campaign.address}`} className="gt-cc">
            <div className="gt-cc-media">
                <CampaignImage hash={campaign.ipfsHash} />
                <span className={`${meta.badge} gt-cc-badge`}>{meta.label}</span>
            </div>

            <div className="gt-cc-body">
                <h3 className="gt-cc-title">{campaign.title}</h3>
                <p className="gt-cc-desc">{campaign.description}</p>

                <div>
                    <div className="gt-cc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(pct, 100)}>
                        <div className={`gt-cc-fill${pct >= 100 ? " is-full" : ""}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                </div>

                <div className="gt-cc-amounts">
                    <span>
                        <strong>{formatAmount(campaign.raised)} {symbol}</strong> raised of {formatAmount(campaign.goal)}
                    </span>
                    <span className="gt-cc-pct">{percentLabel(pct)}</span>
                </div>

                <div className="gt-cc-meta">
                    <span><IUsers /> {campaign.donorCount} donor{campaign.donorCount === 1 ? "" : "s"}</span>
                    <span><IClock /> {timeLeft(campaign.deadline, now)}</span>
                </div>

                {state === "failed" && <p className="gt-cc-note">Goal not met. Donors can claim refunds.</p>}

                <div className="gt-cc-foot">
                    <span className="gt-cc-by">By <code>{shortAddress(campaign.campaigner)}</code></span>
                    <span className={`gt-cc-cta${meta.open ? " is-primary" : ""}`}>
                        {meta.open ? "Donate" : "View details"}
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function CampaignCardSkeleton() {
    useCardCss();
    return (
        <div className="gt-cc" aria-hidden="true" style={{ pointerEvents: "none" }}>
            <div className="gt-cc-media"><div className="gt-cc-skel gt-skeleton" /></div>
            <div className="gt-cc-body">
                <div className="gt-skeleton gt-cc-sk-line" style={{ width: "70%", height: 20 }} />
                <div className="gt-skeleton gt-cc-sk-line" style={{ width: "100%" }} />
                <div className="gt-skeleton gt-cc-sk-line" style={{ width: "85%" }} />
                <div className="gt-skeleton" style={{ height: 8, borderRadius: 999 }} />
                <div className="gt-skeleton gt-cc-sk-line" style={{ width: "60%" }} />
                <div className="gt-skeleton" style={{ height: 40, borderRadius: 10, marginTop: "auto" }} />
            </div>
        </div>
    );
}