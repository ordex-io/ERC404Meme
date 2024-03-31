import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import {
  calculateDNA,
  deployVRFCoordinartorV2Mock,
  getEventArgs,
} from "../utils";
import { SubscriptionCreatedEvent } from "../../typechain-types/contracts/test/mocks/VRFCoordinatorV2Mock.sol/CoordinatorV2Mock";
import { RandomExample, RanDNAExample } from "../../typechain-types";
import {
  RandomFulfilledEvent,
  RandomRequestedEvent,
} from "../../typechain-types/contracts/test/examples/RandomExample";
import {
  TokenMintEvent,
  RandomRequestedEvent as RandomRequestedEventRanDNA,
  RandomFulfilledEvent as RandomFulfilledEventRanDNA,
} from "../../typechain-types/contracts/test/examples/RanDNAExample";

describe("Random Facet", () => {
  /**
   * Deploy a RandomExample contract using a fixture of VRFCoordinator
   */
  async function deployRandomExample() {
    const vrfMock = await loadFixture(deployVRFCoordinartorV2Mock);

    let tx = await vrfMock.createSubscription();
    const subCreatedEvent = (await getEventArgs(
      tx,
      "SubscriptionCreated",
      vrfMock
    )) as SubscriptionCreatedEvent.OutputObject;

    const factory = await ethers.getContractFactory("RandomExample");

    // Arguments to initialize
    const keyHash =
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    const subId = subCreatedEvent.subId;
    const reqConfirmations = 1;
    const callbackGasLimit = 150000;
    const numWords = 5;

    //@ts-expect-error TypeScript give error since `deployProxy` does not use the root typechain
    const randomEx = (await upgrades.deployProxy(factory, [
      await vrfMock.getAddress(),
      keyHash, // An arbitrary key hash (Check chainlink docs for more info for each network)
      subId, // The subscription ID that will use
      reqConfirmations, // Request confirmations
      callbackGasLimit, // Gas limit for the callback
      numWords, // Num words to get
    ])) as RandomExample;

    // Wait for deploy and init
    await randomEx.waitForDeployment();

    return {
      contract: randomEx,
      contractAddress: await randomEx.getAddress(),
      vrfMock,
      vrfMockAddress: await vrfMock.getAddress(),
      keyHash,
      subId,
      reqConfirmations,
      callbackGasLimit,
      numWords,
    };
  }

  async function deployRanDNAExample() {
    const vrfMock = await loadFixture(deployVRFCoordinartorV2Mock);

    let tx = await vrfMock.createSubscription();
    const subCreatedEvent = (await getEventArgs(
      tx,
      "SubscriptionCreated",
      vrfMock
    )) as SubscriptionCreatedEvent.OutputObject;

    const factory = await ethers.getContractFactory("RanDNAExample");

    // Arguments to initialize
    const keyHash =
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    const subId = subCreatedEvent.subId;
    const reqConfirmations = 1;
    const callbackGasLimit = 1500000;
    const numWords = 5;

    //@ts-expect-error TypeScript give error since `deployProxy` does not use the root typechain
    const ranDnaEx = (await upgrades.deployProxy(factory, [
      await vrfMock.getAddress(),
      keyHash, // An arbitrary key hash (Check chainlink docs for more info for each network)
      subId, // The subscription ID that will use
      reqConfirmations, // Request confirmations
      callbackGasLimit, // Gas limit for the callback
      numWords, // Num words to get
    ])) as RanDNAExample;

    // Wait for deploy and init
    await ranDnaEx.waitForDeployment();

    return {
      contract: ranDnaEx,
      contractAddress: await ranDnaEx.getAddress(),
      vrfMock,
      vrfMockAddress: await vrfMock.getAddress(),
      keyHash,
      subId,
      reqConfirmations,
      callbackGasLimit,
      numWords,
    };
  }

  describe("Test random facet correct behaviour", () => {
    it("should initialize the random facet only once", async () => {
      const { contract, ...params } = await loadFixture(deployRandomExample);

      await expect(
        contract.initialize(
          params.vrfMockAddress,
          params.keyHash,
          params.subId,
          params.reqConfirmations,
          params.callbackGasLimit,
          params.numWords
        )
      ).to.be.revertedWithCustomError(contract, "InvalidInitialization");
    });

    it("should retrieve initialize values stored", async () => {
      const { contract, ...params } = await loadFixture(deployRandomExample);

      expect(await contract.getKeyHash()).to.be.equals(params.keyHash);
      expect(await contract.getSubscriptionId()).to.be.equals(params.subId);
      expect(await contract.getRequestConfirmations()).to.be.equals(
        params.reqConfirmations
      );
      expect(await contract.getCallbackGasLimit()).to.be.equals(
        params.callbackGasLimit
      );
      expect(await contract.getNumWords()).to.be.equals(params.numWords);
      expect(await contract.getVRFCoordinator()).to.be.equals(
        params.vrfMockAddress
      );
    });
  });

  describe("Random contract implementer (RandomExample)", () => {
    it("should be able to request random values", async () => {
      const { contract, vrfMock, subId, contractAddress } = await loadFixture(
        deployRandomExample
      );

      // Fund the subId to be used (Real VRF will need real funds. See Chainlink docs)
      await vrfMock.fundSubscription(subId, 1000000000);

      // Add the contract as consumer
      await vrfMock.addConsumer(subId, await contract.getAddress());

      // Request a random value
      const tx_0 = await contract.requestRandom();

      // Read the event
      const { requestId: requestId_0 } = (await getEventArgs(
        tx_0,
        "RandomRequested",
        contract
      )) as RandomRequestedEvent.OutputObject;

      // Mock the fullfill from VRF
      const words_0 = ["5", "10", "15", "20", "25"].map((x) => BigInt(x));

      // Send fulfill from VRF
      const tx_1 = await vrfMock.fulfillRandomWordsWithOverride(
        requestId_0,
        contractAddress,
        words_0
      );

      // Read the implementer event
      const { requestId: requestId_1, randomWords: randomWords_1 } =
        (await getEventArgs(
          tx_1,
          "RandomFulfilled",
          contract
        )) as RandomFulfilledEvent.OutputObject;

      // Values obtained from VRF and handled by RandomFacet are correct
      expect(requestId_0).to.be.equals(requestId_1);
      expect(words_0).to.be.deep.equals(randomWords_1);
    });
  });

  describe("RandomDNA example", () => {
    it("should get DNA after reveal", async () => {
      const { contract, vrfMock, subId, contractAddress } = await loadFixture(
        deployRanDNAExample
      );
      const signers = await ethers.getSigners();
      const alice = signers[1];
      const bob = signers[2];

      // Fund the subId to be used (Real VRF will need real funds. See Chainlink docs)
      await vrfMock.fundSubscription(subId, 6000000000000000000n);

      // Add the contract as consumer
      await vrfMock.addConsumer(subId, contractAddress);

      const tx_mint_0 = await contract.connect(alice).mint();
      const tokenMint_0 = (await getEventArgs(
        tx_mint_0,
        "TokenMint",
        contract
      )) as TokenMintEvent.OutputObject;

      const tx_mint_1 = await contract.connect(bob).mint();
      const tokenMint_1 = (await getEventArgs(
        tx_mint_1,
        "TokenMint",
        contract
      )) as TokenMintEvent.OutputObject;

      expect(tokenMint_1.id).to.be.equals(tokenMint_0.id + 1n);
      expect(tokenMint_0.owner).to.be.equals(alice.address);
      expect(tokenMint_1.owner).to.be.equals(bob.address);

      expect(tokenMint_0.currentRandomId).to.be.equals(
        tokenMint_1.currentRandomId
      );

      expect(contract.getDNA(tokenMint_0.id)).to.be.revertedWithCustomError(
        contract,
        "NotRevealed"
      );
      expect(contract.getDNA(tokenMint_1.id)).to.be.revertedWithCustomError(
        contract,
        "NotRevealed"
      );

      const tx_reveal_2 = await contract.requestReveal();
      const revealEvent_2 = (await getEventArgs(
        tx_reveal_2,
        "RandomRequested",
        contract
      )) as RandomRequestedEventRanDNA.OutputObject;

      expect(revealEvent_2.randomId).to.be.equals(tokenMint_0.currentRandomId);

      // Mock the fullfill from VRF
      const words_0 = [5n, 10n, 15n, 20n, 25n];

      // Send fulfill from VRF
      const tx_mock_fulfill_3 = await vrfMock.fulfillRandomWordsWithOverride(
        revealEvent_2.requestId,
        contractAddress,
        words_0
      );

      const fulfillEvent_3 = (await getEventArgs(
        tx_mock_fulfill_3,
        "RandomFulfilled",
        contract
      )) as RandomFulfilledEventRanDNA.OutputObject;

      expect(fulfillEvent_3.requestId).to.be.equals(revealEvent_2.requestId);
      expect(fulfillEvent_3.randomWords).to.be.deep.equals(words_0);

      expect(await contract.getDNA(tokenMint_0.id)).to.be.equals(
        calculateDNA(tokenMint_0.id, words_0, tokenMint_0.mintTime)
      );
      expect(await contract.getDNA(tokenMint_1.id)).to.be.equals(
        calculateDNA(tokenMint_1.id, words_0, tokenMint_1.mintTime)
      );
    });
  });
});
