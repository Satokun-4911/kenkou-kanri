function stopAlarm(id) {
  console.log(`アラーム ${id} を停止`);
  const el = document.getElementById(id);
  if (el) el.remove();

  const audio = document.getElementById(`audio-${id}`);
  if (audio) audio.pause();
}

function startAlarmMonitor() {
  setInterval(async () => {
    try {
      const res = await fetch("/stopped.json");
      const stoppedList = await res.json();
      stoppedList.forEach(id => stopAlarm(id));
    } catch (err) {
      console.error("停止状態の取得エラー:", err);
    }
  }, 3000);
}

startAlarmMonitor();