import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCGv94pkCGguMbrpJ8IHn7A8GdT6lcnrPo",
  authDomain: "contas-marcus.firebaseapp.com",
  projectId: "contas-marcus",
  storageBucket: "contas-marcus.firebasestorage.app",
  messagingSenderId: "782681768962",
  appId: "1:782681768962:web:eaa7fe1f7c7490d0a1131b"
};

const CLOUDINARY = {
  cloudName: "dcisadb2q",
  uploadPreset: "hub-imoveis"
};

const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/publicar-imovel";
const SYNC_API_URL = "http://localhost:5999";
const SYNC_API_VPS = "http://179.197.64.167:5999";
const WHATSAPP_NEGOCIOS = "(62) 9XXXX-XXXX";

const ADMINS = ["marcusbeda@gmail.com"];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const COL = "imoveis";

const TIPOS = ["Casa", "Apartamento", "Lote", "Sobrado", "Comercial", "Rural"];
const OPERACOES = ["Venda", "Aluguel"];
const STATUS = {
  disponivel: { label: "Disponível", cor: "#2e7d52" },
  reservado:  { label: "Reservado",  cor: "#b07c2a" },
  vendido:    { label: "Vendido",    cor: "#8a3a3a" },
  alugado:    { label: "Alugado",    cor: "#3a5e8a" },
};

const VAZIO = {
  titulo: "", tipo: "Casa", operacao: "Venda", preco: "",
  cidade: "Goiânia", bairro: "", endereco: "",
  quartos: "", banheiros: "", vagas: "", area: "", areaLote: "",
  descricao: "", fotos: [], status: "disponivel",
};

const fmtPreco = (v) => {
  const n = Number(String(v).replace(/\D/g, ""));
  return n ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—";
};

function gerarAnuncio(im) {
  const linhas = [];
  linhas.push(`🏡 ${im.titulo}`);
  linhas.push(`📍 ${im.bairro}${im.bairro && im.cidade ? " — " : ""}${im.cidade}`);
  const specs = [];
  if (im.quartos) specs.push(`${im.quartos} quarto${im.quartos > 1 ? "s" : ""}`);
  if (im.banheiros) specs.push(`${im.banheiros} banheiro${im.banheiros > 1 ? "s" : ""}`);
  if (im.vagas) specs.push(`${im.vagas} vaga${im.vagas > 1 ? "s" : ""}`);
  if (im.area) specs.push(`${im.area} m² construídos`);
  if (im.areaLote) specs.push(`lote de ${im.areaLote} m²`);
  if (specs.length) linhas.push(`✨ ${specs.join(" · ")}`);
  linhas.push(`💰 ${im.operacao}: ${fmtPreco(im.preco)}${im.operacao === "Aluguel" ? "/mês" : ""}`);
  if (im.descricao) linhas.push(`\n${im.descricao}`);
  linhas.push(`\n📲 Agende sua visita: ${WHATSAPP_NEGOCIOS}`);
  linhas.push(`Marcus Beda — EMCAZA Imóveis · CRECI 23.152`);
  const cidadeTag = im.cidade.toLowerCase().replace(/\s/g, "");
  linhas.push(`\n#imoveis${cidadeTag} #${im.tipo.toLowerCase()}avenda #emcazaimoveis #${cidadeTag} #imobiliaria #seuimovelaqui`);
  return linhas.join("\n");
}

function gerarFicha(im) {
  const l = [];
  l.push(`*${im.titulo}*`);
  l.push("");
  l.push(`*Tipo:* ${im.tipo} · *${im.operacao}*`);
  l.push(`*Valor:* ${fmtPreco(im.preco)}${im.operacao === "Aluguel" ? "/mês" : ""}`);
  l.push(`*Localização:* ${im.bairro}${im.bairro && im.cidade ? ", " : ""}${im.cidade}`);
  l.push("");
  if (im.quartos) l.push(`🛏 ${im.quartos} quarto${im.quartos > 1 ? "s" : ""}`);
  if (im.banheiros) l.push(`🚿 ${im.banheiros} banheiro${im.banheiros > 1 ? "s" : ""}`);
  if (im.vagas) l.push(`🚗 ${im.vagas} vaga${im.vagas > 1 ? "s" : ""} de garagem`);
  if (im.area) l.push(`📐 ${im.area} m² de área construída`);
  if (im.areaLote) l.push(`🌳 Lote de ${im.areaLote} m²`);
  if (im.descricao) { l.push(""); l.push(im.descricao); }
  l.push("");
  l.push(`📲 *Agende sua visita:* ${WHATSAPP_NEGOCIOS}`);
  l.push(`Marcus Beda — EMCAZA Imóveis · CRECI 23.152`);
  return l.join("\n");
}

function TelaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setErro(""); setEntrando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch {
      setErro("E-mail ou senha incorretos.");
    } finally {
      setEntrando(false);
    }
  }

  return (
    <div className="hub login-wrap">
      <style>{css}</style>
      <div className="card login">
        <span className="marca">EMCAZA</span>
        <p className="login-sub">Hub de Imóveis · acesso restrito</p>
        <label>E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="username" />
        </label>
        <label>Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && entrar()} />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button className="primario login-btn" onClick={entrar} disabled={entrando}>
          {entrando ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}

