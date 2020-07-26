/**
 * A script to periodically check replies and mentions
 * and then add those users to a list.
 *
 * Will check that the user is not on the list already.
 *
 * Will try to write a json file of users it has already tried
 * to add to the list.
 */

import Twitter from "twitter-lite";
import { keys } from "../keys";

const twitter = new Twitter(keys);
const appRoot = require("app-root-path");

// Set up database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/db.json`);
const db = low(adapter);
db.defaults({ usersInteracted: [] }).write();

import addUsersToList from "./addUsersToList";
import getListMembers from "./getListMembers";

export default async (listId: string) => {
  try {
    const results = await twitter.get("statuses/mentions_timeline");
    let users = [];

    // Loop through results and add to array
    console.log("Latest 20 mentions...");
    console.log("----------");

    for (const record of results) {
      console.log(record.user.screen_name);
      users.push(record.user.id_str);
    }

    console.log("----------");
    console.log(`Found ${users.length} user ids: ${users}`);

    const alreadyOnList = await getListMembers(listId);
    let alreadyInDb = db.get("usersInteracted").value();

    console.log(`${alreadyOnList.length} users already on list`);

    // Add those already on list to database if not there
    for (const listUser of alreadyOnList) {
      if (!alreadyInDb.includes(listUser)) {
        db.get("usersInteracted").push(listUser).write();
      }
    }

    // Update list of already in database
    alreadyInDb = db.get("usersInteracted").value();

    console.log(`${alreadyInDb.length} users already on in local database`);

    // Filter users already on list
    const filteredUsers = users.filter((user) => {
      if (alreadyOnList.includes(user) || alreadyInDb.includes(user)) return false;
      else return true;
    });

    console.log(`${filteredUsers.length} new users to add: ${filteredUsers}`);

    if (filteredUsers.length > 0) {
      // Add found users to list
      addUsersToList(filteredUsers, listId);

      // Also write to local database just in case
      // To stop user complaints if they don't want to be
      // continually added if they remove themselves
      db.get("usersInteracted")
        .push(...filteredUsers)
        .write();
    }
  } catch (error) {
    console.error(error);
  }
};
