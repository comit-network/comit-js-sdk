import { BigNumber } from "bignumber.js";
import { TransactionReceipt, TransactionResponse } from "ethers/providers";
import { Arrayish, BigNumber as BigNumberEthers, SigningKey } from "ethers/utils";
import { HDNode } from "ethers/utils/hdnode";
/**
 * Simple Ethereum wallet based on [ethers.js]{@link https://github.com/ethers-io/ethers.js/}.
 */
export declare class EthereumWallet {
    private readonly wallet;
    constructor(jsonRpcUrl: string, key?: SigningKey | HDNode | Arrayish);
    getAccount(): string;
    getBalance(): Promise<BigNumberEthers>;
    getErc20Balance(contractAddress: string, decimals?: number): Promise<BigNumber>;
    deployContract(data: string, amount: BigNumber, gasLimit: string, chainId: number): Promise<string>;
    callContract(data: string, contractAddress: string, gasLimit: string, chainId: number): Promise<string>;
    getTransactionReceipt(transactionId: string): Promise<TransactionReceipt>;
    getTransaction(transactionId: string): Promise<TransactionResponse>;
    private sendTransaction;
    private assertNetwork;
}
