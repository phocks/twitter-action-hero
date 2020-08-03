import Twitter, { TwitterOptions } from "twitter-lite";
import to from "await-to-js";
import _ from "lodash";

const appRoot = require("app-root-path");

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/watchUsers.json`);
const db = low(adapter);

db.defaults({ usersToWatch: [] }).write();

interface WatchedUser {
  screen_name: string;
  id_str: string;
}

export default async (usersToWatch: WatchedUser[], keys: TwitterOptions) => {
  const twitter = new Twitter(keys);

  // Check if missing from local database
  for (const user of usersToWatch) {
    const userExists = db
      .get("usersToWatch")
      .find({ id_str: user.id_str })
      .value();

    // Add users if missing
    if (!userExists) {
      db.get("usersToWatch").push(user).write();
    }
  }

  // Lookup data on all our users to watch
  const joinedUsers = usersToWatch
    .map((user: WatchedUser) => user.id_str)
    .join(",");

  const [usersLookupError, usersLookupResult] = await to(
    twitter.get("users/lookup", { user_id: joinedUsers })
  );

  if (usersLookupError) console.error(usersLookupError);

  if (usersLookupResult) {
    const storedUsers = db.get("usersToWatch");

    for (const storedUser of storedUsers) {
      const userMatch = _.find(usersLookupResult, {
        id_str: storedUser.id_str,
      });

      if (userMatch) {
        // Check name change
        if (typeof storedUser.name === "undefined") {
          console.log(storedUsers);
          storedUsers.find({ id_str: "34116377" }).set("test", "test").write();
        }
      }
    }
  }
};
