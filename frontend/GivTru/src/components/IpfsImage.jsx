import { useLayoutEffect, useMemo, useState } from "react";
import { getIPFSUrl } from "../utils/ipfs";
import { DEFAULT_IPFS_HASH } from "../utils/campaign";

// Tries the primary gateway first, then public fallbacks, then renders `fallback`.
// The parent must be position: relative with overflow: hidden (the image fills it).
const FALLBACK_GATEWAYS = ["https://ipfs.io/ipfs/", "https://dweb.link/ipfs/"];

const css = `
.gt-ipfs-skel { position: absolute; inset: 0; border-radius: inherit; }
.gt-ipfs-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.25s; }
.gt-ipfs-img.is-loaded { opacity: 1; }
`;

function useCss() {
    useLayoutEffect(() => {
        if (document.getElementById("gt-ipfs-css")) return;
        const el = document.createElement("style");
        el.id = "gt-ipfs-css";
        el.textContent = css;
        document.head.appendChild(el);
    }, []);
}

export function ipfsSources(hash) {
    if (!hash || hash === DEFAULT_IPFS_HASH) return [];
    const path = String(hash).replace(/^ipfs:\/\//, "").replace(/^\/?ipfs\//, "");
    let primary = null;
    try { primary = getIPFSUrl(hash); } catch { /* fall through to gateways */ }
    return [...new Set([primary, ...FALLBACK_GATEWAYS.map((g) => g + path)].filter(Boolean))];
}

export default function IpfsImage({ hash, fallback = null }) {
    useCss();
    const sources = useMemo(() => ipfsSources(hash), [hash]);
    const [idx, setIdx] = useState(0);
    const [loaded, setLoaded] = useState(false);

    if (sources.length === 0 || idx >= sources.length) return fallback;

    return (
        <>
            {!loaded && <span className="gt-ipfs-skel gt-skeleton" />}
            <img
                key={sources[idx]}
                src={sources[idx]}
                alt=""
                loading="lazy"
                className={`gt-ipfs-img${loaded ? " is-loaded" : ""}`}
                onLoad={() => setLoaded(true)}
                onError={() => { setLoaded(false); setIdx((i) => i + 1); }}
            />
        </>
    );
}