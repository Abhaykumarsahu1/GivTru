import { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import CampaignFactoryABI from "../contracts/CampaignFactory.json";
import CampaignABI from "../contracts/Campaign.json";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";
import WalletModal from "../components/WalletModal";

const WalletContext = createContext();

const ARBITRUM_CHAIN_ID = "0x66eee";

export const WalletProvider = ({ children }) => {
    const [account, setAccount]     = useState(null);
    const [provider, setProvider]   = useState(null);
    const [signer, setSigner]       = useState(null);
    const [chainId, setChainId]     = useState(null);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);
    const [isBoardMember, setIsBoardMember] = useState(false);
    const [rawProvider, setRawProvider]     = useState(null); // the wallet the user picked
    const [showModal, setShowModal]         = useState(false);

    const checkBoardMembership = async (account, provider) => {
        try {
            const factory = new ethers.Contract(
                CONTRACT_ADDRESSES.CAMPAIGN_FACTORY,
                CampaignFactoryABI.abi,
                provider
            );
            const allCampaigns = await factory.getAllCampaigns();

            for (const address of allCampaigns) {
                const campaign = new ethers.Contract(address, CampaignABI.abi, provider);
                const isMember = await campaign.isBoardMember(account);
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

    // Listen on the CHOSEN wallet, not window.ethereum
    useEffect(() => {
        if (!rawProvider) return;

        const handleAccountsChanged = async (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                const web3Provider = new ethers.BrowserProvider(rawProvider);
                const web3Signer   = await web3Provider.getSigner();
                setProvider(web3Provider);
                setSigner(web3Signer);
                setAccount(accounts[0]);
                checkBoardMembership(accounts[0], web3Provider);
            }
        };

        const handleChainChanged = async (newChainId) => {
            const web3Provider = new ethers.BrowserProvider(rawProvider);
            const web3Signer   = await web3Provider.getSigner();
            setProvider(web3Provider);
            setSigner(web3Signer);
            setChainId(newChainId);
        };

        rawProvider.on("accountsChanged", handleAccountsChanged);
        rawProvider.on("chainChanged", handleChainChanged);

        return () => {
            rawProvider.removeListener("accountsChanged", handleAccountsChanged);
            rawProvider.removeListener("chainChanged", handleChainChanged);
        };
    }, [rawProvider]);

    const ensureArbitrumSepolia = async (eth) => {
        const current = await eth.request({ method: "eth_chainId" });
        if (current === ARBITRUM_CHAIN_ID) return;

        try {
            await eth.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: ARBITRUM_CHAIN_ID }],
            });
        } catch (err) {
            if (err.code === 4902) {
                await eth.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: ARBITRUM_CHAIN_ID,
                        chainName: "Arbitrum Sepolia",
                        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                        rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
                        blockExplorerUrls: ["https://sepolia.arbiscan.io"],
                    }],
                });
            } else {
                throw err;
            }
        }
    };

    // Called by the Connect button -> just opens the picker
    const connectWallet = () => {
        setError(null);
        setShowModal(true);
    };

    // Called when the user picks a wallet in the modal
    const connectWith = async (wallet) => {
        const eth = wallet.provider;
        try {
            setLoading(true);
            setError(null);

            // Force the account picker (some wallets don't support this, so ignore those errors)
            try {
                await eth.request({
                    method: "wallet_requestPermissions",
                    params: [{ eth_accounts: {} }],
                });
            } catch (err) {
                if (err.code === 4001) throw err; // user rejected, stop
            }

            const accounts = await eth.request({ method: "eth_requestAccounts" });
            if (!accounts || accounts.length === 0) {
                setError("No account selected.");
                return;
            }

            // Switch before building the ethers provider so the network isn't stale
            await ensureArbitrumSepolia(eth);

            const web3Provider = new ethers.BrowserProvider(eth);
            const web3Signer   = await web3Provider.getSigner();
            const network      = await web3Provider.getNetwork();

            setRawProvider(eth);
            setProvider(web3Provider);
            setSigner(web3Signer);
            setAccount(accounts[0]);
            setChainId(network.chainId.toString());
            await checkBoardMembership(accounts[0], web3Provider);
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
            loading,
            error,
            isBoardMember,
            connectWallet,
            disconnectWallet,
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