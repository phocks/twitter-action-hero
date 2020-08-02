import Twitter, { TwitterOptions } from "twitter-lite";
import to from "await-to-js";

const appRoot = require("app-root-path");

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/watchUsers.json`);
const db = low(adapter);
db.defaults({ userObjects: [] }).write();

export default async (usersToWatch: string[], keys: TwitterOptions) => {
  const twitter = new Twitter(keys);

  // Lookup data on all our users to watch
  const joinedUsers = usersToWatch.join(",");

  const [usersLookupError, usersLookupResult] = await to(
    twitter.get("users/lookup", { screen_name: joinedUsers })
  );

  if (usersLookupError) console.error(usersLookupError);

  if (usersLookupResult) {
    // Write all user objects to db
    db.set("userObjects", usersLookupResult).write();
  }
};
