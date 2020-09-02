import fs from "fs";

import sources from "./twitter-sources-overnight.json";
import { myKeys } from "../keys";

// for (const source in sources) {
//   console.log(sources[source]);
// }

var sourcesArray = Object.keys(sources).map((key) => {
  return { source: key, count: sources[key] };
});

console.log(sourcesArray);

const sortedArray = sourcesArray.sort((a, b) => {
  return b.count - a.count;
});

console.log(sortedArray);

fs.writeFile("sorted.json", JSON.stringify(sortedArray), () => {
  console.log("done");
});
