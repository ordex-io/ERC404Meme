// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

library UniswapPoolCheckerStorage {
    struct Layout {
        IUniswapV3Factory uniswapFactory;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.UniswapPoolChecker");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
