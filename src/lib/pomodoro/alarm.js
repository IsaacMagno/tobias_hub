/** Alarme + keep-alive para PWA (Android com tela bloqueada). */

let audioCtx = null;
let keepAliveAudio = null;
let alarmAudio = null;

const ALARM_TAG = "tobias-alarm";
const RUNNING_TAG = "tobias-timer-running";

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AC();
    }
  } catch {
    return null;
  }
  return audioCtx;
}

export async function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended" || ctx.state === "interrupted") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
  // Prepara elementos HTMLAudio (gesto do usuário).
  try {
    ensureAlarmAudio();
    ensureKeepAliveAudio();
  } catch {
    /* ignore */
  }
}

/** WAV curto em loop quase inaudível — reduz freeze do Chrome com tela bloqueada. */
function buildSilentWavDataUri() {
  const sampleRate = 8000;
  const seconds = 1;
  const numSamples = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);
  // amplitude mínima (não silêncio total — alguns Androids pausam áudio 100% quieto)
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, i % 64 === 0 ? 2 : 0, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/** WAV de bipe agudo para o alarme (HTMLAudio sobrevive melhor em background). */
function buildAlarmWavDataUri() {
  const sampleRate = 22050;
  const duration = 0.55;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = t < 0.2 ? 880 : 660;
    const env = Math.min(1, t * 30) * Math.max(0, 1 - (t - 0.35) * 4);
    const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.55;
    view.setInt16(44 + i * 2, (sample * 0x7fff) | 0, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function ensureKeepAliveAudio() {
  if (typeof window === "undefined") return null;
  if (!keepAliveAudio) {
    keepAliveAudio = new Audio(buildSilentWavDataUri());
    keepAliveAudio.loop = true;
    keepAliveAudio.preload = "auto";
    keepAliveAudio.volume = 0.01;
  }
  return keepAliveAudio;
}

function ensureAlarmAudio() {
  if (typeof window === "undefined") return null;
  if (!alarmAudio) {
    alarmAudio = new Audio(buildAlarmWavDataUri());
    alarmAudio.preload = "auto";
    alarmAudio.volume = 1;
  }
  return alarmAudio;
}

/** Mantém o processo um pouco mais vivo com a tela bloqueada (PWA Android). */
export async function startTimerKeepAlive() {
  try {
    await unlockAudio();
    const audio = ensureKeepAliveAudio();
    if (!audio) return;
    audio.currentTime = 0;
    await audio.play();
  } catch {
    /* ignore — sem keep-alive o alarme ainda tenta via notificação */
  }
}

export function stopTimerKeepAlive() {
  try {
    if (keepAliveAudio) {
      keepAliveAudio.pause();
      keepAliveAudio.currentTime = 0;
    }
  } catch {
    /* ignore */
  }
}

async function playHtmlAlarm({ loops = 8 } = {}) {
  const audio = ensureAlarmAudio();
  if (!audio) return;
  for (let i = 0; i < loops; i++) {
    try {
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
      await new Promise((r) => setTimeout(r, 700));
    } catch {
      break;
    }
  }
}

async function playWebAudioAlarm({ loops = 8 } = {}) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    await unlockAudio();
    const now = ctx.currentTime;
    for (let i = 0; i < loops; i++) {
      const t0 = now + i * 0.85;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.setValueAtTime(660, t0 + 0.2);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.22, t0 + 0.02);
      gain.gain.linearRampToValueAtTime(0, t0 + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    }
  } catch {
    /* ignore */
  }
}

/** Toca alarme mesmo com tela bloqueada (tenta HTMLAudio + WebAudio). */
export async function playAlarmTone({ loops = 8 } = {}) {
  stopTimerKeepAlive();
  // HTMLAudio primeiro — costuma ser o que o Android deixa tocar em background.
  await playHtmlAlarm({ loops });
  await playWebAudioAlarm({ loops });
}

async function getSwRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("sw-ready-timeout")), 2000)
      ),
    ]);
  } catch {
    return null;
  }
}

async function showAlarmNotification({ title, body, tag }) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const opts = {
    body: body || "",
    tag: tag || ALARM_TAG,
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [500, 200, 500, 200, 500, 200, 800],
    data: { url: "/timer", kind: "alarm" },
    badge: "/icons/icon-192.png",
    icon: "/icons/icon-192.png",
  };

  try {
    await clearNotificationsByTag(RUNNING_TAG);
  } catch {
    /* ignore */
  }

  try {
    const reg = await getSwRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, opts);
      return;
    }
  } catch {
    /* fall through */
  }

  try {
    // eslint-disable-next-line no-new
    new Notification(title, opts);
  } catch {
    /* ignore */
  }
}

async function clearNotificationsByTag(tag) {
  const reg = await getSwRegistration();
  if (!reg?.getNotifications) return;
  const list = await reg.getNotifications({ tag });
  list.forEach((n) => n.close());
}

/**
 * Notificação persistente enquanto o timer roda — ajuda o Android a não matar o PWA.
 */
export async function showRunningTimerNotification({
  title = "Tobias · timer em andamento",
  body = "O alarme vai tocar ao terminar o bloco.",
} = {}) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const opts = {
    body,
    tag: RUNNING_TAG,
    silent: true,
    requireInteraction: false,
    ongoing: true,
    data: { url: "/timer", kind: "running" },
    badge: "/icons/icon-192.png",
    icon: "/icons/icon-192.png",
  };

  try {
    const reg = await getSwRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, opts);
      return;
    }
  } catch {
    /* ignore */
  }
}

export async function clearRunningTimerNotification() {
  try {
    await clearNotificationsByTag(RUNNING_TAG);
  } catch {
    /* ignore */
  }
}

/**
 * Agenda alarme no Service Worker (backup se a página for congelada).
 * O SW tenta waitUntil+setTimeout; no Android pode sobreviver alguns minutos.
 */
export async function scheduleServiceWorkerAlarm({
  endsAt,
  title,
  body,
  tag,
}) {
  try {
    const reg = await getSwRegistration();
    const worker = reg?.active || navigator.serviceWorker?.controller;
    if (!worker) return;
    worker.postMessage({
      type: "SCHEDULE_ALARM",
      endsAt,
      title,
      body,
      tag: tag || ALARM_TAG,
    });
  } catch {
    /* ignore */
  }
}

export async function cancelServiceWorkerAlarm() {
  try {
    const reg = await getSwRegistration();
    const worker = reg?.active || navigator.serviceWorker?.controller;
    worker?.postMessage({ type: "CANCEL_ALARM" });
  } catch {
    /* ignore */
  }
}

/**
 * Dispara notificação + som (também com tela bloqueada).
 * Nunca pede permissão aqui.
 */
export async function notifyAlarm({ title, body, tag }) {
  if (typeof window === "undefined") return;
  try {
    await showAlarmNotification({ title, body, tag });
  } catch {
    /* ignore */
  }
  try {
    await playAlarmTone({ loops: 8 });
  } catch {
    /* ignore */
  }
}

/** Desbloqueia áudio e pede notificação (gesto do usuário). */
export async function requestAlarmPermissions() {
  await unlockAudio();
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { audio: true, notification: "unsupported" };
  }
  let permission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = Notification.permission;
    }
  }
  return { audio: true, notification: permission };
}
