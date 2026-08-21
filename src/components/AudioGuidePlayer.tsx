"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface AudioGuidePlayerProps {
  title: string;
  winemakerName?: string;
  winemakerRole?: string;
  avatarUrl?: string;
  storyText: string;
  durationSeconds?: number;
}

export function AudioGuidePlayer({
  title,
  winemakerName = "Alejandro Morales",
  winemakerRole = "Enólogo Jefe • El Origen",
  avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
  storyText,
  durationSeconds = 75,
}: AudioGuidePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 via-surface-container to-surface border border-surface-variant rounded-2xl p-5 sm:p-6 soft-shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Winemaker info */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-sm flex-shrink-0">
            <Image
              src={avatarUrl}
              alt={winemakerName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                La Voz del Enólogo
              </span>
            </div>
            <h4 className="font-serif text-base font-bold text-on-surface leading-tight">
              {title}
            </h4>
            <p className="text-xs text-secondary">{winemakerName} • {winemakerRole}</p>
          </div>
        </div>

        {/* Play Controls */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-primary-container text-white flex items-center justify-center hover:bg-primary shadow-md transition-all active:scale-95"
            aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>

          {/* Soundwave animation */}
          <div className="flex items-center gap-1 h-6 px-2">
            {[35, 65, 45, 90, 60, 80, 40, 70, 50, 85].map((height, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isPlaying ? "bg-primary" : "bg-outline-variant"
                }`}
                style={{
                  height: isPlaying ? `${Math.max(20, (height * (idx % 3 + 1)) % 100)}%` : "20%",
                  transitionDelay: `${idx * 50}ms`,
                }}
              />
            ))}
          </div>

          <span className="text-xs font-semibold text-secondary min-w-[60px] text-right">
            {formatTime(progress)} / {formatTime(durationSeconds)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-500 rounded-full"
          style={{ width: `${(progress / durationSeconds) * 100}%` }}
        />
      </div>

      {/* Transcript Toggle */}
      <div className="mt-3 text-right">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <span>{showTranscript ? "Ocultar transcripción" : "Leer transcripción"}</span>
          <span className="material-symbols-outlined text-[14px]">
            {showTranscript ? "expand_less" : "expand_more"}
          </span>
        </button>
      </div>

      {/* Transcript Text */}
      {showTranscript && (
        <div className="mt-3 p-4 bg-surface rounded-xl border border-surface-variant text-xs text-on-surface-variant leading-relaxed animate-fade-in-up">
          <p className="italic">"{storyText}"</p>
        </div>
      )}
    </div>
  );
}
