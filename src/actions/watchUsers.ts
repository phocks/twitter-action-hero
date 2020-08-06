import Twitter, { TwitterOptions } from "twitter-lite";
import to from "await-to-js";
// const unshorten = require("unshorten");
import longly from "../lib/longly";

const appRoot = require("app-root-path");

const FAVS_TO_GET = 200;
const FRIENDS_TO_GET = 5000;

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/watchUsers.json`);
const db = low(adapter);

db.defaults({ usersToWatch: [] }).write();

interface WatchedUser {
  screen_name: string;
  id_str: string;
}

const runComparison = (attribute: string, localUser: any, remoteUser: any) => {
  const localAttribute = localUser.value()[attribute];
  const remoteAttribute = remoteUser[attribute];

  if (typeof localAttribute === "undefined") {
    console.log(
      `"${attribute}" not found in local database. Setting to "${remoteAttribute}"`
    );
    localUser.assign({ [attribute]: remoteUser[attribute] }).write();
    return { changed: false, old: localAttribute, new: remoteAttribute };
  }

  if (remoteAttribute === localAttribute) {
    console.log(
      `"${attribute}" "${remoteAttribute}" hasn't changed since last time...`
    );
    return { changed: false, old: localAttribute, new: remoteAttribute };
  }

  // Finally that means it has changed
  console.log(
    `"${attribute}" has changed! It was "${localAttribute}" and now is "${remoteAttribute}"`
  );

  console.log(
    `Saving new "${attribute}" name "${remoteUser.name}" to local database...`
  );
  // Write change to the local database
  localUser.assign({ [attribute]: remoteUser[attribute] }).write();
  return { changed: true, old: localAttribute, new: remoteAttribute };
};

// Main module
export default async (usersToWatch: WatchedUser[], keys: TwitterOptions) => {
  const twitter = new Twitter(keys);

  console.log("*** THIS IS THE START OF WATCH USERS SCRIPT ***");
  console.log();

  // Check for removed targets and clean database
  console.log(`Checking for removed targets...`);
  const dbTargetIds = db.get("usersToWatch").map("id_str").value();
  console.log(`Currently in database:`);
  console.log(dbTargetIds);
  const toWatchIds = usersToWatch.map((user: any) => user.id_str);
  console.log(`Users to watch in config:`);
  console.log(toWatchIds);

  // Get difference of arrays
  const idsNoLongerWatched = dbTargetIds.filter(
    (x: string) => !toWatchIds.includes(x)
  );

  console.log(idsNoLongerWatched);

  // Loop through and remove from database
  for (const id_str of idsNoLongerWatched) {
    console.log(`Removing ${id_str} from local database`)
    db.get("usersToWatch").remove({ id_str: id_str }).write();
  }

  // Loop through supplied targets
  for (const user of usersToWatch) {
    console.log(`Checking for user "${user.screen_name}" in local database...`);
    const userExists = db
      .get("usersToWatch")
      .find({ id_str: user.id_str })
      .value();

    // Add users if missing
    if (!userExists) {
      console.log("User missing in local db. Adding...");
      db.get("usersToWatch").push(user).write();
    } else {
      console.log(`User "${user.screen_name}" exists!`);
    }

    // Re-get the local user
    const localUser = db.get("usersToWatch").find({ id_str: user.id_str });

    // Get remote user
    const [remoteUserError, remoteUser] = await to(
      twitter.get("users/show", { user_id: user.id_str })
    );

    // Process api error
    if (remoteUserError) {
      console.error(remoteUserError);
      continue; // end processing
    }

    // Here we start our checks to see if anything has changed
    if (remoteUser) {
      // console.log(remoteUser);

      // Check if screen name is the same
      let result = runComparison("screen_name", localUser, remoteUser);
      console.log(result);

      // Check if Twitter name is the same
      result = runComparison("name", localUser, remoteUser);
      console.log(result);

      // Check for location change
      result = runComparison("location", localUser, remoteUser);
      console.log(result);

      // Check for description change
      result = runComparison("description", localUser, remoteUser);
      console.log(result);

      // Check profile URL
      result = runComparison("url", localUser, remoteUser);
      console.log(result);

      // // Expand URLs
      // console.log("Expanding short-urls...");
      // if (result.old) {
      //   const [error, oldUrl] = await to(tall(result.old));
      //   if (!error) console.log(`Old url un-shortened: ${oldUrl}`);
      //   else console.error(error);
      // }
      // if (result.new) {
      //   const [error, newUrl] = await to(tall(result.new));
      //   if (!error) console.log(`New url un-shortened: ${newUrl}`);
      //   else console.error(error);
      // }

      // const url: any = await longly(result.new);
      // console.log(url);

      // longly(result.new).then((result: any) => {
      //   console.log(result);
      // });

      // Check verified status
      result = runComparison("verified", localUser, remoteUser);
      console.log(result);

      // See if account protected (private)
      result = runComparison("protected", localUser, remoteUser);
      console.log(result);

      // Check favourites
      result = runComparison("favourites_count", localUser, remoteUser);
      console.log(result);

      // If number of favs to get change we want to reset the database ids
      if (localUser.value().favourites_to_fetch_count !== FAVS_TO_GET) {
        console.log(`(Re)setting favourites to fetch count...`);
        localUser
          .assign({
            favourites_to_fetch_count: FAVS_TO_GET,
            recent_favourites: undefined,
          })
          .write();
      }

      // Populate initial latest favourites and fav fetch count
      if (typeof localUser.value().recent_favourites === "undefined") {
        console.log("Recent favorites not found");
        const [favsError, favsResult] = await to(
          twitter.get("favorites/list", {
            user_id: user.id_str,
            count: FAVS_TO_GET,
          })
        );

        if (favsError) console.error(favsError);

        if (favsResult) {
          const favIds = favsResult.map((fav: any) => fav.id_str);
          console.log(`Remote favourites: ${favIds.length}`);
          console.log(favIds);
          // Write favourites to the database
          console.log("Writing current favs to database...");
          localUser
            .assign({
              recent_favourites: favIds,
            })
            .write();
        }
        // Otherwise check for changes in fav count
      } else if (result.changed) {
        console.log("Checking for new favourites...");

        const [favsError, favsResult] = await to(
          twitter.get("favorites/list", {
            user_id: user.id_str,
            count: FAVS_TO_GET,
          })
        );

        if (favsResult) {
          const favIds = favsResult.map((fav: any) => fav.id_str);
          console.log(`Remote favourites: (${favIds.length})`);
          console.log(favIds);

          const recentFavs = localUser.value().recent_favourites;

          console.log(`Saved favs: (${recentFavs.length})`);
          console.log(recentFavs);

          const newFavs = favIds.filter(
            (favId: string) => !recentFavs.includes(favId)
          );

          console.log(`Filtered favs:`);
          console.log(newFavs);
          // Write favourites to the database
          console.log("Writing current favs to database...");
          localUser.assign({ recent_favourites: favIds }).write();
        }
      }

      // Check if friend count changed (indicates following/unfollowing)
      result = runComparison("friends_count", localUser, remoteUser);
      console.log(result);

      // If number of friends to get change we want to reset the database ids
      if (localUser.value().friends_to_fetch_count !== FRIENDS_TO_GET) {
        console.log(`(Re)setting friends to fetch count...`);
        localUser
          .assign({
            friends_to_fetch_count: FRIENDS_TO_GET,
            friends_ids: undefined,
          })
          .write();
      }

      // TODO: friends/id is 15 / 15 min window rate limited so we need
      // to find a way to handle rate limiting...
    } // End of: if (remoteUser)
    console.log();
  }
};
