"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import type { Language } from "@/lib/i18n";

/* Escáner de entradas para la puerta (tablet o teléfono) y para el panel.
   Cámara con html5-qrcode (trasera por defecto; requiere HTTPS) y entrada manual del código como respaldo.
   Flujo: escanear → POST /api/verify {action:"verify"} → resultado grande → "Registrar ingreso" → {action:"checkin"}. */

/** Entrada tal como la devuelve `POST /api/verify` (`number` = 0 si el QR es de una orden completa antigua). */
export interface ScannedTicket {
  code: string;
  number: number;
  attendeeName: string | null;
  customerName: string;
  customerDocId: string;
  tastingTitle: string;
  tastingDate: string;
  tastingTime: string;
  dietaryRestrictions: string | null;
  checkedInAt: string | null;
  orderSpots: number;
  orderCheckedIn: number;
}

interface VerifyResponse {
  success: boolean;
  message: string;
  ticket?: ScannedTicket;
}

type Action = "verify" | "checkin";
type Facing = "environment" | "user";
type CameraState = "starting" | "on" | "off" | "error";
type CameraProblem = "denied" | "insecure" | "no_camera" | "other";

const SCANNER_COPY = {
  es: {
    cameraLabel: "Cámara del escáner",
    starting: "Encendiendo la cámara…",
    aim: "Apunte la cámara al código QR de la entrada",
    cameraOff: "Cámara apagada",
    turnOn: "Encender cámara",
    turnOff: "Apagar cámara",
    switchCamera: "Cambiar cámara",
    retry: "Reintentar",
    problems: {
      denied: "El navegador no tiene permiso para usar la cámara. Actívelo en los ajustes del sitio y pulse Reintentar.",
      insecure: "La cámara solo funciona con una conexión segura (https://). Use la entrada manual.",
      no_camera: "No se encontró ninguna cámara en este dispositivo. Use la entrada manual.",
      other: "No se pudo encender la cámara. Pulse Reintentar o use la entrada manual.",
    } satisfies Record<CameraProblem, string>,
    manualLabel: "Código de la entrada",
    manualHint: "Escriba el código impreso bajo el QR (ej. EO-7KQ2M-1).",
    manualSubmit: "Verificar",
    verifying: "Verificando…",
    checkingIn: "Registrando…",
    waitingTitle: "Listo para escanear",
    waitingText: "Cada QR es una persona. Al leerlo verá aquí si la entrada es válida.",
    valid: "Entrada válida",
    checkedIn: "Ingreso registrado",
    used: "Entrada ya utilizada",
    invalid: "Entrada no válida",
    notFound: "Código no encontrado",
    connection: "Error de conexión. Revise el internet e intente de nuevo.",
    offline: "Sin conexión",
    retryScan: "Reintentar",
    entryOf: (n: number, total: number) => `Entrada ${n} de ${total}`,
    wholeOrder: (total: number) => `Reserva completa · ${total} ${total === 1 ? "persona" : "personas"}`,
    buyer: "Comprador",
    docId: "Cédula",
    tasting: "Cata",
    when: "Fecha",
    code: "Código",
    group: "Grupo",
    groupProgress: (inside: number, total: number) => `${inside} de ${total} ya ingresaron`,
    diet: "Dieta",
    usedAt: "Ingresó",
    checkin: "Registrar ingreso",
    checkinMany: (n: number) => `Registrar ingreso (${n} personas)`,
    next: "Escanear siguiente",
    cancel: "Cancelar",
    autoNext: "Volviendo al escáner…",
    soundOn: "Sonido activado",
    soundOff: "Sonido desactivado",
    close: "Cerrar escáner",
    title: "Escáner de entradas",
  },
  en: {
    cameraLabel: "Scanner camera",
    starting: "Starting the camera…",
    aim: "Point the camera at the ticket QR code",
    cameraOff: "Camera off",
    turnOn: "Turn camera on",
    turnOff: "Turn camera off",
    switchCamera: "Switch camera",
    retry: "Retry",
    problems: {
      denied: "The browser is not allowed to use the camera. Enable it in the site settings and tap Retry.",
      insecure: "The camera only works over a secure connection (https://). Use manual entry.",
      no_camera: "No camera was found on this device. Use manual entry.",
      other: "The camera could not be started. Tap Retry or use manual entry.",
    } satisfies Record<CameraProblem, string>,
    manualLabel: "Ticket code",
    manualHint: "Type the code printed under the QR (e.g. EO-7KQ2M-1).",
    manualSubmit: "Verify",
    verifying: "Verifying…",
    checkingIn: "Checking in…",
    waitingTitle: "Ready to scan",
    waitingText: "Each QR admits one person. When it is read you will see here whether the ticket is valid.",
    valid: "Valid ticket",
    checkedIn: "Checked in",
    used: "Ticket already used",
    invalid: "Invalid ticket",
    notFound: "Code not found",
    connection: "Connection error. Check the internet and try again.",
    offline: "No connection",
    retryScan: "Try again",
    entryOf: (n: number, total: number) => `Ticket ${n} of ${total}`,
    wholeOrder: (total: number) => `Whole booking · ${total} ${total === 1 ? "person" : "people"}`,
    buyer: "Buyer",
    docId: "ID number",
    tasting: "Tasting",
    when: "Date",
    code: "Code",
    group: "Group",
    groupProgress: (inside: number, total: number) => `${inside} of ${total} already checked in`,
    diet: "Diet",
    usedAt: "Checked in",
    checkin: "Check in",
    checkinMany: (n: number) => `Check in (${n} people)`,
    next: "Scan next",
    cancel: "Cancel",
    autoNext: "Returning to the scanner…",
    soundOn: "Sound on",
    soundOff: "Sound off",
    close: "Close scanner",
    title: "Ticket scanner",
  },
};

