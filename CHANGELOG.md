# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Set all files names to snake_case.
- `Order` interface renamed to `OrderParams`, `Order` is now a class that allows the taker to check it against criteria.
- Replaced `TakerNegotiator.getOrderByTradingPair()` with `TakerNegotiator.getOrder()`

## [0.10.1] - 2020-02-06

### Changed
- Expose `tryExecuteAction` and `doLedgerAction` of the `Swap` class.

## [0.10.0] - 2020-01-31

### Changed
- `Breaking API Change`: No need to initialise a `MakerClient` anymore, `TakerNegotiator`'s constructor directly accept URL to Maker.
- `Breaking API Change`: No need to initialise a `MakerHttpApi`, it will be done as part of `MakerNegotiator` and the `listen()` method is moved to `MakerNegotiator` too.
- `MakerNegotiator.listen()` now accepts an optional hostname.

## Added
- `MakerNegotiator.getUrl()` returns a string to the maker negotiator external API.

## [0.9.1] - 2020-01-21

### Fixed
- `InMemoryBitcoinWallet.getBalance()` correctly returns a `number` instead of a `string`.
- Typing issues related to the abi in `EthereumWallet` are fixed.

## [0.9.0] - 2019-12-17

### Changed
- `Breaking API` of the negotiation protocol: simplified and renamed interfaces. Make getOrder/takeOrder more explicit for the client
- `Breaking API` of the Bitcoin wallet. Made the provided wallet to an in-memory wallet only and extracted an interface so that developers can implement their own wallet.

## [0.8.0] - 2019-12-11

### Changed
- `Breaking API`: Use `BigNumber` from bignumber.js instead of ethers to support floats

### Fixed
- Support float amount for Ether and ERC20 tokens.

## [0.7.2] - 2019-12-05

### Added
- New function `createActor` to setup an actor's `comitClient`, retrieve its `ID` and bundle it with btc/eth wallets.

## [0.7.1] - 2019-11-29

### Changed
- Improve negotiation protocol to allow maker to identify a taken order by swap id.

### Fixed
- Auto-accept introduced with negotiation protocol.

## [0.7.0] - 2019-11-27

### Changed
- Make alpha and beta expiries optional in `SwapRequest`.
- `ExecutionParams.ledgers` is now optional and defaulted to mainnet values. `chain_id` is used for Ethereum meaning that `comit-rs:^0.4.0` is needed.
- Improve `TakerNegotiator` API.
- Change `Order` to have all fields in camelCase.
- Rename `Swap.getEntity()` & `SwapEntity` to `Swap.fetchDetails()` & `SwapDetails` for clarity.
- Improve `TryParams` terminology, use of seconds.
- Use nominal amounts (Bitcoin, Ether instead of Satoshi or Wei) in `Order`.

## [0.6.0] - 2019-11-25

### Fixed
- Return the tx-id instead of the tx-hash for Bitcoin because it is the canonical way of identifying a transaction.

### Added
- An order negotiation protocol over HTTP.

## [0.5.6] - 2019-11-05

### Fixed
- Issue with generated files when publishing.

### Added
- `Swap.getEntity()` to get details of the swap.
- `ComitClient.getPeerId()` to get peer id of cnd.
- `ComitClient.getPeerListenAddresses()` to get addresses on which cnd is listening (comit-p2p protocol).
- `EthereumWallet.getErc20Balance()` to retrieve any ERC20 balance.

### Changed
- Replace Siren types with Expect Swap types to improve interfaces accuracy.

## [0.4.1] - 2019-10-29
### Changed
- Allow creation of Ethereum wallet without HD key. Instead a random HD key is used.
- Make field `self` on class `Swap` public to allow for logging of swap identifiers.

## [0.4.0] - 2019-10-29
### Added
- Facade class `ComitClient` that wraps communication with cnd to create and get swaps.
- Class `Swap` that provides functions to interact with individual swaps, i.e. accept, decline, deploy, fund, redeem and refund.

### Fixed
- Function `postSwap` in class `Cnd` actually returns the URL of the swap.

### Removed
- Method `getSwap` which assumed on class `Cnd` which assumed a certain path structure that should not be publicly exposed.

## [0.3.2] - 2019-10-03
### Changed
- Return swap identifier when sending a swap request.

## [0.3.1] - 2019-09-26
### Changed
- Bitcoin wallet: watch the next 100 receive and change addresses.

## [0.2.0] - 2019-09-25
### Changed
- Bitcoin wallet: now initialised using a HD key.
- Ethereum wallet: now initialised using a HD key.

## [0.1.2] - 2019-09-25
### Added
- Function to get listen addresses from cnd.

## [0.1.1] - 2019-09-20
### Added
- Common code that can be used to build applications on top of COMIT.

[Unreleased]: https://github.com/comit-network/comit-js-sdk/compare/0.10.1...HEAD
[0.10.1]: https://github.com/comit-network/comit-js-sdk/compare/0.10.0...0.10.1
[0.10.0]: https://github.com/comit-network/comit-js-sdk/compare/0.9.1...0.10.0
[0.9.1]: https://github.com/comit-network/comit-js-sdk/compare/0.8.0...0.9.1
[0.9.0]: https://github.com/comit-network/comit-js-sdk/compare/0.8.0...0.9.0
[0.8.0]: https://github.com/comit-network/comit-js-sdk/compare/0.7.2...0.8.0
[0.7.2]: https://github.com/comit-network/comit-js-sdk/compare/0.7.1...0.7.2
[0.7.1]: https://github.com/comit-network/comit-js-sdk/compare/0.7.0...0.7.1
[0.7.0]: https://github.com/comit-network/comit-js-sdk/compare/0.6.0...0.7.0
[0.6.0]: https://github.com/comit-network/comit-js-sdk/compare/0.5.6...0.6.0
[0.5.6]: https://github.com/comit-network/comit-js-sdk/compare/0.4.1...0.5.6
[0.4.1]: https://github.com/comit-network/comit-js-sdk/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/comit-network/comit-js-sdk/compare/0.3.2...0.4.0
[0.3.2]: https://github.com/comit-network/comit-js-sdk/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/comit-network/comit-js-sdk/compare/0.2.0...0.3.1
[0.2.0]: https://github.com/comit-network/comit-js-sdk/compare/0.1.2...0.2.0
[0.1.2]: https://github.com/comit-network/comit-js-sdk/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/comit-network/comit-js-sdk/compare/7ab82552ccf7fe99ba2197153267061e83bb7ad3...0.1.1
