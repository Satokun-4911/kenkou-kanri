const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const { shortenUrl } = require("./shorten");

// 🔔 通知送信（Slack / メール）
async function sendNotification({ type, label, time, id, email }) {
  const stopUrl = `https://kenkou-kanri.netlify.app/.netlify/functions/alarmHandler?stop=${id}&label=${label}&time=${time}&type=${type}&email=${email}`;
  const checkUrl = `https://kenkou-kanri.netlify.app/.netlify/functions/alarmHandler?check=${id}&label=${label}&time=${time}`;
  const shortStopUrl = await shortenUrl(stopUrl);
  const shortCheckUrl = await shortenUrl(checkUrl);

  const message = `🔔 【${label}】（${time}）の時間になりました\n⏹ 停止 → ${shortStopUrl}\n🔍 設定確認 → ${shortCheckUrl}`;

  // Slack通知
  if ((type === "slack" || type === "both") && process.env.SLACK_WEBHOOK_URL) {
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

  // メール通知
  if ((type === "mail" || type === "both") && process.env.SMTP_USER) {
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

  // Slack通知
  if ((type === "slack" || type === "both") && process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message })
    });
  }

  // メール通知
  if ((type === "mail" || type === "both") && process.env.SMTP_USER) {
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

module.exports = { sendNotification, sendStopNotice };