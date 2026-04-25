export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

    const { mensagem } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    // Teste de segurança da chave
    if (!API_KEY || API_KEY === "") {
        return res.status(500).json({ erro: "A Vercel não encontrou a variável GEMINI_API_KEY." });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analise: "${mensagem}". Retorne JSON: {"valor": number, "descricao": "string", "tipo": "receita" ou "despesa", "categoria": "Essencial", "Lazer" ou "Investimento"}` }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(400).json({ erro: "Chave Inválida ou Expirada: " + data.error.message });
        }

        const content = JSON.parse(data.candidates[0].content.parts[0].text);
        res.status(200).json(content);

    } catch (error) {
        res.status(500).json({ erro: "Erro de conexão: " + error.message });
    }
}
