import Twitter from "twitter-lite";

import { keys } from "./keys";

const client = new Twitter(keys);

client
  .get("account/verify_credentials")
  .then((results) => {
    console.log("results", results);
  })
  .catch(console.error);
