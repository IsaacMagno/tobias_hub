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

function isPageVisible() {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "visible";
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
}

export async function playAlarmTone({ loops = 4 } = {}) {
  // Com a tela bloqueada o Web Audio costuma falhar/travar — só toca em foreground.
  if (!isPageVisible()) return;
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
    /* áudio pode falhar após background */
  }
}

async function showAlarmNotification({ title, body, tag }) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const opts = {
    body: body || "",
    tag: tag || "tobias-alarm",
    data: { url: "/timer" },
    silent: false,
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("sw-ready-timeout")), 2000)
        ),
      ]);
      if (reg?.showNotification) {
        await reg.showNotification(title, opts);
        return;
      }
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

/**
 * Som (só se app visível) + notificação.
 * Nunca pede permissão aqui — isso quebra o fluxo ao voltar do background.
 */
export async function notifyAlarm({ title, body, tag }) {
  if (typeof window === "undefined") return;
  try {
    await showAlarmNotification({ title, body, tag });
  } catch {
    /* ignore */
  }
  try {
    await playAlarmTone();
  } catch {
    /* ignore */
  }
}

/** Desbloqueia áudio e pede notificação (chamar a partir de gesto do usuário). */
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
