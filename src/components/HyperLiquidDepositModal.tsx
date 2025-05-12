import { useState } from 'react';
import { useAccount, useDisconnect, useReadContract, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { AarcFundKitModal } from '@aarc-xyz/fundkit-web-sdk';
import { HYPERLIQUID_DEPOSIT_ADDRESS, LIQUIDITY_ROUTER_ADDRESS, SupportedChainId, USDC_ADDRESS } from '../constants';
import { Navbar } from './Navbar';
import StyledConnectButton from './StyledConnectButton';

interface DepositWithPermit {
    user: string;
    usd: bigint;
    deadline: bigint;
    signature: {
        r: string;
        s: string;
        v: number;
    };
}

export const HyperLiquidDepositModal = ({ aarcModal }: { aarcModal: AarcFundKitModal }) => {
    const [amount, setAmount] = useState('20');
    const [isProcessing, setIsProcessing] = useState(false);
    const { disconnect } = useDisconnect();
    const { data: walletClient } = useWalletClient();
    const { address } = useAccount();

    const handleDisconnect = () => {
        // Reset all state values
        setAmount('20');
        setIsProcessing(false);

        // Disconnect wallet
        disconnect();

        // Clear any local storage
        localStorage.removeItem('selectedAccount');
    };

    const { data: nonce } = useReadContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: [{
            inputs: [{ name: "owner", type: "address" }],
            name: "nonces",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function"
        }],
        functionName: "nonces",
        args: [address as `0x${string}`]
    });
    b
    const splitSig = (sig: string) => {
        const r = sig.slice(0, 66);
        const s = "0x" + sig.slice(66, 130);
        const v = parseInt(sig.slice(130, 132), 16);
        return { r, s, v };
    };

    const handleDeposit = async () => {
        console.log("address", address);
        console.log("walletClient", walletClient);
        console.log("nonce", nonce);
        if (!address || !walletClient) return;

        try {
            setIsProcessing(true);

            const amountInWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

            console.log("amountInWei", amountInWei);
            console.log("deadline", deadline);
            console.log("nonce", nonce);

            // Create the permit for the bridge contract
            const bridgePermit = {
                owner: address as `0x${string}`,
                spender: HYPERLIQUID_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM] as `0x${string}`, // The bridge needs the permit
                value: amountInWei,
                nonce,
                deadline,
            };

            const domain = {
                name: "USD Coin",
                version: "2",
                chainId: 42161,
                verifyingContract: USDC_ADDRESS as `0x${string}`,
            };

            const permitTypes = {
                Permit: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                ],
            };

            const dataToSign = {
                domain,
                types: permitTypes,
                primaryType: "Permit",
                message: bridgePermit,
            } as const;

            const signature = await walletClient.signTypedData(dataToSign);
            const splitSignature = splitSig(signature);

            console.log("signature", signature);
            console.log("splitSignature", splitSignature);

            // Create the deposit object for Hyperliquid with the exact amount
            const deposit: DepositWithPermit = {
                user: address as `0x${string}`,
                usd: amountInWei, // Exact amount for Hyperliquid
                deadline,
                signature: splitSignature,
            };

            // Generate calldata for batchedDepositWithPermit function
            const hyperLiquidDepositInterface = new ethers.Interface([
                "function batchedDepositWithPermit(tuple(address user, uint64 usd, uint64 deadline, tuple(uint256 r, uint256 s, uint8 v) signature)[] deposits) external",
            ]);

            const contractPayload = hyperLiquidDepositInterface.encodeFunctionData("batchedDepositWithPermit", [[deposit]]);

            // Update Aarc's configuration with the exact amount
            aarcModal.updateRequestedAmount(Number(amount));

            // Update Aarc's destination contract configuration
            aarcModal.updateDestinationContract({
                contractAddress: HYPERLIQUID_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM],
                contractName: "Hyperliquid Deposit",
                contractGasLimit: "800000",
                contractPayload: contractPayload,
            });

            // Open the Aarc modal
            aarcModal.openModal();
            setAmount('');
            setIsProcessing(false);
        } catch (error) {
            console.error("Error preparing deposit:", error);
            setIsProcessing(false);
            aarcModal.close();
        }
    };

    const shouldDisableInteraction = !address;

    return (
        <div className="min-h-screen bg-aarc-bg grid-background">
            <Navbar handleDisconnect={handleDisconnect} />
            <main className="mt-24 gradient-border flex items-center justify-center mx-auto max-w-md shadow-[4px_8px_8px_4px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col items-center w-[440px] bg-[#2D2D2D] rounded-[24px]  p-8 pb-[22px] gap-3">

                    <div className="w-full relative">
                        {!address &&
                            <StyledConnectButton />}
                    </div>

                    {/* Amount Input */}
                    <div className="w-full">
                        <a href="https://app.hyperliquid.xyz/trade" target="_blank" rel="noopener noreferrer" className="block">
                            <h3 className="text-[14px] font-semibold text-[#F6F6F6] mb-4">Deposit in <span className="underline text-[#A5E547]">Hyperliquid</span></h3>
                        </a>
                        <div className="flex items-center p-3 bg-[#2A2A2A] border border-[#424242] rounded-2xl">
                            <div className="flex items-center gap-3">
                                <img src="/usdc-icon.svg" alt="USDC" className="w-6 h-6" />
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="^[0-9]*[.,]?[0-9]*$"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                    className="w-full bg-transparent text-[18px] font-semibold text-[#F6F6F6] outline-none"
                                    placeholder="Enter amount"
                                    disabled={shouldDisableInteraction}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="flex gap-[14px] w-full">
                        {['1', '5', '10', '20'].map((value) => (
                            <button
                                key={value}
                                onClick={() => setAmount(value)}
                                disabled={shouldDisableInteraction}
                                className="flex items-center justify-center px-2 py-2 bg-[rgba(83,83,83,0.2)] border border-[#424242] rounded-lg h-[34px] flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-[14px] font-semibold text-[#F6F6F6]">{value} USDC</span>
                            </button>
                        ))}
                    </div>

                    {/* Warning Message */}
                    <div className="flex gap-x-2 w-full items-start p-4 bg-[rgba(255,183,77,0.05)] border border-[rgba(255,183,77,0.2)] rounded-2xl mt-2">
                        <img src="/info-icon.svg" alt="Info" className="w-4 h-4 mt-[2px]" />
                        <p className="text-xs font-bold text-[#F6F6F6] leading-5">
                            The funds will be deposited in Hyperliquid.
                        </p>
                    </div>

                    {/* Continue Button */}
                    <button
                        onClick={handleDeposit}
                        disabled={isProcessing || shouldDisableInteraction}
                        className="w-full h-11 mt-2 bg-[#A5E547] hover:opacity-90 text-[#003300] font-semibold rounded-2xl border border-[rgba(0,51,0,0.05)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Continue'}
                    </button>

                    {/* Powered by Footer */}
                    <div className="flex flex-col items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-[#F6F6F6]">Powered by</span>
                            <img src="/aarc-logo-small.svg" alt="Aarc" />
                        </div>
                        <p className="text-[10px] text-[#C3C3C3]">
                            By using this service, you agree to Aarc <span className="underline cursor-pointer">terms</span>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HyperLiquidDepositModal;