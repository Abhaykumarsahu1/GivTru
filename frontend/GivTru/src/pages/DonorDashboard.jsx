import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useContract } from "../hooks/useContract";
import CampaignCard, { CampaignCardSkeleton } from "../components/CampaignCard";
import { campaignState, percentFunded, formatAmount } from "../utils/campaign";

const css = `
.gt-br { min-height: calc(100vh - 69px); background: #f8fafc; }
.gt-br-inner { max-width: 1200px; margin: 0 auto; padding: 36px var(--page-gutter) 64px; }

.gt-br-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
.gt-br-title { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; }
.gt-br-sub { margin: 6px 0 0; font-size: 15px; color: var(--text-muted); }

.gt-br-toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.gt-br-search { position: relative; flex: 1 1 320px; }
.gt-br-search > svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-dim); pointer-events: none; }
.gt-br-search input {
    width: 100%; font: inherit; font-size: 15px; padding: 12px 40px 12px 42px;
    background: #ffffff; color: var(--text);
    border: 1px solid var(--border-strong); border-radius: 12px;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.gt-br-search input:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18); }
.gt-br-clear {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    width: 28px; height: 28px; border: none; border-radius: 8px; background: none;
    color: var(--text-dim); cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.gt-br-clear:hover { background: var(--surface-alt); color: var(--text); }
.gt-br-sort { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-muted); }
.gt-br-sort select {
    font: inherit; font-size: 14px; font-weight: 600; color: var(--text);
    padding: 11px 12px; background: #ffffff; border: 1px solid var(--border-strong);
    border-radius: 12px; cursor: pointer;
}
.gt-br-sort select:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18); }

.gt-br-filterbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 16px 0 22px; }
.gt-br-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.gt-br-chip {
    font: inherit; font-size: 13px; font-weight: 600; padding: 7px 14px; border-radius: 999px;
    background: #ffffff; color: var(--text-muted); border: 1px solid var(--border-strong);
    cursor: pointer; transition: all 0.15s;
}
.gt-br-chip:hover { border-color: #22c55e; color: var(--primary-ink); }
.gt-br-chip.is-on { background: #22c55e; border-color: #22c55e; color: #052e16; }
.gt-br-chip small { margin-left: 6px; font-size: 12px; font-weight: 700; opacity: 0.75; }
.gt-br-count { font-size: 13px; color: var(--text-dim); }

.gt-br-grid { display: grid; gap: 22px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }

.gt-br-state {
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px;
    padding: 64px 20px; background: #ffffff; border: 1px dashed var(--border-strong); border-radius: 20px;
}
.gt-br-state-icon { width: 56px; height: 56px; border-radius: 16px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.gt-br-state h2 { margin: 0; font-size: 20px; font-weight: 800; }
.gt-br-state p { margin: 0; max-width: 420px; font-size: 14px; line-height: 1.6; color: var(--text-muted); }
.gt-br-state .gt-btn { margin-top: 10px; }

.gt-br-warn { margin: 0 0 18px; padding: 12px 16px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a; color: #78350f; font-size: 14px; }
.gt-br-warn button { background: none; border: none; padding: 0; margin-left: 6px; font: inherit; font-weight: 700; color: inherit; text-decoration: underline; cursor: pointer; }

.gt-br-totals {
    margin-top: 40px; padding: 18px 24px; background: #ffffff; border: 1px solid var(--border); border-radius: 16px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px 32px; flex-wrap: wrap;
}
.gt-br-totals-label { font-size: 13px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
.gt-br-totals-items { display: flex; gap: 12px 40px; flex-wrap: wrap; }
.gt-br-total { display: flex; flex-direction: column; gap: 2px; }
.gt-br-total strong { font-size: 18px; font-weight: 800; }
.gt-br-total span { font-size: 12.5px; color: var(--text-dim); }

@media (max-width: 640px) {
    .gt-br-title { font-size: 26px; }
    .gt-br-head .gt-btn { width: 100%; }
    .gt-br-sort { width: 100%; }
    .gt-br-sort select { flex: 1; }
}
`;

