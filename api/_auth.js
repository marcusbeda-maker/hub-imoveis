// Verificacao de login para as funcoes serverless do Hub.
// (o "_" no nome impede a Vercel de publicar este arquivo como rota)
//
// O navegador manda o token do Firebase em "Authorization: Bearer <token>".
// Aqui o token e conferido no proprio Google (Identity Toolkit), que recusa
// token falso, vencido ou de outro projeto. Sem token valido -> 401.
//
// Opcional: HUB_EMAILS_PERMITIDOS na Vercel (e-mails separados por virgula)
// limita o acesso a essas contas, mesmo que alguem crie conta no Firebase.

// chave publica do app web (a mesma que ja vai no navegador em firebaseConfig)
const FIREBASE_API_KEY =
  process.env.FIREBASE_API_KEY || "AIzaSyCGv94pkCGguMbrpJ8IHn7A8GdT6lcnrPo";

export async function exigeLogin(req, res) {
  const cab = req.headers.authorization || "";
  const token = cab.startsWith("Bearer ") ? cab.slice(7).trim() : "";
  if (!token) {
    res.status(401).json({ erro: "nao autenticado" });
    return null;
  }

  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    const d = await r.json();
    const u = r.ok && d.users && d.users[0];
    if (!u || u.disabled) {
      res.status(401).json({ erro: "sessao invalida ou expirada" });
      return null;
    }

    const email = (u.email || "").toLowerCase();
    const permitidos = (process.env.HUB_EMAILS_PERMITIDOS || "")
      .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (permitidos.length && !permitidos.includes(email)) {
      res.status(403).json({ erro: "usuario sem acesso" });
      return null;
    }
    return { email };
  } catch {
    res.status(503).json({ erro: "nao consegui validar o login" });
    return null;
  }
}