type ScannerCopy = (typeof SCANNER_COPY)["es"];

const FACING_KEY = "eo_scanner_facing";
const SOUND_KEY = "eo_scanner_sound";
/** Tiempo durante el que se ignora el mismo QR (sigue frente a la cámara tras el resultado). */
const SAME_CODE_COOLDOWN_MS = 5000;
const AUTO_NEXT_MS = 3500;

function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Almacenamiento bloqueado: la preferencia dura solo esta sesión.
  }
}

function cameraProblem(error: unknown): CameraProblem {
  if (typeof window !== "undefined" && !window.isSecureContext) return "insecure";
  const text = String(error instanceof Error ? `${error.name} ${error.message}` : error);
  if (/NotAllowed|Permission|denied/i.test(text)) return "denied";
  if (/NotFound|Overconstrained|no camera|Requested device not found/i.test(text)) return "no_camera";
  return "other";
}

const timeInCaracas = (iso: string, lang: Language) =>
  new Date(iso).toLocaleString(lang === "es" ? "es-VE" : "en-US", {
    timeZone: "America/Caracas",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

/* ─── Cámara ─── */

interface QrCameraProps {
  active: boolean;
  facing: Facing;
  onDecode: (text: string) => void;
  onStateChange: (state: CameraState, problem?: CameraProblem) => void;
  label: string;
}

interface CameraSession {
  cancelled: boolean;
  scanner: Html5Qrcode | null;
}

/** Arranques y paradas de la cámara en serie (una sola cámara a la vez, aunque se cambie o se reintente). */
let cameraQueue: Promise<void> = Promise.resolve();

/** Vista de la cámara con html5-qrcode. El video conserva su proporción (la zona de lectura se calcula sobre él)
    y el contenedor lo centra y recorta. */
function QrCamera({ active, facing, onDecode, onStateChange, label }: QrCameraProps) {
  const elementId = `qr-camera-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const decodeRef = useRef(onDecode);
  const stateRef = useRef(onStateChange);
  decodeRef.current = onDecode;
  stateRef.current = onStateChange;

  useEffect(() => {
    if (!active) {
      stateRef.current("off");
      return;
    }
    const session: CameraSession = { cancelled: false, scanner: null };

    const start = async () => {
      if (session.cancelled) return;
      stateRef.current("starting");
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        stateRef.current("error", window.isSecureContext ? "no_camera" : "insecure");
        return;
      }
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (session.cancelled) return;
        const scanner = new Html5Qrcode(elementId, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
        });
        session.scanner = scanner;
        await scanner.start(
          { facingMode: facing },
          {
            fps: 12,
            qrbox: (w: number, h: number) => {
              const size = Math.max(160, Math.floor(Math.min(w, h) * 0.72));
              return { width: size, height: size };
            },
          },
          (text) => decodeRef.current(text),
          () => {
            // Sin QR en este cuadro: es lo normal mientras se apunta.
          }
        );
        if (!session.cancelled) stateRef.current("on");
      } catch (error) {
        if (!session.cancelled) stateRef.current("error", cameraProblem(error));
      }
    };

    const stop = async () => {
      const scanner = session.scanner;
      if (!scanner) return;
      try {
        if (scanner.isScanning) await scanner.stop();
      } catch {
        // Ya estaba detenida.
      }
      try {
        scanner.clear();
      } catch {
        // Nada que limpiar.
      }
    };

    cameraQueue = cameraQueue.then(start).catch(() => {});
    return () => {
      session.cancelled = true;
      cameraQueue = cameraQueue.then(stop).catch(() => {});
    };
  }, [active, facing, elementId]);

  return (
    <div
      id={elementId}
      aria-label={label}
      role="img"
      className="w-full [&_video]:block"
    />
  );
}

/* ─── Sonido y vibración ─── */

type Feedback = "valid" | "done" | "bad";

function useFeedback(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  /** iOS solo permite audio tras un toque: se llama en cada interacción con el escáner. */
  const unlock = useCallback(() => {
    if (!enabled) return;
    if (!ctxRef.current) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      ctxRef.current = new Ctx();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
  }, [enabled]);

  const play = useCallback(
    (kind: Feedback) => {
      try {
        navigator.vibrate?.(kind === "bad" ? [180, 90, 180] : kind === "done" ? [60, 50, 120] : 80);
      } catch {
        // Sin vibración en este dispositivo.
      }
      const ctx = ctxRef.current;
      if (!enabled || !ctx || ctx.state !== "running") return;
      const tones = kind === "bad" ? [220, 180] : kind === "done" ? [660, 990] : [880];
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const at = ctx.currentTime + i * 0.16;
        osc.type = kind === "bad" ? "square" : "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(kind === "bad" ? 0.12 : 0.25, at + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 0.15);
      });
    },
    [enabled]
  );

  useEffect(() => () => void ctxRef.current?.close().catch(() => {}), []);

  return { unlock, play };
}

/** Mantiene la pantalla encendida mientras la cámara está activa (tablet en la puerta). */
function useWakeLock(active: boolean) {
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const wakeLock = (navigator as unknown as { wakeLock?: { request: (type: "screen") => Promise<Sentinel> } }).wakeLock;
    if (!active || !wakeLock) return;
    let sentinel: Sentinel | null = null;
    let released = false;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      wakeLock
        .request("screen")
        .then((s) => {
          if (released) s.release().catch(() => {});
          else sentinel = s;
        })
        .catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", request);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}

/* ─── Escáner completo ─── */

interface ScanResult {
  action: Action;
  input: string;
  response: VerifyResponse;
  /** No hubo respuesta del servidor (red caída). */
  offline: boolean;
}

type Phase = "idle" | "verifying" | "result" | "checking_in";

export interface DoorScannerProps {
  lang?: Language;
  /** "fullscreen" ocupa todo el alto disponible (modo puerta en tablet). */
  layout?: "panel" | "fullscreen";
  /** La sesión de puerta/admin expiró (la API respondió 401). */
  onUnauthorized?: () => void;
}

export function DoorScanner({ lang = "es", layout = "panel", onUnauthorized }: DoorScannerProps) {
  const t = SCANNER_COPY[lang];
  const manualId = useId();

  const [facing, setFacing] = useState<Facing>("environment");
  const [cameraOn, setCameraOn] = useState(true);
  const [cameraState, setCameraState] = useState<CameraState>("starting");
  const [problem, setProblem] = useState<CameraProblem | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [sound, setSound] = useState(true);
  const [manual, setManual] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);

  const phaseRef = useRef<Phase>("idle");
  const lastScan = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const resultRef = useRef<HTMLElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const prevPhase = useRef<Phase>("idle");
  const { unlock, play } = useFeedback(sound);

  useWakeLock(cameraOn && cameraState === "on");

  // html5-qrcode fija el tamaño del video al arrancar: al girar la tablet se reinicia la cámara.
  useEffect(() => {
    let width = window.innerWidth;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (Math.abs(window.innerWidth - width) < 80) return;
        width = window.innerWidth;
        setCameraKey((k) => k + 1);
      }, 400);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const savedFacing = readPref(FACING_KEY);
    if (savedFacing === "user" || savedFacing === "environment") setFacing(savedFacing);
    if (readPref(SOUND_KEY) === "off") setSound(false);
  }, []);

  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const reset = useCallback(() => {
    setPhaseBoth("idle");
    setResult(null);
  }, [setPhaseBoth]);

  const call = useCallback(
    async (input: string, action: Action) => {
      setPhaseBoth(action === "checkin" ? "checking_in" : "verifying");
      let response: VerifyResponse;
      let offline = false;
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: input, action }),
        });
        if (res.status === 401 || res.status === 403) {
          reset();
          onUnauthorized?.();
          return;
        }
        response = await res.json();
      } catch {
        offline = true;
        response = { success: false, message: t.connection };
      }
      lastScan.current = { text: input, at: offline ? 0 : Date.now() };
      setResult({ action, input, response, offline });
      setPhaseBoth("result");
      play(!response.success ? "bad" : action === "checkin" ? "done" : "valid");
    },
    [onUnauthorized, play, reset, setPhaseBoth, t.connection]
  );

  const onDecode = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || phaseRef.current !== "idle") return;
      const { text: prev, at } = lastScan.current;
      if (value === prev && Date.now() - at < SAME_CODE_COOLDOWN_MS) return;
      void call(value, "verify");
    },
    [call]
  );

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const value = manual.trim();
    if (!value || phaseRef.current === "verifying" || phaseRef.current === "checking_in") return;
    setManual("");
    void call(value, "verify");
  };

  // Tras un ingreso correcto vuelve solo al escáner.
  const checkedInOk = phase === "result" && result?.action === "checkin" && result.response.success;
  useEffect(() => {
    if (!checkedInOk) return;
    const timer = setTimeout(() => {
      lastScan.current = { ...lastScan.current, at: Date.now() };
      reset();
    }, AUTO_NEXT_MS);
    return () => clearTimeout(timer);
  }, [checkedInOk, reset]);

  // En teléfonos el resultado queda debajo de la cámara: se lleva a la vista, y luego se vuelve a la cámara.
  useEffect(() => {
    if (phase === "result") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    else if (phase === "idle" && prevPhase.current === "result") cameraRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    prevPhase.current = phase;
  }, [phase]);

  const onCameraState = useCallback((state: CameraState, p?: CameraProblem) => {
    setCameraState(state);
    setProblem(state === "error" ? p ?? "other" : null);
  }, []);

  const switchCamera = () => {
    const next: Facing = facing === "environment" ? "user" : "environment";
    setFacing(next);
    writePref(FACING_KEY, next);
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    writePref(SOUND_KEY, next ? "on" : "off");
  };

  const busy = phase === "verifying" || phase === "checking_in";
  const fullscreen = layout === "fullscreen";

  return (
    <div
      onPointerDown={unlock}
      className={`grid gap-4 lg:gap-6 md:grid-cols-2 ${fullscreen ? "md:h-full md:min-h-0" : ""}`}
    >
      {/* Cámara + entrada manual */}
      <section className={`flex flex-col gap-3 min-w-0 ${fullscreen ? "md:min-h-0" : ""}`} aria-label={t.cameraLabel}>
        <div
          ref={cameraRef}
          className={`relative w-full overflow-hidden rounded-2xl bg-ink flex items-center justify-center scroll-mt-4 ${
            fullscreen ? "aspect-square md:aspect-auto md:flex-1 md:min-h-[280px]" : "aspect-square sm:aspect-[4/3] md:aspect-square"
          }`}
        >
          {cameraOn && (
            <QrCamera
              key={cameraKey}
              active={cameraOn}
              facing={facing}
              onDecode={onDecode}
              onStateChange={onCameraState}
              label={t.cameraLabel}
            />
          )}

          {(cameraState !== "on" || !cameraOn) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-paper">
              <span
                className={`material-symbols-outlined text-5xl text-paper/70 ${cameraOn && cameraState === "starting" ? "animate-pulse" : ""}`}
                aria-hidden="true"
              >
                {!cameraOn ? "videocam_off" : cameraState === "error" ? "no_photography" : "photo_camera"}
              </span>
              <p className="text-[15px] leading-relaxed max-w-xs" role={cameraState === "error" ? "alert" : "status"}>
                {!cameraOn ? t.cameraOff : cameraState === "error" ? t.problems[problem ?? "other"] : t.starting}
              </p>
              {cameraOn && cameraState === "error" && problem !== "insecure" && problem !== "no_camera" && (
                <button
                  type="button"
                  onClick={() => setCameraKey((k) => k + 1)}
                  className="h-12 px-6 rounded bg-paper text-ink text-[14px] font-semibold"
                >
                  {t.retry}
                </button>
              )}
            </div>
          )}

          {cameraOn && cameraState === "on" && phase === "idle" && (
            <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-center text-[14px] font-semibold text-white">
              {t.aim}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <ToolbarButton
            icon="cameraswitch"
            label={t.switchCamera}
            onClick={switchCamera}
            disabled={!cameraOn || cameraState === "starting"}
          />
          <ToolbarButton
            icon={cameraOn ? "videocam_off" : "videocam"}
            label={cameraOn ? t.turnOff : t.turnOn}
            onClick={() => setCameraOn((v) => !v)}
          />
          <ToolbarButton
            icon={sound ? "volume_up" : "volume_off"}
            label={sound ? t.soundOn : t.soundOff}
            onClick={toggleSound}
            pressed={sound}
          />
        </div>

        <form onSubmit={submitManual} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
          <label htmlFor={manualId} className="block text-[13px] font-semibold">
            {t.manualLabel}
          </label>
          <p id={`${manualId}-hint`} className="text-[12px] text-on-surface-variant mt-0.5">
            {t.manualHint}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              id={manualId}
              type="text"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              aria-describedby={`${manualId}-hint`}
              placeholder="EO-XXXXX-1"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="min-w-0 flex-1 h-12 rounded border border-outline-variant bg-surface-container-lowest px-3.5 font-mono text-[16px] uppercase tracking-wider focus:border-primary-container focus:outline-none"
            />
            <button
              type="submit"
              disabled={!manual.trim() || busy}
              className="h-12 px-5 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold disabled:opacity-50"
            >
              {t.manualSubmit}
            </button>
          </div>
        </form>
      </section>

      {/* Resultado */}
      <section ref={resultRef} className={`min-w-0 scroll-mt-4 ${fullscreen ? "md:min-h-0 md:overflow-y-auto" : ""}`} aria-live="polite">
        {phase === "verifying" ? (
          <StatusCard icon="hourglass_top" title={t.verifying} spinning />
        ) : result && (phase === "result" || phase === "checking_in") ? (
          <ResultCard
            result={result}
            t={t}
            lang={lang}
            busy={phase === "checking_in"}
            autoNext={checkedInOk}
            onCheckin={() => void call(result.input, "checkin")}
            onRetry={() => void call(result.input, result.action)}
            onNext={() => {
              lastScan.current = { ...lastScan.current, at: Date.now() };
              reset();
            }}
          />
        ) : (
          <StatusCard icon="qr_code_scanner" title={t.waitingTitle} text={t.waitingText} />
        )}
      </section>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  pressed,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className="inline-flex items-center gap-2 h-12 px-4 rounded border border-outline-variant bg-surface-container-lowest text-[13px] font-semibold hover:border-primary-container disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}

function StatusCard({ icon, title, text, spinning }: { icon: string; title: string; text?: string; spinning?: boolean }) {
  return (
    <div className="h-full min-h-[220px] rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-3 p-8 text-center">
      <span className={`material-symbols-outlined text-5xl text-primary-container ${spinning ? "animate-spin" : ""}`} aria-hidden="true">
        {spinning ? "progress_activity" : icon}
      </span>
      <p className="font-serif text-2xl text-on-surface" role="status">
        {title}
      </p>
      {text && <p className="text-[15px] text-on-surface-variant max-w-sm leading-relaxed">{text}</p>}
    </div>
  );
}

function ResultCard({
  result,
  t,
  lang,
  busy,
  autoNext,
  onCheckin,
  onRetry,
  onNext,
}: {
  result: ScanResult;
  t: ScannerCopy;
  lang: Language;
  busy: boolean;
  autoNext: boolean;
  onCheckin: () => void;
  onRetry: () => void;
  onNext: () => void;
}) {
  const { response, action } = result;
  const ticket = response.ticket;
  const ok = response.success;
  const done = ok && action === "checkin";
  const canCheckin = ok && action === "verify" && Boolean(ticket) && !ticket?.checkedInAt;
  const pendingInOrder = ticket ? Math.max(0, ticket.orderSpots - ticket.orderCheckedIn) : 0;

  const headline = ok
    ? done
      ? t.checkedIn
      : t.valid
    : result.offline
      ? t.offline
      : ticket?.checkedInAt
        ? t.used
        : ticket
          ? t.invalid
          : t.notFound;

  const name = ticket ? ticket.attendeeName || ticket.customerName : "";
  const rows: [string, string, boolean?][] = [];
  if (ticket) {
    if (ticket.attendeeName && ticket.attendeeName !== ticket.customerName) rows.push([t.buyer, ticket.customerName]);
    if (ticket.customerDocId) rows.push([t.docId, ticket.customerDocId]);
    rows.push([t.tasting, ticket.tastingTitle]);
    const when = [ticket.tastingDate, ticket.tastingTime].filter(Boolean).join(" · ");
    if (when) rows.push([t.when, when]);
    rows.push([t.code, ticket.code]);
    if (ticket.orderSpots > 1) rows.push([t.group, t.groupProgress(ticket.orderCheckedIn, ticket.orderSpots)]);
    if (!ok && ticket.checkedInAt) rows.push([t.usedAt, timeInCaracas(ticket.checkedInAt, lang)]);
    if (ticket.dietaryRestrictions) rows.push([t.diet, ticket.dietaryRestrictions, true]);
  }

  const tone = ok
    ? "border-emerald-600 bg-emerald-50 text-emerald-950"
    : "border-error bg-error-container text-on-error-container";

  return (
    <div className="flex flex-col gap-3">
      <div className={`rounded-2xl border-4 p-5 sm:p-6 ${tone}`} role="status">
        <div className="flex items-center gap-3">
          <span
            className={`material-symbols-outlined text-[56px] leading-none ${ok ? "text-emerald-700" : "text-error"}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            {ok ? (done ? "how_to_reg" : "check_circle") : result.offline ? "wifi_off" : "cancel"}
          </span>
          <div className="min-w-0">
            <p className="text-[24px] sm:text-[28px] font-bold uppercase tracking-wide leading-tight">{headline}</p>
            {ticket && (
              <p className="text-[17px] font-semibold mt-0.5">
                {ticket.number > 0 ? t.entryOf(ticket.number, ticket.orderSpots) : t.wholeOrder(ticket.orderSpots)}
              </p>
            )}
          </div>
        </div>

        {name && <p className="mt-4 font-serif text-[30px] sm:text-[36px] leading-tight text-on-surface break-words">{name}</p>}
        {response.message && <p className="mt-2 text-[15px] leading-relaxed">{response.message}</p>}

        {rows.length > 0 && (
          <dl className="mt-4 space-y-2 border-t border-black/10 pt-4 text-[16px]">
            {rows.map(([k, v, highlight]) => (
              <div
                key={k}
                className={`flex justify-between gap-4 ${highlight ? "rounded bg-tertiary-fixed px-3 py-2 text-on-tertiary-fixed" : ""}`}
              >
                <dt className={highlight ? "font-semibold flex-shrink-0" : "text-on-surface-variant flex-shrink-0"}>{k}</dt>
                <dd className="font-semibold text-right break-words min-w-0">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {canCheckin && (
        <button
          type="button"
          onClick={onCheckin}
          disabled={busy}
          className="w-full h-16 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[19px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[26px] ${busy ? "animate-spin" : ""}`} aria-hidden="true">
            {busy ? "progress_activity" : "how_to_reg"}
          </span>
          {busy ? t.checkingIn : ticket && ticket.number === 0 && pendingInOrder > 1 ? t.checkinMany(pendingInOrder) : t.checkin}
        </button>
      )}

      {result.offline && (
        <button
          type="button"
          onClick={onRetry}
          disabled={busy}
          className="w-full h-16 rounded bg-primary-container hover:bg-primary text-white text-[18px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[22px] ${busy ? "animate-spin" : ""}`} aria-hidden="true">
            {busy ? "progress_activity" : "refresh"}
          </span>
          {t.retryScan}
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={busy}
        className={`w-full rounded inline-flex items-center justify-center gap-2 font-semibold disabled:opacity-60 ${
          canCheckin || result.offline
            ? "h-12 border border-outline-variant bg-surface-container-lowest text-[15px]"
            : "h-16 bg-primary-container hover:bg-primary text-white text-[18px]"
        }`}
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
          {canCheckin ? "close" : "qr_code_scanner"}
        </span>
        {canCheckin ? t.cancel : t.next}
      </button>
      {autoNext && (
        <p className="text-center text-[13px] text-on-surface-variant" role="status">
          {t.autoNext}
        </p>
      )}
    </div>
  );
}

/* ─── Modal (para abrir el escáner desde cualquier pantalla del panel) ─── */

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

export function QRScannerModal({ isOpen, onClose, lang = "es" }: QRScannerModalProps) {
  const t = SCANNER_COPY[lang];
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center overflow-y-auto p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl border border-outline-variant bg-background p-4 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 id={titleId} className="font-serif text-xl sm:text-2xl">
            {t.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-surface-container"
            aria-label={t.close}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>
        <DoorScanner lang={lang} />
      </div>
    </div>
  );
}