const Svg = ({ children, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);
const ISearch = () => <Svg><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>;
const IX = () => <Svg size={16}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
const IHeart = () => (
    <Svg size={26}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></Svg>
);

const FILTERS = [
    { id: "all",    label: "All",    test: () => true },
    { id: "active", label: "Active", test: (c, now) => now < c.deadline * 1000 },
    { id: "funded", label: "Funded", test: (c) => c.goal > 0n && c.raised >= c.goal },
    { id: "ended",  label: "Ended",  test: (c, now) => now >= c.deadline * 1000 },
];

const SORTS = {
    newest:  { label: "Newest first",  fn: () => (a, b) => b.index - a.index },
    ending:  { label: "Ending soon",   fn: (now) => (a, b) => {
        const ae = now >= a.deadline * 1000;
        const be = now >= b.deadline * 1000;
        if (ae !== be) return ae ? 1 : -1;       // running campaigns first
        return ae ? b.deadline - a.deadline : a.deadline - b.deadline;
    } },
    funded:  { label: "Most funded",   fn: () => (a, b) => percentFunded(b.raised, b.goal) - percentFunded(a.raised, a.goal) },
    raised:  { label: "Most raised",   fn: () => (a, b) => (b.raised > a.raised ? 1 : b.raised < a.raised ? -1 : 0) },
};

// re-render every minute so "time left" and the Active/Ended state stay current
const useNow = (ms = 60000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
};

/**
 * All chain reads live here. Right now they go through the wallet's provider;
 * switching to a public RPC later only means changing this hook.
 */
function useCampaigns() {
    const { chainId, provider } = useWallet();
    const { getFactoryContractReadOnly, getCampaignContractReadOnly } = useContract();
    const [state, setState] = useState({ status: "loading", campaigns: [], failed: 0 });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setState((s) => ({ ...s, status: "loading" }));
            try {
                const factory = getFactoryContractReadOnly();
                if (!factory) {
                    if (!cancelled) setState({ status: "unsupported", campaigns: [], failed: 0 });
                    return;
                }

                const addresses = await factory.getAllCampaigns();
                const rows = await Promise.all(
                    addresses.map(async (address, index) => {
                        try {
                            const c = getCampaignContractReadOnly(address);
                            const [title, description, ipfsHash, goal, raised, deadline, campaigner, donorCount] =
                                await Promise.all([
                                    c.title(), c.description(), c.ipfsHash(), c.goalAmount(),
                                    c.totalDonated(), c.deadline(), c.campaigner(), c.getDonorCount(),
                                ]);
                            return {
                                address, index, title, description, ipfsHash,
                                goal, raised,                       // bigint (wei)
                                deadline: Number(deadline),         // unix seconds
                                campaigner,
                                donorCount: Number(donorCount),
                            };
                        } catch (err) {
                            console.error("Could not load campaign", address, err);
                            return null;
                        }
                    })
                );

                if (cancelled) return;
                const ok = rows.filter(Boolean);
                setState({ status: "ready", campaigns: ok, failed: rows.length - ok.length });
            } catch (err) {
                console.error("Could not load campaigns", err);
                if (!cancelled) setState({ status: "error", campaigns: [], failed: 0 });
            }
        })();

        return () => { cancelled = true; };
        // provider/chainId change whenever the wallet switches network
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainId, provider, reloadKey]);

    return { ...state, reload: () => setReloadKey((k) => k + 1) };
}

