// sync-api da VPS 2 via nginx/HTTPS; acesso liberado pela chave X-Hub-Key (env HUB_KEY na Vercel) - 07/10/2026
const VPS = process.env.SYNC_API_BASE || "https://api.marcusbedacorretor.com";
const HUB_KEY = process.env.HUB_KEY || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
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
      headers: { "Content-Type": "application/json", "X-Hub-Key": HUB_KEY },
      body: method === "POST" || method === "PATCH" ? JSON.stringify(body) : undefined,
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ erro: e.message });
  }
}
