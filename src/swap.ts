import { BigNumber } from "bignumber.js";
import { BitcoinWallet } from "./bitcoinWallet";
import { Cnd, LedgerAction, SwapDetails } from "./cnd";
import { EthereumWallet } from "./ethereumWallet";
import { Field } from "./siren";
import { sleep, timeoutPromise, TryParams } from "./timeout_promise";

export class Swap {
  constructor(
    private readonly bitcoinWallet: BitcoinWallet,
    private readonly ethereumWallet: EthereumWallet,
    private readonly cnd: Cnd,
    readonly self: string
  ) {}

  public async accept(params: TryParams) {
    return await this.tryExecuteAction("accept", params);
  }

  public async decline(params: TryParams) {
    return await this.tryExecuteAction("decline", params);
  }

  public async deploy(params: TryParams) {
    const result = await this.tryExecuteAction("deploy", params);
    return result
      .mapErr(err => {
        return new Error(`Could not retrieve deploy action: ${err}`);
      })
      .andThen(async res => {
        return await this.doLedgerAction(res.data);
      });
  }

  public async fund(params: TryParams) {
    const result = await this.tryExecuteAction("fund", params);
    return result
      .mapErr(err => {
        return new Error(`Could not retrieve fund action: ${err}`);
      })
      .andThen(async res => {
        return await this.doLedgerAction(res.data);
      });
  }

  public async redeem(params: TryParams) {
    const result = await this.tryExecuteAction("redeem", params);
    return result
      .mapErr(err => {
        return new Error(`Could not retrieve redeem action: ${err}`);
      })
      .andThen(async res => {
        return await this.doLedgerAction(res.data);
      });
  }

  public async refund(params: TryParams) {
    const result = await this.tryExecuteAction("refund", params);
    return result
      .mapErr(err => {
        return new Error(`Could not retrieve refund action: ${err}`);
      })
      .andThen(async res => {
        return await this.doLedgerAction(res.data);
      });
  }

  public async fetchDetails(): Promise<SwapDetails> {
    const response = await this.cnd.fetch<SwapDetails>(this.self);
    return response.data;
  }

  public tryExecuteAction(
    actionName: string,
    { maxTimeoutSecs, tryIntervalSecs }: TryParams
  ) {
    return timeoutPromise(
      maxTimeoutSecs * 1000,
      this.executeAction(actionName, tryIntervalSecs)
    );
  }

  public async doLedgerAction(action: LedgerAction) {
    switch (action.type) {
      case "bitcoin-broadcast-signed-transaction": {
        const { hex, network } = action.payload;

        return await this.bitcoinWallet.broadcastTransaction(hex, network);
      }
      case "bitcoin-send-amount-to-address": {
        const { to, amount, network } = action.payload;
        const sats = parseInt(amount, 10);

        return await this.bitcoinWallet.sendToAddress(to, sats, network);
      }
      case "ethereum-call-contract": {
        const { data, contract_address, gas_limit } = action.payload;

        return await this.ethereumWallet.callContract(
          data,
          contract_address,
          gas_limit
        );
      }
      case "ethereum-deploy-contract": {
        const { amount, data, gas_limit } = action.payload;
        const value = new BigNumber(amount);

        return await this.ethereumWallet.deployContract(data, value, gas_limit);
      }
    }
  }

  private async executeAction(actionName: string, tryIntervalSecs: number) {
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

      return this.cnd.executeAction(action!, (field: Field) =>
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
