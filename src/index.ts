const appRoot = require("app-root-path"); // Require due to no types
require("dotenv").config({ path: `${appRoot}/.env` }); // Load environment variables
import addInteractionsToList from "./actions/addInteractionsToList";

import { userKeys, cowspriactyBotKeys } from "./keys";

const main = async () => {
  addInteractionsToList("1280669347413848064", userKeys);
};

main();
