import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "firebase/auth";

/* ================================================================
   CONFIGURAÇÃO — preencha LOCALMENTE no seu PC, nunca cole em chats
   ================================================================ */
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
const WHATSAPP_NEGOCIOS = "(62) 9XXXX-XXXX";

// E-mails com acesso TOTAL (excluir, publicar). Os demais usuários
// criados no Console Firebase > Authentication entram como corretores.
const ADMINS = ["marcusbeda@gmail.com"];
/* ================================================================ */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const COL = "imoveis"; // coleção separada — não interfere em Contas/Vendas

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
  const [aba, setAba] = useState("lista");
  const [form, setForm] = useState(VAZIO);
  const [editId, setEditId] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState("");
  const [galeria, setGaleria] = useState(null); // { fotos, idx, titulo }
  const [postImovel, setPostImovel] = useState(null); // imóvel selecionado para "Preparar post"
  const [user, setUser] = useState(null);
  const [authPronto, setAuthPronto] = useState(false);

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
    navigator.clipboard.writeText(gerarAnuncio(im));
    avisar("Legenda copiada! Abrindo o Instagram — cole a legenda e escolha as fotos baixadas.");
    window.open("https://www.instagram.com/", "_blank");
  }

  function abrirFacebook(im) {
    navigator.clipboard.writeText(gerarAnuncio(im));
    avisar("Legenda copiada! Abrindo o Facebook — cole no campo do post.");
    window.open("https://www.facebook.com/", "_blank");
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
      // fallback: abre em nova aba para salvar manualmente
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
          <span className="marca">EMCAZA</span>
          <span className="sub">Hub de Imóveis</span>
        </div>
        <nav>
          <button className={aba === "lista" ? "ativo" : ""} onClick={() => setAba("lista")}>
            Imóveis ({imoveis.length})
          </button>
          <button className={aba === "form" ? "ativo" : ""}
            onClick={() => { setForm(VAZIO); setEditId(null); setAba("form"); }}>
            + Novo imóvel
          </button>
          <span className="quem" title={user.email}>
            {user.email.split("@")[0]}{papel === "admin" ? " · admin" : ""}
          </span>
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
            <div className="vazio">Nenhum imóvel aqui ainda. Cadastre o primeiro em “+ Novo imóvel”.</div>
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
                      <button className="primario" onClick={() => setPostImovel(im)}>Preparar post</button>
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
      {postImovel && (
        <div className="galeria" onClick={() => setPostImovel(null)}>
          <div className="post-painel" onClick={(e) => e.stopPropagation()}>
            <button className="g-fechar" onClick={() => setPostImovel(null)}>×</button>
            <h2>Preparar post</h2>
            <p className="post-titulo">{postImovel.titulo}</p>

            <div className="post-passo">
              <span className="post-num">1</span>
              <div>
                <strong>Baixe as fotos</strong>
                <p>Salva as {postImovel.fotos?.length || 0} fotos no seu aparelho para usar no post.</p>
                <button onClick={() => baixarTodasFotos(postImovel)}>⬇ Baixar todas as fotos</button>
              </div>
            </div>

            <div className="post-passo">
              <span className="post-num">2</span>
              <div>
                <strong>Escolha onde publicar</strong>
                <p>A legenda é copiada automaticamente. É só colar no app que abrir.</p>
                <div className="post-redes">
                  <button className="rede ig" onClick={() => abrirInstagram(postImovel)}>Instagram</button>
                  <button className="rede fb" onClick={() => abrirFacebook(postImovel)}>Facebook</button>
                  <button className="rede olx" onClick={() => abrirOLX(postImovel)}>OLX</button>
                  <button className="rede wa" onClick={() => abrirWhatsApp(postImovel)}>WhatsApp</button>
                </div>
              </div>
            </div>

            <p className="post-dica">💡 No Instagram, poste pelo app do celular: abra o Hub no celular, baixe as fotos e use o botão Instagram.</p>
          </div>
        </div>
      )}

      {galeria && (
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
  .galeria img { max-width: 92vw; max-height: 82vh; object-fit: contain; border-radius: 8px; cursor: pointer; }
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
`;
