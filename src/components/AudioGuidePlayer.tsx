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
    <div className="bg-white border border-outline-variant/40 rounded-2xl p-5 sm:p-6 soft-shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Winemaker info */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-outline-variant/40 flex-shrink-0">
            <Image
              src={avatarUrl}
              alt={winemakerName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse-soft" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                La Voz del Enólogo
              </span>
            </div>
            <h4 className="font-serif text-base font-semibold text-on-surface leading-tight">
              {title}
            </h4>
            <p className="text-[12px] text-on-surface-variant/70">{winemakerName} • {winemakerRole}</p>
          </div>
        </div>

        {/* Play Controls */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center hover:bg-primary transition-all duration-200 ease-out active:scale-[0.94] shadow-sm"
            aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
          >
            <span className="material-symbols-outlined text-[22px]">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>

          {/* Soundwave animation */}
          <div className="flex items-center gap-1 h-6 px-2">
            {[35, 65, 45, 90, 60, 80, 40, 70, 50, 85].map((height, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-300 ease-out ${
                  isPlaying ? "bg-primary" : "bg-outline-variant/60"
                }`}
                style={{
                  height: isPlaying ? `${Math.max(25, (height * ((idx % 3) + 1)) % 100)}%` : "20%",
                  transitionDelay: `${idx * 40}ms`,
                }}
              />
            ))}
          </div>

          <span className="text-[12px] font-medium text-on-surface-variant/70 min-w-[55px] text-right font-mono">
            {formatTime(progress)} / {formatTime(durationSeconds)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-surface-container h-1 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${(progress / durationSeconds) * 100}%` }}
        />
      </div>

      {/* Transcript Toggle */}
      <div className="mt-3 text-right">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="text-[11px] font-medium text-on-surface-variant/70 hover:text-primary transition-colors duration-200 inline-flex items-center gap-1"
        >
          <span>{showTranscript ? "Ocultar transcripción" : "Leer transcripción"}</span>
          <span className="material-symbols-outlined text-[14px]">
            {showTranscript ? "expand_less" : "expand_more"}
          </span>
        </button>
      </div>

      {/* Transcript Text */}
      {showTranscript && (
        <div className="mt-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 text-[13px] text-on-surface-variant leading-relaxed animate-fade-in">
          <p className="italic">"{storyText}"</p>
        </div>
      )}
    </div>
  );
}
