const VPS = "http://179.197.64.167:5999";

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
      headers: { "Content-Type": "application/json" },
      body: method === "POST" || method === "PATCH" ? JSON.stringify(body) : undefined,
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ erro: e.message });
  }
}
