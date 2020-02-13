<a href="https://comit.network">
<img src="logo.svg" height="120px">
</a>

---

[COMIT](https://comit.network) is an open protocol facilitating cross-blockchain applications.
For example, with [COMIT](https://comit.network) you can exchange Bitcoin for Ether or any ERC20 token directly with another person.

This repository contains the Javascript software development kit (SDK) that wraps the communication with the [comit-network daemon](https://github.com/comit-network/comit-rs).

If you wish to do an atomic swap on your machine or to integrate COMIT into an application (e.g. a DEX) please take a look at the [Getting Started section](https://comit.network/docs/getting-started/create-comit-app/) of the COMIT documentation.
If you have any questions, feel free to [reach out to the team in our Gitter chat](https://gitter.im/comit-network/community)!

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/comit-network/community)

# COMIT Javascript SDK

The COMIT Javascript SDK enables the integration of the [comit-network daemon](https://github.com/comit-network/comit-rs) into Javascript applications.
You'll find the [latest comit-sdk version on npmjs](https://www.npmjs.com/package/comit-sdk).

Below you find a short introduction into the SDK. For more detailed information please refer to the API-documentation in our documentation.

## Getting started

The fastest way to get started with the SDK is to take a look at examples using the SDK.

Create a project using [create-comit-app](https://github.com/comit-network/create-comit-app) and take a look at the generated `examples` folder! 

## SDK Overview

The SDK enables you to create Javascript applications on top of COMIT.
This can for example be a trustless decentralized exchange (DEX) or a multi-currency wallet. 

The SDK offers functionality to negotiate a trade and to execute the trade after the negotiation is finished.

### Trade Negotiation vs. Execution

The SDK integrates a simple negotiation protocol that serves as a starting point for makers and takers to create and take orders.

It is recommended to take a look at the [`TakerNegotiator`](https://github.com/comit-network/comit-js-sdk/blob/master/src/negotiation/taker_negotiator.ts) and [`MakerNegotiator`](https://github.com/comit-network/comit-js-sdk/blob/master/src/negotiation/maker_negotiator.ts) classes to get started.

The negotiation is currently only integrated into the SDK and does not concern the [comit-network daemon (`cnd`)](https://github.com/comit-network/comit-rs).
`cnd` is only used for executing the trade, i.e. preparing transactions necessary for executing the atomic swap and monitoring the respective ledgers of the swap. 

For the execution you can use the SDK for communicating with `cnd`. 
Take a look at the [`ComitClient`](https://github.com/comit-network/comit-js-sdk/blob/master/src/comitClient.ts) class to get started. 
The [ComitClient](https://github.com/comit-network/comit-js-sdk/blob/master/src/comitClient.ts) enables you to:


1. Initiate a swap with another party.
2. Receive the fund action from `cnd` when available.
3. Send the fund transaction to a [wallet](#wallets).
4. Receive the redeem transaction from `cnd` when available.
5. Send the redeem transaction to a [wallet](#wallets).

(For a refund scenario you would of course be able to receive and send the refund transaction as well.)

### Wallets

The SDK includes two Javascript wallets:

* Bitcoin wallet based on [bcoin](https://github.com/bcoin-org/bcoin)
* Ethereum wallet based on [ethers.js](https://github.com/ethers-io/ethers.js/)

These wallets are used to actually send the transactions necessary for the atomic swap to the respective ledger.
COMIT is designed in a non-custodial way, thus `cnd` never holds your private key at any time.
The wallets integrated in the SDK show how the transaction information received from `cnd` can be sent to the respective ledger.
Note that you can, of course, use different wallets than the above default wallets in your application.
