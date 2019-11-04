import { BigNumber } from "ethers/utils";
import { Field } from "../types/siren";
import { BitcoinWallet } from "./bitcoinWallet";
import { Cnd, LedgerAction, SwapEntity } from "./cnd";
import { EthereumWallet } from "./ethereumWallet";

export interface ActionParams {
  timeout: number;
  tryInterval: number;
}

export class Swap {
  constructor(
    private readonly bitcoinWallet: BitcoinWallet,
    private readonly ethereumWallet: EthereumWallet,
    private readonly cnd: Cnd,
    readonly self: string
  ) {}

  public async accept(params: ActionParams) {
    return await this.tryExecuteAction("accept", params);
  }

  public async decline(params: ActionParams) {
    return await this.tryExecuteAction("decline", params);
  }

  public async deploy(params: ActionParams) {
    const response = await this.tryExecuteAction("deploy", params);
    return await this.doLedgerAction(response.data);
  }

  public async fund(params: ActionParams) {
    const response = await this.tryExecuteAction("fund", params);
    return await this.doLedgerAction(response.data);
  }

  public async redeem(params: ActionParams) {
    const response = await this.tryExecuteAction("redeem", params);
    return await this.doLedgerAction(response.data);
  }

  public async refund(params: ActionParams) {
    const response = await this.tryExecuteAction("refund", params);
    return await this.doLedgerAction(response.data);
  }

  public async getEntity(): Promise<SwapEntity> {
    const response = await this.cnd.fetch<SwapEntity>(this.self);
    return response.data;
  }

  private tryExecuteAction(
    actionName: string,
    { timeout, tryInterval }: ActionParams
  ) {
    return this.timeoutPromise(
      timeout,
      this.executeAction(actionName, tryInterval)
    );
  }

  private timeoutPromise<T>(ms: number, promise: Promise<T>): Promise<T> {
    const timeout = new Promise<T>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject("Timed out in " + ms + "ms.");
      }, ms);
    });

    return Promise.race([promise, timeout]);
  }

  private async executeAction(actionName: string, repeatInterval: number) {
    while (true) {
      await this.sleep(repeatInterval);

      const swap = await this.getEntity();
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

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  private async doLedgerAction(action: LedgerAction) {
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
}