export default function HubImoveis() {
  const [imoveis, setImoveis] = useState([]);
  const [aba, setAba] = useState("site");
  const [menuAberto, setMenuAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [editId, setEditId] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState("");
  const [galeria, setGaleria] = useState(null);
  const [geradorImovel, setGeradorImovel] = useState(null);
  const [user, setUser] = useState(null);
  const [authPronto, setAuthPronto] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [gruposCarregando, setGruposCarregando] = useState(false);
  const [buscaGrupoTermo, setBuscaGrupoTermo] = useState("");
  const [buscaGrupoResultados, setBuscaGrupoResultados] = useState([]);
  const [buscandoGrupo, setBuscandoGrupo] = useState(false);

  async function carregarGrupos() {
    setGruposCarregando(true);
    try {
      const r = await fetch(`${SYNC_API_URL}/grupos`);
      const d = await r.json();
      setGrupos(d.grupos || []);
    } catch (e) {
      console.error("Erro ao carregar grupos", e);
    } finally {
      setGruposCarregando(false);
    }
  }

  async function buscarGrupoWhatsapp() {
    if (!buscaGrupoTermo.trim()) return;
    setBuscandoGrupo(true);
    setBuscaGrupoResultados([]);
    try {
      const r = await fetch(`${SYNC_API_URL}/grupos/buscar?q=${encodeURIComponent(buscaGrupoTermo.trim())}`);
      const d = await r.json();
      setBuscaGrupoResultados(d.resultados || []);
    } catch (e) {
      console.error("Erro ao buscar grupos no WhatsApp", e);
    } finally {
      setBuscandoGrupo(false);
    }
  }

  async function adicionarGrupo(g) {
    try {
      await fetch(`${SYNC_API_URL}/grupos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: g.nome, jid: g.jid }),
      });
      setBuscaGrupoResultados((prev) => prev.filter((x) => x.jid !== g.jid));
      carregarGrupos();
    } catch (e) {
      console.error("Erro ao adicionar grupo", e);
    }
  }

  async function alternarAtivoGrupo(id, ativoAtual) {
    try {
      await fetch(`${SYNC_API_URL}/grupos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativoAtual }),
      });
      setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, ativo: !ativoAtual } : g)));
    } catch (e) {
      console.error("Erro ao atualizar grupo", e);
    }
  }

  async function excluirGrupo(id) {
    if (!confirm("Remover este grupo da lista monitorada?")) return;
    try {
      await fetch(`${SYNC_API_URL}/grupos/${id}`, { method: "DELETE" });
      setGrupos((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      console.error("Erro ao excluir grupo", e);
    }
  }

  useEffect(() => {
    if (aba === "grupos") carregarGrupos();
  }, [aba]);


  useEffect(
    () => onAuthStateChanged(auth, (u) => { setUser(u); setAuthPronto(true); }),
    []
  );

  useEffect(() => {
    if (!user) { setImoveis([]); return; }
    const q = query(collection(db, COL), orderBy("criadoEm", "desc"));
    return onSnapshot(q, (snap) =>
      setImoveis(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  const avisar = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function uploadFoto(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (CLOUDINARY.cloudName === "SEU_CLOUD_NAME") {
      avisar("Configure o Cloudinary no topo do arquivo para subir fotos.");
      return;
    }
    setEnviando(true);
    try {
      const urls = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("upload_preset", CLOUDINARY.uploadPreset);
        const r = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`,
          { method: "POST", body: fd }
        );
        const j = await r.json();
        if (j.secure_url) urls.push(j.secure_url);
      }
      setForm((f) => ({ ...f, fotos: [...f.fotos, ...urls] }));
      avisar(`${urls.length} foto(s) enviada(s)`);
    } catch {
      avisar("Falha no upload. Verifique o preset unsigned no Cloudinary.");
    } finally {
      setEnviando(false);
    }
  }

  async function salvar() {
    if (!form.titulo || !form.preco) { avisar("Preencha ao menos título e preço."); return; }
    const dados = { ...form, preco: Number(String(form.preco).replace(/\D/g, "")) };
    try {
      if (editId) {
        await updateDoc(doc(db, COL, editId), dados);
        avisar("Imóvel atualizado");
      } else {
        await addDoc(collection(db, COL), { ...dados, criadoEm: serverTimestamp(), publicadoEm: null });
        avisar("Imóvel cadastrado");
      }
      setForm(VAZIO); setEditId(null); setAba("lista");
    } catch { avisar("Erro ao salvar no Firestore."); }
  }

  function editar(im) {
    setForm({ ...VAZIO, ...im });
    setEditId(im.id);
    setAba("form");
  }

  async function excluir(id) {
    if (!window.confirm("Excluir este imóvel do hub?")) return;
    await deleteDoc(doc(db, COL, id));
    avisar("Imóvel excluído");
  }

  async function mudarStatus(im, novo) {
    await updateDoc(doc(db, COL, im.id), { status: novo });
  }

  function copiarAnuncio(im) {
    navigator.clipboard.writeText(gerarAnuncio(im));
    avisar("Texto do anúncio copiado");
  }

  function copiarFicha(im) {
    navigator.clipboard.writeText(gerarFicha(im));
    avisar("Ficha completa copiada — pronta para o WhatsApp");
  }

  async function baixarTodasFotos(im) {
    if (!im.fotos?.length) { avisar("Este imóvel não tem fotos."); return; }
    avisar(`Baixando ${im.fotos.length} foto(s)...`);
    for (let i = 0; i < im.fotos.length; i++) {
      await baixarFoto(im.fotos[i], im.titulo, i);
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  function abrirInstagram(im) {
    const params = new URLSearchParams({
      titulo: im.titulo || '',
      tipo: im.tipo || '',
      bairro: (im.bairro ? im.bairro + (im.cidade ? ', ' + im.cidade : '') : im.cidade) || '',
      preco: im.preco || '',
      quartos: im.quartos || '',
      banheiros: im.banheiros || '',
      vagas: im.vagas || '',
      area: im.area || '',
      areaLote: im.areaLote || '',
      descricao: im.descricao || '',
      fotos: JSON.stringify(im.fotos || []),
      origem: 'hub'
    });
    window.open(`https://marcusbeda-ig-v3.vercel.app/?${params.toString()}`, '_blank');
    avisar("Abrindo o Gerador com os dados do imóvel...");
  }

  function abrirFacebook(im) {
    navigator.clipboard.writeText(gerarAnuncio(im));
    avisar("Legenda copiada! Abrindo o Facebook — cole no campo do post.");
    window.open("https://www.facebook.com/", "_blank");
  }
  async function salvarNoDrive(im) {
  avisar("Enviando fotos para o Drive...");
  try {
    const r = await fetch(syncUrl_("salvar-drive"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: im.nome, fotos: im.fotos || [], descricao: im.observacoes || "" }),
    });
    const d = await r.json();
    if (d.link) {
      navigator.clipboard.writeText(d.link);
      avisar(`Salvo no Drive! (${d.total_fotos} fotos) Link copiado.`);
      window.open(d.link, "_blank");
    } else {
      avisar("Erro: " + (d.erro || "desconhecido"));
    }
  } catch {
    avisar("Erro ao conectar com o servidor de sync.");
  }
}

async function enviarParceiro(im) {
  avisar("Preparando fotos com marca d'água...");
  try {
    const r = await fetch(syncUrl_("enviar-parceiro"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: im.nome, fotos: im.fotos || [] }),
    });
    const d = await r.json();
    if (d.link) {
      navigator.clipboard.writeText(d.link);
      avisar(`Pronto! (${d.total_fotos} fotos c/ marca d'água) Link copiado.`);
      window.open(d.link, "_blank");
    } else {
      avisar("Erro: " + (d.erro || "desconhecido"));
    }
  } catch {
    avisar("Erro ao conectar com o servidor de sync.");
  }
}

  function abrirOLX(im) {
    navigator.clipboard.writeText(gerarFicha(im));
    avisar("Ficha copiada! Abrindo a OLX para anunciar.");
    window.open("https://www.olx.com.br/imoveis/publicar", "_blank");
  }

  function abrirWhatsApp(im) {
    const texto = encodeURIComponent(gerarFicha(im));
    window.open(`https://wa.me/?text=${texto}`, "_blank");
    avisar("Abrindo o WhatsApp com a ficha pronta para enviar.");
  }

  async function baixarFoto(url, titulo, idx) {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const link = document.createElement("a");
      const nome = (titulo || "imovel").replace(/[^a-z0-9]/gi, "-").toLowerCase();
      link.href = URL.createObjectURL(blob);
      link.download = `${nome}-${idx + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      avisar("Foto baixada");
    } catch {
      window.open(url, "_blank");
      avisar("Toque e segure na foto para salvar");
    }
  }

  async function publicar(im) {
    setEnviando(true);
    try {
      const r = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...im, anuncio: gerarAnuncio(im) }),
      });
      if (!r.ok) throw new Error();
      await updateDoc(doc(db, COL, im.id), { publicadoEm: new Date().toISOString() });
      avisar("Enviado para publicação via n8n");
    } catch {
      avisar("n8n não respondeu. Ele está rodando? (http://localhost:5678)");
    } finally {
      setEnviando(false);
    }
  }

  // ── Config Sync URL ─────────────────────────────────────────────
  const [syncUrl, setSyncUrl] = useState(() => {
    if (window.location.hostname === "localhost") return SYNC_API_URL;
    return localStorage.getItem("syncApiUrl") || SYNC_API_VPS;
  });
  const [editandoUrl, setEditandoUrl] = useState(false);
  const [urlTemp, setUrlTemp] = useState("");

  function salvarSyncUrl(url) {
    const limpa = url.replace(/\/$/, "");
    localStorage.setItem("syncApiUrl", limpa);
    setSyncUrl(limpa);
    setEditandoUrl(false);
    avisar("URL salva!");
  }

  const isLocalhost = window.location.hostname === "localhost";
  const syncApiAtivo = isLocalhost ? SYNC_API_URL : syncUrl;
  const syncUrl_ = (rota) => isLocalhost
    ? `${SYNC_API_URL}/${rota}`
    : `/api/sync-proxy?rota=${rota}`;

  // ── Imóveis Site (Notion) ────────────────────────────────────────
  const [imoveisSite, setImoveisSite] = useState([]);
  const [siteCarregando, setSiteCarregando] = useState(false);
  const [siteErro, setSiteErro] = useState("");
  const [siteDetalhe, setSiteDetalhe] = useState(null);

  useEffect(() => {
    if (aba !== "site") return;
    if (imoveisSite.length > 0) return;
    carregarSite();
  }, [aba]);

  async function carregarSite() {
    setSiteCarregando(true); setSiteErro("");
    try {
      const url = isLocalhost
        ? `${SYNC_API_URL}/notion-imoveis`
        : `/api/imoveis-site`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (d.erro) throw new Error(d.erro);
      setImoveisSite(d.imoveis || []);
    } catch (e) {
      setSiteErro(e.message);
    } finally {
      setSiteCarregando(false);
    }
  }

  function fmtValor(v) {
    if (!v) return "—";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

    function compartilharInstagram(im) {
  const params = new URLSearchParams({
    titulo: im.nome, tipo: im.tipo, bairro: [im.bairro, im.cidade].filter(Boolean).join(", "),
    preco: im.valor || "", quartos: im.quartos || "", banheiros: im.banheiros || "",
    vagas: im.vagas || "", area: im.area || "", descricao: im.observacoes || "",
    fotos: JSON.stringify(im.fotos || []), origem: "hub-site",
  });
  setGeradorImovel({ url: `https://marcusbeda-ig-v3.vercel.app/?${params}`, titulo: im.nome });
}

  function compartilharFacebook(im) {
  const texto = gerarAnuncioSite(im);
  navigator.clipboard.writeText(texto);
  avisar("Legenda copiada! Abrindo janela de compartilhamento...");
  const url = im.link || "https://hub-imoveis.vercel.app";
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    "facebook-share",
    "width=580,height=520"
  );
}
  function gerarAnuncioSite(im) {
    const specs = [
      im.quartos && `${im.quartos} quartos`,
      im.banheiros && `${im.banheiros} banheiros`,
      im.vagas && `${im.vagas} vagas`,
      im.area && `${im.area}m²`,
    ].filter(Boolean).join(" · ");
    return [
      `🏡 ${im.nome}`,
      `📍 ${[im.bairro, im.cidade].filter(Boolean).join(" — ")}`,
      specs && `✨ ${specs}`,
      `💰 ${im.finalidade}: ${fmtValor(im.valor)}`,
      im.observacoes && `\n${im.observacoes}`,
      `\n📲 Agende sua visita: ${WHATSAPP_NEGOCIOS}`,
      `Marcus Beda — EMCAZA Imóveis · CRECI 23.152`,
    ].filter(Boolean).join("\n");
  }

  function gerarPDF(im) {
    const fotos = im.fotos || [];
    const fotosHtml = fotos.map(u =>
      `<img src="${u}" style="width:48%;margin:4px;border-radius:6px;object-fit:cover;height:160px;" />`
    ).join("");
    const specs = [
      im.tipo, im.finalidade,
      im.quartos && `${im.quartos} quartos`,
      im.suites && `${im.suites} suítes`,
      im.banheiros && `${im.banheiros} banheiros`,
      im.vagas && `${im.vagas} vagas`,
      im.area && `${im.area} m² construídos`,
      im.areaTotal && `Lote ${im.areaTotal} m²`,
    ].filter(Boolean).join("  ·  ");
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title></title>
    <style>
      body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#222}
      h1{color:#1a1a2e;font-size:22px;margin-bottom:4px}
      .valor{font-size:26px;color:#b07000;font-weight:700;margin:8px 0}
      .local{color:#555;font-size:14px;margin-bottom:12px}
      .specs{background:#f5f5f5;padding:10px 14px;border-radius:6px;font-size:13px;color:#444;margin-bottom:14px}
      .desc{font-size:14px;line-height:1.7;margin-bottom:16px}
      .fotos{display:flex;flex-wrap:wrap;gap:4px}
      .rodape{margin-top:20px;font-size:12px;color:#888;border-top:1px solid #ddd;padding-top:10px}
      @media print{body{margin:10px}button{display:none}}
    </style></head><body>
    <button onclick="window.print()" style="background:#b07000;color:#fff;border:0;padding:10px 20px;border-radius:6px;cursor:pointer;margin-bottom:20px;font-size:14px">&#8595; Salvar / Imprimir PDF</button>
    <h1>${im.nome.replace(/[<>]/g, "")}</h1>
    <p class="local">&#128205; ${[im.bairro, im.cidade, im.cep].filter(Boolean).map(s => s.replace(/[<>]/g, "")).join(" · ")}</p>
    <p class="valor">${fmtValor(im.valor)}</p>
    <p class="specs">${specs.replace(/[<>]/g, "")}</p>
    ${im.observacoes ? `<p class="desc">${im.observacoes.replace(/[<>]/g, "")}</p>` : ""}
    ${fotos.length ? `<div class="fotos">${fotosHtml}</div>` : ""}
    <div class="rodape">Marcus Beda — EMCAZA Imóveis · CRECI 23.152 · (62) 98116-2705</div>
    </body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  // ── Sincronizar Notion ───────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncRodando, setSyncRodando] = useState(false);
  const [syncLog, setSyncLog] = useState(false);

  useEffect(() => {
    if (aba !== "sync") return;
    buscarStatus();
    const id = setInterval(buscarStatus, 4000);
    return () => clearInterval(id);
  }, [aba]);

  async function buscarStatus() {
    try {
      const r = await fetch(syncUrl_("status"));
      if (!r.ok) throw new Error();
      const d = await r.json();
      setSyncStatus(d);
      setSyncRodando(d.rodando);
    } catch {
      setSyncStatus(null);
    }
  }

  async function iniciarSync() {
    if (syncRodando) return;
    setSyncRodando(true);
    try {
      await fetch(syncUrl_("sync"), { method: "POST" });
      avisar("Sincronização iniciada! Aguarde...");
    } catch {
      avisar("Erro ao conectar com o servidor de sync.");
      setSyncRodando(false);
    }
  }

  async function toggleAgendamento() {
    if (!syncStatus) return;
    const rota = syncStatus.agendado ? "cancelar-agendamento" : "agendar";
    try {
      const r = await fetch(syncUrl_(rota), { method: "POST" });
      const d = await r.json();
      setSyncStatus((s) => ({ ...s, agendado: d.agendado }));
      avisar(d.agendado ? "Sync diário ativado (06:00)" : "Agendamento cancelado");
    } catch {
      avisar("Erro: sync_api.py não está rodando");
    }
  }

  function fmtData(iso) {
    if (!iso) return "Nunca";
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  const lista = imoveis.filter((im) => filtro === "todos" || im.status === filtro);

  if (!authPronto) {
    return (
      <div className="hub"><style>{css}</style>
        <div className="vazio">Carregando...</div>
      </div>
    );
  }
  if (!user) return <TelaLogin />;

  const papel = ADMINS.includes(user.email) ? "admin" : "corretor";

  return (
    <div className="hub">
      <style>{css}</style>

      <header>
        <div>
          <img src="https://dashboard-imoveis-xml-official.vercel.app/assets/logo-emcaza.jpg" alt="EMCAZA" className="logo-emcaza" />
          <span className="marca">EMCAZA</span>
          <span className="sub">Hub de Imóveis</span>
        </div>
        <div className="header-direita">
          <span className="quem" title={user.email}>
            {user.email.split("@")[0]}{papel === "admin" ? " · admin" : ""}
          </span>
          <button className="menu-toggle" onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu">☰</button>
        </div>
        <nav className={menuAberto ? "aberto" : ""}>
          <button className={aba === "site" ? "ativo" : ""} onClick={() => { setAba("site"); setMenuAberto(false); }}>
            Imóveis Site
          </button>
          <button className={aba === "xml" ? "ativo" : ""} onClick={() => { setAba("xml"); setMenuAberto(false); }}>
            Dashboard XML
          </button>
          <button className={aba === "sync" ? "ativo" : ""} onClick={() => { setAba("sync"); setMenuAberto(false); }}>
            🔄 Notion Sync
          </button>
          <button className={aba === "grupos" ? "ativo" : ""} onClick={() => { setAba("grupos"); setMenuAberto(false); }}>
            📋 Grupos
          </button>
          <button className={aba === "lista" ? "ativo" : ""} onClick={() => { setAba("lista"); setMenuAberto(false); }}>
            Imóveis ({imoveis.length})
          </button>
          <button className={aba === "form" ? "ativo" : ""}
            onClick={() => { setForm(VAZIO); setEditId(null); setAba("form"); setMenuAberto(false); }}>
            + Novo imóvel
          </button>
          <button onClick={() => signOut(auth)}>Sair</button>
        </nav>
      </header>

      {toast && <div className="toast">{toast}</div>}

      {aba === "form" && (
        <section className="card form">
          <h2>{editId ? "Editar imóvel" : "Cadastrar imóvel"}</h2>

          <div className="grid2">
            <label>Título do anúncio
              <input value={form.titulo} onChange={set("titulo")} placeholder="Casa 3 quartos no Jardim Novo Mundo" />
            </label>
            <label>Preço (R$)
              <input value={form.preco} onChange={set("preco")} placeholder="450000" inputMode="numeric" />
            </label>
          </div>

          <div className="grid4">
            <label>Tipo
              <select value={form.tipo} onChange={set("tipo")}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select>
            </label>
            <label>Operação
              <select value={form.operacao} onChange={set("operacao")}>{OPERACOES.map((o) => <option key={o}>{o}</option>)}</select>
            </label>
            <label>Cidade
              <input value={form.cidade} onChange={set("cidade")} />
            </label>
            <label>Bairro / Setor
              <input value={form.bairro} onChange={set("bairro")} placeholder="Jd. Novo Mundo" />
            </label>
          </div>

          <div className="grid4">
            <label>Quartos<input value={form.quartos} onChange={set("quartos")} inputMode="numeric" /></label>
            <label>Banheiros<input value={form.banheiros} onChange={set("banheiros")} inputMode="numeric" /></label>
            <label>Vagas<input value={form.vagas} onChange={set("vagas")} inputMode="numeric" /></label>
            <label>Área construída (m²)<input value={form.area} onChange={set("area")} inputMode="numeric" /></label>
          </div>

          <div className="grid4">
            <label>Área do lote (m²)<input value={form.areaLote || ""} onChange={set("areaLote")} inputMode="numeric" /></label>
          </div>

          <label>Endereço completo (uso interno — não sai no anúncio)
            <input value={form.endereco} onChange={set("endereco")} />
          </label>

          <label>Descrição
            <textarea rows={4} value={form.descricao} onChange={set("descricao")}
              placeholder="Pontos fortes: acabamento, localização, condomínio, proximidades..." />
          </label>

          <label className="upload">
            Fotos {enviando && "· enviando..."}
            <input type="file" accept="image/*" multiple onChange={uploadFoto} />
          </label>
          {form.fotos.length > 0 && (
            <div className="thumbs">
              {form.fotos.map((u, i) => (
                <div key={i} className="thumb">
                  <img src={u} alt="" />
                  <button onClick={() => setForm({ ...form, fotos: form.fotos.filter((_, j) => j !== i) })}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className="acoes">
            <button className="primario" onClick={salvar} disabled={enviando}>
              {editId ? "Salvar alterações" : "Cadastrar imóvel"}
            </button>
            <button onClick={() => { setForm(VAZIO); setEditId(null); setAba("lista"); }}>Cancelar</button>
          </div>
        </section>
      )}

      {aba === "lista" && (
        <section>
          <div className="filtros">
            <button className={filtro === "todos" ? "ativo" : ""} onClick={() => setFiltro("todos")}>Todos</button>
            {Object.entries(STATUS).map(([k, v]) => (
              <button key={k} className={filtro === k ? "ativo" : ""} onClick={() => setFiltro(k)}>{v.label}</button>
            ))}
          </div>

          {lista.length === 0 && (
            <div className="vazio">Nenhum imóvel aqui ainda. Cadastre o primeiro em "+ Novo imóvel".</div>
          )}

          <div className="cards">
            {lista.map((im) => (
              <article key={im.id} className="card imovel">
                <div
                  className="foto"
                  onClick={() =>
                    im.fotos?.length &&
                    setGaleria({ fotos: im.fotos, idx: 0, titulo: im.titulo })
                  }
                  style={{ cursor: im.fotos?.length ? "pointer" : "default" }}
                >
                  {im.fotos?.[0]
                    ? <img src={im.fotos[0]} alt={im.titulo} />
                    : <div className="semfoto">{im.tipo}</div>}
                  <span className="badge" style={{ background: STATUS[im.status]?.cor }}>
                    {STATUS[im.status]?.label}
                  </span>
                  {im.fotos?.length > 1 && (
                    <span className="badge-fotos">📷 {im.fotos.length}</span>
                  )}
                </div>
                <div className="info">
                  <h3>{im.titulo}</h3>
                  <p className="local">{im.bairro}{im.bairro && " · "}{im.cidade}</p>
                  <p className="preco">{fmtPreco(im.preco)}{im.operacao === "Aluguel" && <small>/mês</small>}</p>
                  <p className="specs">
                    {[im.quartos && `${im.quartos}q`, im.banheiros && `${im.banheiros}b`,
                      im.vagas && `${im.vagas}v`, im.area && `${im.area}m²`,
                      im.areaLote && `lote ${im.areaLote}m²`].filter(Boolean).join(" · ")}
                  </p>
                  {im.descricao && <p className="descricao-card">{im.descricao}</p>}
                  {im.publicadoEm && <p className="pub">Publicado {new Date(im.publicadoEm).toLocaleDateString("pt-BR")}</p>}
                  <div className="botoes">
                    {papel === "admin" && (
                      <button className="primario" onClick={() => setGeradorImovel(im)}>Preparar post</button>
                    )}
                    <button onClick={() => copiarAnuncio(im)}>Copiar anúncio</button>
                    <button onClick={() => copiarFicha(im)}>Copiar ficha</button>
                    <button onClick={() => editar(im)}>Editar</button>
                    <select value={im.status} onChange={(e) => mudarStatus(im, e.target.value)}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    {papel === "admin" && (
                      <button className="perigo" onClick={() => excluir(im.id)}>Excluir</button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {aba === "site" && (
        <section>
          <div className="site-topo">
            <span className="site-total">{imoveisSite.length} imóveis no Notion</span>
            <button onClick={carregarSite} disabled={siteCarregando}>
              {siteCarregando ? "Carregando..." : "↻ Recarregar"}
            </button>
          </div>

          {siteErro && <div className="site-erro">Erro: {siteErro} — configure NOTION_TOKEN no Vercel.</div>}

          {!siteErro && imoveisSite.length === 0 && !siteCarregando && (
            <div className="vazio">Nenhum imóvel carregado. Faça deploy no Vercel e configure NOTION_TOKEN.</div>
          )}

          <div className="cards">
            {imoveisSite.map((im) => (
              <article key={im.id} className="card imovel">
                <div className="foto" onClick={() => im.fotos?.length && setGaleria({ fotos: im.fotos, idx: 0, titulo: im.nome })}
                  style={{ cursor: im.fotos?.length ? "pointer" : "default" }}>
                  {im.capa
                    ? <img src={im.capa} alt={im.nome} />
                    : <div className="semfoto">{im.tipo}</div>}
                  <span className="badge" style={{ background: im.status === "Disponível" ? "#2e7d52" : im.status === "Vendido" ? "#8a3a3a" : "#b07c2a" }}>
                    {im.status}
                  </span>
                  {im.fotos?.length > 1 && <span className="badge-fotos">📷 {im.fotos.length}</span>}
                </div>
                <div className="info">
                  <h3>{im.nome}</h3>
                  <p className="local">{im.bairro}{im.bairro && " · "}{im.cidade}</p>
                  <p className="preco">{fmtValor(im.valor)}{im.finalidade === "Locação" && <small>/mês</small>}</p>
                  <p className="specs">
                    {[im.quartos && `${im.quartos}q`, im.banheiros && `${im.banheiros}b`,
                      im.vagas && `${im.vagas}v`, im.area && `${im.area}m²`].filter(Boolean).join(" · ")}
                  </p>
                  <div className="botoes">
  <button className="pdf-btn" onClick={() => gerarPDF(im)}>📄 PDF</button>
  <button className="rede ig" onClick={() => compartilharInstagram(im)}>📸 Instagram</button>
  <button className="rede fb" onClick={() => compartilharFacebook(im)}>👍 Facebook</button>
  <button className="rede drive" onClick={() => salvarNoDrive(im)}>📁 Drive</button>
  <button className="rede parceiro" onClick={() => enviarParceiro(im)}>🤝 Parceiro</button>
  {im.link && <a href={im.link} target="_blank" rel="noreferrer" className="site-link">Ver site</a>}
</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {aba === "xml" && (
            <section className="xml-embed">
                    <iframe src="https://dashboard-imoveis-xml-official.vercel.app" title="Dashboard Imoveis XML" style={{ width: "100%", height: "85vh", border: "none", borderRadius: "8px" }} />
            </section>
        )}
    {aba === "sync" && (
        <section className="sync-centro">
          <button
            className={`sync-grande${syncRodando ? " rodando" : ""}`}
            onClick={iniciarSync}
            disabled={syncRodando}
          >
            {syncRodando ? "⏳ Atualizando..." : "🔄 Atualizar Notion"}
          </button>
          {syncStatus?.ultima_sync && !syncRodando && (
            <p className="sync-ultima-info">Última atualização: {fmtData(syncStatus.ultima_sync)}</p>
          )}

          {window.location.hostname !== "localhost" && (
            <div className="sync-vpn">
              {!editandoUrl ? (
                <>
                  <p className="sync-vpn-label">
                    {syncApiAtivo ? `✅ VPN: ${syncApiAtivo}` : "⚠️ IP da VPN não configurado"}
                  </p>
                  <button className="sync-vpn-btn" onClick={() => { setUrlTemp(syncApiAtivo); setEditandoUrl(true); }}>
                    ⚙️ {syncApiAtivo ? "Alterar IP" : "Configurar IP da VPN"}
                  </button>
                </>
              ) : (
                <div className="sync-vpn-form">
                  <p className="sync-vpn-label">IP do PC na VPN (ex: http://10.8.0.2:5999)</p>
                  <input
                    value={urlTemp}
                    onChange={(e) => setUrlTemp(e.target.value)}
                    placeholder="http://10.8.0.2:5999"
                  />
                  <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
                    <button className="primario" onClick={() => salvarSyncUrl(urlTemp)}>Salvar</button>
                    <button onClick={() => setEditandoUrl(false)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

          {aba === "grupos" && (
            <section>
              <div className="filtros">
                <p>Buscar grupo no WhatsApp pelo nome (a busca pode levar até 1 minuto)</p>
                <input
                  type="text"
                  placeholder="Nome do grupo no WhatsApp..."
                  value={buscaGrupoTermo}
                  onChange={(e) => setBuscaGrupoTermo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarGrupoWhatsapp()}
                />
                <button className="primario" onClick={buscarGrupoWhatsapp} disabled={buscandoGrupo}>
                  {buscandoGrupo ? "Buscando..." : "Buscar"}
                </button>
              </div>

              {buscaGrupoResultados.length > 0 && (
                <div className="lista-grupos">
                  {buscaGrupoResultados.map((g) => (
                    <div className="grupo-item" key={g.jid}>
                      <span>{g.nome} ({g.tamanho} membros)</span>
                      <button onClick={() => adicionarGrupo(g)}>+ Adicionar</button>
                    </div>
                  ))}
                </div>
              )}

              <h3>Grupos monitorados ({grupos.length})</h3>
              {gruposCarregando ? (
                <p>Carregando...</p>
              ) : (
                <div className="lista-grupos">
                  {grupos.map((g) => (
                    <div className="grupo-item" key={g.id}>
                      <span>{g.nome}</span>
                      <button
                        className={g.ativo ? "grupo-ativo" : "grupo-inativo"}
                        onClick={() => alternarAtivoGrupo(g.id, g.ativo)}
                      >
                        {g.ativo ? "Ativo" : "Inativo"}
                      </button>
                      <button onClick={() => excluirGrupo(g.id)}>Excluir</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

      {geradorImovel && (
        <div className="galeria" onClick={() => setGeradorImovel(null)}>
          <div className="post-painel" onClick={(e) => e.stopPropagation()}>
            <button className="g-fechar" onClick={() => setGeradorImovel(null)}>×</button>
            <h2>Preparar post</h2>
            <p className="post-titulo">{geradorImovel.titulo}</p>

            <div className="post-passo">
              <span className="post-num">1</span>
              <div>
                <strong>Baixe as fotos</strong>
                <p>Salva as {geradorImovel.fotos?.length || 0} fotos no seu aparelho para usar no post.</p>
                <button onClick={() => baixarTodasFotos(geradorImovel)}>⬇ Baixar todas as fotos</button>
              </div>
            </div>

            <div className="post-passo">
              <span className="post-num">2</span>
              <div>
                <strong>Escolha onde publicar</strong>
                <p>A legenda é copiada automaticamente. É só colar no app que abrir.</p>
                <div className="post-redes">
                  <button className="rede ig" onClick={() => abrirInstagram(geradorImovel)}>Instagram</button>
                  <button className="rede fb" onClick={() => abrirFacebook(geradorImovel)}>Facebook</button>
                  <button className="rede olx" onClick={() => abrirOLX(geradorImovel)}>OLX</button>
                  <button className="rede wa" onClick={() => abrirWhatsApp(geradorImovel)}>WhatsApp</button>
                </div>
              </div>
            </div>

            <div className="post-passo">
              <span className="post-num">3</span>
              <div>
                <strong>Gerar com IA</strong>
                <p>Abre o Gerador já preenchido com os dados deste imóvel. Selecione as fotos que quer usar no post.</p>
                <button onClick={() => abrirInstagram(geradorImovel)} style={{background:"linear-gradient(135deg,#c9a96e,#a07030)",color:"#000",fontWeight:700,border:0,padding:"10px 16px",borderRadius:"8px",cursor:"pointer",fontSize:"14px"}}>✨ Gerar com IA</button>
              </div>
            </div>

            <p className="post-dica">💡 No Instagram, poste pelo app do celular: abra o Hub no celular, baixe as fotos e use o botão Instagram.</p>
          </div>
        </div>
      )}

      {geradorImovel && (
  <div className="galeria" onClick={() => setGeradorImovel(null)}>
    <button className="g-fechar" onClick={() => setGeradorImovel(null)}>×</button>
    <iframe
      title="Gerador de posts"
      src={geradorImovel.url}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "95vw", height: "92vh", border: "none",
        borderRadius: "10px", background: "#fff",
      }}
    />
  </div>
)}{galeria && (
        <div className="galeria" onClick={() => setGaleria(null)}>
          <button className="g-fechar" onClick={() => setGaleria(null)}>×</button>
          <button
            className="g-seta esq"
            onClick={(e) => {
              e.stopPropagation();
              setGaleria((g) => ({ ...g, idx: (g.idx - 1 + g.fotos.length) % g.fotos.length }));
            }}
          >‹</button>
          <img
            src={galeria.fotos[galeria.idx]}
            alt={galeria.titulo}
            onClick={(e) => {
              e.stopPropagation();
              setGaleria((g) => ({ ...g, idx: (g.idx + 1) % g.fotos.length }));
            }}
          />
          <button
            className="g-seta dir"
            onClick={(e) => {
              e.stopPropagation();
              setGaleria((g) => ({ ...g, idx: (g.idx + 1) % g.fotos.length }));
            }}
          >›</button>
          <div className="g-info">{galeria.titulo} · {galeria.idx + 1}/{galeria.fotos.length}</div>
          <button
            className="g-download"
            onClick={(e) => {
              e.stopPropagation();
              baixarFoto(galeria.fotos[galeria.idx], galeria.titulo, galeria.idx);
            }}
          >⬇ Baixar foto</button>
        </div>
      )}
    <footer className="hub-footer">
    <img src="https://dashboard-imoveis-xml-official.vercel.app/assets/logo-marcus-beda.jpg" alt="Marcus Beda Corretor de Imoveis" className="logo-marcus" />
    </footer>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; }
  body { background: #14171a; }
  .hub { min-height: 100vh; background: #14171a; color: #e8e4dc; font-family: Inter, sans-serif; padding: 0 16px 64px; max-width: 1100px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 20px 0; border-bottom: 1px solid #2a2f34; margin-bottom: 20px; }
  .marca { font-family: Archivo, sans-serif; font-weight: 800; font-size: 22px; letter-spacing: 2px; color: #d9a440; }
  .sub { margin-left: 10px; color: #8b9299; font-size: 14px; }
  nav { display: flex; gap: 8px; }
  nav button, .filtros button { background: #1d2226; border: 1px solid #2a2f34; color: #c8cdd2; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-family: Inter; font-size: 14px; }
  nav button.ativo, .filtros button.ativo { background: #d9a440; color: #14171a; border-color: #d9a440; font-weight: 600; }
  .filtros { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .card { background: #1d2226; border: 1px solid #2a2f34; border-radius: 12px; padding: 20px; }
  .form h2 { font-family: Archivo; margin-bottom: 16px; font-size: 18px; }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #8b9299; margin-bottom: 12px; }
  input, select, textarea { background: #14171a; border: 1px solid #2a2f34; color: #e8e4dc; border-radius: 8px; padding: 10px 12px; font-family: Inter; font-size: 14px; }
  input:focus, select:focus, textarea:focus { outline: 2px solid #d9a44066; border-color: #d9a440; }
  .grid2 { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
  .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  @media (max-width: 640px) { .grid2, .grid4 { grid-template-columns: 1fr 1fr; } }
  .upload input { padding: 8px; }
  .thumbs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .thumb { position: relative; }
  .thumb img { width: 84px; height: 64px; object-fit: cover; border-radius: 6px; border: 1px solid #2a2f34; }
  .thumb button { position: absolute; top: -6px; right: -6px; background: #8a3a3a; color: #fff; border: 0; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; }
  .acoes { display: flex; gap: 10px; margin-top: 8px; }
  button.primario { background: #d9a440; color: #14171a; border: 0; font-weight: 600; padding: 10px 18px; border-radius: 8px; cursor: pointer; }
  button.primario:disabled { opacity: .5; }
  .acoes button:not(.primario), .botoes button:not(.primario) { background: #1d2226; border: 1px solid #2a2f34; color: #c8cdd2; padding: 10px 14px; border-radius: 8px; cursor: pointer; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .imovel { padding: 0; overflow: hidden; }
  .foto { position: relative; height: 170px; background: #14171a; }
  .foto img { width: 100%; height: 100%; object-fit: cover; }
  .semfoto { display: flex; align-items: center; justify-content: center; height: 100%; color: #3d444b; font-family: Archivo; font-size: 20px; letter-spacing: 1px; }
  .badge { position: absolute; top: 10px; left: 10px; color: #fff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
  .info { padding: 14px 16px 16px; }
  .info h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .local { color: #8b9299; font-size: 13px; }
  .preco { font-family: Archivo; font-size: 20px; color: #d9a440; margin: 8px 0 2px; }
  .preco small { font-size: 12px; color: #8b9299; font-family: Inter; }
  .specs { font-size: 13px; color: #8b9299; margin-bottom: 6px; }
  .pub { font-size: 12px; color: #2e7d52; margin-bottom: 4px; }
  .botoes { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
  .botoes button, .botoes select { font-size: 13px; padding: 7px 10px; }
  .botoes select { background: #1d2226; }
  button.perigo { color: #c97070 !important; }
  .vazio { text-align: center; color: #8b9299; padding: 60px 0; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #d9a440; color: #14171a; font-weight: 600; padding: 12px 20px; border-radius: 10px; z-index: 10; }
  .badge-fotos { position: absolute; bottom: 10px; right: 10px; background: #14171acc; color: #e8e4dc; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
  .galeria { position: fixed; inset: 0; background: rgba(10,12,14,.96); display: flex; align-items: center; justify-content: center; z-index: 50; }
  .galeria .g-frame { width: 92vw; height: 82vh; display: flex; align-items: center; justify-content: center; }
.galeria img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; border-radius: 8px; cursor: pointer; }
  .g-seta { position: fixed; top: 50%; transform: translateY(-50%); background: #1d2226cc; border: 1px solid #2a2f34; color: #e8e4dc; font-size: 32px; line-height: 1; width: 52px; height: 52px; border-radius: 50%; cursor: pointer; z-index: 51; }
  .g-seta.esq { left: 12px; }
  .g-seta.dir { right: 12px; }
  .g-fechar { position: fixed; top: 14px; right: 14px; background: #1d2226cc; border: 1px solid #2a2f34; color: #e8e4dc; font-size: 26px; line-height: 1; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 51; }
  .g-info { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); background: #1d2226cc; color: #e8e4dc; font-size: 14px; padding: 8px 18px; border-radius: 20px; max-width: 90vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
  .card.login { width: 100%; max-width: 380px; text-align: center; padding: 32px 28px; }
  .card.login .marca { font-size: 26px; }
  .login-sub { color: #8b9299; font-size: 13px; margin: 6px 0 22px; }
  .card.login label { text-align: left; }
  .login-btn { width: 100%; margin-top: 6px; }
  .erro { color: #c97070; font-size: 13px; margin-bottom: 10px; }
  .quem { color: #8b9299; font-size: 13px; align-self: center; padding: 0 4px; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .descricao-card { font-size: 13px; color: #a8aeb4; line-height: 1.5; margin: 6px 0 2px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .g-download { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); background: #d9a440; color: #14171a; font-weight: 600; font-size: 14px; border: 0; padding: 10px 20px; border-radius: 20px; cursor: pointer; z-index: 52; }
  .post-painel { background: #1d2226; border: 1px solid #2a2f34; border-radius: 16px; padding: 28px; max-width: 460px; width: 92vw; max-height: 88vh; overflow-y: auto; position: relative; }
  .post-painel h2 { font-family: Archivo, sans-serif; font-size: 20px; color: #d9a440; margin-bottom: 4px; }
  .post-titulo { color: #c8cdd2; font-size: 14px; margin-bottom: 20px; }
  .post-passo { display: flex; gap: 14px; margin-bottom: 22px; }
  .post-num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: #d9a440; color: #14171a; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .post-passo strong { display: block; margin-bottom: 4px; font-size: 15px; }
  .post-passo p { color: #8b9299; font-size: 13px; margin-bottom: 10px; line-height: 1.4; }
  .post-passo > div > button { background: #14171a; border: 1px solid #2a2f34; color: #e8e4dc; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; }
  .post-redes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .post-redes .rede { color: #fff; border: 0; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; }
  .rede.ig { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366); }
  .rede.fb { background: #1877f2; }
  .rede.olx { background: #6e0ad6; }
  .rede.wa { background: #25d366; color: #14171a; }
  .post-dica { font-size: 12px; color: #8b9299; background: #14171a; padding: 10px 12px; border-radius: 8px; line-height: 1.4; margin-top: 6px; }

  /* ── Imóveis Site ── */
  .site-topo { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .site-total { color: #8b9299; font-size: 14px; }
  .site-erro { background: #1d1010; border: 1px solid #7d2e2e; border-radius: 8px; padding: 14px; color: #cf9090; font-size: 13px; margin-bottom: 16px; }
  .site-link { background: linear-gradient(135deg,#23282e,#1a1e22); border: 1px solid #3a4048; color: #9aa0a8; padding: 7px 10px; border-radius: 8px; font-size: 13px; text-decoration: none; display:inline-block; }

  /* Botões cromo metálico */
  .botoes .pdf-btn {
    background: linear-gradient(160deg,#e8e0d0 0%,#c9b88a 40%,#d9a440 60%,#b8881e 100%);
    color: #1a1200; border: 0; padding: 7px 12px; border-radius: 8px; cursor: pointer;
    font-weight: 700; font-size: 13px; letter-spacing:.3px;
    box-shadow: 0 2px 8px #d9a44055, inset 0 1px 0 #ffffffaa;
    text-shadow: 0 1px 0 #fff8;
  }
  .botoes .pdf-btn:hover { filter: brightness(1.1); }

  .botoes .rede { border: 0; padding: 7px 12px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; letter-spacing:.3px; box-shadow: inset 0 1px 0 #ffffff33, 0 2px 6px #0006; }
  .botoes .ig {
    background: linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7);
    color: #fff; text-shadow: 0 1px 2px #0005;
  }
  .botoes .ig:hover { filter: brightness(1.15); }
  .botoes .fb {
    background: linear-gradient(160deg,#4a90e2 0%,#1877f2 50%,#0d5bbf 100%);
    color: #fff; text-shadow: 0 1px 2px #0005;
  }
  .botoes .fb:hover { filter: brightness(1.12); }
  .botoes .drive {
  background: linear-gradient(160deg,#4a90d9 0%,#1a73e8 50%,#0d47a1 100%);
  color: #fff; text-shadow: 0 1px 2px #0005;
}
.botoes .drive:hover { filter: brightness(1.12); }
.botoes .parceiro {
  background: linear-gradient(160deg,#8a8a8a 0%,#5a5a5a 50%,#2e2e2e 100%);
  color: #fff; text-shadow: 0 1px 2px #0005;
}
.botoes .parceiro:hover { filter: brightness(1.15); }
  /* ── Sync ── */
  .sync-centro { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 16px; }
  .sync-grande { background: #d9a440; color: #14171a; border: 0; font-family: Archivo, sans-serif; font-weight: 800; font-size: 20px; padding: 20px 48px; border-radius: 14px; cursor: pointer; letter-spacing: 1px; transition: opacity .2s; }
  .sync-grande:hover { opacity: .88; }
  .sync-grande.rodando { opacity: .6; cursor: not-allowed; }
  .sync-ultima-info { color: #8b9299; font-size: 13px; }
  .sync-vpn { margin-top: 24px; text-align: center; }
  .sync-vpn-label { color: #8b9299; font-size: 13px; margin-bottom: 8px; }
  .sync-vpn-btn { background: #1d2226; border: 1px solid #2a2f34; color: #c8cdd2; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; }
  .sync-vpn-form { background: #1d2226; border: 1px solid #2a2f34; border-radius: 10px; padding: 16px; max-width: 320px; }
  .sync-vpn-form input { width: 100%; margin-top: 6px; }
  .logo-emcaza { height: 40px; margin-right: 10px; }
    .logo-marcus { height: 50px; opacity: .9; }
      .hub-footer { display: flex; justify-content: center; align-items: center; padding: 24px 0 8px; }
        .xml-embed { width: 100%; }
  .header-direita { display: flex; align-items: center; gap: 10px; }
  .menu-toggle { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; font-size: 20px; background: #1d2226; border: 1px solid #2a2f34; border-radius: 8px; cursor: pointer; color: #e8e4dc; }
  header { position: relative; }
  header nav { display: none; position: absolute; top: 100%; right: 0; background: #1a1e22; border: 1px solid #2a2f34; border-radius: 10px; padding: 10px; flex-direction: column; align-items: stretch; gap: 6px; z-index: 50; min-width: 220px; box-shadow: 0 10px 30px rgba(0,0,0,.5); margin-top: 8px; }
  header nav.aberto { display: flex; }
  
      .lista-grupos { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
      .grupo-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; background: #1a1e22; border: 1px solid #2a2f34; border-radius: 8px; }
      .grupo-item span { flex: 1; }
      .grupo-ativo { background: #1f3d2a; border-color: #2d5a3d; color: #7fd99a; }
      .grupo-inativo { opacity: 0.6; }
        `;
