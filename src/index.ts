// Initial set up
const appRoot = require("app-root-path"); // Require due to no types
require("dotenv").config({ path: `${appRoot}/.env` }); // Load environment variables

// Import actions
import addInteractionsToList from "./actions/addInteractionsToList";
import searchAndRetweet from "./actions/searchAndRetweet";
import watchUsers from "./actions/watchUsers";

// Import environment keys
import { myKeys, cowspriactyBotKeys, auspolwatchKeys } from "./keys";

// Cowspiracybot blocklist
const blockedUsernames = ["cowspiracybot"];

const main = async () => {
  // Adds latest @replies & @mentions to a list
  await addInteractionsToList("1280669347413848064", myKeys);

  // Searches a phrase and retweets those tweets
  await searchAndRetweet(
    "cowspiracy -filter:nativeretweets -filter:replies",
    blockedUsernames,
    cowspriactyBotKeys
  );
};

const test = async () => {
  watchUsers(["phocks"], auspolwatchKeys);
};

// Start the main process
main();

// A testing thread (uncomment to test)
// test();
