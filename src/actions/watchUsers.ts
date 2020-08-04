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

const runComparison = (attribute: string, localUser: any, remoteUser: any) => {
  if (typeof localUser.value()[attribute] === "undefined") {
    console.log(
      `"${attribute}" not found in local database. Setting to "${remoteUser[attribute]}"`
    );
    localUser.assign({ name: remoteUser.name }).write();
  } else if (remoteUser[attribute] === localUser.value()[attribute]) {
    console.log(
      `"${attribute}" "${remoteUser[attribute]}" hasn't changed since last time...`
    );
  } else {
    // Handle a Twitter name change
    console.log(
      `"${attribute}" has changed! It was "${
        localUser.value()[attribute]
      }" and now is "${remoteUser[attribute]}"`
    );

    // TODO: Tweet about Twitter name change

    console.log(
      `Saving new "${attribute}" name "${remoteUser.name}" to local database...`
    );
    // Write change to the local database
    localUser.assign({ name: remoteUser.name }).write();
  }
};

// Main module
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
      runComparison("screen_name", localUser, remoteUser);

      // Check if Twitter name is the same
      runComparison("name", localUser, remoteUser);
    }
  }
};
