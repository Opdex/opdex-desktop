# OpdexDesktop

Opdex platform UI built using Angular with Electron requiring access to a local Cirrus Blockchain Full Node. 

## Development

Development and production versions require a locally running Cirrus Full Node from Stratis.

### Clone and Install Dependencies

```sh
## Clone 
git clone https://github.com/Opdex/opdex-desktop.git

## Navigate to project
cd ./path/to/opdex-desktop

## Install dependencies
npm i
```

### Run

Commands to run locally via development environment. 

```sh
## Browser
## using environment.ts to set Testnet/Mainnet network
npm run start 

## Electron Mainnet
npm run start:electron

## Electron Testnet
npm run start:electron:testnet
```

### Test

Run project tests with the following command:

```sh
npm run test
```

### Pack

Package electron apps for Linux, Windows, and Mac with a single command.

```sh
npm run pack
```

### Publish

Publish for Linux, Windows, and Mac with a single command.

```sh
$GH_TOKEN <token> npm run publish
```

## Requirements

This project requires running a local Full Node of the Cirrus Blockchain using either [Cirrus Core](https://github.com/stratisproject/CirrusCore/releases) or [Stratis Full Node](https://github.com/stratisproject/StratisFullNode).
