import { Asset } from "../cnd";
import {
  assetOrderToSwap,
  isNative,
  OrderAsset,
  orderSwapAssetMatchesForMaker,
  orderSwapMatchesForMaker
} from "./order";

const ethBtcOrder = {
  tradingPair: "ETH-BTC",
  id: "123",
  validUntil: 123456,
  bid: {
    ledger: "bitcoin",
    asset: "bitcoin",
    amount: "1000000000"
  },
  ask: {
    ledger: "ethereum",
    asset: "ether",
    amount: "5000000000000000000"
  }
};

const erc20BtcOrder = {
  tradingPair: "PAY-BTC",
  id: "123",
  validUntil: 123456,
  bid: {
    ledger: "bitcoin",
    asset: "bitcoin",
    amount: "1000000000"
  },
  ask: {
    ledger: "ethereum",
    asset: "PAY",
    amount: "5000000000000000000"
  }
};

describe("Payload module", () => {
  it("Bitcoin & Ether are native", () => {
    expect(isNative(ethBtcOrder.ask)).toBeTruthy();
    expect(isNative(ethBtcOrder.bid)).toBeTruthy();
  });

  it("ERC20 token is not native", () => {
    expect(isNative(erc20BtcOrder.ask)).toBeFalsy();
  });

  it("Matches Bitcoin order and swap asset for Maker", () => {
    const swapAsset = {
      name: "bitcoin",
      quantity: "1000000000"
    };
    const swapLedger = {
      name: "bitcoin",
      network: "testnet"
    };
    expect(
      orderSwapAssetMatchesForMaker(ethBtcOrder.bid, swapAsset, swapLedger)
    ).toBeTruthy();
  });

  it("Matches Ether order and swap asset for Maker", () => {
    const swapAsset = {
      name: "ether",
      quantity: "5000000000000000000"
    };
    const swapLedger = {
      name: "ethereum",
      chain_id: 3
    };
    expect(
      orderSwapAssetMatchesForMaker(ethBtcOrder.ask, swapAsset, swapLedger)
    ).toBeTruthy();
  });

  it("Matches erc20 order and swap asset for Maker", () => {
    const swapAsset = {
      name: "erc20",
      token_contract: "0xB97048628DB6B661D4C2aA833e95Dbe1A905B280",
      quantity: "5000000000000000000"
    };
    const swapLedger = {
      name: "ethereum",
      chain_id: 3
    };
    expect(
      orderSwapAssetMatchesForMaker(erc20BtcOrder.ask, swapAsset, swapLedger)
    ).toBeTruthy();
  });

  it("Matches an order and a swap for native currencies", () => {
    const swapProps = {
      id: "abc",
      counterparty: "deadbeef",
      role: "Alice" as const,
      protocol: "foo",
      status: "IN_PROGRESS" as const,
      parameters: {
        alpha_asset: {
          name: "ether",
          quantity: "5000000000000000000"
        },
        alpha_ledger: {
          name: "ethereum",
          chain_id: 3
        },
        beta_asset: {
          name: "bitcoin",
          quantity: "1000000000"
        },
        beta_ledger: {
          name: "bitcoin",
          network: "testnet"
        }
      }
    };

    expect(orderSwapMatchesForMaker(ethBtcOrder, swapProps)).toBeTruthy();
  });

  it("Matches an order and a swap for token currencies", () => {
    const swapProps = {
      id: "abc",
      counterparty: "deadbeef",
      role: "Alice" as const,
      protocol: "foo",
      status: "IN_PROGRESS" as const,
      parameters: {
        alpha_asset: {
          name: "erc20",
          token_contract: "0xB97048628DB6B661D4C2aA833e95Dbe1A905B280",
          quantity: "5000000000000000000"
        },
        alpha_ledger: {
          name: "ethereum",
          chain_id: 3
        },
        beta_asset: {
          name: "bitcoin",
          quantity: "1000000000"
        },
        beta_ledger: {
          name: "bitcoin",
          network: "testnet"
        }
      }
    };

    expect(orderSwapMatchesForMaker(erc20BtcOrder, swapProps)).toBeTruthy();
  });

  it("Mismatches an order and a swap due to quantity discrepancy", () => {
    const swapProps = {
      id: "abc",
      counterparty: "deadbeef",
      role: "Alice" as const,
      protocol: "foo",
      status: "IN_PROGRESS" as const,
      parameters: {
        alpha_asset: {
          name: "ether",
          quantity: "500000000000"
        },
        alpha_ledger: {
          name: "ethereum",
          chain_id: 3
        },
        beta_asset: {
          name: "bitcoin",
          quantity: "1000000000"
        },
        beta_ledger: {
          name: "bitcoin",
          network: "testnet"
        }
      }
    };

    expect(orderSwapMatchesForMaker(ethBtcOrder, swapProps)).toBeFalsy();
  });

  it("Builds Bitcoin swap asset from order asset", () => {
    const orderAsset: OrderAsset = {
      ledger: "bitcoin",
      asset: "bitcoin",
      amount: "1000000000"
    };
    const expectedSwapAsset: Asset = {
      name: "bitcoin",
      quantity: "1000000000"
    };
    const actualSwapAsset = assetOrderToSwap(orderAsset);
    expect(actualSwapAsset).toStrictEqual(expectedSwapAsset);
  });

  it("Builds Ether swap asset from order asset", () => {
    const orderAsset: OrderAsset = {
      ledger: "ethereum",
      asset: "ether",
      amount: "42000000000000000000"
    };
    const expectedSwapAsset: Asset = {
      name: "ether",
      quantity: "42000000000000000000"
    };
    const actualSwapAsset = assetOrderToSwap(orderAsset);
    expect(actualSwapAsset).toStrictEqual(expectedSwapAsset);
  });

  it("Builds ERC20 swap asset from order asset", () => {
    const orderAsset: OrderAsset = {
      ledger: "ethereum",
      asset: "PAY",
      amount: "42000000000000000000"
    };
    const expectedSwapAsset: Asset = {
      name: "erc20",
      token_contract: "0xB97048628DB6B661D4C2aA833e95Dbe1A905B280",
      quantity: "42000000000000000000"
    };
    const actualSwapAsset = assetOrderToSwap(orderAsset);
    expect(actualSwapAsset).toStrictEqual(expectedSwapAsset);
  });
});