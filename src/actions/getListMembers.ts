import Twitter from "twitter-lite";

const MAX_LIST_COUNT = 5000;

export default async (listId: string, keys: any) => {
  const twitter = new Twitter(keys);

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
