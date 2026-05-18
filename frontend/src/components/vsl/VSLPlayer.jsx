import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";
import { LS_PROGRESS_KEY, WISTIA_MEDIA_ID } from "@/lib/constants";

const WISTIA_SCRIPT = "https://fast.wistia.com/assets/external/E-v1.js";

function loadScript(src) {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.body.appendChild(s);
    });
}

export default function VSLPlayer({ onProgress }) {
    const lastTimeRef = useRef(0);
    const videoApiRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [muted, setMuted] = useState(true);
    const [watched, setWatched] = useState(0);

    // Carrega progresso persistido
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_PROGRESS_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (typeof data?.maxWatched === "number" && data.maxWatched > 0) {
                    setWatched(data.maxWatched);
                }
            }
        } catch (e) {
            // ignore
        }
    }, []);

    const persist = useCallback((w) => {
        try {
            localStorage.setItem(
                LS_PROGRESS_KEY,
                JSON.stringify({ maxWatched: w, updatedAt: Date.now() })
            );
        } catch (e) {
            // ignore
        }
    }, []);

    // Reporta progresso para o pai
    useEffect(() => {
        if (onProgress) onProgress(watched);
    }, [watched, onProgress]);

    // Inicializa via _wq (API padrão do Wistia embed normal)
    useEffect(() => {
        let mounted = true;

        window._wq = window._wq || [];
        window._wq.push({
            id: WISTIA_MEDIA_ID,
            options: { autoPlay: false, silentAutoPlay: false },
            onReady(video) {
                if (!mounted) return;
                videoApiRef.current = video;
                setReady(true);

                // Inicia mutado para evitar bloqueio de autoplay
                try { video.mute(); } catch (e) { /* ignore */ }

                video.bind("play", () => {
                    if (mounted) setHasStarted(true);
                });

                // timechange dispara ~300ms, igual ao time-update do Aurora
                video.bind("timechange", (t) => {
                    if (!mounted) return;
                    const delta = t - lastTimeRef.current;
                    lastTimeRef.current = t;
                    // Só conta tempo "natural" — skip/seek não conta
                    if (delta > 0.05 && delta < 1.5) {
                        setWatched((prev) => {
                            const next = prev + delta;
                            if (Math.floor(next) !== Math.floor(prev)) {
                                persist(next);
                            }
                            return next;
                        });
                    }
                });
            },
        });

        loadScript(WISTIA_SCRIPT);

        return () => {
            mounted = false;
        };
    }, [persist]);

    const handleStartClick = () => {
        const video = videoApiRef.current;
        if (!video) return;
        try {
            video.unmute();
            setMuted(false);
            video.play();
        } catch (e) {
            try {
                video.mute();
                setMuted(true);
                video.play();
            } catch (e2) {
                // ignore
            }
        }
    };

    const toggleMute = () => {
        const video = videoApiRef.current;
        if (!video) return;
        try {
            if (muted) {
                video.unmute();
                setMuted(false);
            } else {
                video.mute();
                setMuted(true);
            }
        } catch (e) {
            // ignore
        }
    };

    return (
        <div
            data-testid="vsl-video-player"
            className="relative w-full mx-auto"
        >
            <div className="relative rounded-2xl overflow-hidden rp-frame-breathe bg-black">
                <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                    {/* Embed padrão do Wistia */}
                    <div
                        data-testid="vsl-video-element"
                        className={`wistia_embed wistia_async_${WISTIA_MEDIA_ID} absolute inset-0 w-full h-full`}
                        style={{ overflow: "hidden" }}
                    />

                    {/* Overlay inicial */}
                    {!hasStarted && (
                        <button
                            type="button"
                            onClick={handleStartClick}
                            disabled={!ready}
                            data-testid="vsl-start-play-button"
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm group cursor-pointer disabled:cursor-wait"
                        >
                            {!ready ? (
                                <div className="flex flex-col items-center gap-4 text-white/80">
                                    <Loader2 className="w-10 h-10 animate-spin text-[#00FF66]" />
                                    <p className="text-sm uppercase tracking-[0.3em]">
                                        Carregando vídeo...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-[#00FF66] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity" />
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#00FF66] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <Play
                                                className="w-8 h-8 sm:w-10 sm:h-10 text-black ml-1"
                                                fill="black"
                                            />
                                        </div>
                                    </div>
                                    <p className="mt-6 text-white font-display text-lg sm:text-xl">
                                        Clique para iniciar
                                    </p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#00FF66]">
                                        Vídeo com áudio
                                    </p>
                                </>
                            )}
                        </button>
                    )}

                    {/* Indicador ao vivo — só o dot */}
                    {hasStarted && (
                        <div className="absolute top-3 left-3 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-black/50 backdrop-blur-md border border-[#00FF66]/20 pointer-events-none">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-[#00FF66] opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF66]" />
                            </span>
                        </div>
                    )}

                    {/* Botão mute — ícone minimalista */}
                    {hasStarted && (
                        <button
                            type="button"
                            onClick={toggleMute}
                            data-testid="vsl-mute-toggle"
                            className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-base hover:border-[#00FF66]/40 transition"
                            aria-label={muted ? "Ativar som" : "Desativar som"}
                        >
                            {muted ? "🔇" : "🔊"}
                        </button>
                    )}

                    {/* Faixa bloqueando interação com a timeline */}
                    {hasStarted && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-10 z-10"
                            onClick={(e) => e.preventDefault()}
                            onMouseDown={(e) => e.preventDefault()}
                            style={{ background: "transparent" }}
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
