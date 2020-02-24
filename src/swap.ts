import { AxiosResponse } from "axios";
import { BigNumber } from "bignumber.js";
import { BitcoinWallet } from "./bitcoin_wallet";
import { Cnd, LedgerAction, SwapDetails } from "./cnd/cnd";
import { Field } from "./cnd/siren";
import { EthereumWallet } from "./ethereum_wallet";
import { sleep, timeoutPromise, TryParams } from "./util/timeout_promise";

/**
 * A statefull class that represents a single swap.
 *
 * It has all the dependencies embedded that are necessary for taking actions on the swap.
 */
export class Swap {
  constructor(
    private readonly bitcoinWallet: BitcoinWallet,
    private readonly ethereumWallet: EthereumWallet,
    private readonly cnd: Cnd,
    readonly self: string
  ) {}

  /**
   * Looks for and executes the accept action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
   */
  public async accept(tryParams: TryParams): Promise<void> {
    await this.tryExecuteSirenAction<void>("accept", tryParams);
  }

  /**
   * Looks for and executes the decline action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
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
   */
  public async deploy(tryParams: TryParams): Promise<string> {
    const response = await this.tryExecuteSirenAction<LedgerAction>(
      "deploy",
      tryParams
    );
    return await this.doLedgerAction(response.data);
  }

  /**
   * Looks for and executes the fund action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
   * @returns The hash of the transaction that was sent to the blockchain network.
   */
  public async fund(tryParams: TryParams): Promise<string> {
    const response = await this.tryExecuteSirenAction<LedgerAction>(
      "fund",
      tryParams
    );
    return await this.doLedgerAction(response.data);
  }

  /**
   * Looks for and executes the redeem action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
   * @returns The hash of the transaction that was sent to the blockchain network.
   */
  public async redeem(tryParams: TryParams): Promise<string> {
    const response = await this.tryExecuteSirenAction<LedgerAction>(
      "redeem",
      tryParams
    );
    return await this.doLedgerAction(response.data);
  }

  /**
   * Looks for and executes the refund action of this {@link Swap}.
   * If the {@link Swap} is not in the right state this call will throw a timeout exception.
   *
   * @param tryParams Controls at which stage the exception is thrown.
   * @returns The hash of the transaction that was sent to the blockchain network.
   */
  public async refund(tryParams: TryParams): Promise<string> {
    const response = await this.tryExecuteSirenAction<LedgerAction>(
      "refund",
      tryParams
    );
    return await this.doLedgerAction(response.data);
  }

  public async fetchDetails(): Promise<SwapDetails> {
    const response = await this.cnd.fetch<SwapDetails>(this.self);
    return response.data;
  }

  /**
   * Low level API for executing actions on the {@link Swap}.
   *
   * If you are using any of the above actions ({@link Swap.redeem}, etc) you shouldn't need to use this.
   *
   * @param actionName The name of the Siren action you want to execute.
   * @param tryParams Controls at which stage the exception is thrown.
   * @returns The response from {@link Cnd}. The actual response depends on the action you executed (hence the type parameter).
   */
  public tryExecuteSirenAction<R>(
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
   */
  public async doLedgerAction(ledgerAction: LedgerAction): Promise<string> {
    switch (ledgerAction.type) {
      case "bitcoin-broadcast-signed-transaction": {
        const { hex, network } = ledgerAction.payload;

        return await this.bitcoinWallet.broadcastTransaction(hex, network);
      }
      case "bitcoin-send-amount-to-address": {
        const { to, amount, network } = ledgerAction.payload;
        const sats = parseInt(amount, 10);

        return await this.bitcoinWallet.sendToAddress(to, sats, network);
      }
      case "ethereum-call-contract": {
        const { data, contract_address, gas_limit } = ledgerAction.payload;

        return await this.ethereumWallet.callContract(
          data,
          contract_address,
          gas_limit
        );
      }
      case "ethereum-deploy-contract": {
        const { amount, data, gas_limit } = ledgerAction.payload;
        const value = new BigNumber(amount);

        return await this.ethereumWallet.deployContract(data, value, gas_limit);
      }

      default:
        throw new Error(`Cannot handle ${ledgerAction.type}`);
    }
  }

  private async executeSirenAction(
    actionName: string,
    tryIntervalSecs: number
  ) {
    while (true) {
      await sleep(tryIntervalSecs * 1000);

      const swap = await this.fetchDetails();
      const actions = swap.actions;

      if (!actions || actions.length === 0) {
        continue;
      }

      const action = actions.find(action => action.name === actionName);

      if (!action) {
        continue;
      }

      return this.cnd.executeSirenAction(action!, (field: Field) =>
        this.fieldValueResolver(field)
      );
    }
  }

  private async fieldValueResolver(field: Field): Promise<string | undefined> {
    const classes: string[] = field.class;

    if (classes.includes("bitcoin") && classes.includes("address")) {
      return this.bitcoinWallet.getAddress();
    }

    if (classes.includes("bitcoin") && classes.includes("feePerWU")) {
      return Promise.resolve(this.bitcoinWallet.getFee());
    }

    if (classes.includes("ethereum") && classes.includes("address")) {
      return Promise.resolve(this.ethereumWallet.getAccount());
    }
  }
}
