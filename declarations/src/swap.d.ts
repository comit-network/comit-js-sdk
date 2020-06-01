import { AxiosResponse } from "axios";
import { LedgerAction } from "./cnd/action_payload";
import { Cnd } from "./cnd/cnd";
import { SwapDetails } from "./cnd/rfc003_payload";
import { Action } from "./cnd/siren";
import { Transaction } from "./transaction";
import { AllWallets } from "./wallet";
export declare class WalletError extends Error {
    readonly attemptedAction: string;
    readonly source: Error;
    readonly callParams: any;
    constructor(attemptedAction: string, source: Error, callParams: any);
}
/**
 * A stateful class that represents a single swap.
 *
 * It has all the dependencies embedded that are necessary for taking actions on the swap.
 */
export declare class Swap {
    private readonly cnd;
    readonly self: string;
    private readonly wallets;
    constructor(cnd: Cnd, self: string, wallets: AllWallets);
    /**
     * Looks for and executes the accept action of this {@link Swap}.
     * If the {@link Swap} is not in the right state this call will throw a timeout exception.
     *
     * @param tryParams Controls at which stage the exception is thrown.
     * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
     */
    accept(tryParams: TryParams): Promise<void>;
    /**
     * Looks for and executes the decline action of this {@link Swap}.
     * If the {@link Swap} is not in the right state this call will throw a timeout exception.
     *
     * @param tryParams Controls at which stage the exception is thrown.
     * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
     */
    decline(tryParams: TryParams): Promise<void>;
    /**
     * Looks for and executes the deploy action of this {@link Swap}.
     * If the {@link Swap} is not in the right state this call will throw a timeout exception.
     *
     * This is only valid for ERC20 swaps.
     *
     * @param tryParams Controls at which stage the exception is thrown.
     * @returns The hash of the transaction that was sent to the blockchain network.
     * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
     */
    deploy(tryParams: TryParams): Promise<Transaction | string>;
    /**
     * Looks for and executes the fund action of this {@link Swap}.
     * If the {@link Swap} is not in the right state this call will throw a timeout exception.
     *
     * @param tryParams Controls at which stage the exception is thrown.
     * @returns The hash of the transaction that was sent to the blockchain network.
     * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
     */
    fund(tryParams: TryParams): Promise<Transaction | string>;
    /**
     * Looks for and executes the redeem action of this {@link Swap}.
     * If the {@link Swap} is not in the right state this call will throw a timeout exception.
     *
     * @param tryParams Controls at which stage the exception is thrown.
     * @returns The hash of the transaction that was sent to the blockchain network.
     * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
     */
    redeem(tryParams: TryParams): Promise<Transaction | string>;
    /**
     * Looks for and executes the refund action of this {@link Swap}.
     * If the {@link Swap} is not in the right state this call will throw a timeout exception.
     *
     * @param tryParams Controls at which stage the exception is thrown.
     * @returns The result of the refund action, a hash of the transaction that was sent to the blockchain.
     * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
     */
    refund(tryParams: TryParams): Promise<Transaction | string>;
    /**
     * Fetch the details of a swap.
     *
     * @return The details of the swap are returned by cnd REST API.
     * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
     */
    fetchDetails(): Promise<SwapDetails>;
    /**
     * Low level API for executing actions on the {@link Swap}.
     *
     * If you are using any of the above actions ({@link Swap.redeem}, etc) you shouldn't need to use this.
     * This only performs an action on the CND REST API, if an action is needed on another system (e.g blockchain wallet),
     * then the needed information is returned by this function and needs to be processed with {@link doLedgerAction}.
     *
     * @param actionName The name of the Siren action you want to execute.
     * @param tryParams Controls at which stage the exception is thrown.
     * @returns The response from {@link Cnd}. The actual response depends on the action you executed (hence the
     * type parameter).
     * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
     */
    tryExecuteSirenAction<R>(actionName: string, { maxTimeoutSecs, tryIntervalSecs }: TryParams): Promise<AxiosResponse<R>>;
    /**
     * Low level API for executing a ledger action returned from {@link Cnd}.
     *
     * Uses the wallets given in the constructor to send transactions according to the given ledger action.
     *
     * @param ledgerAction The ledger action returned from {@link Cnd}.
     * @throws A {@link WalletError} if a wallet or blockchain action failed.
     */
    doLedgerAction(ledgerAction: LedgerAction): Promise<Transaction | string>;
    /**
     * Get the Alpha deploy transaction.
     *
     * @returns null if cnd hasn't seen a deploy transaction, otherwise, {@link Transaction} if supported or the transaction id as string.
     */
    getAlphaDeployTransaction(): Promise<Transaction | string | null>;
    /**
     * Get the Alpha Fund transaction.
     *
     * @returns null if cnd hasn't seen a funding transaction, otherwise, {@link Transaction} if supported or the transaction id as string.
     */
    getAlphaFundTransaction(): Promise<Transaction | string | null>;
    /**
     * Get the Alpha Redeem transaction.
     *
     * @returns null if cnd hasn't seen a redeem transaction, otherwise, {@link Transaction} if supported or the transaction id as string.
     */
    getAlphaRedeemTransaction(): Promise<Transaction | string | null>;
    /**
     * Get the Alpha Refund transaction.
     *
     * @returns null if cnd hasn't seen a refund transaction, otherwise, {@link Transaction} if supported or the transaction id as string.
     */
    getAlphaRefundTransaction(): Promise<Transaction | string | null>;
    /**
     * Get the Beta deploy transaction.
     *
     * @returns null if cnd hasn't seen a deploy transaction, otherwise, {@link Transaction} if supported or the transaction id as string.
     */
    getBetaDeployTransaction(): Promise<Transaction | string | null>;
    /**
     * Get the Beta Fund transaction.
     *
     * @returns null if cnd hasn't seen a funding transaction, otherwise, {@link Transaction} if supported or the transaction id as string.
     */
    getBetaFundTransaction(): Promise<Transaction | string | null>;
    /**
     * Get the Beta Redeem transaction.
     *
     * @returns null if cnd hasn't seen a redeem transaction, otherwise, {@link Transaction} if supported or the transaction id as string.
     */
    getBetaRedeemTransaction(): Promise<Transaction | string | null>;
    /**
     * Get the Beta Refund transaction.
     *
     * @returns null if cnd hasn't seen a refund transaction, otherwise, {@link Transaction} if supported or the transaction id as string.
     */
    getBetaRefundTransaction(): Promise<Transaction | string | null>;
    executeAction(action: Action): Promise<AxiosResponse>;
    private getTransaction;
    private executeAvailableAction;
    private fieldValueResolver;
}
/**
 * Defines the parameters (for how long and how often) to try executing an action of a {@link Swap}.
 */
export interface TryParams {
    maxTimeoutSecs: number;
    tryIntervalSecs: number;
}
