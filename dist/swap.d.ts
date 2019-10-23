import { BitcoinWallet } from "./bitcoinWallet";
import { Cnd } from "./cnd";
import { EthereumWallet } from "./ethereumWallet";
export interface ActionParams {
    timeout: number;
    tryInterval: number;
}
export declare class Swap {
    private readonly bitcoinWallet;
    private readonly ethereumWallet;
    private readonly cnd;
    readonly self: string;
    constructor(bitcoinWallet: BitcoinWallet, ethereumWallet: EthereumWallet, cnd: Cnd, self: string);
    accept(params: ActionParams): Promise<import("axios").AxiosResponse<any>>;
    decline(params: ActionParams): Promise<import("axios").AxiosResponse<any>>;
    deploy(params: ActionParams): Promise<string | undefined>;
    fund(params: ActionParams): Promise<string | undefined>;
    redeem(params: ActionParams): Promise<string | undefined>;
    refund(params: ActionParams): Promise<string | undefined>;
    private tryExecuteAction;
    private timeoutPromise;
    private executeAction;
    private sleep;
    private fieldValueResolver;
    private doLedgerAction;
}
