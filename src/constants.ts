export enum SupportedChainId {
    ARBITRUM = 42161
}

export type AddressMap = {
    [chainId: number]: string;
};

export const HYPERLIQUID_DEPOSIT_ADDRESS: AddressMap = {
    [SupportedChainId.ARBITRUM]: '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7'
};

export const LIQUIDITY_ROUTER_ADDRESS: AddressMap = {
    [SupportedChainId.ARBITRUM]: '0xA7Ae401c37b786B9bD96Db5D4BDbD2b1df882A90'
};

export const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"

export const MIN_DEPOSIT = 5;

// USDC ABI for transfer function
export const USDC_ABI = [
    {
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function"
    }
];
