// Convert screen names into id_string object list

import Twitter, { TwitterOptions } from "twitter-lite";

const convertScreenNames = async (
  originalTargets: any,
  keys: TwitterOptions
) => {
  const twitter = new Twitter(keys);

  let newTargets: any[] = [];

  for (const user of originalTargets.targets) {
    const result = await twitter
      .get("users/show", { screen_name: user })
      .catch((error) => console.error(error));
    console.log(result.id_str);
    newTargets.push({ screen_name: user, id_str: result.id_str });
  }

  console.log(JSON.stringify(newTargets));
};

export default convertScreenNames;
