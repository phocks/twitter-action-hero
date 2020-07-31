// Initial set up
const appRoot = require("app-root-path"); // Require due to no types
require("dotenv").config({ path: `${appRoot}/.env` }); // Load environment variables

// Import actions
import addInteractionsToList from "./actions/addInteractionsToList";
import searchAndRetweet from "./actions/searchAndRetweet";

// Import environment keys
import { myKeys, cowspriactyBotKeys } from "./keys";

// Cowspiracybot blocklist
const blockedUsernames = ["cowspiracybot"];

const main = async () => {
  // Adds latest @replies & @mentions to a list
  // await addInteractionsToList("1280669347413848064", myKeys);

  // Searches a phrase and retweets those tweets
  await searchAndRetweet(
    "cowspiracy -filter:nativeretweets -filter:replies",
    blockedUsernames,
    cowspriactyBotKeys
  );
};

main();
