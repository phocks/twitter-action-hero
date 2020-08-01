import Twitter, { TwitterOptions } from "twitter-lite";
import to from "await-to-js";

// NOT FINISHED YET 

export default async (usersToWatch: string[], keys: TwitterOptions) => {
  const twitter = new Twitter(keys);

  const [err, result] = await to(
    twitter.get("users/show", { screen_name: "phocks" })
  );

  console.log(result);
};
