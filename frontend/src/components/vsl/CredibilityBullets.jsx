import { ShieldCheck, Zap, BadgeCheck } from "lucide-react";

const items = [
    {
        icon: ShieldCheck,
        label: "Atendimento especializado",
    },
    {
        icon: Zap,
        label: "Processo rápido e seguro",
    },
    {
        icon: BadgeCheck,
        label: "Consulta inicial gratuita",
    },
];

export default function CredibilityBullets() {
    return (
        <ul
            data-testid="vsl-credibility-bullets"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm"
        >
            {items.map(({ icon: Icon, label }, i) => (
                <li
                    key={i}
                    data-testid={`vsl-bullet-${i}`}
                    className="flex items-center gap-2 text-zinc-300"
                >
                    <Icon className="w-4 h-4 text-[#00FF66]" />
                    <span>{label}</span>
                </li>
            ))}
        </ul>
    );
}
