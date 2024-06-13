import { ContractFactory } from "ethers";
import { ethers } from "hardhat";

type InitCode = string;
type ContractAndArgs = {
  factoryContract: ContractFactory;
  args?: any[];
}

export function bytesToAddress(bytes_: string): string {
  return "0x" + bytes_.slice(-40);
}

export async function findCreate2Address(factoryAddress: string, options: InitCode | ContractAndArgs) {
  let initCode = '';
  if (typeof options === 'string') {
    initCode = options;
  } else {
    const {factoryContract, args = []} = options;
    const deployArgs  = factoryContract.interface.encodeDeploy(args);
    initCode = ethers.concat([factoryContract.bytecode, deployArgs]);
  }

  for (let i = 0n; i < ethers.MaxUint256; i++) {
    const salt = ethers.toBeHex(i, 32);
    const create2Address = ethers.getCreate2Address(factoryAddress, salt, ethers.keccak256(initCode));

    if (create2Address.startsWith("0x404")) {
      const code = await ethers.provider.getCode(create2Address)
      if (code == "0x") {
        return {
          salt,
          create2Address
        }
      }
    }

  }

  // If reach this point, address was not found
  throw new Error("Create2 address not found")
}