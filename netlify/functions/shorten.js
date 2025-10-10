const fetch = require("node-fetch");

async function shortenUrl(longUrl) {
  try {
    const res = await fetch("https://api.tinyurl.com/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TINYURL_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: longUrl, domain: "tinyurl.com" })
    });
    const data = await res.json();
    return data?.data?.tiny_url || longUrl;
  } catch (err) {
    console.error("URL短縮エラー:", err);
    return longUrl;
  }
}

module.exports = { shortenUrl };