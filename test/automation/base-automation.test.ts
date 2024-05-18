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

    // Check that the checkUpkeep is false because the maxTime is not met yet
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Increase the time to the time when automation was deployer plus the maxTime
    const timeAtDeploy = await getTimeStamp(
      automationContract.deploymentTransaction()?.blockNumber
    );

    await increaseTimestampBy(timeAtDeploy + Number(maxWait));

    // Check that the checkUpkeep is false
    // Because there is no pending reveals, the check upKeep still false.
    // This is to avoid callings for no reasons
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.false;

    // Increase the pending reveals to one
    await automationContract.setPendingReveals(1);

    // Check that the checkUpkeep is now true
    const result2 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result2.upkeepNeeded).to.be.true;

    // Increase the pending reveals to minPending - 1
    await automationContract.setPendingReveals(minPending - 1n);

    // Check that the checkUpkeep still true
    const result3 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result3.upkeepNeeded).to.be.true;
  });

  it("should require just one pending reveal is no condition is defined", async () => {
    const [deployer] = await ethers.getSigners();
    // None condition
    const minPending = 0n;
    const minWait = 0n;
    const maxWait = 0n;

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Check that the checkUpkeep is false because there is no pending reveal yet
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Increase the pending reveals to one
    await automationContract.setPendingReveals(1);

    // Check that the checkUpkeep is now true
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.true;

    // Increase the pending reveals to 10
    await automationContract.setPendingReveals(10);

    // Check that the checkUpkeep is now true
    const result2 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result2.upkeepNeeded).to.be.true;
  });

  it("should return upkeepNeeded correctly when both minPending and minWait are met", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 100n; // 100 pendings
    const minWait = 30n; // 30 sec
    const maxWait = 0n; // Non max wait

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Check that the checkUpkeep is false because the non of the contions are met yet
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Make the contract to reach the minPending
    await automationContract.setPendingReveals(minPending);

    // Increase the time to the time when automation was deployer plus the minTime
    const timeAtDeploy = await getTimeStamp(
      automationContract.deploymentTransaction()?.blockNumber
    );
    await increaseTimestampBy(timeAtDeploy + Number(minWait));

    // Check that the checkUpkeep is true now since both condtions are met
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.true;
  });

  it("should return upkeepNeeded correctly when minPending is met but minWait is not", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 100n; // 100 pendings
    const minWait = 30n; // 30 sec
    const maxWait = 0n; // Non max wait

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Check that the checkUpkeep is false because the non of the contions are met yet
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Make the contract to reach the minPending
    await automationContract.setPendingReveals(minPending);

    // Check that the checkUpkeep still false because only minPending is met
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.false;
  });

  it("should return upkeepNeeded correctly when minWait is met but minPending is not", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 100n; // 100 pendings
    const minWait = 30n; // 30 sec
    const maxWait = 0n; // Non max wait

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Check that the checkUpkeep is false because the non of the contions are met yet
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Increase the time to the time when automation was deployer plus the minTime
    const timeAtDeploy = await getTimeStamp(
      automationContract.deploymentTransaction()?.blockNumber
    );
    await increaseTimestampBy(timeAtDeploy + Number(minWait));

    // Check that the checkUpkeep still false because only minWait is met
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.false;
  });

  it("should return upkeepNeeded correctly when only minPending is defined", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 100n; // 100 pendings
    const minWait = 0n; // None defined
    const maxWait = 0n; // None defined

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Check that the checkUpkeep is false because the minPending is not met yet
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Increase the time to high time to check
    const timeAtDeploy = await getTimeStamp(
      automationContract.deploymentTransaction()?.blockNumber
    );

    await increaseTimestampBy(timeAtDeploy + 2000);

    // Check that the checkUpkeep still false because the minPending is not met yet
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.false;

    // Increase the minPending
    await automationContract.setPendingReveals(minPending);

    // Check that the checkUpkeep now is true because the minPending is met
    const result2 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result2.upkeepNeeded).to.be.true;

    // Increase the minPending much more to cehck
    await automationContract.setPendingReveals(minPending + 50n);

    // Check that the checkUpkeep still true because the minPending still met
    const result3 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result3.upkeepNeeded).to.be.true;
  });

  it("should return upkeepNeeded correctly when only minPending and maxWait are defined", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 100n; // 100 pendings
    const minWait = 0n; // None defined
    const maxWait = 100n; // 100 seconds

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Check that the checkUpkeep is false because the minPending is not met yet
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Increase the minPending
    await automationContract.setPendingReveals(minPending);

    // The checkUpkeep now is true because the minPending is met without taking care of maxWait
    const result2 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result2.upkeepNeeded).to.be.true;

    // Increase the time using maxWait to check
    const timeAtDeploy = await getTimeStamp(
      automationContract.deploymentTransaction()?.blockNumber
    );

    await increaseTimestampBy(timeAtDeploy + Number(maxWait));

    // Check that the checkUpkeep still true
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.true;
  });

  it("should return upkeepNeeded correctly when only minWait is defined", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 0n; // None defined
    const minWait = 30n; // 30 seconds
    const maxWait = 0n; // None defined

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Check that the checkUpkeep is false because the minWait is not met yet
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Increase the time to the minWait
    const timeAtDeploy = await getTimeStamp(
      automationContract.deploymentTransaction()?.blockNumber
    );
    await increaseTimestampBy(timeAtDeploy + Number(minWait));

    // Check that the checkUpkeep still false.
    // Because there is no pending reveals, the check upKeep still false.
    // This is to avoid callings for no reasons
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.false;

    // Increase the minPending
    await automationContract.setPendingReveals(1);

    // Check that checkUpkeep is now true because has atleast one pending reveal
    const result2 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result2.upkeepNeeded).to.be.true;

    // Increase the minPending to high value just to check
    await automationContract.setPendingReveals(50);

    // Check that checkUpkeep still true
    const result3 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result3.upkeepNeeded).to.be.true;

    // Increase the time to really high time to check
    await increaseTimestampBy(timeAtDeploy + Number(minWait * 5n));

    // Check that the checkUpkeep still true because the minWait still met
    const result4 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result4.upkeepNeeded).to.be.true;
  });

  it("should return upkeepNeeded correctly when only minWait and maxWait are defined", async () => {
    const [deployer] = await ethers.getSigners();
    const minPending = 0n; // None defined
    const minWait = 30n; // 30 seconds
    const maxWait = 100n; // 100 seconds

    const { automationContract } = await deployAutomationBase(
      minPending,
      minWait,
      maxWait,
      deployer
    );

    // Check that the checkUpkeep is false because the minWait is not met yet
    const result0 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result0.upkeepNeeded).to.be.false;

    // Increase the time to the minWait
    const timeAtDeploy = await getTimeStamp(
      automationContract.deploymentTransaction()?.blockNumber
    );
    await increaseTimestampBy(timeAtDeploy + Number(minWait));

    // Check that the checkUpkeep still false.
    // Because there is no pending reveals, the check upKeep still false.
    // This is to avoid callings for no reasons
    const result1 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result1.upkeepNeeded).to.be.false;

    // Increase the minPending
    await automationContract.setPendingReveals(1);

    // Check that checkUpkeep is now true because has atleast one pending reveal
    const result2 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result2.upkeepNeeded).to.be.true;

    // Increase the minPending to high value just to check
    await automationContract.setPendingReveals(50);

    // Check that checkUpkeep still true
    const result3 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result3.upkeepNeeded).to.be.true;

    // Increase the time using maxWait to check
    await increaseTimestampBy(timeAtDeploy + Number(maxWait));

    // Check that the checkUpkeep is stil true
    const result4 = await checkUpKeepCall(automationContract, ethers.provider);
    expect(result4.upkeepNeeded).to.be.true;
  });
});
