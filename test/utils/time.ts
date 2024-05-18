import { time } from "@nomicfoundation/hardhat-network-helpers";
import { getTimeStamp } from "../../utils";

export async function increaseTimestampTo(newTime: number) {
  const currentTime = await getTimeStamp();

  if (currentTime < newTime) {
    await time.increaseTo(newTime);
  }
}
