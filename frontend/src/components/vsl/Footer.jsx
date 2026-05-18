import { BRAND } from "@/lib/constants";

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer
            data-testid="vsl-footer"
            className="w-full border-t border-white/5 mt-16"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img
                            src={BRAND.logoUrl}
                            alt="RecuperaPix"
                            className="h-10 w-auto object-contain opacity-90"
                        />
                        <div>
                            <p className="font-display text-white text-sm">
                                {BRAND.name}
                            </p>
                            <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                                {BRAND.tagline}
                            </p>
                        </div>
                    </div>

                    <nav className="flex items-center gap-6 text-xs text-zinc-500">
                        <a
                            href="#"
                            data-testid="vsl-footer-terms"
                            className="hover:text-[#00FF66] transition-colors"
                        >
                            Termos de uso
                        </a>
                        <a
                            href="#"
                            data-testid="vsl-footer-privacy"
                            className="hover:text-[#00FF66] transition-colors"
                        >
                            Política de privacidade
                        </a>
                        <a
                            href="#"
                            data-testid="vsl-footer-contact"
                            className="hover:text-[#00FF66] transition-colors"
                        >
                            Contato
                        </a>
                    </nav>
                </div>

                <p
                    data-testid="vsl-footer-disclaimer"
                    className="mt-10 text-[11px] leading-relaxed text-zinc-600 max-w-4xl"
                >
                    <strong className="text-zinc-500">Aviso legal:</strong> A
                    RecuperaPix é um serviço de orientação e suporte na
                    recuperação de valores perdidos em fraudes e transações
                    indevidas via PIX, baseado em mecanismos oficiais do Banco
                    Central do Brasil. Os resultados variam conforme cada caso
                    e dependem da decisão das instituições financeiras
                    envolvidas. Os depoimentos apresentados refletem experiências
                    individuais e não representam garantia de resultado. Este
                    site não é vinculado ao Banco Central do Brasil ou a
                    qualquer instituição financeira.
                </p>

                <p className="mt-6 text-[11px] text-zinc-700">
                    © {year} {BRAND.name}. Todos os direitos reservados.
                </p>
            </div>
        </footer>
    );
}
