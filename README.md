# Comit Javascript SDK

A software development kit for developing Javascript applications on top of the COMIT protocol reference implementation [comit-rs](https://github.com/comit-network/comit-rs).

Currently [comit-rs](https://github.com/comit-network/comit-rs) is shipped as a binary called [cnd](https://github.com/comit-network/comit-rs/releases) (Comit Node Daemon).

## Getting started

The fastest way to get started with the SDK is to take a look at examples using the SDK.

Create a project using [create-comit-app](https://github.com/comit-network/create-comit-app) and take a look at the generated `examples` folder! 

## SDK Overview

### Communication with cnd

The SDK exports the `ComitClient` class which is a first starting point for the communication with cnd. The `ComitClient` allows you to:

* `sendSwaps`: when the taker initiates a swap with the maker (after successful negotiation)
* get new swaps: when the maker has received a swap from the taker
* get ongoing swaps: for both maker and taker during the execution of the swap (fund, redeem)
* get done swaps: for both maker and taker to retrieve swaps that are finished

Additionally the SDK exports more fine-grained functionality to communicate with cnd, take at the classes in `cnd.ts` for details. 

### Wallets

The SDK includes two Javascript wallets:

* Bitcoin wallet based on [bcoin](https://github.com/bcoin-org/bcoin)
* Ethereum wallet based on [ethers.js](https://github.com/ethers-io/ethers.js/)

When starting an environment using the `start-env` command of [create-comit-app](https://github.com/comit-network/create-comit-app) an `.env` file is created that is read by an application using the SDK. 
The wallets are used to request balances and sending transactions.
