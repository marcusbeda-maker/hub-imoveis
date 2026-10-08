// sync-api da VPS 2 via nginx/HTTPS; acesso liberado pela chave X-Hub-Key (env HUB_KEY na Vercel) - 07/10/2026
const VPS = process.env.SYNC_API_BASE || "https://api.marcusbedacorretor.com";
const HUB_KEY = process.env.HUB_KEY || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const rota = req.query.rota || "status";
  const GET_ROTAS = ["status", "notion-imoveis"];
  const method = GET_ROTAS.includes(rota) ? "GET" : "POST";

  try {
    const resp = await fetch(`${VPS}/${rota}`, {
  method,
  headers: { "Content-Type": "application/json", "X-Hub-Key": HUB_KEY },
  body: method === "POST" ? JSON.stringify(req.body) : undefined,
});
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ erro: e.message });
  }
}
