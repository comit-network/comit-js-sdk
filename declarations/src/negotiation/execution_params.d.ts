export interface ExecutionParams {
    peer: {
        peer_id: string;
        address_hint: string;
    };
    alpha_expiry: number;
    beta_expiry: number;
    ledgers?: LedgerParams;
}
export declare function defaultLedgerParams(): LedgerParams;
interface LedgerParams {
    [name: string]: {
        network?: string;
        chain_id?: number;
    };
}
export declare function isValidExecutionParams(executionParams?: ExecutionParams): boolean;
export declare enum NetworkType {
    AllMainnet = "main",
    AllTest = "test",
    Invalid = "invalid"
}
export {};
