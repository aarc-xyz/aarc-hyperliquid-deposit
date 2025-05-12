import {
  FKConfig,
  ThemeName,
  TransactionSuccessData,
  TransactionErrorData,
  SourceConnectorName,
} from "@aarc-xyz/fundkit-web-sdk";
import { HYPERLIQUID_DEPOSIT_ADDRESS, SupportedChainId, USDC_ADDRESS } from "../constants";

export const aarcConfig: FKConfig = {
  appName: "Hyperliquid x Aarc",
  module: {
    exchange: {
      enabled: true,
    },
    onRamp: {
      enabled: true,
      onRampConfig: {},
    },
    bridgeAndSwap: {
      enabled: true,
      fetchOnlyDestinationBalance: false,
      routeType: "Value",
      connectors: [SourceConnectorName.ETHEREUM],
    },
  },
  destination: {
    contract: {
      contractAddress: HYPERLIQUID_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM],
      contractName: "Hyperliquid Deposit",
      contractPayload: "0x", // This will be updated dynamically
      contractGasLimit: "300000", // Standard gas limit, can be adjusted if needed
      contractLogoURI: "https://app.hyperliquid.xyz/coins/HYPE_USDC.svg"
    },
    walletAddress: HYPERLIQUID_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM],
    chainId: 42161, // Arb chain ID
    tokenAddress: USDC_ADDRESS, // USDC on Arb
  },
  appearance: {
    roundness: 42,
    theme: ThemeName.DARK,
  },
  apiKeys: {
    aarcSDK: import.meta.env.VITE_AARC_API_KEY,
  },
  events: {
    onTransactionSuccess: (data: TransactionSuccessData) => {
      console.log("Transaction successful:", data);
    },
    onTransactionError: (data: TransactionErrorData) => {
      console.error("Transaction failed:", data);
    },
    onWidgetClose: () => {
      console.log("Widget closed");
    },
    onWidgetOpen: () => {
      console.log("Widget opened");
    },
  },
  origin: window.location.origin,

}; 