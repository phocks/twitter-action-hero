import Twitter from "twitter-lite";
import to from "await-to-js";

const appRoot = require("app-root-path");

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/detectNotFollowing.json`);
const db = low(adapter);

// db.defaults({ accountsToProcess: [] }).write();

const LOOKUP_LIMIT = 100;
const MAX_USERS_TO_UNFOLLOW_PER_ITERATION = 3;

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

  // Otherwise process accounts
  let commaSeparatedIds: string = "";

  // Make a string with comma separated ids to process
  for (const [index, id_str] of accountsToProcess.value().entries()) {
    if (index > LOOKUP_LIMIT - 1) break;
    commaSeparatedIds += `${id_str},`;
  }

  console.log(`Got some ids to process...`);

  console.log(commaSeparatedIds);

  const [error, result] = await to(
    twitter.get("friendships/lookup", { user_id: commaSeparatedIds })
  );

  if (error) {
    console.error(error);
    return;
  }

  console.log(result);

  // Sometimes twitter returns nothing so... try again with the next lot

  if (result.length === 0) {
    commaSeparatedIds = "";
    for (const [index, id_str] of accountsToProcess.value().entries()) {
      if (index > LOOKUP_LIMIT - 1) break;
      accountsToProcess.pull(id_str).write();
    }

    for (const [index, id_str] of accountsToProcess.value().entries()) {
      if (index > LOOKUP_LIMIT - 1) break;
      commaSeparatedIds += `${id_str},`;
    }
  }

  // Use as API rate limiter
  let unfollowedThroughApiCount = 0;

  for (const account of result) {
    if (account.connections.includes("followed_by")) {
      console.log(`Account "${account.screen_name}" is following. All good!`);
    } else {
      unfollowedThroughApiCount++;

      if (unfollowedThroughApiCount > MAX_USERS_TO_UNFOLLOW_PER_ITERATION) {
        console.log(
          `Refusing to unfollow "${account.screen_name}" to keep Twitter API team happy...`
        );
        return;
      }

      console.log(`Account "${account.screen_name}" isn't following... 😞`);

      if (process.env.NODE_ENV === "production") {
        const [error, result] = await to(
          twitter.post("friendships/destroy", { user_id: account.id_str })
        );

        if (error) {
          console.error(error);
          return;
        }

        console.log(`User "${account.screen_name}" was unfollowed on Twitter!`);
      } else {
        console.log(
          `User "${account.screen_name}" would have been unfollowed if running NODE_ENV=production`
        );
      }
    }
    // We tried so pull it
    accountsToProcess.pull(account.id_str).write();
  }
};
