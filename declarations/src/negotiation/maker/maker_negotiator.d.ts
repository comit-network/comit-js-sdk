import { ComitClient } from "../../comit_client";
import { TryParams } from "../../swap";
import { ExecutionParams } from "../execution_params";
import { Order } from "../order";
/**
 * Handles the negotiation on the maker side of a trade.
 * Bundles functionality to create orders for a maker and make them available for the taker.
 */
export declare class MakerNegotiator {
    private ordersByTradingPair;
    private ordersById;
    private readonly executionParams;
    private readonly comitClient;
    private readonly tryParams;
    private readonly httpService;
    /**
     *
     * @param comitClient The {@link ComitClient} of the taker for swap execution.
     * @param executionParams The {@link ExecutionParams} of the maker for swap execution.
     * @param tryParams The {@link TryParams} of the maker for swap execution.
     */
    constructor(comitClient: ComitClient, executionParams: ExecutionParams, tryParams: TryParams);
    /**
     * Add an Order to the order book.
     * @returns True if the order parameters are valid and were successfully added to the order book, false otherwise.
     * @param order The order to add.
     */
    addOrder(order: Order): boolean;
    /**
     * Get an {@link Order} by trading pair (e.g. ethereum-ether-bitcoin-bitcoin).
     * @param tradingPair A trading pair (e.g. bitcoin-bitcoin-ethereum-erc20).
     * @returns An {@link Order} or undefined if there is no {@link Order} for the given trading pair.
     */
    getOrderByTradingPair(tradingPair: string): Order | undefined;
    /**
     * Get an {@link Order} by {@link Order.id}.
     * @param orderId The {@link Order.id}.
     * @returns An {@link Order} or undefined if there is no {@link Order} for the given id.
     */
    getOrderById(orderId: string): Order | undefined;
    /**
     * Get the {@link ExecutionParams} of the maker.
     * @returns The {@link ExecutionParams} of the maker.
     */
    getExecutionParams(): ExecutionParams;
    /**
     * Take an order by accepting the swap request on the maker side.
     *
     * This function uses the given swapId and order to find a matching {@link Swap} using the {@link ComitClient}.
     * If a matching {@link Swap} can be found {@link Swap#accept} is called.
     *
     * @param swapId The id of a swap.
     * @param order The order corresponding to the swap.
     */
    takeOrder(swapId: string, order: Order): Promise<void>;
    /**
     * @returns The maker's {@link HttpService} URL.
     */
    getUrl(): string | undefined;
    /**
     * Exposes the maker's {@link HttpService} on the given port and hostname.
     * @param port The port where the {@link HttpService} should be exposed.
     * @param hostname Optionally a hostname can be provided as well.
     */
    listen(port: number, hostname?: string): Promise<void>;
    private tryAcceptSwap;
    private acceptSwap;
}
