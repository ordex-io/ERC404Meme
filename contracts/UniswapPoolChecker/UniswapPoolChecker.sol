// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UniswapPoolCheckerStorage} from "./UniswapPoolCheckerStorage.sol";
import {IUniswapV3PoolImmutables as IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolImmutables.sol";
import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

/// @title UniswapPoolChecker
/// @notice The UniswapPoolChecker facilities and  provide the abilitiy to check if an address is a pool
/// created for the uniswap factory trusted by the contract
/// @dev The contract need a Uniswap Factory to trust
abstract contract UniswapPoolChecker {
    /// @notice Initialize the UniswapPoolChecker contract
    /// @param uniswapFactory_ The Uniswap factory that the contract will trust
    function __UniswapPoolChecker_Init(address uniswapFactory_) internal {
        UniswapPoolCheckerStorage.layout().uniswapFactory = IUniswapV3Factory(
            uniswapFactory_
        );
    }

    /// @notice Use the target address to check if it's an uniswap pool
    /// @param target The address to check
    function isUniswapV3Pool(address target) public view returns (bool) {
        if (target.code.length == 0) {
            return false;
        }

        IUniswapV3Pool poolContract = IUniswapV3Pool(target);

        address token0;
        address token1;
        uint24 fee;

        try poolContract.token0() returns (address _token0) {
            token0 = _token0;
        } catch (bytes memory) {
            return false;
        }

        try poolContract.token1() returns (address _token1) {
            token1 = _token1;
        } catch (bytes memory) {
            return false;
        }

        try poolContract.fee() returns (uint24 _fee) {
            fee = _fee;
        } catch (bytes memory) {
            return false;
        }

        return
            target ==
            UniswapPoolCheckerStorage.layout().uniswapFactory.getPool(
                token0,
                token1,
                fee
            );
    }
}
