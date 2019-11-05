# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- Generate dist files before publishing.

## [0.5.2] - 2019-11-05
### Fixed
- Able to install comit-sdk from npm package.

## [0.5.1] - 2019-11-04
### Fixed
- `postinstall` task.

## [0.5.0] - 2019-11-04
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

[Unreleased]: https://github.com/comit-network/comit-js-sdk/compare/0.5.2...HEAD
[0.5.1]: https://github.com/comit-network/comit-js-sdk/compare/0.5.1...0.5.2
[0.5.1]: https://github.com/comit-network/comit-js-sdk/compare/0.5.0...0.5.1
[0.5.0]: https://github.com/comit-network/comit-js-sdk/compare/0.4.1...0.5.0
[0.4.1]: https://github.com/comit-network/comit-js-sdk/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/comit-network/comit-js-sdk/compare/0.3.2...0.4.0
[0.3.2]: https://github.com/comit-network/comit-js-sdk/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/comit-network/comit-js-sdk/compare/0.2.0...0.3.1
[0.2.0]: https://github.com/comit-network/comit-js-sdk/compare/0.1.2...0.2.0
[0.1.2]: https://github.com/comit-network/comit-js-sdk/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/comit-network/comit-js-sdk/compare/7ab82552ccf7fe99ba2197153267061e83bb7ad3...0.1.1
