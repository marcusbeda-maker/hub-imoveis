// Vercel serverless — proxy para a API de publicação da VPS 1 (/opt/insta)
//
// A chave NUNCA vai para o navegador: fica em INSTA_API_KEY nas variáveis
// de ambiente da Vercel e só é usada aqui, no servidor.
//
//   GET  /api/insta-proxy?acao=status
//   GET  /api/insta-proxy?acao=previa&codigo=51i&rede=instagram&fotos=10
//   POST /api/insta-proxy?acao=publicar   body: {codigo, rede, fotos}

import { exigeLogin } from "./_auth.js";

const BASE = process.env.INSTA_API_BASE || "https://vitrine.marcusbedaimoveis.cloud/insta";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!(await exigeLogin(req, res))) return;

  const CHAVE = process.env.INSTA_API_KEY;
  if (!CHAVE) {
    return res.status(500).json({ erro: "INSTA_API_KEY não configurada na Vercel" });
  }

  const acao = (req.query.acao || "status").toString();

  try {
    if (acao === "status") {
      const r = await fetch(`${BASE}/status`, { headers: { "X-API-Key": CHAVE } });
      return res.status(r.status).json(await r.json());
    }

    if (acao === "previa") {
      const { codigo = "", rede = "instagram", fotos = "10", ia = "0" } = req.query;
      if (!codigo) return res.status(400).json({ erro: "codigo obrigatório" });
      const url = `${BASE}/previa?codigo=${encodeURIComponent(codigo)}` +
                  `&rede=${encodeURIComponent(rede)}&fotos=${encodeURIComponent(fotos)}` +
                  `&ia=${encodeURIComponent(ia)}`;
      // a IA analisa as fotos e demora ~20s; damos folga no tempo
      const r = await fetch(url, { headers: { "X-API-Key": CHAVE } });
      return res.status(r.status).json(await r.json());
    }

    if (acao === "publicar") {
      if (req.method !== "POST") {
        return res.status(405).json({ erro: "publicar exige POST" });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      if (!body.codigo) return res.status(400).json({ erro: "codigo obrigatório" });

      const r = await fetch(`${BASE}/publicar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": CHAVE },
        body: JSON.stringify({
          codigo: body.codigo,
          rede: body.rede || "instagram",
          fotos: Number(body.fotos) || 10,
          // legenda aprovada na prévia; se vier vazia a VPS monta a padrão
          legenda: body.legenda || "",
        }),
      });
      return res.status(r.status).json(await r.json());
    }

    return res.status(400).json({ erro: "ação desconhecida: " + acao });
  } catch (e) {
    return res.status(502).json({ erro: "falha ao falar com a VPS: " + String(e).slice(0, 300) });
  }
}
