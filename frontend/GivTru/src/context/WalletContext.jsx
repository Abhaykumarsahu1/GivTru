import { createContext, useContext, useState, useEffect,useMemo } from "react";
import { ethers } from "ethers";
import CampaignFactoryABI from "../contracts/CampaignFactory.json";
import CampaignABI from "../contracts/Campaign.json";
import { NETWORKS, DEFAULT_CHAIN_ID, getNetwork, toHex } from "../contracts/networks";
import WalletModal from "../components/WalletModal";

const WalletContext = createContext();

// switch the wallet to a supported chain, adding it first if the wallet doesn't know it
const switchChain = async (eth, id) => {
    const net = NETWORKS[id];
    const hexId = toHex(id);
    try {
        await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexId }],
        });
    } catch (err) {
        if (err.code === 4902) {
            await eth.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: hexId,
                    chainName: net.name,
                    nativeCurrency: { name: net.symbol, symbol: net.symbol, decimals: 18 },
                    rpcUrls: [net.rpc],
                    blockExplorerUrls: [net.explorer],
                }],
            });
        } else {
            throw err;
        }
    }
};

export const WalletProvider = ({ children }) => {
    const [account, setAccount]     = useState(null);
    const [provider, setProvider]   = useState(null);
    const [signer, setSigner]       = useState(null);
    const [chainId, setChainId]     = useState(null); // number
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);
    const [isBoardMember, setIsBoardMember] = useState(false);
    const [rawProvider, setRawProvider]     = useState(null);
    const [showModal, setShowModal]         = useState(false);

    // derived from the active chain
    const network        = getNetwork(chainId);
    const factoryAddress = network?.factory || null;
    const symbol         = network?.symbol || "ETH";
    const explorer       = network?.explorer || "";

    const checkBoardMembership = async (acct, prov, factoryAddr) => {
        if (!factoryAddr) { setIsBoardMember(false); return; }
        try {
            const factory = new ethers.Contract(factoryAddr, CampaignFactoryABI.abi, prov);
            const allCampaigns = await factory.getAllCampaigns();

            for (const address of allCampaigns) {
                const campaign = new ethers.Contract(address, CampaignABI.abi, prov);
                const isMember = await campaign.isBoardMember(acct);
                if (isMember) {
                    setIsBoardMember(true);
                    return;
                }
            }
            setIsBoardMember(false);
        } catch (err) {
            console.error("Board check failed:", err);
            setIsBoardMember(false);
        }
    };

    // Listen on the CHOSEN wallet
    useEffect(() => {
        if (!rawProvider) return;

        const handleAccountsChanged = async (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                const web3Provider = new ethers.BrowserProvider(rawProvider);
                const web3Signer   = await web3Provider.getSigner();
                const net          = await web3Provider.getNetwork();
                setProvider(web3Provider);
                setSigner(web3Signer);
                setAccount(accounts[0]);
                checkBoardMembership(accounts[0], web3Provider, getNetwork(net.chainId)?.factory);
            }
        };

        const handleChainChanged = async (newChainId) => {
            const id = Number(newChainId); // works for hex ("0x66eee") and decimal
            const web3Provider = new ethers.BrowserProvider(rawProvider);
            const web3Signer   = await web3Provider.getSigner();
            const addr         = await web3Signer.getAddress();
            setProvider(web3Provider);
            setSigner(web3Signer);
            setChainId(id);
            checkBoardMembership(addr, web3Provider, getNetwork(id)?.factory);
        };

        rawProvider.on("accountsChanged", handleAccountsChanged);
        rawProvider.on("chainChanged", handleChainChanged);

        return () => {
            rawProvider.removeListener("accountsChanged", handleAccountsChanged);
            rawProvider.removeListener("chainChanged", handleChainChanged);
        };
    }, [rawProvider]);

    // Connect button -> opens the picker
    const connectWallet = () => {
        setError(null);
        setShowModal(true);
    };

    // User picked a wallet
    const connectWith = async (wallet) => {
        const eth = wallet.provider;
        try {
            setLoading(true);
            setError(null);

            try {
                await eth.request({
                    method: "wallet_requestPermissions",
                    params: [{ eth_accounts: {} }],
                });
            } catch (err) {
                if (err.code === 4001) throw err;
            }

            const accounts = await eth.request({ method: "eth_requestAccounts" });
            if (!accounts || accounts.length === 0) {
                setError("No account selected.");
                return;
            }

            // keep the wallet's chain if we support it, otherwise move it to the default
            const current = Number(await eth.request({ method: "eth_chainId" }));
            if (!NETWORKS[current]) {
                await switchChain(eth, DEFAULT_CHAIN_ID);
            }

            const web3Provider = new ethers.BrowserProvider(eth);
            const web3Signer   = await web3Provider.getSigner();
            const net          = await web3Provider.getNetwork();
            const id           = Number(net.chainId);

            setRawProvider(eth);
            setProvider(web3Provider);
            setSigner(web3Signer);
            setAccount(accounts[0]);
            setChainId(id);
            await checkBoardMembership(accounts[0], web3Provider, getNetwork(id)?.factory);
        } catch (err) {
            if (err.code === 4001) {
                setError("Connection rejected.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // called by the navbar network dropdown
    const switchNetwork = async (id) => {
        if (!rawProvider) return;
        try {
            setError(null);
            await switchChain(rawProvider, Number(id));
            // the chainChanged listener updates everything else
        } catch (err) {
            setError(err.code === 4001 ? "Network switch rejected." : err.message);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setChainId(null);
        setError(null);
        setIsBoardMember(false);
        setRawProvider(null);
    };

    const shortAddress = (addr) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <WalletContext.Provider value={{
            account,
            provider,
            signer,
            chainId,
            network,
            symbol,
            explorer,
            factoryAddress,
            loading,
            error,
            isBoardMember,
            connectWallet,
            disconnectWallet,
            switchNetwork,
            shortAddress,
        }}>
            {children}
            <WalletModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSelect={connectWith}
            />
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);