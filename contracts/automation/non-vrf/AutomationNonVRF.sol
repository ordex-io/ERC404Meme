// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@solidstate/contracts/security/initializable/Initializable.sol";
import {AutomationBaseStorage} from "../AutomationBaseStorage.sol";
import {AutomationBase} from "../AutomationBase.sol";
import {DNABaseStorage} from "../../dna/DNABaseStorage.sol";
import {IAutomationNonVRF} from "./IAutomationNonVRF.sol";

contract AutomationNonVRF is AutomationBase, IAutomationNonVRF, Initializable {
    function __AutomationNonVRF_init(
        address caller_,
        uint96 minPending_,
        uint128 minWait_,
        uint128 maxWait_
    )
        public
        reinitializer(3) // reinitializer using 3 (3rd contract calling his init)
    {
        __AutomationBase_Init(caller_, minPending_, minWait_, maxWait_);
    }

    function performUpkeep(bytes calldata) external onlyUpKeepCaller {
        uint256[] memory words = new uint256[](1);
        words[0] = uint256(blockhash(block.number - 1));

        // Save the words on DNA storage AND get the counter ID about where are
        // stored on the DNA mapping
        uint256 counterID = DNABaseStorage.saveWords(words);

        // Using 0 as request Id since it's a NON VRF call.
        emit RevealCalled(0, block.number);
        emit NftsRevealed(0, counterID, block.number);
    }
}