const DonorDashboard = () => {
    const navigate = useNavigate();
    const { symbol, network } = useWallet();
    const { status, campaigns, failed, reload } = useCampaigns();
    const now = useNow();

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("newest");

    const counts = useMemo(
        () => Object.fromEntries(FILTERS.map((f) => [f.id, campaigns.filter((c) => f.test(c, now)).length])),
        [campaigns, now]
    );

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const test = FILTERS.find((f) => f.id === filter).test;
        return campaigns
            .filter((c) => test(c, now))
            .filter((c) =>
                !q ||
                c.title.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.campaigner.toLowerCase().includes(q) ||
                c.address.toLowerCase().includes(q)
            )
            .sort(SORTS[sort].fn(now));
    }, [campaigns, query, filter, sort, now]);

    const totals = useMemo(() => ({
        campaigns: campaigns.length,
        active: campaigns.filter((c) => campaignState(c, now) === "active" || campaignState(c, now) === "goal_reached").length,
        donors: campaigns.reduce((s, c) => s + c.donorCount, 0),
        raised: campaigns.reduce((s, c) => s + c.raised, 0n),
    }), [campaigns, now]);

    const clearFilters = () => { setQuery(""); setFilter("all"); };

    let body;
    if (status === "loading") {
        body = (
            <div className="gt-br-grid">
                {Array.from({ length: 6 }, (_, i) => <CampaignCardSkeleton key={i} />)}
            </div>
        );
    } else if (status === "unsupported") {
        body = (
            <div className="gt-br-state">
                <h2>GivTru isn't on this network yet</h2>
                <p>Use the network switcher in the navbar to pick Arbitrum Sepolia or MST.</p>
            </div>
        );
    } else if (status === "error") {
        body = (
            <div className="gt-br-state">
                <h2>Couldn't load campaigns</h2>
                <p>Something went wrong while reading from the blockchain. Check your connection and try again.</p>
                <button className="gt-btn gt-btn-primary" onClick={reload}>Try again</button>
            </div>
        );
    } else if (campaigns.length === 0) {
        body = (
            <div className="gt-br-state">
                <div className="gt-br-state-icon"><IHeart /></div>
                <h2>No campaigns on {network?.name || "this network"} yet</h2>
                <p>Be the first to launch one, or switch networks to see campaigns elsewhere.</p>
                <button className="gt-btn gt-btn-primary" onClick={() => navigate("/register")}>Start a campaign</button>
            </div>
        );
    } else if (visible.length === 0) {
        body = (
            <div className="gt-br-state">
                <div className="gt-br-state-icon"><ISearch /></div>
                <h2>No campaigns match</h2>
                <p>Try a different search term or filter.</p>
                <button className="gt-btn gt-btn-secondary" onClick={clearFilters}>Clear filters</button>
            </div>
        );
    } else {
        body = (
            <div className="gt-br-grid">
                {visible.map((c) => <CampaignCard key={c.address} campaign={c} symbol={symbol} now={now} />)}
            </div>
        );
    }

    const showControls = status === "ready" && campaigns.length > 0;

    return (
        <div className="gt-br">
            <style>{css}</style>
            <div className="gt-br-inner">
                <header className="gt-br-head">
                    <div>
                        <h1 className="gt-br-title">Browse campaigns</h1>
                        <p className="gt-br-sub">Every donation and every withdrawal is recorded on-chain.</p>
                    </div>
                </header>

                {showControls && (
                    <>
                        <div className="gt-br-toolbar">
                            <div className="gt-br-search">
                                <ISearch />
                                <input
                                    type="search"
                                    placeholder="Search by title, description or address"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    aria-label="Search campaigns"
                                />
                                {query && (
                                    <button className="gt-br-clear" onClick={() => setQuery("")} aria-label="Clear search">
                                        <IX />
                                    </button>
                                )}
                            </div>
                            <label className="gt-br-sort">
                                Sort by
                                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                    {Object.entries(SORTS).map(([id, s]) => (
                                        <option key={id} value={id}>{s.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="gt-br-filterbar">
                            <div className="gt-br-chips">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        className={`gt-br-chip${filter === f.id ? " is-on" : ""}`}
                                        onClick={() => setFilter(f.id)}
                                        aria-pressed={filter === f.id}
                                    >
                                        {f.label}<small>{counts[f.id]}</small>
                                    </button>
                                ))}
                            </div>
                            <span className="gt-br-count">
                                Showing {visible.length} of {campaigns.length}
                            </span>
                        </div>
                    </>
                )}

                {status === "ready" && failed > 0 && (
                    <p className="gt-br-warn">
                        {failed} campaign{failed === 1 ? "" : "s"} couldn't be loaded.
                        <button onClick={reload}>Retry</button>
                    </p>
                )}

                {body}

                {showControls && (
                    <section className="gt-br-totals" aria-label="Network totals">
                        <span className="gt-br-totals-label">On {network?.name || "this network"}</span>
                        <div className="gt-br-totals-items">
                            <div className="gt-br-total"><strong>{totals.campaigns}</strong><span>Campaigns</span></div>
                            <div className="gt-br-total"><strong>{totals.active}</strong><span>Active</span></div>
                            <div className="gt-br-total"><strong>{totals.donors}</strong><span>Donors across campaigns</span></div>
                            <div className="gt-br-total"><strong>{formatAmount(totals.raised)} {symbol}</strong><span>Total donated</span></div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default DonorDashboard;