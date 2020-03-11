import { AxiosResponse } from "axios";
import { BigNumber } from "bignumber.js";
import { Cnd, LedgerAction, SwapDetails } from "./cnd/cnd";
import { Field } from "./cnd/siren";
import { sleep, timeoutPromise, TryParams } from "./util/timeout_promise";
import { AllWallets, Wallets } from "./wallet";

export class WalletError extends Error {
  constructor(
    public readonly attemptedAction: string,
    public readonly callError: Error,
    public readonly callParams: any
  ) {
    super(callError.message);
  }
}

/**
 * A stateful class that represents a single swap.
 *
 * It has all the dependencies embedded that are necessary for taking actions on the swap.
 */
export class Swap {
  private readonly wallets: Wallets;

  constructor(
    private readonly cnd: Cnd,
    readonly self: string,
    wallets: AllWallets
  ) {
    this.wallets = new Wallets(wallets);
  }

  /**
   * Looks for and executes the accept action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
   * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
   */
  public async accept(tryParams: TryParams): Promise<void> {
    await this.tryExecuteSirenAction<void>("accept", tryParams);
  }

  /**
   * Looks for and executes the decline action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
   * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
   */
  public async decline(tryParams: TryParams): Promise<void> {
    await this.tryExecuteSirenAction<void>("decline", tryParams);
  }

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
  public async deploy(tryParams: TryParams): Promise<string> {
    const response = await this.tryExecuteSirenAction<LedgerAction>(
      "deploy",
      tryParams
    );
    return this.doLedgerAction(response.data);
  }

  /**
   * Looks for and executes the fund action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
   * @returns The hash of the transaction that was sent to the blockchain network.
   * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
   */
  public async fund(tryParams: TryParams): Promise<string> {
    const response = await this.tryExecuteSirenAction<LedgerAction>(
      "fund",
      tryParams
    );
    return this.doLedgerAction(response.data);
  }

  /**
   * Looks for and executes the redeem action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
   * @returns The hash of the transaction that was sent to the blockchain network.
   * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
   */
  public async redeem(tryParams: TryParams): Promise<string> {
    const response = await this.tryExecuteSirenAction<LedgerAction>(
      "redeem",
      tryParams
    );
    return this.doLedgerAction(response.data);
  }

  /**
   * Looks for and executes the refund action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
   * @returns The result of the refund action, a hash of the transaction that was sent to the blockchain.
   * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
   */
  public async refund(tryParams: TryParams): Promise<string> {
    const response = await this.tryExecuteSirenAction<LedgerAction>(
      "refund",
      tryParams
    );
    return this.doLedgerAction(response.data);
  }

  /**
   * Fetch the details of a swap.
   *
   * @return The details of the swap at returned by cnd REST API.
   * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
   */
  public async fetchDetails(): Promise<SwapDetails> {
    const response = await this.cnd.fetch<SwapDetails>(this.self);
    return response.data;
  }

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
  public async tryExecuteSirenAction<R>(
    actionName: string,
    { maxTimeoutSecs, tryIntervalSecs }: TryParams
  ): Promise<AxiosResponse<R>> {
    return timeoutPromise(
      maxTimeoutSecs * 1000,
      this.executeSirenAction(actionName, tryIntervalSecs)
    );
  }

