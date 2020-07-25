import Twitter from "twitter-lite";
import { keys } from "../keys";

const twitter = new Twitter(keys);

const MAX_LIST_COUNT = 5000;

export default async (listId: string) => {
  const result = await twitter.get("lists/members", {
    list_id: listId,
    count: MAX_LIST_COUNT,
    include_entities: false,
  });

  const listOfUserIds = result.users.map((result: any) => {
    return result.id_str;
  });

  return listOfUserIds;
};
