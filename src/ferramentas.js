// 05/11/2026 - Ferramentas extras do Hub para publicar "algo a mais".
// NAO mexe no modelo "A arte de morar bem" nem na postagem diaria.
//   - Reels "Gancho + preco" e "Tour rapido": montados na VPS 1 (Remotion), sem API paga.
//   - Kit para CapCut / Edits / Canva: fotos na ordem certa (.zip) + legenda copiada.
const PROXY = "/api/insta-proxy";

function el(tag, css, txt) {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (txt != null) e.textContent = txt;
  return e;
}
const BTN = "padding:11px 14px;border-radius:9px;border:1px solid #ccc;background:#f4f4f4;cursor:pointer;font-size:15px;text-align:left";
const BTN_AZUL = "padding:11px 14px;border-radius:9px;border:0;background:#1877f2;color:#fff;font-weight:600;cursor:pointer;font-size:15px";

async function espera(job, st, msg) {
  let res = null;
  for (let i = 0; i < 120; i++) {
    await new Promise((ok) => setTimeout(ok, 5000));
    const rs = await fetch(`${PROXY}?acao=video-status&job=${encodeURIComponent(job)}`);
    res = await rs.json();
    if (res.estado === "ok" || res.estado === "erro" || res.erro) return res;
    if (st) st.textContent = `${msg} (${res.estado || "aguarde"}, ${(i + 1) * 5}s)`;
  }
  return res || {estado: "erro", erro: "tempo esgotado"};
}

function janela(titulo) {
  const fundo = el("div", "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px");
  const caixa = el("div", "background:#fff;color:#111;border-radius:12px;max-width:560px;width:100%;max-height:92vh;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:10px;font-family:system-ui,sans-serif");
  const topo = el("div", "display:flex;justify-content:space-between;align-items:center;gap:8px");
  topo.append(el("div", "font-weight:700;font-size:16px", titulo));
  const x = el("button", "border:0;background:none;font-size:22px;cursor:pointer", "✕");
  x.onclick = () => fundo.remove();
  topo.append(x);
  const corpo = el("div", "display:flex;flex-direction:column;gap:10px");
  caixa.append(topo, corpo);
  fundo.append(caixa);
  fundo.addEventListener("click", (ev) => { if (ev.target === fundo) fundo.remove(); });
  document.body.append(fundo);
  return {fundo, corpo, fechar: () => fundo.remove()};
}

async function copiar(txt, avisar) {
  try { await navigator.clipboard.writeText(txt); avisar && avisar("Legenda copiada."); }
  catch { window.prompt("Copie a legenda:", txt); }
}

function areaLegenda(texto) {
  const a = el("textarea", "width:100%;min-height:220px;font-size:14px;line-height:1.4;padding:10px;border:1px solid #ccc;border-radius:8px;box-sizing:border-box;resize:vertical");
  a.value = texto || "";
  return a;
}

async function gerarVideo(codigo, modelo, gancho, w, avisar) {
  w.corpo.innerHTML = "";
  const st = el("div", "font-size:15px", "Montando o vídeo na VPS… leva de 1 a 3 minutos. Pode deixar esta janela aberta.");
  w.corpo.append(st);
  const q = new URLSearchParams({acao: "video", codigo, modelo, gancho: gancho || ""});
  const r = await fetch(`${PROXY}?${q}`);
  const j = await r.json();
  if (!r.ok || j.erro) { st.textContent = "Erro: " + (j.erro || r.status); return; }
  const res = await espera(j.job, st, "Montando o vídeo na VPS…");
  if (!res || res.estado !== "ok") { st.textContent = "Não deu certo: " + ((res && (res.erro || res.estado)) || "tempo esgotado"); return; }
  w.corpo.innerHTML = "";
  const v = el("video", "width:100%;max-height:52vh;background:#000;border-radius:8px");
  v.src = res.url; v.controls = true; v.playsInline = true;
  const leg = areaLegenda(res.legenda);
  const linha = el("div", "display:flex;flex-wrap:wrap;gap:8px");
  const baixar = el("a", BTN + ";text-decoration:none;color:#111", "⬇️ Baixar vídeo");
  baixar.href = res.url; baixar.download = ""; baixar.target = "_blank";
  const cop = el("button", BTN, "📋 Copiar legenda");
  cop.onclick = () => copiar(leg.value, avisar);
  const pub = el("button", BTN_AZUL, "🚀 Publicar no Instagram");
  pub.onclick = async () => {
    if (!leg.value.trim()) { avisar("A legenda está vazia."); return; }
    if (!window.confirm("Publicar este Reels agora no @marcusbeda?\n\nEsta ação é irreversível.")) return;
    pub.disabled = true; pub.textContent = "Publicando… (até 3 min)";
    const rp = await fetch(`${PROXY}?acao=publicar-video`, {method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({url: res.url, legenda: leg.value, codigo: res.codigo})});
    let jp = await rp.json();
    if (rp.ok && jp.job) jp = await espera(jp.job, null, "");
    if (!rp.ok || jp.erro || jp.estado !== "ok") { pub.disabled = false; pub.textContent = "🚀 Publicar no Instagram"; avisar("Falhou: " + (jp.erro || rp.status)); return; }
    avisar("Reels publicado!"); if (jp.link) window.open(jp.link, "_blank"); w.fechar();
  };
  linha.append(baixar, cop, pub);
  w.corpo.append(v, el("div", "font-size:13px;color:#555", "Legenda (pode editar):"), leg, linha);
}

