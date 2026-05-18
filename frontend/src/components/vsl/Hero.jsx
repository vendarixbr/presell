import { useState, useCallback } from "react";
import VSLPlayer from "@/components/vsl/VSLPlayer";
import LockedCTA from "@/components/vsl/LockedCTA";
import CredibilityBullets from "@/components/vsl/CredibilityBullets";
import ConsultaFlow from "@/components/vsl/ConsultaFlow";
import ExpertBlock from "@/components/vsl/ExpertBlock";

export default function Hero({ gateData = null }) {
    const [watchedSeconds, setWatchedSeconds] = useState(0);
    const [flowOpen, setFlowOpen] = useState(false);

    const handleProgress = useCallback((s) => {
        setWatchedSeconds((prev) => (s > prev ? s : prev));
    }, []);

    return (
        <section
            data-testid="vsl-hero-section"
            className="relative w-full overflow-hidden rp-hero-bg"
        >
            {/* Grid overlay */}
            <div className="absolute inset-0 rp-grid-overlay pointer-events-none" />
            {/* Noise */}
            <div className="absolute inset-0 rp-noise pointer-events-none" />

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-20 flex flex-col">
                {/* Overline */}
                <div className="rp-fade-in flex justify-center order-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF66]/5 border border-[#00FF66]/20 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                        <span className="text-[11px] tracking-[0.2em] uppercase text-[#00FF66] font-semibold">
                            Atenção · Tempo Limitado
                        </span>
                    </div>
                </div>

                {/* H1 */}
                <h1
                    data-testid="vsl-hero-title"
                    className="rp-fade-in font-display text-center text-white text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05] order-2"
                    style={{ animationDelay: "0.05s" }}
                >
                    Recupere o dinheiro perdido em{" "}
                    <span
                        className="text-[#00FF66]"
                        style={{
                            textShadow: "0 0 40px rgba(0,255,102,0.35)",
                        }}
                    >
                        golpes online
                    </span>{" "}
                    agora mesmo.
                </h1>

                {/* VSL Player — mobile: logo após o H1 | desktop: após os bullets */}
                <div
                    className="rp-fade-in mt-8 sm:mt-12 max-w-4xl mx-auto w-full order-3 sm:order-5"
                    style={{ animationDelay: "0.35s" }}
                >
                    <VSLPlayer onProgress={handleProgress} />
                </div>

                {/* Subtitle */}
                <p
                    data-testid="vsl-hero-subtitle"
                    className="rp-fade-in mt-6 text-center text-zinc-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed order-4 sm:order-3"
                    style={{ animationDelay: "0.15s" }}
                >
                    Descubra como milhares de brasileiros estão conseguindo recuperar o dinheiro perdido após fraudes via PIX, golpes digitais e transações indevidas — usando os mecanismos oficiais do Banco Central.
                </p>

                {/* Bullets */}
                <div
                    className="rp-fade-in mt-8 order-5 sm:order-4"
                    style={{ animationDelay: "0.25s" }}
                >
                    <CredibilityBullets />
                </div>

                {/* CTA */}
                <div
                    className="rp-fade-in mt-8 sm:mt-10 max-w-2xl mx-auto w-full order-6"
                    style={{ animationDelay: "0.45s" }}
                >
                    <LockedCTA
                        watchedSeconds={watchedSeconds}
                        onOpenFlow={() => setFlowOpen(true)}
                    />
                    {/* Trust line — directly below the button */}
                    <p className="mt-3 text-center text-xs text-zinc-600">
                        🔒 Conexão segura · Dados protegidos · Sem custo inicial
                    </p>
                </div>

                {/* Expert block */}
                <div className="order-7 w-full max-w-2xl mx-auto mt-2 px-0">
                    <ExpertBlock />
                </div>
            </div>

            <ConsultaFlow open={flowOpen} onClose={() => setFlowOpen(false)} initialFormData={gateData} />
        </section>
    );
}
