// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IUniswapPoolChecker {
    function isUniswapV3Pool(address target) external view returns (bool);
}