async function gerarKit(codigo, w, avisar) {
  w.corpo.innerHTML = "";
  const st = el("div", "font-size:15px", "Separando as fotos na ordem certa (fachada → sala → cozinha → quartos)…");
  w.corpo.append(st);
  const r = await fetch(`${PROXY}?acao=kit&codigo=${encodeURIComponent(codigo)}`);
  const j = await r.json();
  if (!r.ok || j.erro) { st.textContent = "Erro: " + (j.erro || r.status); return; }
  const k = await espera(j.job, st, "Separando as fotos…");
  if (k.estado !== "ok") { st.textContent = "Não deu certo: " + (k.erro || k.estado); return; }
  w.corpo.innerHTML = "";
  const grade = el("div", "display:grid;grid-template-columns:repeat(5,1fr);gap:4px");
  (k.fotos || []).forEach((u, i) => {
    const b = el("div", "position:relative");
    const im = el("img", "width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:6px");
    im.src = u; im.loading = "lazy";
    b.append(im, el("div", "position:absolute;top:2px;left:4px;color:#fff;font-weight:700;text-shadow:0 1px 3px #000", String(i + 1)));
    grade.append(b);
  });
  const leg = areaLegenda(k.legenda);
  const linha = el("div", "display:flex;flex-wrap:wrap;gap:8px");
  const zip = el("a", BTN_AZUL + ";text-decoration:none", "⬇️ Baixar fotos (.zip)");
  zip.href = k.zip; zip.download = "";
  const cop = el("button", BTN, "📋 Copiar legenda");
  cop.onclick = () => copiar(leg.value, avisar);
  const capcut = el("a", BTN + ";text-decoration:none;color:#111", "Abrir CapCut");
  capcut.href = "https://www.capcut.com/"; capcut.target = "_blank";
  const canva = el("a", BTN + ";text-decoration:none;color:#111", "Abrir Canva");
  canva.href = "https://www.canva.com/"; canva.target = "_blank";
  linha.append(zip, cop, capcut, canva);
  w.corpo.append(
    el("div", "font-size:13px;color:#555", "Fotos já na ordem do vídeo. No celular: baixe o .zip, abra no app (CapCut, Edits do Instagram, Canva ou InShot), escolha um modelo/áudio em alta e cole a legenda."),
    grade, linha, el("div", "font-size:13px;color:#555", "Legenda (pode editar antes de copiar):"), leg);
}

export function maisFerramentas(im, avisar) {
  const codigo = im.link || im.nome;
  if (!codigo) { avisar && avisar("Este imóvel não tem link do site — não consigo identificá-lo."); return; }
  const w = janela("🧰 Ferramentas extras" + (im.nome ? " · " + String(im.nome).slice(0, 40) : ""));
  const info = el("div", "font-size:13px;color:#555", "Para publicar algo a mais. O modelo diário \"A arte de morar bem\" continua igual.");
  const b1 = el("button", BTN, "🎬 Reels \"Gancho + preço\" — frase grande no 1º segundo e depois as fotos");
  const gIn = el("input", "padding:9px;border:1px solid #ccc;border-radius:8px;font-size:14px");
  gIn.placeholder = "Frase do gancho (opcional) — ex.: 2 quartos por R$ 370 mil?";
  b1.onclick = () => gerarVideo(codigo, "gancho", gIn.value.trim(), w, avisar);
  const b2 = el("button", BTN, "⚡ Reels \"Tour rápido\" — cortes de 1 segundo, preço fixo embaixo");
  b2.onclick = () => gerarVideo(codigo, "tour", "", w, avisar);
  const b3 = el("button", BTN, "📦 Kit para CapCut / Edits / Canva — fotos na ordem + legenda");
  b3.onclick = () => gerarKit(codigo, w, avisar);
  w.corpo.append(info, b1, gIn, b2, b3);
}
