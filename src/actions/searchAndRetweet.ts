import Twitter, { TwitterOptions } from "twitter-lite";

export default async (
  searchPhrase: string,
  blockedUsernames: string[],
  keys: TwitterOptions
) => {
  const twitter = new Twitter(keys);
  try {
    const result = await twitter.get("search/tweets", {
      q: searchPhrase,
      result_type: "recent",
      lang: "en",
    });

    for (const status of result.statuses) {
      const screenName = status.user.screen_name;
      const tweetId = status.id_str;

      if (blockedUsernames.includes(screenName)) continue;

      console.log(tweetId);

      twitter
        .post(`statuses/retweet/${tweetId}`, {
          id: tweetId,
        })
        .then((result) => {
          console.log(result);
        })
        .catch((error) => {
          console.error(error.errors);
        });

      twitter
        .post("favorites/create", {
          id: tweetId,
        })
        .then((result) => {
          console.log(result);
        })
        .catch((error) => {
          console.error(error.errors);
        });
    }
  } catch (error) {
    console.error(error);
  }
};
