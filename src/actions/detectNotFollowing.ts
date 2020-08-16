import Twitter from "twitter-lite";
import to from "await-to-js";

const appRoot = require("app-root-path");

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/detectNotFollowing.json`);
const db = low(adapter);

const LOOKUP_LIMIT = 100;
const MAX_USERS_TO_UNFOLLOW_PER_ITERATION = 5;

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

  const [error, results] = await to(
    twitter.get("friendships/lookup", { user_id: commaSeparatedIds })
  );

  if (error) {
    console.error(error);
    return;
  }

  // console.log(results);
  console.log(`Got ${results.length} results from Twitter...`);

  // Map results for difference comparrison
  const lookupIds = results.map((element: any) => element.id_str);

  // If user not in results then delete from database
  const userNotFound = thisBatch.filter((x: string) => !lookupIds.includes(x));
  for (const userId of userNotFound) {
    accountsToProcess.pull(userId).write();
  }

  // Use as API rate limiter
  let unfollowedThroughApiCount = 0;

  for (const account of results) {
    if (account.connections.includes("followed_by")) {
      console.log(`Account "${account.screen_name}" is following. All good!`);

      // Pull from database
      accountsToProcess.pull(account.id_str).write();
    } else if (account.connections.includes("none")) {
      console.log(
        `We aren't following "${account.screen_name}" and they aren't following us. Oh well 🤷`
      );

      // Pull from database
      accountsToProcess.pull(account.id_str).write();
    } else if (account.connections.includes("following")) {
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

      // Pull from database
      accountsToProcess.pull(account.id_str).write();
    } else {
      console.log(
        `Already not following "${account.screen_name}" so I dunno 🤷`
      );
    }
  }
};
