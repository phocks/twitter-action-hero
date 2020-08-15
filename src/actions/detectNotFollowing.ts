import Twitter from "twitter-lite";
import to from "await-to-js";

const appRoot = require("app-root-path");

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/detectNotFollowing.json`);
const db = low(adapter);

db.defaults({ accountsToProcess: [] }).write();

const LOOKUP_LIMIT = 100;
const MAX_USERS_TO_UNFOLLOW_PER_ITERATION = 2;

export default async (keys: any) => {
  const twitter = new Twitter(keys);

  const accountsToProcess = db.get("accountsToProcess");

  // Check if to have accounts to process
  if (accountsToProcess.value().length === 0) {
    console.log(`Getting and storing friends list for future processing`);
    const [error, result] = await to(twitter.get("friends/ids"));

    if (error) {
      console.error(error);
      return;
    }

    const idsAsStrings = result.ids.map((id: number) => id.toString());

    db.set("accountsToProcess", idsAsStrings).write();
  }

  // Otherwise process accounts
  let commaSeparatedIds: string = "";

  accountsToProcess.value().forEach((id_str: string, iteration: number) => {
    if (iteration > LOOKUP_LIMIT - 1) return;
    commaSeparatedIds += `${id_str},`;
  });

  console.log(`Got some ids to process: `);
  console.log(commaSeparatedIds);

  const [error, result] = await to(
    twitter.get("friendships/lookup", { user_id: commaSeparatedIds })
  );

  if (error) {
    console.error(error);
    return;
  }

  // Use as API rate limiter
  let unfollowedThroughApiCount = 0;

  for (const account of result) {
    if (account.connections.includes("followed_by")) {
      console.log(`Account "${account.screen_name}" is following. All good!`);
      accountsToProcess.pull(account.id_str).write();
    } else {
      unfollowedThroughApiCount++;

      if (unfollowedThroughApiCount > MAX_USERS_TO_UNFOLLOW_PER_ITERATION) {
        console.log(
          `Refusing to unfollow ${account.screen_name} more to keep Twitter API team happy...`
        );
        return;
      }

      console.log(`Account "${account.screen_name}" isn't following... :(`);

      const [error, result] = await to(
        twitter.post("friendships/destroy", { user_id: account.id_str })
      );

      if (error) {
        console.error(error);
        return;
      }

      console.log(`User "${account.screen_name}" was unfollowed on Twitter!`);

      // Pull that id from accounts to process
      accountsToProcess.pull(account.id_str).write();
    }
  }
};
