import { useEffect, useState } from "react";

export function useWalletDiscovery() {
    const [wallets, setWallets] = useState([]);

    useEffect(() => {
        const onAnnounce = (e) => {
            const { info, provider } = e.detail;
            setWallets((prev) =>
                prev.some((w) => w.info.uuid === info.uuid)
                    ? prev
                    : [...prev, { info, provider }]
            );
        };

        window.addEventListener("eip6963:announceProvider", onAnnounce);
        window.dispatchEvent(new Event("eip6963:requestProvider"));

        // fallback for wallets that don't support EIP-6963 (maybe BridgeKey)
        const t = setTimeout(() => {
            if (window.ethereum) {
                setWallets((prev) =>
                    prev.length
                        ? prev
                        : [{
                            info: { uuid: "injected", name: "Browser Wallet", icon: "" },
                            provider: window.ethereum,
                        }]
                );
            }
        }, 300);

        return () => {
            window.removeEventListener("eip6963:announceProvider", onAnnounce);
            clearTimeout(t);
        };
    }, []);

    return wallets;
}