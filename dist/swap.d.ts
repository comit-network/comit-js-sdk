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
    private readonly self;
    constructor(bitcoinWallet: BitcoinWallet, ethereumWallet: EthereumWallet, cnd: Cnd, self: string);
    accept(params: ActionParams): Promise<import("axios").AxiosResponse<any>>;
    decline(params: ActionParams): Promise<import("axios").AxiosResponse<any>>;
    deploy(params: ActionParams): Promise<any>;
    fund(params: ActionParams): Promise<any>;
    redeem(params: ActionParams): Promise<any>;
    refund(params: ActionParams): Promise<any>;
    private tryExecuteAction;
    private timeoutPromise;
    private executeAction;
    private sleep;
    private fieldValueResolver;
    private doLedgerAction;
}
