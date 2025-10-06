const fetch = require("node-fetch");

const data = {
  label: "昼休み",
  time: "12:00",
  id: "abc123",
};

(async () => {
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL_ALARM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🔔 【${data.label}】（${data.time}）の時間になりました\n⏹ 停止 → https://kenkou-kanri.netlify.app/?stop=${data.id}`,
      }),
    });
    console.log("Slack通知成功");
  } catch (error) {
    console.error("通知エラー", error);
  }
})();