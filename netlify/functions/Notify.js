// ⏹ アラーム停止監視（3秒ごとに stopped.json を確認）
function startAlarmMonitor() {
  setInterval(async () => {
    try {
      const res = await fetch("/stopped.json");
      const stoppedList = await res.json();
      stoppedList.stopped.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();

        const audio = document.getElementById(`audio-${id}`);
        if (audio) audio.pause();
      });
    } catch (err) {
      console.error("停止状態の取得エラー:", err);
    }
  }, 3000);
}

// 🚀 ページ読み込み時にアラーム初期化＋停止監視開始
document.addEventListener("DOMContentLoaded", () => {
  initAlarms();         // アラーム表示・再生処理
  startAlarmMonitor();  // 停止監視開始
});