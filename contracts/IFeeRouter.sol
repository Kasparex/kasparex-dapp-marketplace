// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IFeeRouter {
    function forwardFeeAndRevenue(address payer) external payable;
    function forwardFeeAndRevenueWithRewards(address payer, string calldata transactionType) external payable;
    function forwardFeeAndRevenueWithRewards(address payer, string calldata transactionType, uint256 paymentAmountWei) external payable;
}
