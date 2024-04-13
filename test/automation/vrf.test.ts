import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployAutomationRegistryMock,
  deployVRFCoordinartorV2Mock,
  getEventArgs,
} from "../utils";
import { ethers } from "hardhat";

import {
  RevealCalledEvent,
  NftsRevealedEvent,
} from "../../typechain-types/artifacts/contracts/automation/IAutomationBase";
import { VRFParamsStruct } from "../../typechain-types/artifacts/contracts/automation/vrf/AutomationVRF";
import { SubscriptionCreatedEvent } from "../../typechain-types/artifacts/contracts/test/mocks/VRFCoordinatorV2Mock.sol/CoordinatorV2Mock";

describe("Automation - VRF", () => {
  async function deployAutoVRFMock() {
    const automationRegistry = await loadFixture(deployAutomationRegistryMock);
    // CoordinatorV2 Mock from Chainlink
    const coordinatorv2 = await loadFixture(deployVRFCoordinartorV2Mock);

    const coordinatorv2Address = await coordinatorv2.getAddress();
    const automationRegistryAddress = await automationRegistry.getAddress();

    // Create the subscription on the VRF coordinator
    const txCreateSubs = await coordinatorv2.createSubscription();
    const subscriptionCreatedEvent = (await getEventArgs(
      txCreateSubs,
      "SubscriptionCreated",
      coordinatorv2
    )) as SubscriptionCreatedEvent.OutputObject;

    const keyHash =
      "0xff8dedfbfa60af186cf3c830acbc32c05aae823045ae5ea7da1e45fbfaba4f92"; // Arbitrary Keyhash
    const subscriptionId = subscriptionCreatedEvent.subId; // SubID created
    const requestConfirmations = 0n;
    const callbackGasLimit = 10000000n; // 10M of gas for the limit on call back
    const numWords = 5n; // 5 random words

    const vrfArguments: VRFParamsStruct = {
      vrfCoordinator: coordinatorv2Address,
      keyHash,
      subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords,
    };

    const factory = await ethers.getContractFactory("AutomationVRFMock");
    const contract = await factory.deploy(
      automationRegistryAddress,
      vrfArguments
    );
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();

    // Add contract as consumer insto the VRFCoordinator
    await coordinatorv2.addConsumer(
      vrfArguments.subscriptionId,
      contractAddress
    );

    // Fund the subsciption with a lot of funds
    await coordinatorv2.fundSubscription(
      vrfArguments.subscriptionId,
      1000n * 10n ** 18n // 1000 ethers / 1000 LINK
    );

    return {
      contract,
      contractAddress,
      automationRegistry,
      coordinatorv2,
      deployArg: {
        automationRegistryAddress,
        vrfArguments,
      },
    };
  }

  it("should save the correct constructor values", async () => {
    const { contract, deployArg } = await loadFixture(deployAutoVRFMock);

    expect(await contract.getAutomationRegistry()).to.be.equals(
      deployArg.automationRegistryAddress
    );

    expect(await contract.getVrfCoordinator()).to.be.equals(
      deployArg.vrfArguments.vrfCoordinator
    );

    expect(await contract.getKeyHash()).to.be.equals(
      deployArg.vrfArguments.keyHash
    );

    expect(await contract.getSubscriptionId()).to.be.equals(
      deployArg.vrfArguments.subscriptionId
    );

    expect(await contract.getRequestConfirmations()).to.be.equals(
      deployArg.vrfArguments.requestConfirmations
    );

    expect(await contract.getCallbackGasLimit()).to.be.equals(
      deployArg.vrfArguments.callbackGasLimit
    );

    expect(await contract.getNumWords()).to.be.equals(
      deployArg.vrfArguments.numWords
    );
  });

  it("should fail if reveal is called from a non automation registry", async () => {
    const signers = await ethers.getSigners();
    const caller0 = signers[0];
    const caller1 = signers[1];
    const caller2 = signers[2];
    const { contract } = await loadFixture(deployAutoVRFMock);

    expect(contract.connect(caller0).reveal()).to.be.revertedWithCustomError(
      contract,
      "NoAutomationRegister"
    );
    expect(contract.connect(caller1).reveal()).to.be.revertedWithCustomError(
      contract,
      "NoAutomationRegister"
    );
    expect(contract.connect(caller2).reveal()).to.be.revertedWithCustomError(
      contract,
      "NoAutomationRegister"
    );
  });

  it("should call reveal from the automation registry ", async () => {
    const { contract, contractAddress, automationRegistry } = await loadFixture(
      deployAutoVRFMock
    );

    const tx = await automationRegistry.simulateAutoReveal(contractAddress);

    const revealCalledEvent = (await getEventArgs(
      tx,
      "RevealCalled",
      contract
    )) as RevealCalledEvent.OutputObject;

    // We can't know the Request ID value before the call
    expect(revealCalledEvent.block).to.be.equals(tx.blockNumber);
  });

  it("should fullfill the random words after reveal is called", async () => {
    const { contract, contractAddress, automationRegistry, coordinatorv2 } =
      await loadFixture(deployAutoVRFMock);

    // Call the reveal using the AutoRegistry
    const txRevealCall = await automationRegistry.simulateAutoReveal(
      contractAddress
    );

    const revealCalledEvent = (await getEventArgs(
      txRevealCall,
      "RevealCalled",
      contract
    )) as RevealCalledEvent.OutputObject;

    // We can't know the Request ID value before the call
    expect(revealCalledEvent.block).to.be.equals(txRevealCall.blockNumber);

    // Define the random words to return
    const randomWords = Array.from({ length: 5 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    // Fulfill the words using the VRFCoordinatorV2
    const txFulFill = await coordinatorv2.fulfillRandomWordsWithOverride(
      revealCalledEvent.requestId,
      contractAddress,
      randomWords
    );

    const nftsRevealedEvent = (await getEventArgs(
      txFulFill,
      "NftsRevealed",
      contract
    )) as NftsRevealedEvent.OutputObject;

    expect(nftsRevealedEvent.requestId).to.be.equals(
      revealCalledEvent.requestId
    );
    expect(nftsRevealedEvent.block).to.be.equals(txFulFill.blockNumber);

    const wordsSaved = await contract.getWordsByPointer(
      nftsRevealedEvent.nftRevealCounter
    );

    expect(randomWords).to.be.deep.equals(wordsSaved);
  });
});
