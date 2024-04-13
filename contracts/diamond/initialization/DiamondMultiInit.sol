// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LibInitDiamond} from "../libraries/LibInitDiamond.sol";

contract DiamondMultiInit {
    error AddressAndCalldataLengthDoNotMatch(
        uint256 _addressesLength,
        uint256 _calldataLength
    );

    function multiInit(
        address[] calldata _addresses,
        bytes[] calldata _calldata
    ) external {
        if (_addresses.length != _calldata.length) {
            revert AddressAndCalldataLengthDoNotMatch(
                _addresses.length,
                _calldata.length
            );
        }
        for (uint i; i < _addresses.length; i++) {
            LibInitDiamond.initialize(_addresses[i], _calldata[i]);
        }
    }
}
