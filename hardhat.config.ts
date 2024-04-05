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
    externalArtifacts: [
      "./node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json ",
    ],
  },
};

export default config;
