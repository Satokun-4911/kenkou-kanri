require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { sendNotification, sendStopNotice } = require("./notify");
const { shortenUrl } = require("./shorten");

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  let body = {};

  // ✅ CORSプリフライト対応（OPTIONSメソッド）
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
      },
      body: "CORSプリフライトOK"
    };
  }

  // 🔍 通知用のリクエストボディ解析
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    console.error("リクエストボディの解析エラー:", err);
  }

  // ✅ 停止処理（リンクを押したときだけ通知）
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

    if (updated) {
      await sendStopNotice({ type, label, time, email });
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
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
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: `🔍 アラーム「${label}」は ${time} に設定されています（ID: ${id}）`
    };
  }

  // ✅ 通知処理（アラーム時間に通知を送る）
  if (body.type && body.label && body.time && body.id && body.email) {
    await sendNotification(body);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: "通知送信完了"
    };
  }

  // ❌ 不正なリクエスト
  return {
    statusCode: 400,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: "不正なリクエストです"
  };
};