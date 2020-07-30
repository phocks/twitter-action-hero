import Twitter, { TwitterOptions } from "twitter-lite";
import to from "await-to-js";

export default async (
  searchPhrase: string,
  blockedUsernames: string[],
  keys: TwitterOptions
) => {
  // Log something to the console
  console.log("------------------------------------------------");
  console.log("This is the start of the searchAndRetweet action");
  console.log("------------------------------------------------");

  const twitter = new Twitter(keys);

  const [resultError, result] = await to(
    twitter.get("search/tweets", {
      q: searchPhrase,
      result_type: "recent",
      lang: "en",
    })
  );

  for (const status of result.statuses) {
    const screenName = status.user.screen_name;
    const tweetId = status.id_str;

    // Don't process if in block list
    if (blockedUsernames.includes(screenName)) {
      console.log(`User ${screenName} in block list. Will not retweet...`);
      continue;
    }

    const [retweetError, retweetResult] = await to(
      twitter.post(`statuses/retweet/${tweetId}`, {
        id: tweetId,
      })
    );

    // Try to retweet
    if (retweetError) {
      const e: any = retweetError;
      console.error(e.errors);
    }

    if (retweetResult) {
      console.log(`Tweet ${tweetId} retweeted...`);
    }

    // Try to fav
    const [favError, favResult] = await to(
      twitter.post("favorites/create", {
        id: tweetId,
      })
    );

    if (favError) {
      const e: any = favError;
      console.error(e.errors);
    }

    if (favResult) {
      console.log(`Tweet ${tweetId} faved...`);
    }
  }
};