  /**
   * Low level API for executing a ledger action returned from {@link Cnd}.
   *
   * Uses the wallets given in the constructor to send transactions according to the given ledger action.
   *
   * @param ledgerAction The ledger action returned from {@link Cnd}.
   * @throws A {@link WalletError} if a wallet or blockchain action failed.
   */
  public async doLedgerAction(ledgerAction: LedgerAction): Promise<string> {
    switch (ledgerAction.type) {
      case "bitcoin-broadcast-signed-transaction": {
        const { hex, network } = ledgerAction.payload;

        try {
          return this.wallets.bitcoin.broadcastTransaction(hex, network);
        } catch (error) {
          throw new WalletError(ledgerAction.type, error, { hex, network });
        }
      }
      case "bitcoin-send-amount-to-address": {
        const { to, amount, network } = ledgerAction.payload;
        const sats = parseInt(amount, 10);

        try {
          return this.wallets.bitcoin.sendToAddress(to, sats, network);
        } catch (error) {
          throw new WalletError(ledgerAction.type, error, {
            to,
            sats,
            network
          });
        }
      }
      case "ethereum-call-contract": {
        const { data, contract_address, gas_limit } = ledgerAction.payload;

        try {
          return this.wallets.ethereum.callContract(
            data,
            contract_address,
            gas_limit
          );
        } catch (error) {
          throw new WalletError(ledgerAction.type, error, {
            data,
            contract_address,
            gas_limit
          });
        }
      }
      case "ethereum-deploy-contract": {
        const { amount, data, gas_limit } = ledgerAction.payload;
        const value = new BigNumber(amount);

        try {
          return this.wallets.ethereum.deployContract(data, value, gas_limit);
        } catch (error) {
          throw new WalletError(ledgerAction.type, error, {
            data,
            value,
            gas_limit
          });
        }
      }
      case "lnd-send-payment": {
        const {
          self_public_key,
          to_public_key,
          amount,
          secret_hash,
          final_cltv_delta,
          chain,
          network
        } = ledgerAction.payload;

        try {
          await this.wallets.lightning.assertLndDetails(
            self_public_key,
            chain,
            network
          );

          await this.wallets.lightning.sendPayment(
            to_public_key,
            amount,
            secret_hash,
            final_cltv_delta
          );

          return secret_hash;
        } catch (error) {
          throw new WalletError(ledgerAction.type, error, {
            self_public_key,
            to_public_key,
            amount,
            secret_hash,
            final_cltv_delta,
            chain,
            network
          });
        }
      }
      case "lnd-add-hold-invoice": {
        const {
          self_public_key,
          amount,
          secret_hash,
          expiry,
          cltv_expiry,
          chain,
          network
        } = ledgerAction.payload;

        try {
          await this.wallets.lightning.assertLndDetails(
            self_public_key,
            chain,
            network
          );

          return this.wallets.lightning.addHoldInvoice(
            amount,
            secret_hash,
            expiry,
            cltv_expiry
          );
        } catch (error) {
          throw new WalletError(ledgerAction.type, error, {
            self_public_key,
            amount,
            secret_hash,
            expiry,
            cltv_expiry,
            chain,
            network
          });
        }
      }
      case "lnd-settle-invoice": {
        const {
          self_public_key,
          secret,
          chain,
          network
        } = ledgerAction.payload;
        try {
          await this.wallets.lightning.assertLndDetails(
            self_public_key,
            chain,
            network
          );

          await this.wallets.lightning.settleInvoice(secret);

          return secret;
        } catch (error) {
          throw new WalletError(ledgerAction.type, error, {
            self_public_key,
            secret,
            chain,
            network
          });
        }
      }
      default:
        throw new Error(`Cannot handle ${ledgerAction.type}`);
    }
  }

  private async executeSirenAction(
    actionName: string,
    tryIntervalSecs: number
  ): Promise<AxiosResponse> {
    while (true) {
      await sleep(tryIntervalSecs * 1000);

      // This throws if cnd returns an error or there is a network error
      const swap = await this.fetchDetails();
      const actions = swap.actions;

      if (!actions || actions.length === 0) {
        continue;
      }

      const action = actions.find(action => action.name === actionName);

      if (!action) {
        continue;
      }

      // This throws if cnd returns an error or there is a network error
      return this.cnd.executeSirenAction(action!, async (field: Field) => {
        try {
          // Awaiting here allows us to have better context
          return await this.fieldValueResolver(field);
        } catch (error) {
          throw new WalletError(actionName, error, field);
        }
      });
    }
  }

  private async fieldValueResolver(field: Field): Promise<string | undefined> {
    const classes: string[] = field.class;

    if (classes.includes("bitcoin") && classes.includes("address")) {
      return this.wallets.bitcoin.getAddress();
    }

    if (classes.includes("bitcoin") && classes.includes("feePerWU")) {
      return this.wallets.bitcoin.getFee();
    }

    if (classes.includes("ethereum") && classes.includes("address")) {
      return this.wallets.ethereum.getAccount();
    }
  }
}
