require("dotenv").config(); // Load environment variables
import addInteractionsToList from "./actions/addInteractionsToList";

import { userKeys, cowspriactyBotKeys } from "./keys";

const main = async () => {
  addInteractionsToList("1280669347413848064", userKeys);
};

main();
