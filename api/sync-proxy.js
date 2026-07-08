const VPS = "http://179.197.64.167:5999";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const rota = req.query.rota || "status";
  const GET_ROTAS = ["status", "notion-imoveis"];
  const method = GET_ROTAS.includes(rota) ? "GET" : "POST";

  try {
    const resp = await fetch(`${VPS}/${rota}`, {
      method,
      headers: { "Content-Type": "application/json" },
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ erro: e.message });
  }
}
