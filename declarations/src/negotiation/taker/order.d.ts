import { BigNumber } from "bignumber.js";
import { Asset } from "../..";
import { Swap } from "../../swap";
import { Order as RawOrder, OrderAsset } from "../order";
export interface MatchingCriteria {
    buy: MatchingCriteriaAsset;
    sell: MatchingCriteriaAsset;
    minRate?: number;
}
export interface MatchingCriteriaAsset {
    ledger: string;
    asset: string;
    minNominalAmount?: string;
    maxNominalAmount?: string;
}
export { Order as TakerOrder };
/**
 * Handles an order for the taker. It has helper functions to facilitate the handler of an
 * order by a taker. This should only be instantiated via {@link getOrder} and should not be constructed from
 * scratch.
 */
declare class Order {
    readonly rawOrder: RawOrder;
    readonly criteria: MatchingCriteria;
    readonly takeOrder: (rawOrder: RawOrder) => Promise<Swap | undefined>;
    /**
     * **Note: This should not be used, `Order` should be created by using {@link getOrder}
     * @param rawOrder - The parameters of the order, as received from the maker.
     * @param criteria - The criteria used to filter/retrieve this order.
     * @param takeOrder - Function passed from the {@link TakerNegotiator} to coordinate calls to `cnd` and the maker to effectively
     * take the order and start the atomic swap execution.
     */
    constructor(rawOrder: RawOrder, criteria: MatchingCriteria, takeOrder: (rawOrder: RawOrder) => Promise<Swap | undefined>);
    /**
     * @description: Return whether an order matches the passed criteria.
     */
    matches(): boolean;
    /**
     * Check that the order is valid and safe. Ensure that all properties are set and that the expiries
     * are safe. It does not check whether the ledgers/assets are correct, this is done with {@link matches}.
     */
    isValid(): boolean;
    /**
     * Initiates the swap execution and tells the maker that we are taking this order.
     * Does nothing if the order is invalid or does not match the passed criteria.
     */
    take(): Promise<Swap | undefined>;
    /**
     * Returned the rate of the order offered by the maker.
     */
    getOfferedRate(): BigNumber;
}
/**
 * This is only exported for test purposes
 * @param criteria
 * @param rawOrder
 */
export declare function rateMatches(criteria: MatchingCriteria, rawOrder: RawOrder): boolean;
export declare function assetOrderToSwap(orderAsset: OrderAsset): Asset | undefined;
export declare function matchingCriteriaToTradingPair(matchingCriteria: MatchingCriteria): string;
