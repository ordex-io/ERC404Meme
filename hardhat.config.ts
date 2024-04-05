import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  gasReporter: {
    currency: "USD",
    gasPrice: 21,
    enabled: false,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
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
    ],
  },
};

export default config;
