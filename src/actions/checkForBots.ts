import { TwitterKeys } from "../types/types";

import Twitter from "twitter-lite";
import to from "await-to-js";
import fetch from "isomorphic-unfetch";
const puppeteer = require("puppeteer");

export const checkForBots = async (keys: TwitterKeys) => {
  const twitter = new Twitter(keys);

  let [error, result] = await to(
    twitter.get("friends/ids", { count: 5000, stringify_ids: true })
  );

  if (error) {
    console.error(error);
    return;
  }

  const { ids }: { ids: string[] } = result;

  for (const id of ids) {
    [error, result] = await to(twitter.get("users/show", { user_id: id }));

    if (error) {
      console.error(error);
      return;
    }

    const { screen_name: screenName } = result;
    console.log(screenName);

    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.goto(`https://botsentinel.com/analyze?twitterHandleInput=${screenName}`);
    // await page.screenshot({ path: "example.png" });

    // await browser.close();

    // result = await fetch(`https://botsentinel.com/analyze?twitterHandleInput=${screenName}`)
    // const data = await result.text();
    // console.log(data)

    // if (error) {
    //   console.error(error);
    //   return;
    // }

    // const { handle, score } = data.data;

    // console.log(`${handle}:`, score);
  }
};
