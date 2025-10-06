const nodemailer = require("nodemailer");

exports.handler = async function (event) {
  const body = JSON.parse(event.body);

  // Slack通知
  if (body.type === "slack") {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🔔 【${body.label}】（${body.time}）の時間になりました\n⏹ 停止 → https://kenkou-kanri.netlify.app/?stop=${body.id}`,
      }),
    });
  }

  // メール通知
  if (body.type === "mail") {
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
      to: body.email, // ← フロントから送られた宛先
      subject: `🔔 ${body.label}のお知らせ`,
      text: `【${body.label}】（${body.time}）の時間になりました。\n停止 → https://kenkou-kanri.netlify.app/?stop=${body.id}`,
    });
  }

  return {
    statusCode: 200,
    body: "通知成功",
  };
};

