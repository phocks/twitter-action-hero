import Twitter from "twitter-lite";
import { keys } from "../keys";

const twitter = new Twitter(keys);

import addUsersToList from "./addUsersToList"

export default (listId?: String) => {
  twitter
    .get("statuses/mentions_timeline")
    .then((results) => {
      let users = [];
      for (const record of results) {
        users.push(record.user.id);
        console.log(record.user.id);
      }

      console.log("Found: " + users.length);

      addUsersToList(users, listId);
    })
    .catch((error) => console.log(error));
};
