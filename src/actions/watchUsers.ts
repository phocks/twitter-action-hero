import Twitter, { TwitterOptions } from "twitter-lite";
import to from "await-to-js";
// import longly from "../lib/longly";

const appRoot = require("app-root-path");

const FAVS_TO_GET = 200;
const FRIENDS_TO_GET = 5000;

// Set up a local database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(`${appRoot}/data/watchUsers.json`);
const db = low(adapter);

db.defaults({ usersToWatch: [], screenNameChanged: [] }).write();

interface WatchedUser {
  screen_name: string;
  id_str: string;
}

const log = (thingToLog: any) => {
  // Set up loggin verbosity
  const verbose = process.env.VERBOSITY === "verbose";
  if (verbose) console.log(thingToLog);
};

const runComparison = (attribute: string, localUser: any, remoteUser: any) => {
  const localAttribute = localUser.value()[attribute];
  const remoteAttribute = remoteUser[attribute];

  if (typeof localAttribute === "undefined") {
    log(
      `"${attribute}" not found in local database. Setting to "${remoteAttribute}"`
    );
    localUser.assign({ [attribute]: remoteUser[attribute] }).write();
    return { changed: false, old: localAttribute, new: remoteAttribute };
  }

  if (remoteAttribute === localAttribute) {
    log(
      `"${attribute}" "${remoteAttribute}" hasn't changed since last time...`
    );
    return { changed: false, old: localAttribute, new: remoteAttribute };
  }

  // Finally that means it has changed
  log(
    `"${attribute}" has changed! It was "${localAttribute}" and now is "${remoteAttribute}"`
  );

  log(
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

  // Check for removed targets and clean database
  log(`Checking for removed targets...`);
  const dbTargetIds = db.get("usersToWatch").map("id_str").value();
  log(`Currently in database:`);
  log(dbTargetIds);
  const toWatchIds = usersToWatch.map((user: any) => user.id_str);
  log(`Users to watch in config:`);
  log(toWatchIds);

  // Get difference of arrays
  const idsNoLongerWatched = dbTargetIds.filter(
    (x: string) => !toWatchIds.includes(x)
  );

  log(`Users removed from config:`);
  log(idsNoLongerWatched);

  // Loop through and remove from database
  for (const id_str of idsNoLongerWatched) {
    log(`Removing ${id_str} from local database`);
    db.get("usersToWatch").remove({ id_str: id_str }).write();
  }

  // Loop through supplied targets
  for (const user of usersToWatch) {
    console.log(`Processing: ${user.screen_name}`);

    log(`Checking for user "${user.screen_name}" in local database...`);
    const userExists = db
      .get("usersToWatch")
      .find({ id_str: user.id_str })
      .value();

    // Add users if missing
    if (!userExists) {
      log("User missing in local db. Adding...");
      db.get("usersToWatch").push(user).write();
    } else {
      log(`User "${user.screen_name}" exists!`);
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
      continue; // end processing current user
    }

    // Here we start our checks to see if anything has changed
    if (remoteUser) {
      console.log(remoteUser);

      // Check if screen name is the same
      let result = runComparison("screen_name", localUser, remoteUser);
      log(result);

      if (result.changed) {
        // IMPORTANT CHANGE ESPECIALLY DUE TO VERIFIED STATUS
        console.log(
          `SCREEN NAME CHANGED from "${result.old}" to "${result.new}"`
        );

        // Tweet change out
        if (process.env.NODE_ENV === "development") {
          console.log(
            "Currently in development mode so not tweeting but would have tweeted: \n" +
              `${result.old} changed their screen name to ${result.new}`
          );
        } else {
          const [tweetError, tweetResult] = await to(
            twitter.post("statuses/update", {
              status: `${result.old} changed their screen name to ${result.new}`,
            })
          );

          if (tweetError) console.error(tweetError);
          if (tweetResult) {
            console.log(`Tweeted screen name change...`);
          }
        }

        // Screen name is also in config so log to db to update later manually
        db.get("screenNameChanged")
          .push({
            id_str: remoteUser.id_str,
            old_screen_name: result.old,
            new_screen_name: result.new,
          })
          .write();
      }

      // Check if Twitter name is the same
      result = runComparison("name", localUser, remoteUser);
      log(result);

      if (result.changed) {
        // User changed their Twitter name
        console.log(`Name from "${result.old}" to "${result.new}"`);

        // Tweet change out
        if (process.env.NODE_ENV === "development") {
          console.log(
            "Currently in development mode so not tweeting but would have tweeted: \n" +
              `${localUser.value().screen_name} changed their Twitter name from ${
                result.old
              } to ${result.new}`
          );
        } else {
          const [tweetError, tweetResult] = await to(
            twitter.post("statuses/update", {
              status: `${
                localUser.value().screen_name
              } changed their Twitter name from ${result.old} to ${result.new}`,
            })
          );

          if (tweetError) console.error(tweetError);
          if (tweetResult) {
            console.log(`Tweeted name change...`);
          }
        }
      }

      // Check for location change
      result = runComparison("location", localUser, remoteUser);
      log(result);

      // Check for description change
      result = runComparison("description", localUser, remoteUser);
      log(result);

      if (result.changed) {
        console.log(`Processing profile change...`);

        db.get("screenNameChanged")
          .push({
            id_str: remoteUser.id_str,
            local_screen_name: localUser.value().screen_name,
            remote_screen_name: remoteUser.screen_name,
          })
          .write();
      }

      // Check profile URL
      result = runComparison("url", localUser, remoteUser);
      log(result);

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
      log(result);

      // See if account protected (private)
      result = runComparison("protected", localUser, remoteUser);
      log(result);

      // Check favourites
      result = runComparison("favourites_count", localUser, remoteUser);
      log(result);

      // If number of favs to get change we want to reset the database ids
      if (localUser.value().favourites_to_fetch_count !== FAVS_TO_GET) {
        log(`(Re)setting favourites to fetch count as "${FAVS_TO_GET}"...`);
        localUser
          .assign({
            favourites_to_fetch_count: FAVS_TO_GET,
            recent_favourites: undefined,
          })
          .write();
      }

      // Populate initial latest favourites and fav fetch count
      if (typeof localUser.value().recent_favourites === "undefined") {
        log("Recent favorites not found");
        const [favsError, favsResult] = await to(
          twitter.get("favorites/list", {
            user_id: user.id_str,
            count: FAVS_TO_GET,
          })
        );

        if (favsError) console.error(favsError);

        if (favsResult) {
          const favIds = favsResult.map((fav: any) => fav.id_str);
          log(`Remote favourites: ${favIds.length}`);
          log(favIds);

          // Write favourites to the database
          log("Writing current favs to database...");
          localUser
            .assign({
              recent_favourites: favIds,
            })
            .write();
        }
      } else if (result.changed) {
        console.log(`Detected new favourites from "${user.screen_name}"`);
        log("Getting new favourites list from Twitter API...");

        const [favsError, favsResult] = await to(
          twitter.get("favorites/list", {
            user_id: user.id_str,
            count: FAVS_TO_GET,
          })
        );

        if (favsError) console.error(favsError);

        if (favsResult) {
          const favIds = favsResult.map((fav: any) => fav.id_str);
          log(`Remote favourites: (${favIds.length})`);
          log(favIds);

          const savedFavs = localUser.value().recent_favourites;

          log(`Saved favs: (${savedFavs.length})`);
          log(savedFavs);

          // Get differental of new favs
          const newFavs: string = favIds.filter(
            (favId: string) => !savedFavs.includes(favId)
          );

          console.log(`New favourites from ${newFavs}`);

          // Tweet our new favs
          for (const fav of newFavs) {
            if (result.new < result.old) {
              console.log(
                `Fav count went down. User probably un-liked. Not tweeting...`
              );

              continue;
            }
            // Get full current favourite object
            const currentFav = favsResult.find(
              (favEl: any) => favEl.id_str === fav
            );

            // log(currentFav);

            // Some minor error handling just in case
            if (!currentFav || !currentFav.user) {
              console.log(`Something bad happened with "${fav}" favourite`);
              return;
            }

            console.log(`Tweeting fav from: ${currentFav.user.screen_name}`);

            if (process.env.NODE_ENV === "development") {
              console.log(
                "Currently in development mode so not tweeting but would have tweeted: \n" +
                  `${localUser.value().screen_name} liked ` +
                  `this tweet: https://twitter.com/${currentFav.user.screen_name}/status/${fav}`
              );
            } else {
              const [tweetError, tweetResult] = await to(
                twitter.post("statuses/update", {
                  status:
                    `${localUser.value().screen_name} liked ` +
                    `this tweet: https://twitter.com/${currentFav.user.screen_name}/status/${fav}`,
                })
              );

              if (tweetError) console.error(tweetError);
              if (tweetResult) {
                console.log(
                  `Tweeted ${fav} from ${currentFav.user.screen_name}`
                );
              }
            }
          }

          // Write updated favourites to the database
          log("Writing current favs to database...");
          localUser.assign({ recent_favourites: favIds }).write();
        }
      }

      // Check if friend count changed (indicates following/unfollowing)
      result = runComparison("friends_count", localUser, remoteUser);
      log(result);

      // If number of friends to get change we want to reset the database ids
      if (localUser.value().friends_to_fetch_count !== FRIENDS_TO_GET) {
        log(`(Re)setting friends to fetch count as "${FRIENDS_TO_GET}"...`);
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
  }
};
