import Twitter from "twitter-lite";
import { keys } from "../keys";

const twitter = new Twitter(keys);

export default (userIds: any, listId: any) => {
  let userList = "";

  userIds.forEach((userId: any, iteration: number) => {
    if (userList === "") userList = userList + userId;
    else userList = userList + "," + userId;
  });

  twitter
    .post("lists/members/create_all", {
      screen_name: userList,
      owner_screen_name: "phocks",
      list_id: listId,
    })
    .then((result) => {
      console.log(`Users added to list: ${result.uri}`);
    })
    .catch((error) => console.log(error));
};
