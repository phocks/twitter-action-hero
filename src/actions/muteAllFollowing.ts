import Twitter from "twitter-lite";
import to from "await-to-js";
import { sleep } from "../lib/sleep";

const appRoot = require("app-root-path");

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/muteAllFollowing.json`);
const db = low(adapter);

const LOOKUP_LIMIT = 100;
const MAX_USERS_TO_MUTE_PER_ITERATION = 5;

export default async (keys: any) => {
  const twitter = new Twitter(keys);

  const accountsToProcess = db.get("accountsToProcess");

  // Check if starting again (Clear data file to start again)
  if (typeof accountsToProcess.value() === "undefined") {
    console.log(`Getting and storing friends list for future processing`);
    const [error, result] = await to(twitter.get("friends/ids"));

    if (error) {
      console.error(error);
      return;
    }

    const idsAsStrings = result.ids.map((id: number) => id.toString());

    db.set("accountsToProcess", idsAsStrings).write();
  }

  // If no accounts left just alert user and halt
  if (accountsToProcess.value().length === 0) {
    console.log(`No accounts left to process. Exiting...`);
    return;
  }

  // Get first N accounts to process this time
  const thisBatch = accountsToProcess.value().slice(0, LOOKUP_LIMIT);
  const commaSeparatedIds = thisBatch.join(",");

  console.log(`Got some ids to process...`);
  console.log(commaSeparatedIds);

  async function process() {
    for (const id of commaSeparatedIds) {
      const [error, result] = await to(
        twitter.post("mutes/users/create", { user_id: id })
      );

      if (error) {
        console.error(error);
        await sleep(1000);
        continue;
      }

      console.log(result);
      await sleep(1000);
    }
  }

  process();
};
