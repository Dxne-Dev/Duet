"use client";

import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronLeft,
  Clock3,
  Crown,
  Headphones,
  Link2,
  Loader2,
  Lock,
  Mic2,
  MicOff,
  Music2,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Trophy,
  Upload,
  Users,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { unlockDuelAudio, usePeerAudio, useSynchronizedBackingTrack } from "@/hooks/use-duel-audio";
import type { PublicRoom } from "@/lib/room-utils";
import { tracks, getTrack, type LyricLine, type Track } from "@/lib/tracks";

const emptyPlayer = { role: "B" as const, name: null, ready: false, connected: false };

type ApiError = { error?: string };

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="Duet, accueil">
      <span
        className={`grid h-9 w-9 place-items-center rounded-full ${inverse ? "bg-white text-black" : "bg-black text-white"}`}
      >
        <AudioLines size={18} strokeWidth={2.6} />
      </span>
      <span className={`text-xl font-black tracking-[-0.06em] ${inverse ? "text-white" : "text-black"}`}>
        duet<span className="text-[#f13d8f]">.</span>
      </span>
    </div>
  );
}

function WaveBars({ active = true, color = "currentColor" }: { active?: boolean; color?: string }) {
  const heights = [8, 17, 27, 13, 22, 9, 29, 19, 11, 24, 14, 8];
  return (
    <span className="flex h-8 items-center gap-[3px]" aria-hidden="true">
      {heights.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={active ? "wave-bar" : ""}
          style={{
            width: 3,
            height,
            backgroundColor: color,
            animationDelay: `${index * -90}ms`,
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
    </span>
  );
}

function Avatar({ name, role, large = false }: { name?: string | null; role: "A" | "B"; large?: boolean }) {
  const initial = name?.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-black text-black ${
        role === "A" ? "bg-[#b6ed3d]" : "bg-[#7cc7ff]"
      } ${large ? "h-16 w-16 text-2xl" : "h-10 w-10"}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

function StatusDot({ live = false }: { live?: boolean }) {
  return <span className={`h-2 w-2 rounded-full ${live ? "bg-[#80dd35] live-dot" : "bg-[#a5a5a5]"}`} />;
}

export default function VocalDuelApp() {
  const [nickname, setNickname] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showJoin, setShowJoin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [incomingCode, setIncomingCode] = useState<string | null>(null);
  const [incomingRoom, setIncomingRoom] = useState<PublicRoom | null>(null);
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [catalogTracks, setCatalogTracks] = useState<Track[]>(tracks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [elapsed, setElapsed] = useState(-4);
  const finishSent = useRef(false);

  useEffect(() => {
    fetch("/api/tracks", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { tracks?: Track[] }) => {
        if (data?.tracks && data.tracks.length > 0) {
          setCatalogTracks(data.tracks);
        }
      })
      .catch(() => undefined);
  }, []);

  const selectedTrack =
    catalogTracks.find((track) => track.id === (room?.trackId ?? selectedTrackId)) ??
    getTrack(room?.trackId ?? selectedTrackId ?? "") ??
    catalogTracks[0] ??
    tracks[0];
  const myPlayer = room?.players.find((player) => player.role === room.role);
  const bothReady = Boolean(room?.players.every((player) => player.connected && player.ready));

  const currentLine = useMemo(() => {
    if (!selectedTrack) return undefined;
    return selectedTrack.lyrics.find((line) => elapsed >= line.at && elapsed < line.end);
  }, [elapsed, selectedTrack]);

  const isMyTurn = Boolean(
    room?.role &&
      currentLine &&
      (currentLine.singer === room.role || currentLine.singer === "BOTH") &&
      elapsed >= 0,
  );

  const { connection, micLevel } = usePeerAudio({
    code: room?.code,
    token: token ?? undefined,
    role: room?.role,
    enabled: micEnabled && (room?.status === "READY" || room?.status === "PLAYING"),
    transmit: room?.status !== "PLAYING" || isMyTurn,
  });

  useSynchronizedBackingTrack(
    selectedTrack,
    room?.startTimestamp,
    room?.status === "PLAYING",
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadRoom = useCallback(async (code: string, roomToken?: string | null) => {
    const response = await fetch(
      `/api/rooms/${code}${roomToken ? `?token=${encodeURIComponent(roomToken)}` : ""}`,
      { cache: "no-store" },
    );
    const data = (await response.json()) as { room?: PublicRoom } & ApiError;
    if (!response.ok || !data.room) throw new Error(data.error || "Salon introuvable.");
    return data.room;
  }, []);

  useEffect(() => {
    const storedName = window.localStorage.getItem("duet:nickname") ?? "";
    setNickname(storedName);
    const code = new URLSearchParams(window.location.search).get("room")?.toUpperCase();
    if (!code) return;
    const storedToken = window.localStorage.getItem(`duet:token:${code}`);
    void loadRoom(code, storedToken)
      .then((loadedRoom) => {
        setSelectedTrackId(loadedRoom.trackId);
        if (storedToken && loadedRoom.role) {
          setToken(storedToken);
          setRoom(loadedRoom);
        } else {
          setIncomingCode(code);
          setIncomingRoom(loadedRoom);
        }
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, [loadRoom]);

  useEffect(() => {
    if (!room || !token) return;
    const poll = async () => {
      try {
        const nextRoom = await loadRoom(room.code, token);
        setRoom(nextRoom);
      } catch {
        // A brief network interruption should not eject either singer.
      }
    };
    const timer = window.setInterval(poll, room.status === "PLAYING" ? 700 : 1100);
    return () => window.clearInterval(timer);
  }, [loadRoom, room?.code, room?.status, token]);

  const mySingingHitsRef = useRef(0);
  const myTurnTicksRef = useRef(0);
  const interruptionHitsRef = useRef(0);
  const micLevelRef = useRef(micLevel);
  const currentLineRef = useRef(currentLine);
  const isMyTurnRef = useRef(isMyTurn);

  useEffect(() => {
    micLevelRef.current = micLevel;
  }, [micLevel]);

  useEffect(() => {
    currentLineRef.current = currentLine;
  }, [currentLine]);

  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  // Reset counters when duel starts
  useEffect(() => {
    if (room?.status === "PLAYING") {
      mySingingHitsRef.current = 0;
      myTurnTicksRef.current = 0;
      interruptionHitsRef.current = 0;
    }
  }, [room?.status]);

  useEffect(() => {
    if (room?.status !== "PLAYING" || !room.startTimestamp) return;
    const update = () => {
      const currentSeconds = (Date.now() - room.startTimestamp!) / 1000;
      setElapsed(currentSeconds);

      const line = currentLineRef.current;
      const level = micLevelRef.current;
      const myTurn = isMyTurnRef.current;

      if (currentSeconds >= 0 && line && room.role) {
        if (myTurn) {
          myTurnTicksRef.current += 1;
          if (level >= 0.06) {
            mySingingHitsRef.current += 1;
          }
        } else if (line.singer !== "BOTH" && line.singer !== room.role) {
          if (level >= 0.32) {
            interruptionHitsRef.current += 1;
          }
        }
      }
    };
    update();
    const timer = window.setInterval(update, 50);
    return () => window.clearInterval(timer);
  }, [room?.status, room?.startTimestamp, room?.role]);

  const computeScore = useCallback(() => {
    const totalTicks = myTurnTicksRef.current;
    if (totalTicks === 0) {
      return 85;
    }
    const hits = mySingingHitsRef.current;
    const interruptions = interruptionHitsRef.current;

    const hitRatio = hits / totalTicks;
    const penaltyRatio = (interruptions / totalTicks) * 0.2;
    const netRatio = Math.max(0, hitRatio - penaltyRatio);

    // Map ratio to 45 - 99 range so it stays fun and motivating
    return Math.min(99, Math.max(45, Math.round(42 + netRatio * 56)));
  }, []);

  const postRoomAction = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      if (!room || !token) return null;
      const response = await fetch(`/api/rooms/${room.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, token, ...extra }),
      });
      const data = (await response.json()) as { room?: PublicRoom } & ApiError;
      if (!response.ok || !data.room) throw new Error(data.error || "Action impossible.");
      setRoom(data.room);
      return data.room;
    },
    [room, token],
  );

  useEffect(() => {
    if (
      room?.status !== "PLAYING" ||
      elapsed < selectedTrack.duration ||
      finishSent.current
    ) {
      return;
    }
    finishSent.current = true;
    const myScore = computeScore();
    void postRoomAction("finish", { score: myScore }).catch(() => undefined);
  }, [computeScore, elapsed, postRoomAction, room?.status, selectedTrack.duration]);

  const rememberSession = (nextRoom: PublicRoom, nextToken: string) => {
    window.localStorage.setItem("duet:nickname", nickname.trim());
    window.localStorage.setItem(`duet:token:${nextRoom.code}`, nextToken);
    window.history.replaceState({}, "", `/?room=${nextRoom.code}`);
    setSelectedTrackId(nextRoom.trackId);
    setStep(1);
    setShowJoin(false);
    setToken(nextToken);
    setRoom(nextRoom);
    setIncomingCode(null);
    setIncomingRoom(null);
    setError(null);
    finishSent.current = false;
  };

  const createRoom = async () => {
    if (nickname.trim().length < 2) {
      setError("Entre ton pseudo avant de créer le duel.");
      return;
    }
    if (!selectedTrackId) {
      setError("Choisis d'abord un titre.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, trackId: selectedTrackId }),
      });
      const data = (await response.json()) as { room?: PublicRoom; token?: string } & ApiError;
      if (!response.ok || !data.room || !data.token) throw new Error(data.error || "Création impossible.");
      rememberSession(data.room, data.token);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Création impossible.");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (requestedCode?: string) => {
    const code = (requestedCode ?? joinCode).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (nickname.trim().length < 2) {
      setError("Entre ton pseudo pour rejoindre le duel.");
      return;
    }
    if (code.length < 4) {
      setError("Le code contient au moins 4 caractères.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rooms/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", nickname }),
      });
      const data = (await response.json()) as { room?: PublicRoom; token?: string } & ApiError;
      if (!response.ok || !data.room || !data.token) throw new Error(data.error || "Connexion impossible.");
      rememberSession(data.room, data.token);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  const activateMicrophone = async () => {
    await unlockDuelAudio();
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Ce navigateur ne permet pas l’accès au micro.");
    }
    const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    permissionStream.getTracks().forEach((track) => track.stop());
    setMicEnabled(true);
  };

  const toggleReady = async () => {
    if (!myPlayer) return;
    setLoading(true);
    setError(null);
    try {
      if (!myPlayer.ready) await activateMicrophone();
      await postRoomAction("ready", { ready: !myPlayer.ready });
    } catch (readyError) {
      setError(
        readyError instanceof Error
          ? readyError.message
          : "Autorise le micro pour participer au duel.",
      );
    } finally {
      setLoading(false);
    }
  };

  const startDuel = async () => {
    setLoading(true);
    setError(null);
    try {
      await unlockDuelAudio();
      await postRoomAction("start");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Lancement impossible.");
    } finally {
      setLoading(false);
    }
  };

  const copyInvite = async () => {
    if (!room) return;
    const link = `${window.location.origin}/?room=${room.code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const goHome = useCallback(() => {
    window.history.replaceState({}, "", "/");
    setRoom(null);
    setToken(null);
    setIncomingCode(null);
    setIncomingRoom(null);
    setMicEnabled(false);
    setElapsed(-4);
    setError(null);
    setStep(1);
    setShowJoin(false);
  }, []);

  const leaveRoom = useCallback(async () => {
    if (room && token && room.status !== "FINISHED" && room.status !== "ABANDONED") {
      try {
        const payload = JSON.stringify({ action: "leave", token });
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(`/api/rooms/${room.code}`, new Blob([payload], { type: "application/json" }));
        } else {
          await fetch(`/api/rooms/${room.code}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          });
        }
      } catch {
        // Ignore
      }
    }
    goHome();
  }, [goHome, room, token]);

  useEffect(() => {
    if (!room || !token || room.status === "FINISHED" || room.status === "ABANDONED") return;
    const handleUnload = () => {
      try {
        const payload = JSON.stringify({ action: "leave", token });
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(`/api/rooms/${room.code}`, new Blob([payload], { type: "application/json" }));
        }
      } catch {
        // Ignore
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [room?.code, room?.status, token]);

  if (room?.status === "ABANDONED") {
    return <AbandonedScreen room={room} onHome={goHome} />;
  }

  if (room?.status === "PLAYING") {
    return (
      <Arena
        room={room}
        track={selectedTrack}
        elapsed={elapsed}
        currentLine={currentLine}
        isMyTurn={isMyTurn}
        micEnabled={micEnabled}
        micLevel={micLevel}
        connection={connection}
        onEnableMic={() => void activateMicrophone().catch((audioError: Error) => setError(audioError.message))}
        onLeave={leaveRoom}
      />
    );
  }

  if (room?.status === "FINISHED") {
    return <Results room={room} track={selectedTrack} onHome={goHome} onShare={copyInvite} copied={copied} />;
  }

  if (room) {
    return (
      <Lobby
        room={room}
        track={selectedTrack}
        loading={loading}
        error={error}
        connection={connection}
        micLevel={micLevel}
        micEnabled={micEnabled}
        bothReady={bothReady}
        copied={copied}
        onBack={leaveRoom}
        onCopy={copyInvite}
        onReady={toggleReady}
        onStart={startDuel}
      />
    );
  }

  return (
    <>
      <Onboarding
        step={step}
        setStep={setStep}
        nickname={nickname}
        setNickname={setNickname}
        selectedTrackId={selectedTrackId}
        setSelectedTrackId={setSelectedTrackId}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        showJoin={showJoin}
        setShowJoin={setShowJoin}
        loading={loading}
        error={error}
        setError={setError}
        toast={toast}
        onCreate={createRoom}
        onJoin={() => void joinRoom()}
        onToast={setToast}
        catalogTracks={catalogTracks}
      />
      {incomingCode && incomingRoom ? (
        <JoinOverlay
          code={incomingCode}
          room={incomingRoom}
          nickname={nickname}
          setNickname={setNickname}
          loading={loading}
          error={error}
          onClose={() => {
            setIncomingCode(null);
            setIncomingRoom(null);
            window.history.replaceState({}, "", "/");
          }}
          onJoin={() => void joinRoom(incomingCode)}
        />
      ) : null}
    </>
  );
}

type OnboardingProps = {
  step: 1 | 2 | 3;
  setStep: (value: 1 | 2 | 3) => void;
  nickname: string;
  setNickname: (value: string) => void;
  selectedTrackId: string | null;
  setSelectedTrackId: (value: string) => void;
  joinCode: string;
  setJoinCode: (value: string) => void;
  showJoin: boolean;
  setShowJoin: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  setError: (value: string | null) => void;
  toast: string | null;
  onCreate: () => void;
  onJoin: () => void;
  onToast: (message: string) => void;
  catalogTracks: Track[];
};

const SUGGESTED_NAMES = ["Nova", "Kaze", "Lila", "Bloom", "Juno", "Milo", "Zoe", "Aria", "Rivo", "Sasha"];

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Pseudo", "Titre", "Salon"];
  return (
    <nav aria-label="Étapes de l'onboarding" className="mx-auto flex w-full max-w-2xl items-center">
      {steps.map((label, index) => {
        const stepNumber = (index + 1) as 1 | 2 | 3;
        const done = current > stepNumber;
        const active = current === stepNumber;
        return (
          <div key={label} className={`flex items-center ${index > 0 ? "flex-1" : ""}`}>
            {index > 0 ? (
              <span className={`mx-3 h-0.5 flex-1 rounded-full sm:mx-4 ${done || active ? "bg-black" : "bg-black/15"}`} />
            ) : null}
            <span className="flex items-center gap-2.5">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black transition ${
                  done ? "bg-black text-white" : active ? "bg-[#f13d8f] text-white" : "border-2 border-black/20 text-black/35"
                }`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : stepNumber}
              </span>
              <span className={`whitespace-nowrap text-sm font-black ${active ? "text-black" : "text-black/35"}`}>{label}</span>
            </span>
          </div>
        );
      })}
    </nav>
  );
}

function Onboarding({
  step,
  setStep,
  nickname,
  setNickname,
  selectedTrackId,
  setSelectedTrackId,
  joinCode,
  setJoinCode,
  showJoin,
  setShowJoin,
  loading,
  error,
  setError,
  toast,
  onCreate,
  onJoin,
  onToast,
  catalogTracks,
}: OnboardingProps) {
  const selectedTrack = catalogTracks.find((t) => t.id === selectedTrackId) ?? getTrack(selectedTrackId ?? "") ?? catalogTracks[0];

  const continueFromName = () => {
    if (nickname.trim().length < 2) {
      setError("Entre ton pseudo (2 caractères minimum).");
      return;
    }
    setError(null);
    setStep(2);
  };

  const continueFromTrack = () => {
    if (!selectedTrack) {
      setError("Choisis un titre pour continuer.");
      return;
    }
    setError(null);
    setStep(3);
  };

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[#f4f1eb] text-[#111]">
      <header className="mx-auto flex h-20 w-full max-w-[1340px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Logo />
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-black/40 sm:text-xs">
          <Mic2 size={14} className="text-[#f13d8f]" /> Sans compte · 2 min max
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-14 sm:px-8">
        <StepIndicator current={step} />

        <div key={step} className="join-in mt-10 flex-1 lg:mt-14">
          {step === 1 ? (
            <div className="mx-auto grid w-full max-w-4xl gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#f13d8f]">Étape 1 / 3</p>
                <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl">
                  D'abord,
                  <br />
                  le blaze.
                </h1>
                <p className="mt-6 max-w-md text-lg font-medium leading-relaxed text-black/55">
                  Aucun email, aucun mot de passe. Ton pseudo t'accompagne dans le duel et sur le téléprompteur.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {["Sans compte", "Micro live", "Paroles synchro"].map((tag) => (
                    <span key={tag} className="rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-black">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_18px_50px_rgba(31,26,20,0.09)] sm:p-8">
                <label htmlFor="nickname-step" className="text-xs font-black uppercase tracking-[0.14em] text-black/45">
                  Ton pseudo
                </label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Mic2 className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={19} />
                    <input
                      id="nickname-step"
                      autoFocus
                      value={nickname}
                      maxLength={24}
                      onChange={(event) => setNickname(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && continueFromName()}
                      placeholder="Ton blaze sur scène"
                      className="h-14 w-full rounded-2xl border-2 border-black/10 bg-[#faf9f6] pl-12 pr-4 text-base font-bold outline-none transition focus:border-black"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setNickname(SUGGESTED_NAMES[Math.floor(Math.random() * SUGGESTED_NAMES.length)])}
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-black/10 px-4 text-sm font-black transition hover:border-black"
                  >
                    <Sparkles size={16} /> Suggestion
                  </button>
                </div>
                {error ? <p className="mt-3 text-sm font-bold text-[#d92f72]">{error}</p> : null}
                <button
                  type="button"
                  onClick={continueFromName}
                  className="group mt-4 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black font-black text-white transition hover:-translate-y-0.5"
                >
                  Continuer
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ) : step === 2 ? (
            <div>
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#f13d8f]">Étape 2 / 3</p>
                  <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">Choisissez votre titre.</h1>
                </div>
                <p className="max-w-xs text-sm font-medium leading-relaxed text-black/45">
                  Quatre titres du catalogue, d'une minute environ, pensés pour un duo face à face.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {catalogTracks.map((catalogTrack) => {
                  const selected = catalogTrack.id === selectedTrackId;
                  return (
                    <button
                      type="button"
                      key={catalogTrack.id}
                      onClick={() => {
                        setError(null);
                        setSelectedTrackId(catalogTrack.id);
                      }}
                      className={`track-card group relative text-left ${selected ? "selected" : ""}`}
                      style={{ "--track-color": catalogTrack.color } as CSSProperties}
                    >
                      <div className="relative overflow-hidden rounded-xl">
                        <img
                          src={catalogTrack.cover}
                          alt=""
                          className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                        />
                        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-black shadow-lg">
                          {selected ? <Check size={18} strokeWidth={3} /> : <Play size={16} fill="currentColor" />}
                        </span>
                        <span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur-sm">
                          {catalogTrack.durationLabel}
                        </span>
                      </div>
                      <div className="px-1 pb-1 pt-4">
                        <h3 className="text-lg font-black tracking-[-0.02em]">{catalogTrack.title}</h3>
                        <p className="mt-1 truncate text-sm font-semibold text-black/45">{catalogTrack.artist}</p>
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => onToast("Cette fonctionnalité sera bientôt disponible.")}
                  className="track-card group text-left"
                  style={{ "--track-color": "#111111" } as CSSProperties}
                >
                  <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-black/25 bg-[#fbfaf7]">
                    <div className="flex flex-col items-center gap-3 text-black/45">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-black/5">
                        <Upload size={22} />
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider">Import MP3</span>
                    </div>
                    <span className="absolute left-3 top-3 rounded-full bg-[#ffd54f] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                      Bientôt
                    </span>
                  </div>
                  <div className="px-1 pb-1 pt-4">
                    <h3 className="text-lg font-black tracking-[-0.02em]">Ta propre chanson</h3>
                    <p className="mt-1 text-sm font-semibold text-black/45">Importe ton instrumental</p>
                  </div>
                </button>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-sm font-black text-black/50 hover:text-black"
                >
                  <ChevronLeft size={17} /> Retour
                </button>
                <button
                  type="button"
                  onClick={continueFromTrack}
                  className="group flex h-14 items-center gap-3 rounded-2xl bg-black px-8 font-black text-white transition hover:-translate-y-0.5"
                >
                  Continuer
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              {error ? <p className="mt-4 text-center text-sm font-bold text-[#d92f72] sm:text-right">{error}</p> : null}
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#f13d8f]">Étape 3 / 3</p>
                <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">Créer ou rejoindre ?</h1>
              </div>

              {selectedTrack ? (
                <div className="mb-7 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-3 pr-5 shadow-sm">
                  <img src={selectedTrack.cover} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wider text-black/40">Duel sur</p>
                    <p className="truncate font-black">
                      {selectedTrack.title} · {selectedTrack.artist}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="ml-auto text-sm font-black text-[#f13d8f] hover:underline"
                  >
                    Changer
                  </button>
                </div>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="flex flex-col rounded-[1.75rem] bg-[#141414] p-6 text-white sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#b8e735] text-black">
                      <Music2 size={22} />
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider">
                      Voix A · Hôte
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-[-0.04em]">Créer un salon</h2>
                  <p className="mb-8 mt-3 max-w-sm text-sm font-medium leading-relaxed text-white/55">
                    Génère un code à 4 lettres, partage-le à ton duo et lancez le duel ensemble.
                  </p>
                  <button
                    type="button"
                    onClick={onCreate}
                    disabled={loading}
                    className="mt-auto flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white font-black text-black transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={19} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                    Créer le salon
                  </button>
                </div>

                <div
                  className={`flex flex-col rounded-[1.75rem] border-2 bg-white p-6 transition sm:p-8 ${
                    showJoin ? "border-black" : "border-black/10"
                  }`}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#7cc7ff] text-black">
                      <Users size={22} />
                    </span>
                    <span className="rounded-full bg-black/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider">
                      Voix B · Invité
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-[-0.04em]">Rejoindre un salon</h2>
                  {showJoin ? (
                    <div className="mt-3">
                      <p className="text-sm font-medium leading-relaxed text-black/55">Entre le code donné par ton duo.</p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <input
                          value={joinCode}
                          maxLength={6}
                          onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                          onKeyDown={(event) => event.key === "Enter" && onJoin()}
                          placeholder="CODE"
                          aria-label="Code du salon"
                          className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-black/10 bg-[#faf9f6] px-4 font-mono text-lg font-black uppercase tracking-[0.24em] outline-none transition focus:border-black placeholder:text-black/25"
                        />
                        <button
                          type="button"
                          onClick={onJoin}
                          disabled={loading}
                          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-black px-6 font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 size={19} className="animate-spin" />
                          ) : (
                            <>
                              Rejoindre <ArrowRight size={17} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-black/55">
                      Ton duo a déjà créé un salon ? Entre le code et récupère ta voix en quelques secondes.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setShowJoin(!showJoin);
                    }}
                    className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 font-black transition ${
                      showJoin
                        ? "mt-6 border-transparent text-black/45 hover:text-black"
                        : "mt-auto border-black hover:bg-black hover:text-white"
                    }`}
                  >
                    {showJoin ? "Annuler" : "J'ai un code"}
                  </button>
                </div>
              </div>

              {error ? <p className="mt-4 text-sm font-bold text-[#d92f72]">{error}</p> : null}
            </div>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 bg-[#111] px-6 py-6 text-white/45 lg:px-12">
        <Logo inverse />
        <p className="text-xs font-bold">Fait pour les voix qui osent · V1 temps réel</p>
        <div className="hidden items-center gap-2 text-xs font-bold sm:flex">
          <Zap size={14} className="text-[#b8e735]" /> Propulsé par WebRTC
        </div>
      </footer>

      {toast ? (
        <div
          role="status"
          className="join-in fixed bottom-6 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 rounded-full bg-black px-5 py-3.5 text-sm font-black text-white shadow-2xl"
        >
          <Sparkles size={16} className="shrink-0 text-[#ffd54f]" />
          {toast}
        </div>
      ) : null}
    </main>
  );
}

type LobbyProps = {
  room: PublicRoom;
  track: Track;
  loading: boolean;
  error: string | null;
  connection: "off" | "connecting" | "live" | "error";
  micLevel: number;
  micEnabled: boolean;
  bothReady: boolean;
  copied: boolean;
  onBack: () => void;
  onCopy: () => void;
  onReady: () => void;
  onStart: () => void;
};

function Lobby({ room, track, loading, error, connection, micLevel, micEnabled, bothReady, copied, onBack, onCopy, onReady, onStart }: LobbyProps) {
  const playerA = room.players[0];
  const playerB = room.players[1] ?? emptyPlayer;
  const me = room.players.find((player) => player.role === room.role);
  return (
    <main className="min-h-screen bg-[#f4f1eb] text-black">
      <header className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 sm:px-8">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-black text-black/55 hover:text-black">
          <ChevronLeft size={18} /> Quitter
        </button>
        <Logo />
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-black/45">
          <StatusDot live={room.status === "READY"} /> {room.status === "WAITING" ? "En attente" : "Salon prêt"}
        </div>
      </header>

      <div className="mx-auto grid max-w-[1220px] gap-6 px-5 pb-12 pt-5 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:pt-10">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-[#171717] p-5 text-white sm:p-7">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={track.cover} alt={`Pochette de ${track.title}`} className="aspect-square w-full object-cover" />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
              <Music2 size={13} /> Votre titre
            </div>
          </div>
          <div className="flex items-end justify-between gap-4 pb-2 pt-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">{track.artist}</p>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.045em] sm:text-4xl">{track.title}</h1>
            </div>
            <div className="text-right text-xs font-bold text-white/45">
              <p>{track.durationLabel}</p><p className="mt-1">{track.bpm} BPM</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-[1.75rem] bg-white p-5 shadow-[0_16px_50px_rgba(31,26,20,0.08)] sm:p-8">
          <div className="flex flex-col justify-between gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Code du salon</p>
              <div className="mt-2 flex items-center gap-1.5">
                {room.code.split("").map((character, index) => (
                  <span key={`${character}-${index}`} className="grid h-12 w-10 place-items-center rounded-lg bg-[#f0eee8] font-mono text-2xl font-black sm:h-14 sm:w-12 sm:text-3xl">
                    {character}
                  </span>
                ))}
              </div>
            </div>
            <button type="button" onClick={onCopy} className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-black px-4 text-sm font-black transition hover:bg-black hover:text-white">
              {copied ? <Check size={17} /> : <Link2 size={17} />}
              {copied ? "Lien copié" : "Copier l’invitation"}
            </button>
          </div>

          <div className="py-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight">Les deux voix</h2>
              <span className="text-xs font-bold text-black/35">2 places maximum</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlayerCard player={playerA} isMe={room.role === "A"} />
              <PlayerCard player={playerB} isMe={room.role === "B"} />
            </div>
          </div>

          <div className="mt-auto border-t border-black/10 pt-6">
            {room.status === "WAITING" ? (
              <div className="flex min-h-28 flex-col items-center justify-center rounded-2xl bg-[#f5f3ee] px-5 text-center">
                <div className="mb-3 flex items-center gap-2 text-[#f13d8f]"><Users size={20} /><WaveBars color="#f13d8f" /></div>
                <p className="font-black">En attente de ta deuxième voix…</p>
                <p className="mt-1 text-sm font-medium text-black/45">Partage le lien ou dicte le code du salon.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between rounded-xl bg-[#f5f3ee] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-full ${micEnabled ? "bg-[#b8e735]" : "bg-black/10"}`}>
                      {micEnabled ? <Mic2 size={17} /> : <MicOff size={17} />}
                    </span>
                    <div>
                      <p className="text-sm font-black">{connection === "live" ? "Connexion vocale active" : micEnabled ? "Micro prêt" : "Test micro"}</p>
                      <p className="text-xs font-semibold text-black/40">{connection === "connecting" ? "Connexion à l’autre voix…" : "Casque recommandé"}</p>
                    </div>
                  </div>
                  <LevelMeter value={micLevel} />
                </div>
                <button
                  type="button"
                  onClick={onReady}
                  disabled={loading}
                  className={`flex h-14 w-full items-center justify-center gap-3 rounded-2xl font-black transition disabled:opacity-50 ${
                    me?.ready ? "bg-[#dff5ad] text-black" : "bg-black text-white hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? <Loader2 size={19} className="animate-spin" /> : me?.ready ? <Check size={20} strokeWidth={3} /> : <Mic2 size={19} />}
                  {me?.ready ? "Prêt·e — modifier" : "Tester mon micro et être prêt·e"}
                </button>
                {room.role === "A" && bothReady ? (
                  <button type="button" onClick={onStart} disabled={loading} className="mt-3 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#f13d8f] font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50">
                    <Play size={18} fill="currentColor" /> Lancer le duel <span className="text-white/60">· 4 sec</span>
                  </button>
                ) : (
                  <p className="mt-3 text-center text-xs font-bold text-black/40">
                    {bothReady ? "L’hôte lance le duel dans un instant." : "Le lancement s’active quand vous êtes tous les deux prêts."}
                  </p>
                )}
              </>
            )}
            {error ? <p className="mt-3 text-center text-sm font-bold text-[#d92f72]">{error}</p> : null}
          </div>
        </section>
      </div>
      <p className="pb-8 text-center text-xs font-semibold text-black/35"><Lock size={12} className="mr-1 inline" /> Le flux vocal reste entre vos deux appareils.</p>
    </main>
  );
}

function PlayerCard({ player, isMe }: { player: PublicRoom["players"][number]; isMe: boolean }) {
  return (
    <div className={`relative min-h-32 rounded-2xl border-2 p-4 ${player.connected ? "border-black/10 bg-white" : "border-dashed border-black/15 bg-[#faf9f6]"}`}>
      {player.connected ? (
        <>
          <div className="flex items-start justify-between">
            <Avatar name={player.name} role={player.role} />
            {player.ready ? (
              <span className="flex items-center gap-1 rounded-full bg-[#dff5ad] px-2 py-1 text-[10px] font-black uppercase"><Check size={11} /> Prêt</span>
            ) : (
              <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-black uppercase text-black/35">Réglages</span>
            )}
          </div>
          <p className="mt-4 truncate font-black">{player.name}{isMe ? " (toi)" : ""}</p>
          <p className="mt-0.5 text-xs font-bold text-black/35">Voix {player.role}</p>
        </>
      ) : (
        <div className="grid h-full min-h-24 place-items-center text-center text-black/30">
          <div><Users size={22} className="mx-auto mb-2" /><p className="text-sm font-black">Place libre</p></div>
        </div>
      )}
    </div>
  );
}

function LevelMeter({ value }: { value: number }) {
  return (
    <div className="flex h-7 items-end gap-1" aria-label={`Niveau du micro ${Math.round(value * 100)} %`}>
      {[0.15, 0.28, 0.42, 0.58, 0.75].map((threshold, index) => (
        <span key={threshold} className={`w-1.5 rounded-full ${value >= threshold ? "bg-[#67bc27]" : "bg-black/10"}`} style={{ height: 8 + index * 3 }} />
      ))}
    </div>
  );
}

type ArenaProps = {
  room: PublicRoom;
  track: Track;
  elapsed: number;
  currentLine?: LyricLine;
  isMyTurn: boolean;
  micEnabled: boolean;
  micLevel: number;
  connection: "off" | "connecting" | "live" | "error";
  onEnableMic: () => void;
  onLeave: () => void;
};

function Arena({ room, track, elapsed, currentLine, isMyTurn, micEnabled, micLevel, connection, onEnableMic, onLeave }: ArenaProps) {
  const lineIndex = track.lyrics.findIndex((line) => line === currentLine);
  const previousLine = lineIndex > 0 ? track.lyrics[lineIndex - 1] : undefined;
  const upcomingLine = track.lyrics.find((line) => line.at > elapsed);
  const isIntro = elapsed < (track.lyrics[0]?.at ?? 0);
  const secondsUntilNext = upcomingLine ? Math.max(1, Math.ceil(upcomingLine.at - elapsed)) : 0;
  const nextPlayer = room.players.find((player) => player.role === upcomingLine?.singer);
  const nextLine = lineIndex >= 0 ? track.lyrics[lineIndex + 1] : upcomingLine;
  const countdown = Math.max(0, Math.ceil(-elapsed));
  const progress = Math.max(0, Math.min(100, (elapsed / track.duration) * 100));
  const singerColor = currentLine?.singer === "A" ? "#b8e735" : currentLine?.singer === "B" ? "#7cc7ff" : currentLine?.singer === "BOTH" ? "#f4a5cc" : "#ffffff";
  const activePlayer = room.players.find((player) => player.role === currentLine?.singer);

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#0c0c0d] text-white">
      <img src={track.cover} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.12] blur-3xl" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute left-0 right-0 top-0 z-30 h-1.5 bg-white/10">
        <div className="h-full transition-[width] duration-100" style={{ width: `${progress}%`, backgroundColor: singerColor }} />
      </div>

      <header className="relative z-20 flex h-20 items-center justify-between px-4 sm:px-8">
        <button type="button" onClick={onLeave} title="Quitter le duel" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-black">
          <X size={18} />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-black">{track.title}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{track.artist}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black">
          <Clock3 size={14} /> {formatTime(elapsed)}
        </div>
      </header>

      <div className="relative z-20 mx-auto flex max-w-5xl items-center justify-between px-5 pt-3 sm:px-8">
        {room.players.map((player) => {
          const singing = currentLine?.singer === player.role || currentLine?.singer === "BOTH";
          return (
            <div key={player.role} className={`flex items-center gap-3 transition-opacity ${singing ? "opacity-100" : "opacity-35"}`}>
              <Avatar name={player.name} role={player.role} />
              <div className={player.role === "B" ? "text-right" : ""}>
                <p className="max-w-28 truncate text-sm font-black">{player.name}{room.role === player.role ? " · toi" : ""}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Voix {player.role}</p>
              </div>
            </div>
          );
        })}
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-210px)] max-w-6xl flex-col items-center justify-center px-5 pb-28 pt-16 text-center sm:px-10">
        {countdown > 0 ? (
          <div className="countdown-in">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.25em] text-white/50">Préparez-vous</p>
            <p className="text-[10rem] font-black leading-none tracking-[-0.1em]" style={{ color: countdown % 2 === 0 ? "#b8e735" : "#7cc7ff" }}>{countdown}</p>
            <p className="mt-5 text-lg font-bold text-white/60">La musique part sur vos deux appareils</p>
          </div>
        ) : !currentLine ? (
          <div className="flex flex-col items-center">
            <div className="mb-8 flex min-h-8 items-center">
              <span className="turn-pill inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
                <Headphones size={15} />
                {isIntro
                  ? `Intro musicale · Départ dans ${secondsUntilNext}s`
                  : `Pause instrumentale · Reprise dans ${secondsUntilNext}s`}
              </span>
            </div>
            <p className="min-h-9 text-xs font-black uppercase tracking-[0.18em] text-white/40">
              {upcomingLine ? `Prochaine voix : ${upcomingLine.singer === "BOTH" ? "Ensemble" : `Voix ${upcomingLine.singer} (${nextPlayer?.name ?? "Joueur"})`}` : "Fin du morceau"}
            </p>
            <h1 className="lyric-in my-8 max-w-4xl text-[clamp(2rem,5.5vw,4.5rem)] font-black leading-[1.05] tracking-[-0.04em] text-white/35 italic">
              {upcomingLine ? `« ${upcomingLine.text} »` : "♫ Musique..."}
            </h1>
            <p className="min-h-9 text-xs font-bold uppercase tracking-wider text-white/25">Écoutez le rythme</p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex min-h-8 items-center">
              <span className="turn-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black" style={{ backgroundColor: singerColor }}>
                {isMyTurn ? <Mic2 size={15} /> : <Headphones size={15} />}
                {currentLine.singer === "BOTH" ? "Ensemble !" : isMyTurn ? "À toi de chanter" : `${activePlayer?.name ?? "L’autre voix"} chante`}
              </span>
            </div>
            <p className="min-h-9 text-xl font-black tracking-[-0.025em] text-white/18 sm:text-2xl">{previousLine?.text}</p>
            <h1 key={`${lineIndex}-${currentLine.text}`} className="lyric-in my-8 max-w-5xl text-[clamp(2.6rem,7.2vw,6.8rem)] font-black leading-[0.96] tracking-[-0.065em]" style={{ color: singerColor }}>
              {currentLine.text}
            </h1>
            <p className="min-h-9 max-w-3xl text-xl font-black tracking-[-0.025em] text-white/32 sm:text-3xl">{nextLine?.text}</p>
          </>
        )}
      </section>

      <div className="absolute bottom-5 left-1/2 z-30 flex w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl border border-white/10 bg-[#181819]/90 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${isMyTurn ? "text-black" : "bg-white/10 text-white/35"}`} style={isMyTurn ? { backgroundColor: singerColor } : undefined}>
            {micEnabled ? <Mic2 size={19} /> : <MicOff size={19} />}
          </span>
          <div>
            <p className="text-xs font-black">{isMyTurn ? "Ton micro est en direct" : "Micro en pause"}</p>
            <p className="mt-0.5 text-[10px] font-bold text-white/35">{connection === "live" ? "Voix connectées · faible latence" : "Connexion vocale en cours"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LevelMeter value={isMyTurn ? micLevel : 0} />
          <Volume2 size={16} className="text-white/35" />
        </div>
      </div>

      {!micEnabled ? (
        <button type="button" onClick={onEnableMic} className="absolute left-1/2 top-28 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#ffd54f] px-4 py-2 text-xs font-black text-black shadow-xl">
          <Mic2 size={15} /> Réactiver le micro
        </button>
      ) : null}
    </main>
  );
}

function Results({ room, track, onHome, onShare, copied }: { room: PublicRoom; track: Track; onHome: () => void; onShare: () => void; copied: boolean }) {
  const scoreA = room.playerAScore ?? 85;
  const scoreB = room.playerBScore ?? 85;
  const isTie = scoreA === scoreB;
  const winnerRole = isTie ? "TIE" : scoreA > scoreB ? "A" : "B";
  const duoSync = Math.round((scoreA + scoreB) / 2);

  const myRole = room.role;
  let headline = "Vous étiez en feu.";
  let subtitle = "Performance du duel";
  if (isTie) {
    headline = "Égalité parfaite !";
    subtitle = "Duel au sommet";
  } else if (myRole && winnerRole === myRole) {
    headline = "Victoire écrasante !";
    subtitle = "Tu as remporté le duel";
  } else if (myRole && winnerRole !== "TIE") {
    headline = "Superbe duel !";
    subtitle = "Ton partenaire a gagné";
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-5 py-8 text-black sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Logo />
        <span className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-wider shadow-sm">Duel terminé</span>
      </header>
      <section className="mx-auto mt-8 grid max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(31,26,20,0.13)] lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative min-h-[360px] overflow-hidden bg-black">
          <img src={track.cover} alt={`Pochette de ${track.title}`} className="absolute inset-0 h-full w-full object-cover opacity-65" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-white/55">Vous avez chanté</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em]">{track.title}</h1>
            <p className="mt-2 font-bold text-white/60">{track.artist} · {track.durationLabel}</p>
            <div className="mt-6"><WaveBars color="#b8e735" /></div>
          </div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
          <div className="mb-5 flex items-center gap-2 text-[#d92f72]">
            <Sparkles size={18} />
            <span className="text-xs font-black uppercase tracking-[0.15em]">{subtitle}</span>
          </div>
          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">{headline}</h2>
          <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <ScorePlayer player={room.players[0]} score={scoreA} winner={winnerRole === "A"} isTie={isTie} />
            <span className="text-sm font-black text-black/25">VS</span>
            <ScorePlayer player={room.players[1]} score={scoreB} winner={winnerRole === "B"} isTie={isTie} />
          </div>
          <div className="mb-7 flex items-center justify-center gap-2 rounded-xl bg-[#effbd2] px-4 py-3 text-sm font-black text-[#3d690e]">
            <Trophy size={18} className="text-[#609e1e]" /> Duo synchro à {duoSync} %
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onHome} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-black font-black text-white hover:bg-black/90 transition"><RotateCcw size={18} /> Nouveau duel</button>
            <button type="button" onClick={onShare} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-black font-black hover:bg-black/5 transition"><Share2 size={18} /> {copied ? "Lien copié" : "Partager"}</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScorePlayer({ player, score, winner, isTie }: { player: PublicRoom["players"][number]; score: number; winner: boolean; isTie?: boolean }) {
  return (
    <div className="relative text-center">
      {winner ? <Crown size={22} className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#e5ad14] animate-bounce" fill="currentColor" /> : null}
      <Avatar name={player.name} role={player.role} large />
      <p className="mt-2 truncate text-sm font-black">{player.name}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.05em]">{score}<span className="text-base text-black/30">%</span></p>
      <span className={`inline-block mt-1.5 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${winner ? "bg-[#e5ad14]/20 text-[#9e7506]" : isTie ? "bg-black/5 text-black/60" : "bg-black/5 text-black/40"}`}>
        {winner ? "Vainqueur 👑" : isTie ? "Égalité" : "Challenger"}
      </span>
    </div>
  );
}

function JoinOverlay({ code, room, nickname, setNickname, loading, error, onClose, onJoin }: { code: string; room: PublicRoom; nickname: string; setNickname: (value: string) => void; loading: boolean; error: string | null; onClose: () => void; onJoin: () => void }) {
  const track = getTrack(room.trackId) ?? tracks[0];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/65 p-4 backdrop-blur-md">
      <div className="join-in w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
        <div className="relative h-44 overflow-hidden bg-black">
          <img src={track.cover} alt="" className="h-full w-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-black/30" />
          <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur"><X size={17} /></button>
          <div className="absolute bottom-5 left-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/60">Invitation de {room.players[0].name}</p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">{track.title}</h2>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between rounded-xl bg-[#f4f1eb] px-4 py-3">
            <span className="text-xs font-black uppercase tracking-wider text-black/40">Code salon</span>
            <span className="font-mono text-xl font-black tracking-[0.2em]">{code}</span>
          </div>
          <label htmlFor="invite-nickname" className="text-xs font-black uppercase tracking-[0.14em] text-black/45">Comment on t’appelle ?</label>
          <div className="relative mt-2">
            <Mic2 className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18} />
            <input id="invite-nickname" autoFocus value={nickname} maxLength={24} onChange={(event) => setNickname(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onJoin()} placeholder="Ton pseudo" className="h-14 w-full rounded-xl border-2 border-black/10 pl-12 pr-4 font-bold outline-none focus:border-black" />
          </div>
          {error ? <p className="mt-3 text-sm font-bold text-[#d92f72]">{error}</p> : null}
          <button type="button" onClick={onJoin} disabled={loading || !room.players[1]?.connected === false} className="mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black font-black text-white disabled:opacity-50">
            {loading ? <Loader2 size={19} className="animate-spin" /> : <Mic2 size={19} />} Rejoindre le duel
          </button>
          <p className="mt-4 text-center text-xs font-semibold text-black/35"><Headphones size={13} className="mr-1 inline" /> Mets un casque pour éviter l’écho.</p>
        </div>
      </div>
    </div>
  );
}

function AbandonedScreen({ room, onHome }: { room: PublicRoom; onHome: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!room.destroyAt) return 8;
    return Math.max(0, Math.ceil((room.destroyAt - Date.now()) / 1000));
  });

  useEffect(() => {
    const target = room.destroyAt ?? Date.now() + 8000;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        onHome();
      }
    }, 150);

    return () => window.clearInterval(interval);
  }, [room.destroyAt, onHome]);

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / 8) * 100));

  return (
    <main className="flex min-h-screen flex-col justify-between bg-[#111113] px-5 py-8 text-white sm:px-8">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Logo inverse />
        <span className="flex items-center gap-1.5 rounded-full bg-[#ff3355]/20 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#ff5c77]">
          <span className="h-2 w-2 rounded-full bg-[#ff3355] animate-ping" /> Duel interrompu
        </span>
      </header>

      <section className="mx-auto my-auto flex w-full max-w-lg flex-col items-center rounded-[2.2rem] border border-white/10 bg-[#1c1c20] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.7)] sm:p-10">
        <div className="relative mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-[#ff3355]/15 text-[#ff4d6d]">
          <MicOff size={36} strokeWidth={2.2} />
        </div>

        <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          Partenaire déconnecté
        </h1>

        <p className="mt-4 text-base font-semibold leading-relaxed text-white/70">
          <span className="font-black text-white underline decoration-[#ff3355] underline-offset-4">
            {room.abandonedByName || "Votre partenaire"}
          </span>{" "}
          a quitté le duel avant la fin.
        </p>

        <div className="mt-8 w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-white/50">
              Destruction du salon
            </span>
            <span className="font-mono text-sm font-black text-[#ff4d6d]">{secondsLeft}s</span>
          </div>
          <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#ff3355] to-[#f13d8f] transition-all duration-200 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-3 text-xs font-medium leading-normal text-white/40">
            La salle et le flux audio seront définitivement supprimés dans quelques secondes.
          </p>
        </div>

        <button
          type="button"
          onClick={onHome}
          className="group mt-8 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-white font-black text-black transition hover:bg-white/90 hover:-translate-y-0.5"
        >
          <RotateCcw size={18} className="transition-transform group-hover:-rotate-45" /> Retour à l'accueil
        </button>
      </section>

      <footer className="mx-auto text-center text-xs font-semibold text-white/30">
        duet · synchronisation vocale temps réel
      </footer>
    </main>
  );
}
