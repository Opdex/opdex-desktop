# OpdexDesktop

Opdex platform UI built using Angular with Electron requiring access to a local Cirrus Blockchain Full Node. 

## Development

Development and production versions require a locally running Cirrus Full Node from Stratis.

### Clone and Install Dependencies

```sh
## Clone 
git clone 

## Navigate to project
cd ../

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

## Cirrus Blockchain Full Node

This project requires running a local Full Node of the Cirrus Blockchain to connect too.

Options of compatible full nodes:

- [Cirrus Core](https://github.com/stratisproject/CirrusCore/releases)
- [Stratis Full Node](https://github.com/stratisproject/StratisFullNode)

### Cirrus Core

Using Cirrus Core it is important to keep up to date with latest versions to ensure the underlying Full Node is up to date. Just install and run in the background.

### Stratis Full Node

To run via a Stratis Full Node, install requirements specified for the project and run the latest release branch.

```sh
## Clone Stratis Full Node
git clone https://github.com/stratisproject/StratisFullNode.git

## Navigate to Cirrus Full Node and switch branch
cd ../path/to/StratisFullNode/src/Stratis.CirrusD

## Run 
## optional --testnet arg
## required for Mac --dbtype=rocksdb arg
dotnet run
```
