import Twitter from "twitter-lite";
import { keys } from "../keys";

const twitter = new Twitter(keys);

import addUsersToList from "./addUsersToList";

export default async (listId: string) => {
  try {
    const results = await twitter.get("statuses/mentions_timeline");
    let users = [];

    // Loop through results and add to array
    console.log("Latest 20 mentions...");
    console.log("----------");

    for (const record of results) {
      console.log(record.user.screen_name);
      users.push(record.user.id);
    }

    console.log("----------");
    console.log(`Found ${users.length} user ids: ${users}`);

    // Add found users to list
    addUsersToList(users, listId);
  } catch (error) {
    console.error(error);
  }
};
