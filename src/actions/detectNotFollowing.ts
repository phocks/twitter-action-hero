import Twitter from "twitter-lite";

export default async (keys: any) => {
  const twitter = new Twitter(keys);

  const result = await twitter.get("friends/ids")

  console.log(result)
}