export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { mensagem } = req.body;

  const prompt = `Analise a frase financeira: "${mensagem}". Retorne APENAS um JSON: {"valor": number, "descricao": "string", "tipo": "receita" ou "despesa", "categoria": "Essencial", "Lazer" ou "Investimento"}`;

  const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } })
  });

  const data = await response.json();
  res.status(200).json(JSON.parse(data.candidates[0].content.parts[0].text));
}
