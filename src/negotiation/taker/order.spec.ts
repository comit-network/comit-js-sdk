import { Asset } from "../../cnd";
import { OrderAsset } from "../order";
import { assetOrderToSwap, Order, rateMatches, TakerCriteria } from "./order";

const defaultOrderParams = {
  tradingPair: "ETH-BTC",
  id: "1234",
  validUntil: 1234567890,
  bid: {
    ledger: "bitcoin",
    asset: "bitcoin",
    nominalAmount: "1.1"
  },
  ask: {
    ledger: "ethereum",
    asset: "ether",
    nominalAmount: "99"
  }
};

const defaultTakerCriteria = {
  buy: {
    asset: "bitcoin",
    ledger: "bitcoin"
  },
  sell: {
    asset: "ether",
    ledger: "ethereum"
  }
};

describe("negotation.taker.Order", () => {
  it("Builds Bitcoin swap asset from order asset", () => {
    const orderAsset: OrderAsset = {
      ledger: "bitcoin",
      asset: "bitcoin",
      nominalAmount: "10"
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
      nominalAmount: "42"
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
      nominalAmount: "123"
    };
    const expectedSwapAsset: Asset = {
      name: "erc20",
      token_contract: "0xB97048628DB6B661D4C2aA833e95Dbe1A905B280",
      quantity: "123000000000000000000"
    };
    const actualSwapAsset = assetOrderToSwap(orderAsset);
    expect(actualSwapAsset).toStrictEqual(expectedSwapAsset);
  });

  it("matches taker criteria", () => {
    const order = new Order(defaultOrderParams, defaultTakerCriteria, () =>
      Promise.resolve(undefined)
    );

    expect(order.matches()).toBeTruthy();
  });

  it("doesnt match taker criteria due to incorrect asset", () => {
    const orderParams = {
      tradingPair: "ETH-BTC",
      id: "1234",
      validUntil: 1234567890,
      bid: {
        ledger: "bitcoin",
        asset: "bitcoin",
        nominalAmount: "1.1"
      },
      ask: {
        ledger: "ethereum",
        asset: "PAY",
        nominalAmount: "99"
      }
    };

    const order = new Order(orderParams, defaultTakerCriteria, () =>
      Promise.resolve(undefined)
    );

    expect(order.matches()).toBeFalsy();
  });

  it("doesnt match taker criteria if buy order amount is too low", () => {
    const takerCriteria = {
      buy: {
        asset: "bitcoin",
        ledger: "bitcoin",
        minNominalAmount: "2"
      },
      sell: {
        asset: "ether",
        ledger: "ethereum"
      }
    };
    const order = new Order(defaultOrderParams, takerCriteria, () =>
      Promise.resolve(undefined)
    );

    expect(order.matches()).toBeFalsy();
  });

  it("is valid", () => {
    const order = new Order(defaultOrderParams, defaultTakerCriteria, () =>
      Promise.resolve(undefined)
    );

    expect(order.isValid()).toBeTruthy();
  });

  it("doesnt take order if it is not valid", async () => {
    const order = new Order(defaultOrderParams, defaultTakerCriteria, () => {
      throw new Error("Test fail, order should not be taken");
    });

    order.isValid = () => {
      return false;
    };

    await order.take();
  });
});

describe("Rate matching", () => {
  it("Does match if min rate is not set", () => {
    const criteria: TakerCriteria = JSON.parse(
      JSON.stringify(defaultTakerCriteria)
    );

    expect(rateMatches(criteria, defaultOrderParams)).toBeTruthy();
  });

  it("Does match if rate is more than min rate", () => {
    const criteria: TakerCriteria = JSON.parse(
      JSON.stringify(defaultTakerCriteria)
    );
    criteria.minRate = 0.01;
    expect(rateMatches(criteria, defaultOrderParams)).toBeTruthy();
  });

  it("Does not match if rate is less than min rate", () => {
    const criteria: TakerCriteria = JSON.parse(
      JSON.stringify(defaultTakerCriteria)
    );
    criteria.minRate = 0.02;
    expect(rateMatches(criteria, defaultOrderParams)).toBeFalsy();
  });
});
