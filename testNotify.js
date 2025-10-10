// 📦 Netlify Function を読み込み
const { handler } = require("./netlify/functions/alarmMailFunction");

// 🧪 テストイベント定義
const testEvent = {
  body: JSON.stringify({
    type: "both", // "slack", "mail", or "both"
    label: "テスト通知",
    time: "15:30",
    id: "test123",
    email: "ep2a2ahg@gmail.com"
  }),
  httpMethod: "POST",
  headers: { "Content-Type": "application/json" }
};

// 🚀 関数実行テスト
(async () => {
  console.log("🔧 通知関数テスト開始");

  try {
    const res = await handler(testEvent);
    console.log("✅ 関数の戻り値:", res.statusCode, res.body);
  } catch (err) {
    console.error("❌ 関数実行エラー:", err);
  }
})();