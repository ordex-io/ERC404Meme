import { ContractTransactionResponse, BaseContract } from "ethers";

/**
 *
 * @param tx transaction where event occurs
 * @param eventName name of event
 * @param contract contract object holding the address, filters, interface
 * @param contractAddressOverride (optional) override the contract address which emits this event
 * @returns Event arguments, can be deconstructed by array index or by object key
 */
export const getEventArgs = async (
  tx: ContractTransactionResponse,
  eventName: string,
  contract: BaseContract,
  contractAddressOverride: string | null = null
) => {
  const txReceipt = await tx.wait();
  if (!txReceipt) {
    throw new Error("Could not get the tx receipt");
  }

  const eventObj = txReceipt.logs.find(
    (log_) =>
      log_.topics[0] === contract.filters[eventName]().fragment.topicHash &&
      (contractAddressOverride === null ||
        log_.address === contractAddressOverride)
  );

  if (!eventObj) {
    throw new Error(`Could not find event with name ${eventName}`);
  }

  // Return all events indexed and not indexed
  return contract.interface.decodeEventLog(
    eventName,
    eventObj.data,
    eventObj.topics
  ) as any;
};
