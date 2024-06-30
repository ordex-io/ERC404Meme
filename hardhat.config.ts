import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";

function getAccounts(name_: string) {
  const accounts: string[] = [];

  let key = process.env[`${name_}_PRIVATE_KEY`];
  if (key) accounts.push(key);

  key = process.env[`${name_}_PRIVATE_KEY_2`];
  if (key) accounts.push(key);

  return accounts;
}

const config: HardhatUserConfig = {

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_kEY,
  },
  networks: {
    hardhat: {
      // Only use fork when we define it
      forking: {
        url: process.env.SEPOLIA_RPC_URL ? process.env.SEPOLIA_RPC_URL : "",
        blockNumber: 6086281,
        enabled: process.env.USE_FORK == "true"
      }
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL ? process.env.SEPOLIA_RPC_URL : "",
      accounts: getAccounts("SEPOLIA"),
    },
    base: {
      url: process.env.BASE_RPC_URL ? process.env.BASE_RPC_URL : "",
      accounts: getAccounts("BASE"),
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 21,
    enabled: false,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
          },
          viaIR: true,
        },
      },
      { version: "0.4.18" },
    ],
  },
  typechain: {
    target: "ethers-v6",
    externalArtifacts: [
      "./node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json",
      "./node_modules/@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json",
      "./node_modules/@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json",
      "./node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json",
      "./node_modules/@uniswap/swap-router-contracts/artifacts/contracts/V3SwapRouter.sol/V3SwapRouter.json"
    ],
  },
};

export default config;
