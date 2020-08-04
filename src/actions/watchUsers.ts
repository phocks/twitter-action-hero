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

  console.log("*** THIS IS THE START OF WATCH USERS SCRIPT ***");

  // Loop through supplied targets
  for (const user of usersToWatch) {
    console.log(`Checking for user "${user.screen_name}" in local database...`);
    const userExists = db
      .get("usersToWatch")
      .find({ id_str: user.id_str })
      .value();

    // Add users if missing
    if (!userExists) {
      console.log("User missing in local db. Adding...");
      db.get("usersToWatch").push(user).write();
    } else {
      console.log(`User "${user.screen_name}" exists!`);
    }

    // Re-get the local user
    const localUser = db.get("usersToWatch").find({ id_str: user.id_str });

    // Get remote user
    const [remoteUserError, remoteUser] = await to(
      twitter.get("users/show", { user_id: user.id_str })
    );

    // Process errors
    if (remoteUserError) {
      console.error(remoteUserError);
      continue; // end processing
    }

    if (remoteUser) {
      // Check if screen name is the same
      if (remoteUser.screen_name === localUser.value().screen_name) {
        console.log(
          `screen_name "${remoteUser.screen_name}" hasn't changed since last time...`
        );
      } else {
        console.log(
          `screen_name has changed! It was "${
            localUser.value().screen_name
          }" and now is "${remoteUser.screen_name}"`
        );

        // TODO: Tweet about screen name change

        console.log(`Saving new screen_name "${remoteUser.screen_name}" to local database...`)
        localUser.assign({ screen_name: remoteUser.screen_name }).write();
      }
    }
  }

  // // Lookup data on all our users to watch
  // const joinedUsers = usersToWatch
  //   .map((user: WatchedUser) => user.id_str)
  //   .join(",");

  // const [usersLookupError, usersLookupResult] = await to(
  //   twitter.get("users/lookup", { user_id: joinedUsers })
  // );

  // if (usersLookupError) console.error(usersLookupError);

  // if (usersLookupResult) {
  //   const storedUsers = db.get("usersToWatch");

  //   for (const storedUser of storedUsers) {
  //     const userMatch = _.find(usersLookupResult, {
  //       id_str: storedUser.id_str,
  //     });

  //     if (userMatch) {
  //       // Check name change
  //       if (typeof storedUser.name === "undefined") {
  //         console.log(storedUsers);
  //         storedUsers.find({ id_str: "34116377" }).set("test", "test").write();
  //       }
  //     }
  //   }
  // }
};
