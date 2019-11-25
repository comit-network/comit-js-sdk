import moment = require("moment");
import { ExecutionParams, validateExecutionParams } from "./execution_params";

const defaultExecutionParams = () => {
  return {
    peer: {
      peer_id: "QmWsfYSJ1fzeCWG7N3y2RPQMrWNXtqWPWqKqqKbXQq2MMs",
      address_hint: "/ip4/a.b.c.d/tcp/9939"
    },
    alpha_expiry: moment().unix() + 48 * 60 * 60,
    beta_expiry: moment().unix() + 24 * 60 * 60,
    ledgers: {
      bitcoin: { network: "mainnet" },
      ethereum: { chain_id: 1 }
    }
  };
};

describe("Taker Negotiator", () => {
  it("Validates mainnet execution parameters", () => {
    const executionParams: ExecutionParams = { ...defaultExecutionParams() };

    expect(validateExecutionParams(executionParams)).toBeTruthy();
  });

  it("Validates test execution parameters", () => {
    const executionParams: ExecutionParams = {
      ...defaultExecutionParams(),
      alpha_expiry: moment().unix() + 2 * 60 * 60,
      beta_expiry: moment().unix() + 1 * 60 * 60,
      ledgers: {
        bitcoin: { network: "regtest" },
        ethereum: { chain_id: 3 }
      }
    };

    expect(validateExecutionParams(executionParams)).toBeTruthy();
  });

  it("Invalidates mainnet execution parameters due to expiry", () => {
    const executionParams: ExecutionParams = {
      ...defaultExecutionParams(),
      alpha_expiry: moment().unix() + 2 * 60 * 60,
      beta_expiry: moment().unix() + 1 * 60 * 60
    };

    expect(validateExecutionParams(executionParams)).toBeFalsy();
  });

  it("Invalidates test execution parameters due to expiry", () => {
    const executionParams: ExecutionParams = {
      ...defaultExecutionParams(),
      alpha_expiry: moment().unix() + 1 * 60 * 60,
      beta_expiry: moment().unix() + 3 * 60 * 60,
      ledgers: {
        bitcoin: { network: "regtest" },
        ethereum: { chain_id: 3 }
      }
    };

    expect(validateExecutionParams(executionParams)).toBeFalsy();
  });

  it("Invalidates mixed network execution parameters", () => {
    const executionParams: ExecutionParams = {
      ...defaultExecutionParams(),
      ledgers: {
        bitcoin: { network: "mainnet" },
        ethereum: { chain_id: 3 }
      }
    };

    expect(validateExecutionParams(executionParams)).toBeFalsy();
  });
});
