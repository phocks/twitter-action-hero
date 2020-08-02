import Twitter, { TwitterOptions } from "twitter-lite";
import to from "await-to-js";

const appRoot = require("app-root-path");

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/watchUsers.json`);
const db = low(adapter);

db.defaults({ usersToWatch: [] }).write();

export default async (usersToWatch: string[], keys: TwitterOptions) => {
  const twitter = new Twitter(keys);

  // Check if already in local database
  for (const userString of usersToWatch) {
    const exists = db.get("usersToWatch").find({ screen_name: userString }).value()
    console.log(exists)
  }

  // db.set("watchedUsers", usersToWatch).write();
  // const storedUsers = db.get("watchedUsers").value();
  // console.log(storedUsers);

  // Lookup data on all our users to watch
  const joinedUsers = usersToWatch.join(",");

  const [usersLookupError, usersLookupResult] = await to(
    twitter.get("users/lookup", { screen_name: joinedUsers })
  );

  if (usersLookupError) console.error(usersLookupError);

  if (usersLookupResult) {
    console.log(usersLookupResult);
    // Write all user objects to db
    // db.get("userObjects").push(usersLookupResult).write();
  }
};
