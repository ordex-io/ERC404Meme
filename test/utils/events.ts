import { ContractTransactionResponse, BaseContract } from "ethers";
import { bytesToAddress } from "./manipulation";

/**
 * Obtain the first event that match the given event name
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

/**
 * Get the ERC721 Transfer events values from a transaction.
 *
 * Since the ERC404 contract hold ERC20 and ERC721, and their topics are the same,
 * the parse always try to decode as ERC20. This function only take the ERC721 transfers
 * @param tx -  Transaction that contain the ERC721 transfers
 * @param contract - The contract to loop the address and that have the interface to decode ERC721 transfers
 * @param contractAddressOverride - Optional address that possible emitted the contract
 * @returns
 */
export async function getERC721TransfersEventsArgs(
  tx: ContractTransactionResponse,
  contract: BaseContract,
  contractAddressOverride: string | null = null
) {
  const txReceipt = await tx.wait();
  if (!txReceipt) {
    throw new Error("Could not get the tx receipt");
  }

  const eventLogs = txReceipt.logs.filter((log_) => {
    return (
      log_.topics[0] === contract.filters["Transfer"]().fragment.topicHash &&
      log_.data.length <= 2 && // This because ERC721 transfer does index every data on the event. So, data is 0x
      (contractAddressOverride === null ||
        log_.address === contractAddressOverride)
    );
  });

  return eventLogs.map((log_) => {
    return {
      index: log_.index,
      from: bytesToAddress(log_.topics[1]),
      to: bytesToAddress(log_.topics[2]),
      id: BigInt(log_.topics[3]),
    };
  });
}
