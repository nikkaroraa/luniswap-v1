// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
    address public tokenAddress;

    constructor(address _token) {
        require(_token != address(0), "invalid token address");
        tokenAddress = _token;
    }

    function addLiquidity(uint256 _tokenAmount) public payable {
        IERC20 token = IERC20(tokenAddress);
        token.transferFrom(msg.sender, address(this), _tokenAmount);
    }

    function getReserve() public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // not ideal, but good to start with
    function getPrice(uint256 inputReserve, uint256 outputReserve)
        public
        pure
        returns (uint256)
    {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        return (inputReserve * 1000) / outputReserve;
    }

    // (x + Δx) * (y − Δy) = x * y
    function getAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) private pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        return (inputAmount * outputReserve) / (inputReserve + inputAmount);
    }

    function getTokenAmount(uint256 _ethSold) public view returns (uint256) {
        require(_ethSold > 0, "ethSold is too small");

        uint256 tokenReserve = getReserve();
        return getAmount(_ethSold, address(this).balance, tokenReserve);
    }

    function getEthAmount(uint256 _tokensSold) public view returns (uint256) {
        require(_tokensSold > 0, "tokenSold is too small");

        uint256 tokenReserve = getReserve();
        return getAmount(_tokensSold, tokenReserve, address(this).balance);
    }

    function ethToTokenSwap(uint256 _minTokens) public payable {
        uint256 tokensBought = getTokenAmount(msg.value);

        require(tokensBought >= _minTokens, "insufficient tokens bought");
        IERC20(tokenAddress).transfer(msg.sender, tokensBought);
    }

    function tokenToEthSwap(uint256 _tokensSold, uint256 _minEth) public {
        uint256 ethBought = getEthAmount(_tokensSold);

        require(ethBought >= _minEth, "insufficient eth output");

        // transfer ethBought
        (bool sent, ) = payable(msg.sender).call{value: ethBought}("");
        require(sent, "Failed to send ether");
    }
}
