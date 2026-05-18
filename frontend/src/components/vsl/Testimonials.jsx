import { Star, BadgeCheck } from "lucide-react";

const AVATARS = [
    "https://images.unsplash.com/photo-1764545973653-94c40d993495?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBhdmF0YXIlMjBwb3J0cmFpdCUyMGRhcmslMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYxOTc2OHww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1762291629616-3e2c044c79a0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBhdmF0YXIlMjBwb3J0cmFpdCUyMGRhcmslMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYxOTc2OHww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
];

const testimonials = [
    {
        name: "Carlos Eduardo M.",
        city: "São Paulo · SP",
        avatar: AVATARS[0],
        amount: "R$ 4.380",
        text: "Eu achei que tinha perdido tudo. Caí em um golpe via PIX e fiquei completamente desesperado, porque o banco praticamente não ajudou em nada. Encontrei a RecuperaPix e resolvi fazer a análise. O atendimento foi rápido, explicaram tudo de forma simples e consegui entender que existiam possibilidades que eu nem imaginava. Só de não ter desistido já valeu a pena.",
        when: "há 2 semanas",
    },
    {
        name: "Juliana R. Souza",
        city: "Belo Horizonte · MG",
        avatar: AVATARS[1],
        amount: "R$ 1.920",
        text: "Há 2 meses eu caí em um golpe comprando em um site falso e achei que tinha perdido meu dinheiro de vez. Conheci a RecuperaPix e resolvi fazer a análise. Depois da liberação, o dinheiro caiu na minha conta em menos de 1 hora.",
        when: "há 1 mês",
    },
    {
        name: "Antônio Pereira",
        city: "Recife · PE",
        avatar: AVATARS[2],
        amount: "R$ 9.700",
        text: "Eu caí em uma promessa falsa de investimento pela internet e acabei transferindo um valor achando que era uma oportunidade real. Depois descobri que era golpe e fiquei sem saber o que fazer. Conheci a RecuperaPix através de um anúncio e resolvi tentar a análise. O processo foi muito simples e o atendimento passou bastante confiança. Depois da liberação consegui recuperar o valor muito mais rápido do que imaginava. Recomendo demais pra quem passou por isso também.",
        when: "há 3 semanas",
    },
];

function Stars() {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className="w-3.5 h-3.5 text-[#00FF66]"
                    fill="#00FF66"
                />
            ))}
        </div>
    );
}

export default function Testimonials() {
    return (
        <section
            data-testid="vsl-testimonials"
            className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pb-20"
        >
            {/* ReclameAQUI badge */}
            <div className="flex justify-center mb-6">
                <div
                    className="inline-flex items-center gap-3 px-4 py-2 rounded-xl"
                    style={{ backgroundColor: "#0d1a10", border: "1px solid #1e3a26" }}
                >
                    {/* Logo text */}
                    <div className="flex items-center gap-0 font-black text-xl leading-none select-none" style={{ fontFamily: "Arial Black, Arial, sans-serif" }}>
                        <span style={{ color: "#8dc63f" }}>Reclame</span>
                        <span style={{ color: "#006633" }}>AQUI</span>
                    </div>

                    <div className="w-px h-8 bg-zinc-700" />

                    {/* Info */}
                    <div>
                        <p className="text-[#00FF66] text-xs font-bold leading-tight">Parceiro Oficial</p>
                        <p className="text-zinc-400 text-[11px] leading-tight mt-0.5">
                            Empresa verificada · Nota 9.3/10 · Respondemos 100% das reclamações
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center mb-8">
                <p className="text-xs tracking-[0.3em] uppercase text-[#00FF66] font-semibold mb-3">
                    Depoimentos verificados
                </p>
                <h2 className="font-display text-3xl sm:text-4xl text-white font-medium tracking-tight">
                    <span className="text-[#00FF66]">47 mil</span> pessoas que recuperaram valores com a RecuperaPix.
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {testimonials.map((t, i) => (
                    <article
                        key={i}
                        data-testid={`vsl-testimonial-${i}`}
                        className="rp-glass rounded-2xl p-6 hover:border-[#00FF66]/30 transition-colors duration-300 flex flex-col"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <img
                                src={t.avatar}
                                alt={t.name}
                                loading="lazy"
                                className="w-11 h-11 rounded-full object-cover border border-white/10"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-white text-sm font-semibold truncate">
                                        {t.name}
                                    </p>
                                    <BadgeCheck className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
                                </div>
                                <p className="text-xs text-zinc-500">
                                    {t.city}
                                </p>
                            </div>
                            <Stars />
                        </div>

                        <p className="text-sm text-zinc-300 leading-relaxed flex-1">
                            "{t.text}"
                        </p>

                        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs text-zinc-500">
                                {t.when}
                            </span>
                            <span className="text-xs font-mono text-[#00FF66] bg-[#00FF66]/5 border border-[#00FF66]/20 px-2 py-1 rounded-md">
                                Recuperou {t.amount}
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
