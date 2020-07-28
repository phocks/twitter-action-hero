/**
 * GET friendships/show
 * Returns detailed information about the relationship
 * between two arbitrary users.
 */

import Twitter from "twitter-lite";

export default (source: string, target: string, keys: any) => {
  const twitter = new Twitter(keys);

  twitter
    .get("friendships/show", {
      source_screen_name: source,
      target_screen_name: target,
    })
    .then((result: object) => {
      console.log(result);
    })
    .catch((error) => console.log(error));
};
