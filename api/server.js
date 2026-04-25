export default async function handler(req, res) {
    // Garante que apenas requisições POST funcionem
    if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

    const { mensagem } = req.body;
    const KEY = process.env.GEMINI_API_KEY;

    // Se a chave não estiver configurada na Vercel, avisa aqui
    if (!KEY) {
        return res.status(500).json({ erro: "Chave API não encontrada nas variáveis de ambiente da Vercel." });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analise financeiramente: "${mensagem}". Retorne apenas JSON puro: {"valor": number, "descricao": "string", "tipo": "receita" ou "despesa", "categoria": "Essencial", "Lazer" ou "Investimento"}` }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ erro: "Erro no Google: " + data.error.message });
        }

        const respostaIA = JSON.parse(data.candidates[0].content.parts[0].text);
        res.status(200).json(respostaIA);

    } catch (error) {
        res.status(500).json({ erro: "Falha catastrófica: " + error.message });
    }
}
