import { useEffect, useMemo, useState } from "react";

// Detects every injected wallet in the browser:
//  1. EIP-6963: wallets announce themselves (MetaMask, Phantom, BridgeKey, Rabby, Coinbase, ...)
//  2. Fallback: older wallets that only set window.ethereum (or window.ethereum.providers)
// Returns [{ info: { uuid, name, icon, rdns }, provider }], the same shape as before.

const guessName = (p) => {
    if (p.isBraveWallet) return "Brave Wallet";
    if (p.isRabby) return "Rabby";
    if (p.isCoinbaseWallet) return "Coinbase Wallet";
    if (p.isTrust || p.isTrustWallet) return "Trust Wallet";
    if (p.isPhantom) return "Phantom";
    if (p.isMetaMask) return "MetaMask";
    return "Browser wallet";
};

export function useWalletDiscovery() {
    const [announced, setAnnounced] = useState([]);
    const [legacy, setLegacy] = useState([]);

    useEffect(() => {
        const onAnnounce = (event) => {
            const detail = event.detail;
            if (!detail?.info || !detail?.provider) return;
            setAnnounced((prev) =>
                prev.some((w) => w.info.uuid === detail.info.uuid) ? prev : [...prev, detail]
            );
        };

        window.addEventListener("eip6963:announceProvider", onAnnounce);
        window.dispatchEvent(new Event("eip6963:requestProvider"));

        // give EIP-6963 wallets a moment to announce, then look for legacy-only wallets
        const timer = setTimeout(() => {
            const eth = window.ethereum;
            if (!eth) return;
            const list = Array.isArray(eth.providers) && eth.providers.length ? eth.providers : [eth];
            setLegacy(
                list.map((p, i) => ({
                    info: { uuid: `legacy-${i}`, name: guessName(p), icon: "", rdns: "" },
                    provider: p,
                }))
            );
        }, 400);

        return () => {
            window.removeEventListener("eip6963:announceProvider", onAnnounce);
            clearTimeout(timer);
        };
    }, []);

    return useMemo(() => {
        const providers = new Set(announced.map((w) => w.provider));
        const names = new Set(announced.map((w) => w.info.name.toLowerCase()));
        const extras = legacy.filter(
            (w) => !providers.has(w.provider) && !names.has(w.info.name.toLowerCase())
        );
        return [...announced, ...extras];
    }, [announced, legacy]);
}