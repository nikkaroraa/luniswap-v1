require("@nomiclabs/hardhat-waffle")
const { ethers } = require("hardhat")
const { expect } = require("chai")

const toWei = (value) => ethers.utils.parseEther(value.toString())

const fromWei = (value) =>
    ethers.utils.formatEther(typeof value === "string" ? value : value.toString())

const getBalance = ethers.provider.getBalance

describe("Exchange", () => {
    let owner
    let user
    let exchange

    beforeEach(async () => {
        ;[owner, user] = await ethers.getSigners()

        const Token = await ethers.getContractFactory("Token")
        token = await Token.deploy("Token", "TKN", toWei(1_000_000))
        await token.deployed()

        const Exchange = await ethers.getContractFactory("Exchange")
        exchange = await Exchange.deploy(token.address)
        await exchange.deployed()
    })

    it("is deployed", async () => {
        expect(await exchange.deployed()).to.equal(exchange)
    })

    describe("addLiquidity", async () => {
        it("adds liquidity", async () => {
            await token.approve(exchange.address, toWei(200))
            await exchange.addLiquidity(toWei(200), { value: toWei(100) })

            expect(await getBalance(exchange.address)).to.equal(toWei(100))
            expect(await exchange.getReserve()).to.equal(toWei(200))
        })
    })

    describe("getPrice", async () => {
        it("returns correct prices", async () => {
            await token.approve(exchange.address, toWei(2000))
            await exchange.addLiquidity(toWei(2000), { value: toWei(1000) })

            const tokenReserve = await exchange.getReserve()
            const etherReserve = await getBalance(exchange.address)

            expect(await exchange.getPrice(etherReserve, tokenReserve)).to.eq(500)
            expect(await exchange.getPrice(tokenReserve, etherReserve)).to.eq(2000)
        })
    })

    describe("getTokenAmount", async () => {
        it("returns correct token amount", async () => {
            await token.approve(exchange.address, toWei(2000))
            await exchange.addLiquidity(toWei(2000), { value: toWei(1000) })

            let tokensOut = await exchange.getTokenAmount(toWei(1))
            expect(fromWei(tokensOut)).to.equal("1.978041738678708079")
        })
    })

    describe("getEthAmount", async () => {
        it("returns correct eth amount", async () => {
            await token.approve(exchange.address, toWei(2000))
            await exchange.addLiquidity(toWei(2000), { value: toWei(1000) })

            let ethOut = await exchange.getEthAmount(toWei(2))
            expect(fromWei(ethOut)).to.equal("0.989020869339354039")
        })
    })

    describe("removeLiquidity", async () => {
        beforeEach(async () => {
            await token.approve(exchange.address, toWei(300))
            await exchange.addLiquidity(toWei(200), { value: toWei(100) })
        })

        it("removes some liquidity", async () => {
            const userEtherBalanceBefore = await getBalance(owner.address)
            const userTokenBalanceBefore = await token.balanceOf(owner.address)

            // remove liquidity
            exchange.removeLiquidity(toWei(25))

            expect(await exchange.getReserve()).to.equal(toWei(150))
            expect(await getBalance(exchange.address)).to.equal(toWei(75))

            const userEtherBalanceAfter = await getBalance(owner.address)
            const userTokenBalanceAfter = await token.balanceOf(owner.address)

            expect(fromWei(userEtherBalanceAfter.sub(userEtherBalanceBefore))).to.equal(
                "24.999932429112684595"
            ) // 25 - gas fees

            expect(fromWei(userTokenBalanceAfter.sub(userTokenBalanceBefore))).to.equal("50.0")
        })
    })
})
