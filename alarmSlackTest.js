require("dotenv").config();
const fetch = require("node-fetch");

const data = {
  label: "昼休み",
  time: "12:00",
  id: "abc123",
};

(async () => {
  console.log("Slack通知処理開始");

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  console.log("Webhook URL:", webhookUrl);

  if (!webhookUrl) {
    console.error("Slack Webhook URL が未定義です。環境変数 SLACK_WEBHOOK_URL を確認してください。");
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🔔 【${data.label}】（${data.time}）の時間になりました\n⏹ 停止 → https://kenkou-kanri.netlify.app/?stop=${data.id}`,
      }),
    });

    console.log("Slack通知レスポンス:", res.status);
    const text = await res.text();
    console.log("Slack通知レスポンス内容:", text);

    if (res.ok) {
      console.log("✅ Slack通知成功");
    } else {
      console.error("❌ Slack通知失敗（ステータスコード異常）");
    }
  } catch (error) {
    console.error("❌ Slack通知エラー:", error);
  }
})();