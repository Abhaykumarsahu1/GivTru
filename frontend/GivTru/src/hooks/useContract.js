import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import CampaignFactoryABI from "../contracts/CampaignFactory.json";
import CampaignABI from "../contracts/Campaign.json";

export const useContract = () => {
    const { signer, provider, factoryAddress } = useWallet();

    const getFactoryContract = () => {
        if (!signer || !factoryAddress) return null;
        return new ethers.Contract(factoryAddress, CampaignFactoryABI.abi, signer);
    };

    const getCampaignContract = (address) => {
        if (!signer) return null;
        return new ethers.Contract(address, CampaignABI.abi, signer);
    };

    const getFactoryContractReadOnly = () => {
        if (!provider || !factoryAddress) return null;
        return new ethers.Contract(factoryAddress, CampaignFactoryABI.abi, provider);
    };

    const getCampaignContractReadOnly = (address) => {
        if (!provider) return null;
        return new ethers.Contract(address, CampaignABI.abi, provider);
    };

    return {
        getFactoryContract,
        getCampaignContract,
        getFactoryContractReadOnly,
        getCampaignContractReadOnly,
    };
};