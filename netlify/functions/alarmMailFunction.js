require("dotenv").config();
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// 🔗 URL短縮（TinyURL API）
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

// 🔔 通知送信（Slack / メール）
async function sendNotification({ type, label, time, id, email }) {
  const stopUrl = `https://kenkou-kanri.netlify.app/.netlify/functions/alarmHandler?stop=${id}&label=${label}&time=${time}&type=${type}&email=${email}`;
  const checkUrl = `https://kenkou-kanri.netlify.app/.netlify/functions/alarmHandler?check=${id}&label=${label}&time=${time}`;
  const shortStopUrl = await shortenUrl(stopUrl);
  const shortCheckUrl = await shortenUrl(checkUrl);
  const message = `🔔 【${label}】（${time}）の時間になりました\n⏹ 停止 → ${shortStopUrl}\n🔍 設定確認 → ${shortCheckUrl}`;

  if (type === "slack" || type === "both") {
    try {
      const res = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message })
      });
      console.log("Slack通知:", await res.text());
    } catch (err) {
      console.error("Slack通知エラー:", err);
    }
  }

  if (type === "mail" || type === "both") {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `🔔 ${label}のお知らせ`,
        text: message
      });
      console.log("メール通知成功");
    } catch (err) {
      console.error("メール通知エラー:", err);
    }
  }
}

// ⏹ 停止通知（Slack / メール）
async function sendStopNotice({ type, label, time, email }) {
  const message = `⏹ 【${label}】（${time}）は停止されました`;

  if (type === "slack" || type === "both") {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message })
    });
  }

  if (type === "mail" || type === "both") {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `⏹ 停止通知`,
      text: message
    });
  }
}

// 🚀 メイン関数（Netlify Functions）
exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  let body = {};

  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    console.error("リクエストボディの解析エラー:", err);
  }

  // ✅ 停止処理
  if (params.stop) {
    const id = params.stop;
    const label = params.label || "未設定";
    const time = params.time || "未設定";
    const type = params.type || "slack";
    const email = params.email || "default@example.com";

    const filePath = path.resolve("/tmp/stopped.json");
    let current = { stopped: [] };

    try {
      if (fs.existsSync(filePath)) {
        current = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    } catch (err) {
      console.error("JSON読み込みエラー:", err);
    }

    let updated = false;
    if (!current.stopped.includes(id)) {
      current.stopped.push(id);
      updated = true;
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(current));
      console.log(`⏹ 停止ID ${id} を保存しました`);
    } catch (err) {
      console.error("JSON保存エラー:", err);
    }

    // ✅ 本当に更新されたときだけ通知を送る
    if (updated) {
      await sendStopNotice({ type, label, time, email });
    }

    return {
      statusCode: 200,
      body: `⏹ アラーム「${label}」は停止されました`
    };
  }

  // ✅ 設定確認処理
  if (params.check) {
    const id = params.check;
    const label = params.label || "未設定";
    const time = params.time || "未設定";

    return {
      statusCode: 200,
      body: `🔍 アラーム「${label}」は ${time} に設定されています（ID: ${id}）`
    };
  }

  // ✅ 通知処理
  if (body.type && body.label && body.time && body.id && body.email) {
    await sendNotification(body);
    return {
      statusCode: 200,
      body: "通知送信完了"
    };
  }

  // ❌ 不正なリクエスト
  return {
    statusCode: 400,
    body: "不正なリクエストです"
  };
};