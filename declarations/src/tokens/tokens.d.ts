export declare type Type = "ERC20";
export interface Token {
    symbol: string;
    type: Type;
    address: string;
    decimals: number;
}
/**
 * Returns information about an ERC20 token.
 * @returns ERC20 token object.
 * @param symbol - ERC20 ticker symbol.
 */
export declare function getToken(symbol: string): Token | undefined;
