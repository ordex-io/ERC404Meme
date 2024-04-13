// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AddressUtils} from "@solidstate/contracts/utils/AddressUtils.sol";

library LibInitDiamond {
    using AddressUtils for address;

    error DiamondWritable__InvalidInitializationParameters();
    error DiamondWritable__TargetHasNoCode();

    function initialize(address target, bytes memory data) internal {
        if ((target == address(0)) != (data.length == 0))
            revert DiamondWritable__InvalidInitializationParameters();

        if (target != address(0)) {
            if (target != address(this)) {
                if (!target.isContract())
                    revert DiamondWritable__TargetHasNoCode();
            }

            (bool success, ) = target.delegatecall(data);

            if (!success) {
                assembly {
                    returndatacopy(0, 0, returndatasize())
                    revert(0, returndatasize())
                }
            }
        }
    }
}
