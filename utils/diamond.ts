import { IERC2535DiamondCutInternal, IPET404 } from "../typechain-types";
import { BaseContract, Signer } from "ethers";

export enum FacetCutAction {
  ADD,
  REPLACE,
  REMOVE,
}

/**
 * Fulfill a FacetCutStruct using the `fromContract_`. Fulfill the struct with
 * the selectors present on `fromContract_` that are not present `skipContract_`.
 *
 * It will skip all the selectors for function names with `_init`
 *
 *
 * @param fromContract_
 * @param diamondSelectors_
 * @param facetCutStruct_
 */
export async function fulfillFacetCut(
  fromContract_: BaseContract,
  skipContracts_: BaseContract[] | null = null,
  action_: FacetCutAction | null = null
) {
  const diamondSelectors: string[] = [];
  if (skipContracts_) {
    skipContracts_.forEach((skipContract_) => {
      skipContract_.interface.forEachFunction((func_) =>
        diamondSelectors.push(func_.selector)
      );
    });
  }

  const facetCut: IERC2535DiamondCutInternal.FacetCutStruct = {
    target: await fromContract_.getAddress(),
    action: action_ == null ? FacetCutAction.ADD : action_,
    selectors: [],
  };

  fromContract_.interface.forEachFunction((ff_) => {
    if (
      !diamondSelectors.includes(ff_.selector) &&
      !ff_.name.includes("_init")
    ) {
      facetCut.selectors.push(ff_.selector);
    }
  });

  return facetCut;
}

export function getInitData(
  contract_: BaseContract,
  name_: string,
  args_: any[]
): string {
  return contract_.interface.encodeFunctionData(name_, args_);
}

export async function setAddressesAsExempt(
  erc404: IPET404,
  owner: Signer,
  addresses: string[]
) {
  for (let i = 0; i < addresses.length; i++) {
    const address_ = addresses[i];

    // Only send meaningful transactions
    const isTransferExempt = await erc404.erc721TransferExempt(address_);

    if (!isTransferExempt) {
      const tx = await erc404
        .connect(owner)
        .setERC721TransferExempt(address_, true);
      await tx.wait();
    }
  }
}
