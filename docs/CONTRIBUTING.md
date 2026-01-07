# Regex Radar – Contributing guide

## Creating Issues

Create a new issue [here](https://github.com/regex-regex/regex-radar/issues/new/choose). Choose a template and fill in the issue template, or choose a blank issue if the existing templates are not applicable.

## Creating Pull Requests

It is recommended to discuss the changes as part of an new or existing issue, before submitting a PR.

A new PR can be created [here](https://github.com/regex-radar/regex-radar/pulls). Choose a template and fill in the PR template, or choose a blank PR if the existing templates are not applicable.

## Setting up the development environment

The following tools are required to build and develop this repository:

| Tool                      | Version  |
| ------------------------- | -------- |
| `node`                    | `24.x.x` |
| `npm` (bundled with node) | `11.x.x` |

install the dependencies in the root of the package:

```console
npm ci
```

> Prefer the use of `ci` over `install`, to avoid updating the `package-lock.json` unintentionally.

Each package can have some specific tasks that can be found in the `scripts` key in their respective `package.json`.
Some tasks can be run from the root of repository and will propegate to each relevant package.

To run a task for a specific package or subset of packages either run the command `npm run <command>` from its directory or use the npm [`-w | --workspace`](https://docs.npmjs.com/cli/v7/commands/npm-run-script#filtering-workspaces) flag:

```console
npm run <command> -w packages/server
```

### Linting

Run `eslint` from the root of the repo:

```console
npm run lint
```

To run the linter and correct autofixable problems.

### Formatting

Run `prettier` from the root of the repo:

```console
npm run format
```

To run the formatter.

### Typchecking

The project uses `typescript` and [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) to typecheck the repository.

Run `tsc` from the root of the repo:

```console
npm run tsc
```

### Testing

#### Unit testing

Run `vitest` from the root of the repo:

```console
npm run test
```

## Forked dependencies

### `recheck`

The following packages are forked/redistributed from the [`recheck`](https://github.com/makenowjust-labs/recheck) repository:

- [`recheck`](https://github.com/regex-radar/recheck)
- [`recheck-esm`](https://github.com/regex-radar/recheck-esm)
- [`recheck-scalajs`](https://github.com/regex-radar/recheck-scalajs)
- [`recheck-scalajs-wasm`](https://github.com/regex-radar/recheck-scalajs-wasm)

Published at:

- [`@regex-radar/recheck-esm`](https://www.npmjs.com/package/@regex-radar/recheck-esm)
- [`@regex-radar/recheck-scalajs`](https://www.npmjs.com/package/@regex-radar/recheck-scalajs)
- [`@regex-radar/recheck-scalajs-wasm`](https://www.npmjs.com/package/@regex-radar/recheck-scalajs-wasm)

The motivation and goal of these forks and redistributions are stated in [this issue](https://github.com/regex-radar/regex-radar/issues/20).

### `vscode-languageserver-node`

The following packages are forked/redistributed from the [`vscode-languageserver-node`](https://github.com/microsoft/vscode-languageserver-node) repository:

- [`vscode-languageserver-esm`](github.com/regex-radar/vscode-languageserver-esm)

The motivation and goal of these forks and redistributions are stated in [this issue](https://github.com/regex-radar/regex-radar/issues/21).

## Structure

The project uses a monorepo structure. More information about the architecture can be found in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Distributing

### Versioning

Until `v1.0.0` the versions will be the same across all packages. At that point it will be reconsidered if this is the correct approach. No packages are distributed individually at the current time.

### Releases

See the [VS Code docs](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#prerelease-extensions).

- use semver
- for normal releases use `major.EVEN_NUMBER.patch`
- for pre-releases use `major.ODD_NUMBER.patch`

Also keep the releases up to date on the [releases](https://github.com/regex-radar/regex-radar/releases/) page.

> `0.x.x` releases will be considered the alpha phase.
> Stable releases will start from `1.x.x`.

### Tags

Rely on the GitHub releases feature to create git tags for releases or use [`git tag`](https://git-scm.com/book/en/v2/Git-Basics-Tagging).
