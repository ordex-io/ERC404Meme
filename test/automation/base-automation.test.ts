import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { deployAutomationRegistryMock, getTimeStamp } from "../../utils";
import { checkUpKeepCall, increaseTimestampBy } from "../utils";

describe.only("AutomationBase", () => {
  async function deployAutomationBase(
    minPending_: bigint,
    minWait_: bigint,
    maxWait_: bigint,
    deployer_: Signer
  ) {
    let automationRegistry = await loadFixture(deployAutomationRegistryMock);
    let automationRegistryAddress = await automationRegistry.getAddress();

    const factory = await ethers.getContractFactory(
      "AutomationBaseImplementer",
      deployer_
    );

    const automationContract = await factory.deploy(
      automationRegistryAddress,
      minPending_,
      minWait_,
      maxWait_
    );

    await automationContract.waitForDeployment();

    return {
      automationContract,
      automationAddress: await automationContract.getAddress(),
      automationRegistry,
      automationRegistryAddress,
      deployArg: {
        caller_: automationRegistryAddress,
        minPending_,
        minWait_,
        maxWait_,
      },
    };
  }
  it("should get the correct caller address", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 1n;
    const minWait = 0n;
    const maxWait = 0n;

    const { automationContract, automationRegistryAddress } =
      await deployAutomationBase(minPending, minWait, maxWait, deployer);

    // Check the current value of the caller address
    expect(await automationContract.getCallerAddress()).to.be.equal(
      automationRegistryAddress
    );
  });

  it("should only allow the owner set a new caller upKeep", async () => {
    const [deployer, alice] = await ethers.getSigners();
    const minPending = 1n;
    const minWait = 0n;
    const maxWait = 0n;

    const { automationContract, automationRegistryAddress } =
      await deployAutomationBase(minPending, minWait, maxWait, deployer);

    // Check the current value of the caller address
    expect(await automationContract.getCallerAddress()).to.be.equal(
      automationRegistryAddress
    );

    // For the implement mock, the owner is set to the address that deployed the contract.
    // Check the owner of the contract is really the deployer.
    expect(await automationContract.owner()).to.be.equal(deployer.address);

    // Alice can't setCallerAddress because is not the owner
    expect(
      automationContract.connect(alice).setCallerAddress(alice.address)
    ).to.be.revertedWithCustomError(automationContract, "NoAutomationRegister");

    // New caller address
    const newCaller = ethers.Wallet.createRandom().address;

    // Now the owner can set a new address
    await automationContract.connect(deployer).setCallerAddress(newCaller);

    // And the caller address should be updated
    expect(await automationContract.getCallerAddress()).to.be.equal(newCaller);
  });

  it("should not allow execute checkUpkeep", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 1n;
    const minWait = 0n;
    const maxWait = 0n;

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Cannot execute checkUpkeep normally
    expect(automationContract.checkUpkeep("0x")).to.be.revertedWithCustomError(
      automationContract,
      "OnlySimulatedBackend"
    );

    // Check that the checkUpkeep can only be called by zero address as view value
    const result = await checkUpKeepCall(automationContract, ethers.provider);

    // The response
    expect(result.upkeepNeeded).to.be.false;
    expect(result.performData).to.be.equal("0x");
  });

  it("should success checkUpkeep if maxWait is reached and other conditions are not met", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 100n; // 100 pendings
    const minWait = 10n; // 10 sec
    const maxWait = 30n; // 30 sec

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Check that the checkUpkeep is false
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Increase the time to the time when automation was deployer plus the maxTime
    const timeAtDeploy = await getTimeStamp(
      automationContract.deploymentTransaction()?.blockNumber
    );

    await increaseTimestampBy(timeAtDeploy + Number(maxWait));

    // Check that the checkUpkeep is false
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.true;
  });
});
