require("dotenv").config(); // Load environment variables

// Load actions
import addInteractionsToList from "./actions/addInteractionsToList";
import searchAndRetweet from "./actions/searchAndRetweet"

import { userKeys, cowspriactyBotKeys } from "./keys";

// Cowspiracybot blocklist
const blockedUsernames = [
  "SSF_BERF_DEFM",
  "DefendingBeef",
  "cowspiracybot",
  "FyfeHendrie",
  "Jamesrabbit7",
  "anneroberts_au",
  "farming_truth_",
  "NatStoppard",
  "DougCookRD",
  "EOMovement",
  "LA_CHEFs",
  "RuthMcMScott",
  "BioMickWatson"
];

const main = async () => {
  // addInteractionsToList("1280669347413848064", userKeys);
  searchAndRetweet("cowspiracy -filter:nativeretweets -filter:replies", blockedUsernames, cowspriactyBotKeys);
};

main();
