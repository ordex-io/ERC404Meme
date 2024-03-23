import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  gasReporter: {
    currency: "USD",
    gasPrice: 21,
    enabled: true,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
      { version: "0.4.18" },
    ],
  },
};

export default config;
