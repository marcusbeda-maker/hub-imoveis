export const config = { runtime: "edge" };

const VPS = "http://179.197.64.167:5999";

export default async function handler(req) {
  const url = new URL(req.url);
  const rota = url.searchParams.get("rota") || "status";
  const method = rota === "status" ? "GET" : "POST";

  try {
    const resp = await fetch(`${VPS}/${rota}`, {
      method,
      headers: { "Content-Type": "application/json" },
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ erro: e.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
