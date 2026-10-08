import { exigeLogin } from "./_auth.js";

// sync-api da VPS 2. Desde 08/09/2026 a porta 5999 crua fica fechada para a
// internet; o caminho externo e o HTTPS do nginx, que aponta para a mesma 5999.
const VPS = (process.env.SYNC_API_BASE || "https://api.marcusbedacorretor.com").replace(/\/$/, "");

// a busca de grupo no WhatsApp pode levar ate 1 minuto (o padrao da Vercel corta antes)
export const config = { maxDuration: 60 };

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
      signal: AbortSignal.timeout(55000),
    });
    // a VPS pode devolver HTML (erro do nginx): repassa o motivo em vez de quebrar no JSON
    const texto = await resp.text();
    let data;
    try {
      data = JSON.parse(texto);
    } catch {
      data = { erro: `VPS 2 respondeu ${resp.status}: ${texto.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)}` };
    }
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ erro: e.message });
  }
}
