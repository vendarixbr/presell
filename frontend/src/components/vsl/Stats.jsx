import { TrendingUp, Users, Star } from "lucide-react";

const stats = [
    {
        icon: Users,
        value: "+47 mil",
        label: "Brasileiros atendidos",
        sub: "Pessoas que recuperaram valores com nossa orientação",
    },
    {
        icon: TrendingUp,
        value: "R$ 12 mi",
        label: "Recuperados",
        sub: "Valores devolvidos a vítimas de golpes e fraudes",
    },
    {
        icon: Star,
        value: "98%",
        label: "Satisfação",
        sub: "Clientes que aprovam o nosso atendimento",
    },
];

export default function Stats() {
    return (
        <section
            data-testid="vsl-stats-bar"
            className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20"
        >
            <div className="text-center mb-10">
                <p className="text-xs tracking-[0.3em] uppercase text-[#00FF66] font-semibold mb-3">
                    Resultados Reais
                </p>
                <h2 className="font-display text-3xl sm:text-4xl text-white font-medium tracking-tight">
                    Números que falam por si.
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div
                            key={i}
                            data-testid={`vsl-stat-${i}`}
                            className="rp-glass rounded-2xl p-6 sm:p-8 group hover:border-[#00FF66]/30 transition-colors duration-300"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-[#00FF66]" />
                                </div>
                                <span className="text-xs uppercase tracking-widest text-zinc-500">
                                    {s.label}
                                </span>
                            </div>
                            <div
                                className="font-display text-5xl sm:text-6xl font-medium text-white tracking-tight"
                                style={{
                                    textShadow:
                                        "0 0 30px rgba(0,255,102,0.18)",
                                }}
                            >
                                {s.value}
                            </div>
                            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                                {s.sub}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
