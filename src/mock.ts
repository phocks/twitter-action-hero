// Dev test functions

import getRelationship from "./actions/getRelationship";
import getListMembers from "./actions/getListMembers";
import addInteractionsToList from "./actions/addInteractionsToList"

// getRelationship("BarackObama", "phocks");

const main = async () => {
  // const test = await getListMembers("1280669347413848064");

  // console.log(test);

  addInteractionsToList("1280669347413848064")
};

main();
