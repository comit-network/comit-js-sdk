import { BitcoinWallet } from "./bitcoin";
import { EthereumWallet } from "./ethereum";
import { LightningWallet } from "./lightning";
export interface AllWallets {
    bitcoin?: BitcoinWallet;
    ethereum?: EthereumWallet;
    lightning?: LightningWallet;
}
export declare class Wallets {
    private readonly wallets;
    constructor(wallets: AllWallets);
    get bitcoin(): BitcoinWallet;
    get ethereum(): EthereumWallet;
    get lightning(): LightningWallet;
    getWalletForLedger<K extends keyof AllWallets>(name: K): AllWallets[K];
}
