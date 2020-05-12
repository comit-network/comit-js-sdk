import { BigNumber } from "bignumber.js";
import { Token } from "../tokens/tokens";
/**
 * The order of a trade as created by the maker through the {@link MakerNegotiator}.
 */
export interface Order {
    id: string;
    validUntil: number;
    bid: OrderAsset;
    ask: OrderAsset;
}
/**
 * Representation of the bid or ask of an {@link Order}.
 */
export interface OrderAsset {
    ledger: string;
    asset: string;
    /**
     * The amount in a human-readable format.
     * Ether for Ethereum (not Wei).
     * Bitcoin for Bitcoin (not Satoshi).
     */
    nominalAmount: string;
}
/**
 * Validates that all fields of an {@link Order} are set correctly.
 * @param order The {@link Order} to be validated.
 * @returns True if all fields of the {@link Order} are set correctl, false otherwise.
 */
export declare function isOrderValid(order: Order): boolean;
/**
 * Convert the bid and ask {@link OrderAsset} to the trading-pair string, e.g. ethereum-ether-bitcoin-bitcoin.
 * @param order
 */
export declare function toTradingPair(order: Order): string;
/**
 * Helper function to check if an asset is native (e.g. ether is on Ethereum but erc20 is not).
 * according to the given asset and ledger string.
 * @param asset
 * @param ledger
 */
export declare function isNative({ asset, ledger }: OrderAsset): boolean;
/**
 * Convert from nominal amount to underlying base unit of an asset, e.g. convert Ether to Wei.
 *
 * @param asset Name of the asset as string (e.g. "ether".
 * @param nominalAmount The nominal amount (e.g. ether amount).
 * @param token Optional parameter for converting ERC20 tokens according to defined {@link Token.decimals}.
 * @returns The base unit amount of the asset (e.g. amount in wei).
 */
export declare function fromNominal(asset: string, nominalAmount: string, token?: Token): BigNumber | undefined;
