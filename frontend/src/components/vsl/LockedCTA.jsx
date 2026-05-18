import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { UNLOCK_SECONDS } from "@/lib/constants";

/**
 * LockedCTA
 * Botão de CTA que permanece bloqueado até o usuário assistir
 * pelo menos UNLOCK_SECONDS (60s) do vídeo.
 *
 * Props:
 *   watchedSeconds: number (segundos realmente assistidos)
 *   onOpenFlow: () => void  — abre o funil de consulta
 */
export default function LockedCTA({ watchedSeconds = 0, onOpenFlow }) {
    const unlocked = watchedSeconds >= UNLOCK_SECONDS;
    const watched = Math.min(watchedSeconds, UNLOCK_SECONDS);
    const remaining = Math.max(UNLOCK_SECONDS - watched, 0);

    const fmt = (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const handleClick = (e) => {
        e.preventDefault();
        if (!unlocked) return;
        if (onOpenFlow) onOpenFlow();
    };

    return (
        <div className="w-full flex flex-col items-center gap-4">
            {unlocked ? (
                <button
                    type="button"
                    onClick={handleClick}
                    data-testid="vsl-main-cta"
                    aria-disabled={false}
                    className="rp-pulse-glow group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-12 py-5 rounded-2xl bg-[#00FF66] text-black font-display font-bold text-base sm:text-lg tracking-tight hover:bg-[#00e65c] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300"
                >
                    <Sparkles className="w-5 h-5" />
                    <span>CONSULTAR MEU POSSÍVEL REEMBOLSO</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            ) : (
                <button
                    type="button"
                    disabled
                    data-testid="vsl-main-cta-locked"
                    aria-disabled={true}
                    className="rp-locked-btn relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-12 py-5 rounded-2xl border border-zinc-800 text-zinc-500 font-display font-semibold text-base sm:text-lg tracking-tight cursor-not-allowed select-none overflow-hidden"
                >
                    <Lock className="w-5 h-5" />
                    <span>RECUPERAR AGORA</span>
                    <span
                        data-testid="vsl-cta-progress-text"
                        className="ml-2 px-2 py-0.5 rounded-md bg-black/40 border border-zinc-700 text-xs text-[#00FF66] font-mono"
                    >
                        {fmt(watched)} / {fmt(UNLOCK_SECONDS)}
                    </span>
                </button>
            )}

            {/* Texto auxiliar */}
            <p
                data-testid="vsl-cta-helper-text"
                className={`text-xs sm:text-sm text-center max-w-md ${
                    unlocked ? "text-[#00FF66]" : "text-zinc-500"
                }`}
            >
                {unlocked
                    ? "✓ Liberação concluída. Clique para iniciar sua consulta gratuita."
                    : `Liberação disponível após assistir 1 minuto do vídeo · faltam ${fmt(remaining)}`}
            </p>

            {/* Barra de liberação */}
            <div className="w-full max-w-md h-1 rounded-full bg-zinc-900 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-[#00cc52] to-[#00FF66] transition-all duration-500"
                    style={{ width: `${(watched / UNLOCK_SECONDS) * 100}%` }}
                />
            </div>
        </div>
    );
}
