import Twitter from "twitter-lite";
import { keys } from "../keys";

const twitter = new Twitter(keys);

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

    // Filter users already on list
    const alreadyOnList = await getListMembers(listId);

    console.log(`Users already on list: ${alreadyOnList}`);

    const filteredUsers = users.filter((user) => {
      if (alreadyOnList.includes(user)) return false;
      else return true;
    });

    console.log(`New users to add: ${filteredUsers}`);

    // Add found users to list
    if (filteredUsers.length > 0) addUsersToList(filteredUsers, listId);
  } catch (error) {
    console.error(error);
  }
};
