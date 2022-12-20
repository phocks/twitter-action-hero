// Initial set up
const appRoot = require("app-root-path"); // Require due to no types
require("dotenv").config({ path: `${appRoot}/.env` }); // Load environment variables

// Import actions
import addInteractionsToList from "./actions/addInteractionsToList";
import searchAndRetweet from "./actions/searchAndRetweet";
import watchUsers from "./actions/watchUsers";
import detectNotFollowing from "./actions/detectNotFollowing";

import test from "./actions/twitterApiV2"

// Import environment keys
import {
  myKeys,
  cowspriactyBotKeys,
  auspolwatchKeys,
  veganAnswersKeys,
} from "./keys";

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

  // Action to run @auspolwatch script
  await watchUsers(auspolwatchConfig.targets, auspolwatchKeys);

  // Run a friend watcher for a while
  // await detectNotFollowing(myKeys);
};

// Some utils etc
import convertScreenNames from "./utils/convertScreenNames";
import originalTargets from "./utils/data/targets.json";

// Development thread
const development = async () => {
  console.log(`Running development actions...`)
  // TODO: add actions
  test();
};

// Check for dev
if (process.env.NODE_ENV === "development") development();
else production();
