// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RandomBaseInternal, VRFCoordinatorV2Interface} from "./RandomBaseInternal.sol";

abstract contract RandomBase is RandomBaseInternal {
    function getKeyHash() public view returns (bytes32) {
        return _getKeyHash();
    }

    function getSubscriptionId() public view returns (uint64) {
        return _getSubscriptionId();
    }

    function getRequestConfirmations() public view returns (uint16) {
        return _getRequestConfirmations();
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return _getCallbackGasLimit();
    }

    function getNumWords() public view returns (uint32) {
        return _getNumWords();
    }

    function getVRFCoordinator()
        public
        view
        returns (VRFCoordinatorV2Interface)
    {
        return _coordinator();
    }
}
