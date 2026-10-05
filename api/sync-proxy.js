import { exigeLogin } from "./_auth.js";

// sync-api da VPS 2. Desde 08/09/2026 a porta 5999 crua fica fechada para a
// internet; o caminho externo e o HTTPS do nginx, que aponta para a mesma 5999.
const VPS = (process.env.SYNC_API_BASE || "https://api.marcusbedacorretor.com").replace(/\/$/, "");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!(await exigeLogin(req, res))) return;
  const rota = req.query.rota || "status";
  const GET_ROTAS = ["status", "notion-imoveis"];
  const method = GET_ROTAS.includes(rota) ? "GET" : "POST";

  try {
    const resp = await fetch(`${VPS}/${rota}`, {
  method,
  headers: { "Content-Type": "application/json" },
  body: method === "POST" ? JSON.stringify(req.body) : undefined,
});
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ erro: e.message });
  }
}
