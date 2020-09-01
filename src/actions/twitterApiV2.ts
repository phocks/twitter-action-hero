const needle = require("needle");
import fs from "fs";

// The code below sets the bearer token from your environment variables
// To set environment variables on Mac OS X, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
const token = process.env.BEARER_TOKEN;

const streamURL =
  "https://api.twitter.com/2/tweets/sample/stream?expansions=attachments.poll_ids,attachments.media_keys,author_id,entities.mentions.username,geo.place_id,in_reply_to_user_id,referenced_tweets.id,referenced_tweets.id.author_id&media.fields=duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics&place.fields=contained_within,country,country_code,full_name,geo,id,name,place_type&poll.fields=duration_minutes,end_datetime,id,options,voting_status&tweet.fields=attachments,author_id,context_annotations,conversation_id,created_at,entities,geo,id,in_reply_to_user_id,lang,public_metrics,possibly_sensitive,referenced_tweets,source,text,withheld&user.fields=created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld";

const counter = {};

function streamConnect(t?) {
  const options = {
    timeout: 20000,
  };

  const stream = needle.get(
    streamURL,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    options
  );

  stream
    .on("data", (data) => {
      try {
        const json = JSON.parse(data);
        // if (json.data.text.search("Biden") !== -1) {
        // console.log(json.data);

        if (typeof counter[json.data.source] === "undefined")
          counter[json.data.source] = 1;
        else counter[json.data.source]++;

        // console.log(counter)

        // }
      } catch (e) {
        // Keep alive signal received. Do nothing.
      }
    })
    .on("error", (error) => {
      if (error.code === "ETIMEDOUT") {
        stream.emit("timeout");
      }
    });

  return stream;
}

export default async () => {
  // Listen to the stream.
  // This reconnection logic will attempt to reconnect when a disconnection is detected.
  // To avoid rate limites, this logic implements exponential backoff, so the wait time
  // will increase if the client cannot reconnect to the stream.

  setInterval(() => {
    fs.writeFile("./data/test.json", JSON.stringify(counter), {}, () => {});
  }, 5000);

  const sampledStream = streamConnect();
  let timeout = 0;
  sampledStream.on("timeout", () => {
    // Reconnect on error
    console.warn("A connection error occurred. Reconnecting…");
    setTimeout(() => {
      timeout++;
      streamConnect(token);
    }, 2 ** timeout);
    streamConnect(token);
  });
};
