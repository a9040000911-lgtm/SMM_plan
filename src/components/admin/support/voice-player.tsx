"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';

export function VoicePlayer({ src }: { src: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // Initialize Web Audio API for volume boosting (> 100%)
    const initAudioContext = () => {
        if (!audioRef.current || audioContextRef.current) return;

        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const ctx = new AudioContextClass();
            const gainNode = ctx.createGain();
            const source = ctx.createMediaElementSource(audioRef.current);

            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            audioContextRef.current = ctx;
            gainNodeRef.current = gainNode;

            // Set initial volume boost
            gainNode.gain.value = isMuted ? 0 : volume;
        } catch (e) {
            console.error('Failed to init AudioContext:', e);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            initAudioContext();
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }

            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSpeedToggle = () => {
        const rates = [1, 1.5, 2];
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(nextRate);
        if (audioRef.current) audioRef.current.playbackRate = nextRate;
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return (
        <div className="flex flex-col gap-2 p-3 bg-slate-100/80 backdrop-blur-sm rounded-lg min-w-[240px] border border-slate-200/50 shadow-sm animate-in fade-in slide-in-from-top-1">
            <audio
                ref={audioRef}
                src={src}
                crossOrigin="anonymous"
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
            />

            <div className="flex items-center gap-3">
                <button
                    onClick={togglePlay}
                    className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shrink-0 shadow-md active:scale-95"
                >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
                </button>

                <div className="flex-1 space-y-1">
                    <div className="h-1 bg-slate-200/80 rounded-full overflow-hidden relative cursor-pointer group">
                        <div
                            className="h-full bg-blue-600 transition-all absolute top-0 left-0"
                            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                        />
                        <div
                            className="absolute top-0 left-0 w-full h-full opacity-0 hover:opacity-10"
                            onClick={(e) => {
                                if (audioRef.current && duration) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const percent = (e.clientX - rect.left) / rect.width;
                                    audioRef.current.currentTime = percent * duration;
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold tabular-nums">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <button
                    onClick={handleSpeedToggle}
                    className="px-1.5 py-1 bg-slate-200 text-slate-600 text-[10px] font-black rounded-md hover:bg-slate-300 transition-colors shrink-0 tabular-nums"
                    title="Скорость воспроизведения"
                >
                    {playbackRate}x
                </button>
            </div>

            <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/50">
                <div className="flex items-center justify-between px-0.5 mb-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Громкость</span>
                    <span className={`text-[9px] font-black tabular-nums ${volume > 1 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`}>
                        {Math.round(volume * 100)}% {volume > 1 && '🚀'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const newMuted = !isMuted;
                            setIsMuted(newMuted);
                            if (gainNodeRef.current) gainNodeRef.current.gain.value = newMuted ? 0 : volume;
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {isMuted || volume === 0 ? <Volume2 size={12} className="opacity-40" /> : <Volume2 size={12} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            const newVol = parseFloat(e.target.value);
                            setVolume(newVol);
                            setIsMuted(newVol === 0);
                            initAudioContext();
                            if (gainNodeRef.current) {
                                gainNodeRef.current.gain.value = newVol;
                            }
                        }}
                        className="flex-1 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full"
                    />
                </div>
            </div>
        </div>
    );
}
