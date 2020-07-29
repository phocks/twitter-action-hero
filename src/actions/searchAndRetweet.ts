import Twitter, { TwitterOptions } from "twitter-lite";

export default async (
  searchPhrase: string,
  blockedUsernames: string[],
  keys: TwitterOptions
) => {
  const twitter = new Twitter(keys);

  const result = await twitter.get("search/tweets", {
    q: searchPhrase,
    result_type: "recent",
    lang: "en",
  });

  for (const status of result.statuses) {
    console.log(status.user.screen_name);
    const screenName = status.user.screen_name;

    if (blockedUsernames.includes(screenName)) {
      console.log("includes");
    } else {
      console.log("no");
    }
  }
};
