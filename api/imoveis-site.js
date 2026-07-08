// Vercel serverless — proxy Notion database
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = process.env.NOTION_DATABASE_ID || "9b57d36bd0a04e1eb7ad8ad1dd3bfa93";

  if (!TOKEN) return res.status(500).json({ erro: "NOTION_TOKEN não configurado" });

  const pages = [];
  let cursor = undefined;

  try {
    do {
      const body = { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) };
      const r = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      for (const page of data.results || []) {
        const p = page.properties || {};
        const fotos = (p["Fotos"]?.files || []).map((f) => f.external?.url || f.file?.url).filter(Boolean);
        pages.push({
          id: page.id,
          nome: p["Nome"]?.title?.[0]?.plain_text || "",
          tipo: p["Tipo"]?.select?.name || "",
          finalidade: p["Finalidade"]?.select?.name || "",
          status: p["Status"]?.select?.name || "",
          bairro: p["Bairro"]?.rich_text?.[0]?.plain_text || "",
          cidade: p["Cidade"]?.select?.name || "",
          valor: p["Valor"]?.number || null,
          quartos: p["Quartos"]?.number || null,
          suites: p["Suítes"]?.number || null,
          banheiros: p["Banheiros"]?.number || null,
          vagas: p["Vagas"]?.number || null,
          area: p["Área m²"]?.number || null,
          areaTotal: p["Área Total"]?.number || null,
          cep: p["CEP"]?.rich_text?.[0]?.plain_text || "",
          endereco: p["Endereço"]?.rich_text?.[0]?.plain_text || "",
          observacoes: p["Observações"]?.rich_text?.[0]?.plain_text || "",
          financiamento: p["Aceita Financiamento"]?.select?.name || "",
          condominio: p["Condomínio R$"]?.rich_text?.[0]?.plain_text || "",
          iptu: p["IPTU"]?.rich_text?.[0]?.plain_text || "",
          link: p["Link do Site"]?.url || "",
          fotos,
          capa: page.cover?.external?.url || page.cover?.file?.url || fotos[0] || null,
        });
      }
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    res.status(200).json({ imoveis: pages });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
}
