const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

async function shortenUrl(longUrl) {
  const res = await fetch("https://api.tinyurl.com/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TINYURL_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: longUrl,
      domain: "tinyurl.com"
    })
  });

  const data = await res.json();
  return data?.data?.tiny_url || longUrl;
}

exports.handler = async (event) => {
  const { type, label, time, id, email } = JSON.parse(event.body);

  const originalUrl = `https://kenkou-kanri.netlify.app/?stop=${id}`;
  const shortUrl = await shortenUrl(originalUrl);

  const message = `🔔 【${label}】（${time}）の時間になりました\n⏹ 停止 → ${shortUrl}`;

  // Slack通知
  if (type === "slack") {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message })
    });
  }

  // メール通知
  if (type === "mail") {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🔔 ${label}のお知らせ`,
      text: message,
    });
  }

  return {
    statusCode: 200,
    body: "通知送信完了"
  };
};