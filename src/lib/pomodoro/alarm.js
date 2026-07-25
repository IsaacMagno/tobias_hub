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
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
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
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    }
  } catch {
    /* áudio pode falhar após tela bloqueada / contexto interrompido */
  }
}

/**
 * Som + notificação no fim do bloco.
 * Não pede permissão aqui (isso trava/quebra o fluxo ao voltar do background).
 * Peça permissão no boot via requestAlarmPermissions.
 */
export async function notifyAlarm({ title, body, tag }) {
  if (typeof window === "undefined") return;

  try {
    await playAlarmTone();
  } catch {
    /* ignore */
  }

  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        tag: tag || "tobias-alarm",
        renotify: true,
        requireInteraction: true,
        vibrate: [400, 200, 400, 200, 400],
        data: { url: "/" },
      });
      return;
    }
  } catch {
    /* fall through */
  }

  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body, tag: tag || "tobias-alarm" });
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
