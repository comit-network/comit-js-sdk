import { AutopilotRpc, ChainRpc, InvoicesRpc, LnRpc, RouterRpc, RpcClientConfig, SignRpc, WalletRpc, WatchtowerRpc, WtClientRpc } from "@radar/lnrpc";
export declare class Lnd {
    config: RpcClientConfig;
    lnrpc: LnRpc;
    autopilotrpc: AutopilotRpc;
    chainrpc: ChainRpc;
    invoicesrpc: InvoicesRpc;
    routerrpc: RouterRpc;
    signrpc: SignRpc;
    walletrpc: WalletRpc;
    watchtowerrpc: WatchtowerRpc;
    wtclientrpc: WtClientRpc;
    /**
     * Initialize gRPC clients for the main server and all sub-servers
     * @param config The RPC client connection configuration
     */
    static init(config: RpcClientConfig): Promise<Lnd>;
    private constructor();
}
