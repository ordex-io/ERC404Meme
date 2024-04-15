import * as fs from "fs";
import * as path from "path";

export function writeFile(path_: string, fileString_: string) {
  try {
    fs.writeFileSync(path_, fileString_);
  } catch (error) {
    console.log(error);
  }
}

export function readFile(path_: string) {
  try {
    const data = fs.readFileSync(path_, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading or parsing JSON file:", error);
    throw error;
  }
}
