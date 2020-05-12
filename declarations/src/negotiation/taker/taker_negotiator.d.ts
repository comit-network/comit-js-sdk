import { ComitClient } from "../../comit_client";
import { MatchingCriteria, TakerOrder } from "./order";
/**
 * Handles the negotiation on the taker side of a trade.
 * Bundles functionality to get orders from a maker, take them and initiate the swap execution.
 */
export declare class TakerNegotiator {
    private static newSwapRequest;
    private readonly comitClient;
    private readonly makerClient;
    /**
     * @param comitClient The {@link ComitClient} of the taker for swap execution
     * @param makerUrl The url where the maker provides offers according to the {@link MakerNegotiator}
     */
    constructor(comitClient: ComitClient, makerUrl: string);
    /**
     * Get an order from the maker based on specified criteria. Whatever is returned from the maker is
     * returned here, even if it does not match the criteria or is invalid. Not all criteria are passed to the maker.
     * If it is indeed invalid or mismatching it will not be possible to execute the order, however it gives the
     * opportunity to the lib consumer to know that this maker returns invalid orders and the details of such order.
     * @param criteria - The criteria of the order to be requested from the maker.
     */
    getOrder(criteria: MatchingCriteria): Promise<TakerOrder>;
    private execAndTakeOrder;
}
