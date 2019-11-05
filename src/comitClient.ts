import { BitcoinWallet } from "./bitcoinWallet";
import { Cnd, SwapRequest } from "./cnd";
import { EthereumWallet } from "./ethereumWallet";
import { Action, EmbeddedRepresentationSubEntity, Entity } from "./siren";
import { Swap } from "./swap";

export class ComitClient {
  constructor(
    private readonly bitcoinWallet: BitcoinWallet,
    private readonly ethereumWallet: EthereumWallet,
    private readonly cnd: Cnd
  ) {}

  public async sendSwap(swapRequest: SwapRequest): Promise<Swap> {
    const swapLocation = await this.cnd.postSwap(swapRequest);
    if (!swapLocation) {
      throw new Error("Problem creating swap, no swap location returned.");
    }
    const response = await this.cnd.fetch(swapLocation);
    if (!response) {
      throw new Error(
        `Swap with location ${swapLocation} could not be retrieved.`
      );
    }
    return this.newSwap(response.data as Entity);
  }

  public async getNewSwaps(): Promise<Swap[]> {
    const swaps = await this.cnd.getSwaps();
    return swaps
      .filter((swap: EmbeddedRepresentationSubEntity) => {
        return (
          swap.actions &&
          !!swap.actions.find((action: Action) => {
            return action.name === "accept";
          })
        );
      })
      .map(swap => this.newSwap(swap));
  }

  public async getOngoingSwaps(): Promise<Swap[]> {
    const swaps = await this.cnd.getSwaps();

    return swaps
      .filter((swap: EmbeddedRepresentationSubEntity) => {
        return (
          swap.actions &&
          !!swap.actions.find((action: Action) => {
            return action.name === "fund" || action.name === "redeem";
          })
        );
      })
      .map(swap => this.newSwap(swap));
  }

  public async getDoneSwaps(): Promise<Swap[]> {
    const swaps = await this.cnd.getSwaps();
    return swaps
      .filter((swap: EmbeddedRepresentationSubEntity) => {
        return (
          swap.properties &&
          (swap.properties.status === "SWAPPED" ||
            swap.properties.status === "NOT_SWAPPED" ||
            swap.properties.status === "INTERNAL_FAILURE")
        );
      })
      .map(swap => this.newSwap(swap));
  }

  public getPeerId(): Promise<string> {
    return this.cnd.getPeerId();
  }

  public getPeerListenAddresses(): Promise<string[]> {
    return this.cnd.getPeerListenAddresses();
  }

  private newSwap(swap: EmbeddedRepresentationSubEntity | Entity) {
    return new Swap(
      this.bitcoinWallet,
      this.ethereumWallet,
      this.cnd,
      swap.links!.find(link => link.rel.includes("self"))!.href
    );
  }
}
