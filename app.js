(() => {
  document.documentElement.classList.add("js");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Topo ganha fundo ao rolar ----------
  const topo = $("#topo");
  const marcarTopo = () => topo.classList.toggle("rolou", scrollY > 12);
  addEventListener("scroll", marcarTopo, { passive: true }); marcarTopo();

  // ---------- Entrada suave dos blocos ----------
  const blocos = $$(".revela");
  if (calmo || !("IntersectionObserver" in window)) blocos.forEach((b) => b.classList.add("visto"));
  else {
    const io = new IntersectionObserver((itens) => itens.forEach((i) => {
      if (!i.isIntersecting) return;
      const irmaos = [...i.target.parentElement.children].filter((c) => c.classList.contains("revela"));
      i.target.style.transitionDelay = `${Math.min(irmaos.indexOf(i.target), 4) * 80}ms`;
      i.target.classList.add("visto"); io.unobserve(i.target);
    }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    blocos.forEach((b) => io.observe(b));
  }

  // ---------- Vídeo da demonstração em janela ----------
  const janela = $("#janela"), filme = $("#filme"), legenda = $("#legenda");
  const LEGENDAS = [[0, "Obra crescendo por etapa"], [6.5, "Andar pelo apê · dia"], [10.4, "Andar pelo apê · noite"]];
  filme.addEventListener("timeupdate", () => {
    let t = LEGENDAS[0][1]; for (const [s, c] of LEGENDAS) if (filme.currentTime >= s) t = c;
    if (legenda.textContent !== t) legenda.textContent = t;
  });
  const abrir = () => {
    if (typeof janela.showModal === "function") janela.showModal(); else janela.setAttribute("open", "");
    filme.currentTime = 0;
    if (calmo) filme.controls = true; else filme.play().catch(() => (filme.controls = true));
  };
  const fechar = () => { filme.pause(); if (janela.open) janela.close(); };
  $$("[data-video]").forEach((b) => b.addEventListener("click", abrir));
  $("[data-fechar]").addEventListener("click", fechar);
  janela.addEventListener("click", (e) => { if (e.target === janela) fechar(); }); // clique fora do vídeo
  janela.addEventListener("close", () => filme.pause());

  // ---------- Mensal / anual ----------
  const fmt = (v) => v.toLocaleString("pt-BR");
  const cobrar = (anual) => {
    $$("[data-cob]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.cob === "a") === anual)));
    $$(".preco b").forEach((el) => {
      const m = +el.dataset.m, v = anual ? Math.round(m * 0.85) : m;
      el.textContent = fmt(v);
      el.closest(".plano").querySelector("[data-obs]").textContent = anual ? `R$ ${fmt(v * 12)} por ano, à vista` : "cobrado mensalmente";
    });
    try { localStorage.setItem("prumo-cobranca", anual ? "a" : "m"); } catch (e) {}
  };
  $$("[data-cob]").forEach((b) => b.addEventListener("click", () => cobrar(b.dataset.cob === "a")));
  try { if (localStorage.getItem("prumo-cobranca") === "a") cobrar(true); } catch (e) {}

  // ---------- Plano clicado já vem no formulário ----------
  $$("[data-plano]").forEach((a) => a.addEventListener("click", () => { $("#f-plano").value = a.dataset.plano; }));

  // ---------- Formulário ----------
  // URL do app da web do Google Apps Script (termina em /exec). Vazio = envio desligado.
  const LEAD_URL = "";
  const form = $("#lead"), aviso = $("#formOk"), botao = form.querySelector("button[type=submit]");
  const dizer = (msg, ok) => { aviso.hidden = false; aviso.style.borderColor = ok ? "var(--terra)" : "#C63A3A"; aviso.textContent = msg; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim(), emp = form.empresa.value.trim(), email = form.email.value.trim();
    if (!nome || !emp || !/^\S+@\S+\.\S+$/.test(email)) { dizer("Preencha nome, construtora e um e-mail válido para continuar.", false); return; }
    const primeiro = nome.split(" ")[0];
    if (form.site.value) { dizer(`Obrigado, ${primeiro}.`, true); return; } // robô
    if (!LEAD_URL) { dizer(`Obrigado, ${primeiro}. (Página de demonstração: o envio ainda não está ligado a um sistema de vendas.)`, true); return; }
    const dados = new URLSearchParams({ nome, empresa: emp, email, tel: form.tel.value.trim(), obras: form.obras.value, plano: form.plano.value, origem: "pagina-vendas", enviado: new Date().toISOString() });
    botao.disabled = true; botao.textContent = "Enviando…";
    try {
      await fetch(LEAD_URL, { method: "POST", mode: "no-cors", body: dados }); // Apps Script não devolve CORS
      form.reset(); $("#f-plano").value = dados.get("plano");
      dizer(`Obrigado, ${primeiro}. Recebemos o pedido de teste do plano ${dados.get("plano")} para ${emp}. Nossa equipe vai falar com você.`, true);
    } catch (err) {
      dizer("Não foi possível enviar agora. Confira a conexão e tente de novo; seus dados continuam preenchidos.", false);
    } finally { botao.disabled = false; botao.textContent = "Quero testar a Prumo"; }
  });
})();
