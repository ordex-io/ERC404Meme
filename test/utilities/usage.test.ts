import { expect } from "chai";
import { ethers } from "hardhat";
import { deployCreate2Factory, deployWithCreate2 } from "../../utils";

describe("Utilities tests", function () {
    describe("Create2", function () {
        it("should deploy normally a contract", async () => {
            // Deploy the create2 factory
            const create2Factory = await deployCreate2Factory();

            // Deploy a single ERC20 Contract
            const address = await deployWithCreate2(create2Factory, "ERC20Mock");

            const erc20mock = await ethers.getContractAt("ERC20Mock", address);

            // Based on the `ERC20Mock`, the msg.sender should have the initial funds.
            // In this case, the msg.sender is the factory
            expect(await erc20mock.balanceOf(await create2Factory.getAddress()))
                .to.be.equal(await erc20mock.totalSupply());
        });
    })
});