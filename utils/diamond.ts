import { IERC2535DiamondCutInternal } from "../typechain-types";
import { BaseContract } from "ethers";

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
  skipContracts_: BaseContract[] | null = null
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
    action: FacetCutAction.ADD,
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
