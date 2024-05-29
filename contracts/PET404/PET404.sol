// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeOwnable} from "@solidstate/contracts/access/ownable/SafeOwnable.sol";
import {ERC721Events} from "ERC404/contracts/lib/ERC721Events.sol";
import {ERC404, ERC404Storage, DNABaseStorage} from "./ERC404/ERC404.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IPET404} from "./IPET404.sol";

contract PET404 is IPET404, ERC404, SafeOwnable {
    error NoAutomationRegister();
    event NftsRevealed(uint256 nftRevealCounter, uint256 time);

    function __PET404_init(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 units_,
        string memory baseUri_,
        uint256 maxTotalSupplyERC721_,
        address initialMintRecipient_
    )
        public
        reinitializer(1) // reinitializer using 1 (1st contract calling his init)
    {
        // The `__ERC404_init` function already have the initializer modifier,
        // so, if the contract is already initialized, then this function will fail.
        __ERC404_init(name_, symbol_, decimals_, units_);
        ERC404Storage.setBaseUri(baseUri_);

        // Do not mint the ERC721s to the initial owner, as it's a waste of gas.
        _setERC721TransferExempt(initialMintRecipient_, true);
        _mintERC20(initialMintRecipient_, maxTotalSupplyERC721_ * units());
    }

    /**
     * @dev Set the Exempt state for an address. Only the owner/admin of the
     * contract can call the set function
     */
    function setERC721TransferExempt(
        address target_,
        bool state_
    ) external onlyOwner {
        _setERC721TransferExempt(target_, state_);
    }

    /// @notice Set the Special Exempt state for the target.
    /// @dev Only the owner/admin can set this special exemptions
    function setSpecialExempt(address target_, bool state_) external onlyOwner {
        _setSpecialExempt(target_, state_);
    }

    function getBaseUri() external view returns (string memory) {
        return ERC404Storage.getBaseUri();
    }

    function setBaseUri(string memory newBaseUri_) external onlyOwner {
        ERC404Storage.setBaseUri(newBaseUri_);
    }

    function tokenURI(
        uint256 id_
    ) public view override returns (string memory) {
        // Check if's a valid and minted id
        _existingId(id_);

        // This will revert if cannot get the DNA (means not revealed)
        DNABaseStorage.getDnaById(id_);

        return string.concat(ERC404Storage.getBaseUri(), Strings.toString(id_));
    }

    function getReadableTokenId(uint256 id_) public pure returns (uint256) {
        if (_isValidTokenId(id_)) {
            return id_ - ID_ENCODING_PREFIX;
        }
        revert InvalidTokenId();
    }

    function _transferERC721(
        address from_,
        address to_,
        uint256 id_
    ) internal override {
        super._transferERC721(from_, to_, id_);

        // If "from" is an address zero, it could means a mint or that ID comes from personal
        // vault. We avoid to override the `counterId` (it's waiting or already revealed).
        if (from_ == address(0) && !DNABaseStorage.hasCounterId(id_)) {
            DNABaseStorage.setCounterForId(id_);
        }
    }

    function _existingId(uint256 id_) internal view {
        // Check if id_ provided is a valid ERC404 id
        if (!_isValidTokenId(id_)) {
            revert InvalidTokenId();
        } else {
            if (id_ - ID_ENCODING_PREFIX > super.erc721TotalSupply()) {
                // If the ID result is greater than the current total ERC721 minted
                // Means that it's not minted yet.
                revert IdNotMinted();
            }
        }
    }
}
