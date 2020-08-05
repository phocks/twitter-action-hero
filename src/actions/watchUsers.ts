import Twitter, { TwitterOptions } from "twitter-lite";
import to from "await-to-js";
import _ from "lodash";
import tall from "tall";

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
  const localAttribute = localUser.value()[attribute];
  const remoteAttribute = remoteUser[attribute];

  if (typeof localAttribute === "undefined") {
    console.log(
      `"${attribute}" not found in local database. Setting to "${remoteAttribute}"`
    );
    localUser.assign({ [attribute]: remoteUser[attribute] }).write();

    return { changed: false, old: localAttribute, new: remoteAttribute };
  }

  if (remoteAttribute === localAttribute) {
    console.log(
      `"${attribute}" "${remoteAttribute}" hasn't changed since last time...`
    );

    return { changed: false, old: localAttribute, new: remoteAttribute };
  }

  // Finally that means it has changed
  console.log(
    `"${attribute}" has changed! It was "${localAttribute}" and now is "${remoteAttribute}"`
  );

  console.log(
    `Saving new "${attribute}" name "${remoteUser.name}" to local database...`
  );
  // Write change to the local database
  localUser.assign({ name: remoteUser.name }).write();

  return { changed: true, old: localAttribute, new: remoteAttribute };
};

// Main module
export default async (usersToWatch: WatchedUser[], keys: TwitterOptions) => {
  const twitter = new Twitter(keys);

  console.log("*** THIS IS THE START OF WATCH USERS SCRIPT ***");
  console.log();

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

    // Process api error
    if (remoteUserError) {
      console.error(remoteUserError);
      continue; // end processing
    }

    if (remoteUser) {
      // console.log(remoteUser);

      // Check if screen name is the same
      let result = runComparison("screen_name", localUser, remoteUser);
      console.log(result);

      // Check if Twitter name is the same
      result = runComparison("name", localUser, remoteUser);
      console.log(result);

      // Check for location change
      result = runComparison("location", localUser, remoteUser);
      console.log(result);

      // Check for description change
      result = runComparison("description", localUser, remoteUser);
      console.log(result);

      // Check profile URL
      result = runComparison("url", localUser, remoteUser);
      if (result.old) {
        const [error, oldUrl] = await to(tall(result.old));
        if (!error) console.log(`Old url un-shortened: ${oldUrl}`);
      }

      if (result.new) {
        const [error, newUrl] = await to(tall(result.new));
        if (!error) console.log(`New url un-shortened: ${newUrl}`);
      }
    }
    console.log();
  }
};
