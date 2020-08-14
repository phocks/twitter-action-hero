import Twitter from "twitter-lite";
import to from "await-to-js";

const appRoot = require("app-root-path");

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/detectNotFollowing.json`);
const db = low(adapter);

db.defaults({ friendsList: [] }).write();

export default async (keys: any) => {
  const twitter = new Twitter(keys);

  let [error, result] = await to(twitter.get("friends/ids"));

  if (error) {
    console.error(error);
    return;
  }

  const idsAsStrings = result.ids.map((id: number) => id.toString());

  db.set("friendsList", idsAsStrings).write();

  idsAsStrings.forEach((element: string) => {
    console.log(element);
  });
};
