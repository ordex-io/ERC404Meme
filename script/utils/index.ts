import { PET404 } from "../../typechain-types/artifacts/contracts/PET404/PET404";
import { AutomationNonVRF } from "../../typechain-types/artifacts/contracts/automation/non-vrf/AutomationNonVRF";
import { DNA } from "../../typechain-types/artifacts/contracts/dna/DNA";
import { DiamondMultiInit } from "../../typechain-types/artifacts/contracts/diamond/initialization/DiamondMultiInit";
import { getInitData, readFile, writeFile } from "../../utils";
import { BigNumberish, BytesLike } from "ethers";
import * as path from "path";
import { ethers, network } from "hardhat";
import * as fs from "fs";

const configPath = path.join(__dirname, "../../script/configuration.json");

const deploymentsPath = path.join(__dirname, "../../script/deployments");

export type Configuration = {
  PET404: {
    args: {
      name_: string;
      symbol_: string;
      decimals_: BigNumberish;
      units_: BigNumberish;
      baseUri_: string;
      maxTotalSupplyERC721_: BigNumberish;
      initialMintRecipient_: string;
    };
  };

  AutomationNonVRF: {
    // TODO: Read this by chain id
    args: { automationRegistry_: string };
  };
  DNA: {
    args: {
      schemaHash: BytesLike;
      variantsName: string[];
    };
  };
  DiamondMultiInit: {
    [key: string]: string;
  };
};

export async function getInitializationData(
  pet404: PET404,
  dna: DNA,
  autoNonVrf: AutomationNonVRF,
  multiInit: DiamondMultiInit
) {
  const config = readConfiguration();

  // Initializations calldata
  const pet404Calldata = getInitData(pet404, "__PET404_init", [
    config.PET404.args.name_,
    config.PET404.args.symbol_,
    config.PET404.args.decimals_,
    config.PET404.args.units_,
    config.PET404.args.baseUri_,
    config.PET404.args.maxTotalSupplyERC721_,
    // Get initial receipient from args config, or use the default deployer address
    config.PET404.args.initialMintRecipient_ !== ""
      ? config.PET404.args.initialMintRecipient_
      : (await ethers.getSigners())[0].address,
  ]);

  const dnaCalldata = getInitData(dna, "__DNA_init", [
    config.DNA.args.schemaHash,
    config.DNA.args.variantsName,
  ]);

  const automationCalldata = getInitData(
    autoNonVrf,
    "__AutomationNonVRF_init",
    [config.AutomationNonVRF.args.automationRegistry_]
  );

  const calldataMultiInit = getInitData(multiInit, "multiInit", [
    [
      await pet404.getAddress(),
      await dna.getAddress(),
      await autoNonVrf.getAddress(),
    ], // Targets
    [pet404Calldata, dnaCalldata, automationCalldata], // Initialization calldata
  ]);

  return calldataMultiInit;
}

export async function getChainId() {
  const chainId: string = BigInt(
    await network.provider.send("eth_chainId")
  ).toString();

  if (!chainId) {
    throw new Error("Not chain ID found");
  }

  return chainId;
}

export function saveConfiguration(file_: Configuration) {
  writeFile(configPath, JSON.stringify(file_, null, 2));
}

export function readConfiguration(): Configuration {
  return readFile(configPath);
}

export async function saveDeployment(deployments: any) {
  const chainId = BigInt(await network.provider.send("eth_chainId")).toString();

  const initPath = path.join(deploymentsPath, chainId);

  if (!fs.existsSync(initPath)) {
    fs.mkdirSync(initPath, { recursive: true });
  }
  const pathDeploy = path.join(initPath, `${Date.now()}.json`);
  writeFile(pathDeploy, JSON.stringify(deployments, null, 2));
}

export { deployUniswapPool, deployFullPET404DiamondNonVrf } from "./full";
