import { exigeLogin } from "./_auth.js";

// sync-api da VPS 2. Desde 08/09/2026 a porta 5999 crua fica fechada para a
// internet; o caminho externo e o HTTPS do nginx, que aponta para a mesma 5999.
const VPS = (process.env.SYNC_API_BASE || "https://api.marcusbedacorretor.com").replace(/\/$/, "");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!(await exigeLogin(req, res))) return;
  try {
    const { method, query, body } = req;
    let url = `${VPS}/grupos`;

    if (method === "GET" && query.buscar) {
      url = `${VPS}/grupos/buscar?q=${encodeURIComponent(query.buscar)}`;
    } else if ((method === "PATCH" || method === "DELETE") && query.id) {
      url = `${VPS}/grupos/${encodeURIComponent(query.id)}`;
    }

    const resp = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" || method === "PATCH" ? JSON.stringify(body) : undefined,
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ erro: e.message });
  }
}
