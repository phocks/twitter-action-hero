import fetch from "isomorphic-unfetch";

export default async (shortUrl: string) => {
  try {
    const response = await fetch(shortUrl);
    const newUrl = response.url;
    return newUrl;
  } catch (error) {
    throw error;
  }
};
