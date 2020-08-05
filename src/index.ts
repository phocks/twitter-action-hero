// Initial set up
const appRoot = require("app-root-path"); // Require due to no types
require("dotenv").config({ path: `${appRoot}/.env` }); // Load environment variables

// Import actions
import addInteractionsToList from "./actions/addInteractionsToList";
import searchAndRetweet from "./actions/searchAndRetweet";
import watchUsers from "./actions/watchUsers";

// Import environment keys
import { myKeys, cowspriactyBotKeys, auspolwatchKeys } from "./keys";

// Load somee configs for actions
const blockedUsernames = ["cowspiracybot"];
import auspolwatchConfig from "./config/auspolwatch.json";

// Main production thread
const production = async () => {
  // Adds latest @replies & @mentions to a list
  await addInteractionsToList("1280669347413848064", myKeys);

  // Searches a phrase and retweets those tweets
  await searchAndRetweet(
    "cowspiracy -filter:nativeretweets -filter:replies",
    blockedUsernames,
    cowspriactyBotKeys
  );

  // Holder action that will become @auspolwatch
  await watchUsers(auspolwatchConfig.targets, auspolwatchKeys);
};

// Development thread
const development = async () => {
  await watchUsers(auspolwatchConfig.targets, auspolwatchKeys);
};

// Check for dev
if (process.env.NODE_ENV === "development") development();
else production();
