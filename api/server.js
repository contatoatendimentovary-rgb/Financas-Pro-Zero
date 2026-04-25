export default async function handler(req, res) {
    // 1. Só aceita requisições do tipo POST
    if (req.method !== "POST") {
        return res.status(405).json({ erro: "Método não permitido" });
    }

    const { mensagem } = req.body;

    // 2. O Prompt que ensina a IA a categorizar para o seu gráfico
    const prompt = `Analise esta transação: "${mensagem}". 
    Retorne estritamente um JSON no formato: 
    {"valor": number, "descricao": "string", "tipo": "receita" ou "despesa", "categoria": "Essencial", "Lazer" ou "Investimento"}`;

    try {
        // 3. Chamada corrigida para o modelo Gemini 1.5 Flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const data = await response.json();
        
        // 4. Pega a resposta da IA e envia de volta para o seu app
        const respostaIA = JSON.parse(data.candidates[0].content.parts[0].text);
        res.status(200).json(respostaIA);

    } catch (error) {
        console.error("Erro na API:", error);
        res.status(500).json({ erro: "Falha ao processar IA", detalhes: error.message });
    }
}
