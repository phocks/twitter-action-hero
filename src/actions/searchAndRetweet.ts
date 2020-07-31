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

  // Search for our search phrase
  const [resultError, result] = await to(
    twitter.get("search/tweets", {
      q: searchPhrase,
      result_type: "recent",
      lang: "en",
    })
  );

  if (resultError) {
    console.log("Twitter search failed...");
    return;
  }

  // Get list of userIds the user has blocked
  const [blockedError, blocked] = await to(
    twitter.get("blocks/ids", { stringify_ids: true })
  );

  let blockedIds = [];

  if (blockedError) console.error(blockedError);
  if (blocked) {
    console.log("Got blocked accounts. Will not retweet them...");
    blockedIds = blocked.ids;
  }

  // Get a list of already tweeted tweets
  const [timelineError, timelineTweets] = await to(
    twitter.get("statuses/user_timeline", {
      include_rts: true,
      trim_user: true,
    })
  );

  if (timelineError) console.error(timelineError);

  let tweetedIds = [];

  if (timelineTweets) {
    console.log(
      "Got already tweeted retweets. Will not try to retweet them..."
    );
    tweetedIds = timelineTweets.map(
      (tweet: any) => tweet.retweeted_status.id_str
    );
  }

  // Loop through found tweets
  for (const status of result.statuses) {
    const userIdStr = status.user.id_str;
    const screenName = status.user.screen_name;
    const tweetId = status.id_str;

    // If already retweeted go to next one
    if (tweetedIds.includes(tweetId)) {
      console.log(`Skipping already retweeted tweet by ${screenName}...`);
      continue;
    }

    if (
      blockedIds.includes(userIdStr) ||
      blockedUsernames.includes(screenName)
    ) {
      // Don't process if in block lists
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
