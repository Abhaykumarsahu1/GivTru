import { useWallet } from "../context/WalletContext";

const short = (v) => (v && v.length > 12 ? `${v.slice(0, 6)}...${v.slice(-4)}` : v);

/**
 * Link to a transaction or address on the block explorer.
 *   <TxLink hash={tx.hash} />
 *   <TxLink type="address" hash={campaignAddress} label="View contract" />
 * Pass `explorer` to pin a specific network (toasts do this so the link
 * stays correct even if the user switches chains afterwards).
 */
export default function TxLink({ hash, type = "tx", label, explorer }) {
    const wallet = useWallet();
    const base = (explorer || wallet?.explorer || "").replace(/\/$/, "");
    if (!hash || !base) return null;

    return (
        <a
            className="gt-txlink"
            href={`${base}/${type}/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
        >
            {label || short(hash)} ↗
        </a>
    );
}