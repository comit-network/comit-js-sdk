# Releasing comit-sdk

This document summarizes the steps to release the `comit-js-sdk`.
Replace `X.Y.Z` with the new version.

1. Open changelog and [decide new version number](https://semver.org/) based on changes.
1. Create release branch `git checkout -b release/X.Y.Z`
1. Update the version in `package.json`
1. Update `CHANGELOG.md`, move unreleased changes under the new version and update links at the bottom of the file.
1. Commit the [changes](https://github.com/comit-network/comit-js-sdk/pull/103/files) with message `Release X.Y.Z`
1. Create a Pull Request, wait for checks and approvals,
1. (don't merge the PR, add the tags first; if merged you might have to remove the branch yourself later)
1. Tag the release commit `git tag X.Y.Z`
1. Push the tag `git push --tags`,
1. Go to the `Checks` section in the PR on Github and wait until the release action to npmjs.com was done,
1. Go to https://npmjs.com, search for `comit-sdk` and check if it was released correctly there,
1. Remove the remote branch if you merged before pushing.
