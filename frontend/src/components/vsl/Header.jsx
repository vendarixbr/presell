import { BRAND } from "@/lib/constants";
import { Users } from "lucide-react";

export default function Header() {
    return (
        <header
            data-testid="vsl-header"
            className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#050A08]/70 border-b border-white/5"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                {/* Logo */}
                <a
                    href="/"
                    data-testid="vsl-logo-link"
                    className="flex items-center gap-2 group"
                >
                    <img
                        src={BRAND.logoUrl}
                        alt="RecuperaPix"
                        className="h-10 sm:h-12 w-auto object-contain"
                        style={{
                            filter: "drop-shadow(0 0 12px rgba(0,255,102,0.25))",
                        }}
                    />
                </a>

                {/* Prova social */}
                <div
                    data-testid="vsl-header-social-proof"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF66]/5 border border-[#00FF66]/20"
                >
                    <Users className="w-3.5 h-3.5 text-[#00FF66]" />
                    <span className="text-xs text-white/80">
                        <span className="text-[#00FF66] font-semibold">+47 mil</span> brasileiros já recuperaram valores
                    </span>
                </div>

                {/* mobile */}
                <div className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF66]/5 border border-[#00FF66]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                    <span className="text-[10px] text-white/80">
                        <span className="text-[#00FF66] font-semibold">+47 mil</span> recuperados
                    </span>
                </div>
            </div>
        </header>
    );
}
