export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ erro: "Método negado" });

    const { mensagem } = req.body;
    const KEY = process.env.GEMINI_API_KEY;

    if (!KEY) return res.status(500).json({ erro: "Chave não configurada na Vercel" });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: `Analise: "${mensagem}". Retorne APENAS um JSON puro (sem markdown ou crases) com este formato: {"valor": 0.00, "descricao": "nome", "tipo": "receita" ou "despesa", "categoria": "Lazer", "Essencial" ou "Investimento"}` }] 
                }]
            })
        });

        const data = await response.json();
        
        if (data.error) return res.status(400).json({ erro: "Erro no Google: " + data.error.message });

        // Limpa a resposta para garantir que seja um JSON puro
        let textoIA = data.candidates[0].content.parts[0].text;
        textoIA = textoIA.replace(/```json|```/g, "").trim(); 
        
        res.status(200).json(JSON.parse(textoIA));

    } catch (e) {
        res.status(500).json({ erro: "Erro no processamento: " + e.message });
    }
}
