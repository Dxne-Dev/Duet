"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerRole } from "@/lib/room-utils";
import type { Track } from "@/lib/tracks";

let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  sharedAudioContext ??= new AudioContext();
  return sharedAudioContext;
}

export async function unlockDuelAudio() {
  const context = getAudioContext();
  if (context?.state === "suspended") await context.resume();
}

function waitForIceGathering(peer: RTCPeerConnection) {
  if (peer.iceGatheringState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 2500);
    const handleChange = () => {
      if (peer.iceGatheringState === "complete") {
        window.clearTimeout(timeout);
        peer.removeEventListener("icegatheringstatechange", handleChange);
        resolve();
      }
    };
    peer.addEventListener("icegatheringstatechange", handleChange);
  });
}

type PeerAudioOptions = {
  code?: string;
  token?: string;
  role?: PlayerRole | null;
  enabled: boolean;
  transmit: boolean;
};

export function usePeerAudio({ code, token, role, enabled, transmit }: PeerAudioOptions) {
  const [connection, setConnection] = useState<"off" | "connecting" | "live" | "error">("off");
  const [micLevel, setMicLevel] = useState(0);
  const transmitRef = useRef(transmit);

  useEffect(() => {
    transmitRef.current = transmit;
  }, [transmit]);

  useEffect(() => {
    if (!enabled || !code || !token || !role) {
      setConnection("off");
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let peer: RTCPeerConnection | null = null;
    let pollingTimer: number | null = null;
    let animationFrame: number | null = null;
    let audioElement: HTMLAudioElement | null = null;
    let remoteApplied = false;

    const sendDescription = async (description: RTCSessionDescription) => {
      await fetch(`/api/rooms/${code}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, description: description.toJSON() }),
      });
    };

    const readSignal = async () => {
      const response = await fetch(`/api/rooms/${code}/signal?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      if (!response.ok) return null;
      return (await response.json()) as {
        offer: RTCSessionDescriptionInit | null;
        answer: RTCSessionDescriptionInit | null;
      };
    };

    const connect = async () => {
      try {
        setConnection("connecting");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        peer = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        stream.getTracks().forEach((track) => peer?.addTrack(track, stream!));

        audioElement = new Audio();
        audioElement.autoplay = true;
        audioElement.setAttribute("playsinline", "true");
        peer.ontrack = (event) => {
          if (!audioElement) return;
          audioElement.srcObject = event.streams[0];
          void audioElement.play().catch(() => undefined);
        };
        peer.onconnectionstatechange = () => {
          if (!peer || cancelled) return;
          if (peer.connectionState === "connected") setConnection("live");
          if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
            setConnection("error");
          }
        };

        const audioContext = getAudioContext();
        if (audioContext) {
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          const values = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (cancelled) return;
            analyser.getByteFrequencyData(values);
            const average = values.reduce((total, value) => total + value, 0) / values.length;
            setMicLevel(Math.min(1, average / 95));
            stream?.getAudioTracks().forEach((track) => {
              track.enabled = transmitRef.current;
            });
            animationFrame = window.requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }

        if (role === "A") {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          await waitForIceGathering(peer);
          if (peer.localDescription) await sendDescription(peer.localDescription);
        }

        const poll = async () => {
          if (!peer || cancelled || remoteApplied) return;
          try {
            const signal = await readSignal();
            if (!signal || cancelled) return;
            if (role === "B" && signal.offer && !peer.remoteDescription) {
              await peer.setRemoteDescription(signal.offer);
              const answer = await peer.createAnswer();
              await peer.setLocalDescription(answer);
              await waitForIceGathering(peer);
              if (peer.localDescription) await sendDescription(peer.localDescription);
              remoteApplied = true;
            }
            if (role === "A" && signal.answer && !peer.remoteDescription) {
              await peer.setRemoteDescription(signal.answer);
              remoteApplied = true;
            }
          } catch {
            setConnection("error");
          }
        };

        await poll();
        pollingTimer = window.setInterval(poll, 1000);
      } catch {
        setConnection("error");
      }
    };

    void connect();

    return () => {
      cancelled = true;
      if (pollingTimer) window.clearInterval(pollingTimer);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      peer?.close();
      if (audioElement) audioElement.srcObject = null;
    };
  }, [code, token, role, enabled]);

  return { connection, micLevel };
}

export function useSynchronizedBackingTrack(
  track: Track | undefined,
  startTimestamp: number | null | undefined,
  playing: boolean,
) {
  useEffect(() => {
    if (!track || !startTimestamp || !playing) return;

    let audioElement: HTMLAudioElement | null = null;
    let fallbackTimer: number | null = null;
    let syncInterval: number | null = null;
    let useFallback = !track.audioUrl;

    const startAudioPlayback = () => {
      if (!track.audioUrl) return;

      audioElement = new Audio(track.audioUrl);
      audioElement.preload = "auto";
      audioElement.crossOrigin = "anonymous";

      audioElement.onerror = () => {
        // If real audio fails to load, gracefully start synth fallback
        useFallback = true;
        startSynthFallback();
      };

      const syncAudio = () => {
        if (!audioElement || useFallback) return;
        const elapsed = (Date.now() - startTimestamp) / 1000;

        if (elapsed < 0) {
          // Still in countdown
          if (!audioElement.paused) audioElement.pause();
          return;
        }

        if (elapsed >= track.duration) {
          if (!audioElement.paused) audioElement.pause();
          return;
        }

        if (audioElement.paused) {
          audioElement.currentTime = Math.max(0, elapsed);
          void audioElement.play().catch(() => {
            // If autoplay is blocked, switch to synth fallback
            useFallback = true;
            startSynthFallback();
          });
        } else {
          // Check drift (> 250ms drift adjustment)
          const drift = Math.abs(audioElement.currentTime - elapsed);
          if (drift > 0.25) {
            audioElement.currentTime = elapsed;
          }
        }
      };

      syncAudio();
      syncInterval = window.setInterval(syncAudio, 200);
    };

    const startSynthFallback = () => {
      const context = getAudioContext();
      if (!context) return;

      let lastBeat = -1;
      const beatLength = 60 / track.bpm;
      const notes = [0, 3, 7, 10, 7, 3, 5, 7];
      const root = track.key.includes("A")
        ? 110
        : track.key.includes("C")
        ? 130.81
        : track.key.includes("D")
        ? 146.83
        : 174.61;

      const pulse = (frequency: number, length: number, gainValue: number, type: OscillatorType) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(gainValue, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + length);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + length);
      };

      const schedule = () => {
        if (context.state === "suspended") void context.resume();
        const elapsed = (Date.now() - startTimestamp) / 1000;
        if (elapsed < 0 || elapsed > track.duration) return;
        const beat = Math.floor(elapsed / beatLength);
        if (beat === lastBeat) return;
        lastBeat = beat;
        const note = notes[beat % notes.length];
        pulse(root * 2 ** (note / 12), beatLength * 0.7, 0.035, "triangle");
        if (beat % 4 === 0) pulse(58, 0.18, 0.12, "sine");
        if (beat % 2 === 1) pulse(900, 0.035, 0.018, "square");
      };

      fallbackTimer = window.setInterval(schedule, 35);
      schedule();
    };

    if (track.audioUrl) {
      startAudioPlayback();
    } else {
      startSynthFallback();
    }

    return () => {
      if (syncInterval) window.clearInterval(syncInterval);
      if (fallbackTimer) window.clearInterval(fallbackTimer);
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
        audioElement = null;
      }
    };
  }, [track, startTimestamp, playing]);
}
