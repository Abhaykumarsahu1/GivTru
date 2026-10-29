export const NETWORKS = {
    421614: {
        chainId: 421614,
        name: "Arbitrum Sepolia",
        symbol: "ETH",
        rpc: "https://sepolia-rollup.arbitrum.io/rpc",
        explorer: "https://sepolia.arbiscan.io",
        factory: "0xe949072287326873587CC7996a56ed2C1e42f460",
    },
    91562037: {
        chainId: 91562037,
        name: "MST Testnet",
        symbol: "tMSTC",
        rpc: "https://testnetrpc.mstblockchain.com",
        explorer: "https://testnet.mstscan.com",
        factory: "0xD7AE608c9E3cEFa533Dc48073DD50C3393ca37DE",
    },
    4646: {
        chainId: 4646,
        name: "MST Mainnet",
        symbol: "MSTC",
        rpc: "https://mariorpc.mstblockchain.com/",
        explorer: "https://mstscan.com",
        factory: "0x1565efF66ed51176901B8a2A227359d31B9A0763",
    },
};

export const DEFAULT_CHAIN_ID = 421614; // chain used if the wallet is on an unsupported network
export const toHex = (id) => "0x" + Number(id).toString(16);
export const getNetwork = (id) => NETWORKS[Number(id)] || null;