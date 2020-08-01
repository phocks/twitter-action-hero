import Twitter, { TwitterOptions } from "twitter-lite";
import to from "await-to-js";

const appRoot = require("app-root-path");

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/watchedUsers.json`);
const db = low(adapter);
db.defaults({ userObjects: [] }).write();

export default async (usersToWatch: string[], keys: TwitterOptions) => {
  const twitter = new Twitter(keys);

  const joinedUsers = usersToWatch.join(",");

  const [usersLookupError, usersLookupResult] = await to(
    twitter.get("users/lookup", { screen_name: joinedUsers })
  );

  if (usersLookupError) console.error(usersLookupError);

  if (usersLookupResult) {
    console.log(usersLookupResult);
    for (const user of usersLookupResult) {
      console.log(user.screen_name);
    }
  }
};
