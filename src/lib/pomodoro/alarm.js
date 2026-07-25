/** Alarme estilo despertador via Web Audio (sem arquivo externo). */
let audioCtx = null;

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
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended" || ctx.state === "interrupted") {
      await ctx.resume();
    }
  } catch {
    /* ignore — comum após tela bloqueada */
  }
}

export async function playAlarmTone({ loops = 4 } = {}) {
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
      // linearRamp evita InvalidStateError do exponential com gain ~0
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.linearRampToValueAtTime(0, t0 + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    }
  } catch {
    /* áudio pode falhar sem derrubar o app */
  }
}

/**
 * Som + notificação. Nunca lança / rejeita — o crash vinha daqui sem catch.
 * Não pede permissão aqui (gesto do usuário / tela Timer).
 */
export async function notifyAlarm({ title, body, tag }) {
  if (typeof window === "undefined") return;

  try {
    await playAlarmTone();
  } catch {
    /* ignore */
  }

  try {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const opts = {
      body: body || "",
      tag: tag || "tobias-alarm",
      renotify: true,
      requireInteraction: true,
      vibrate: [400, 200, 400, 200, 400],
      data: { url: "/" },
    };

    try {
      const reg = await navigator.serviceWorker?.ready;
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
  } catch {
    /* ignore */
  }
}
