(() => {
  // ---------- Vídeo da demo no hero ----------
  const reel = document.getElementById("reel");
  const reelCap = document.getElementById("reelCap");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CAPS = [[0, "Obra crescendo por etapa"], [6.5, "Andar pelo apê · dia"], [10.4, "Andar pelo apê · noite"]];
  reel.addEventListener("timeupdate", () => {
    const t = reel.currentTime; let txt = CAPS[0][1];
    for (const [s, c] of CAPS) if (t >= s) txt = c;
    if (reelCap.textContent !== txt) reelCap.textContent = txt;
  });
  if (reduce) reel.controls = true;
  else {
    // Toca só quando está na tela, para não gastar bateria no celular.
    new IntersectionObserver(([e]) => { if (e.isIntersecting) reel.play().catch(() => (reel.controls = true)); else reel.pause(); }, { threshold: 0.25 }).observe(reel);
  }

  // ---------- Mensal / anual ----------
  const fmt = (v) => v.toLocaleString("pt-BR");
  document.querySelectorAll("[data-bill]").forEach((b) => b.addEventListener("click", () => {
    const annual = b.dataset.bill === "a";
    document.querySelectorAll("[data-bill]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    document.querySelectorAll(".price b").forEach((el) => {
      const m = +el.dataset.m; const v = annual ? Math.round(m * 0.85) : m;
      el.textContent = fmt(v);
      el.closest(".plan").querySelector("[data-note]").textContent = annual ? `R$ ${fmt(v * 12)} por ano, cobrado à vista` : "cobrado mensalmente";
    });
    try { localStorage.setItem("prumo-bill", b.dataset.bill); } catch (e) {}
  }));
  try { if (localStorage.getItem("prumo-bill") === "a") document.getElementById("bill-a").click(); } catch (e) {}

  // ---------- Mapa de lotes (dados ilustrativos) ----------
  const LOTES = [
    [1, 360, "v", 0, "mata nativa ao fundo"], [2, 360, "v", 0, "mata nativa ao fundo"], [3, 380, "d", 214, "mata nativa ao fundo"],
    [4, 380, "r", 219, "mata nativa ao fundo"], [5, 400, "d", 236, "mata nativa ao fundo, ao lado do lazer"], [6, 420, "d", 248, "esquina com a área de lazer"],
    [7, 300, "v", 0, "frente para a rua das Palmeiras"], [8, 300, "d", 172, "frente para a rua das Palmeiras"], [9, 300, "v", 0, "frente para a rua das Palmeiras"],
    [10, 320, "d", 181, "frente para a rua das Palmeiras"], [11, 320, "r", 184, "frente para a rua das Palmeiras"], [12, 340, "d", 199, "vizinho à área de lazer"],
  ];
  const SIT = { d: "Disponível", r: "Reservado", v: "Vendido" };
  const svg = document.getElementById("lotes");
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  // Mata, rua e lazer
  el("rect", { x: 16, y: 6, width: 376, height: 12, fill: "color-mix(in srgb, var(--green) 10%, transparent)" }, svg);
  el("text", { x: 22, y: 15, "font-family": "IBM Plex Mono, monospace", "font-size": 8, fill: "var(--faint)", "letter-spacing": "1" }, svg).textContent = "MATA NATIVA";
  el("rect", { x: 16, y: 126, width: 376, height: 44, fill: "var(--panel-2)" }, svg);
  el("line", { x1: 22, y1: 148, x2: 386, y2: 148, stroke: "var(--faint)", "stroke-dasharray": "8 8" }, svg);
  el("text", { x: 22, y: 140, "font-family": "IBM Plex Mono, monospace", "font-size": 8, fill: "var(--faint)", "letter-spacing": "1" }, svg).textContent = "RUA DAS PALMEIRAS";
  el("rect", { x: 404, y: 22, width: 60, height: 256, fill: "none", stroke: "var(--line)" }, svg);
  el("rect", { x: 414, y: 36, width: 40, height: 64, rx: 6, fill: "color-mix(in srgb, #4AA3DF 35%, var(--panel))" }, svg);
  el("rect", { x: 414, y: 116, width: 40, height: 70, fill: "none", stroke: "var(--faint)" }, svg);
  el("line", { x1: 414, y1: 151, x2: 454, y2: 151, stroke: "var(--faint)" }, svg);
  el("circle", { cx: 434, cy: 228, r: 16, fill: "none", stroke: "var(--faint)" }, svg);
  el("text", { x: 434, y: 270, "text-anchor": "middle", "font-family": "IBM Plex Mono, monospace", "font-size": 8, fill: "var(--faint)", "letter-spacing": "1" }, svg).textContent = "LAZER";
  const info = document.getElementById("lotInfo");
  const field = (f) => info.querySelector(`[data-f="${f}"]`);
  const pick = (g, l) => {
    svg.querySelectorAll(".lot.sel").forEach((x) => { x.classList.remove("sel"); x.setAttribute("aria-pressed", "false"); });
    g.classList.add("sel"); g.setAttribute("aria-pressed", "true");
    field("n").textContent = String(l[0]).padStart(2, "0");
    field("a").textContent = l[1] + " m²";
    field("s").textContent = SIT[l[2]];
    field("p").textContent = l[2] === "v" ? "—" : `R$ ${l[3]} mil`;
    field("v").textContent = l[4];
  };
  LOTES.forEach((l, i) => {
    const top = i < 6, col = i % 6;
    const x = 16 + col * 63, y = top ? 22 : 174, w = 59, h = 100;
    const label = `Lote ${l[0]}, ${l[1]} metros quadrados, ${SIT[l[2]]}` + (l[2] === "v" ? "" : `, R$ ${l[3]} mil`);
    const g = el("g", { class: "lot", "data-s": l[2], tabindex: 0, role: "button", "aria-pressed": "false", "aria-label": label }, svg);
    el("rect", { x, y, width: w, height: h, rx: 2 }, g);
    el("text", { x: x + 8, y: y + 18 }, g).textContent = String(l[0]).padStart(2, "0");
    if (l[2] !== "v") el("text", { x: x + 8, y: y + h - 10, style: "font-size:10px;fill:var(--dim)" }, g).textContent = l[3] + " mil";
    g.addEventListener("click", () => pick(g, l));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g, l); } });
    if (l[0] === 5) pick(g, l);
  });

  // ---------- Plano escolhido preenche o formulário ----------
  document.querySelectorAll("[data-plan]").forEach((a) => a.addEventListener("click", () => {
    document.getElementById("f-plano").value = a.dataset.plan;
  }));

  // ---------- Formulário ----------
  // URL do app da web do Google Apps Script (termina em /exec). Vazio = envio desligado.
  const LEAD_URL = "";
  const form = document.getElementById("lead");
  const ok = document.getElementById("formOk");
  const btn = form.querySelector("button[type=submit]");
  const say = (msg, color) => { ok.hidden = false; ok.style.borderColor = `var(${color})`; ok.textContent = msg; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim(), emp = form.empresa.value.trim(), email = form.email.value.trim();
    if (!nome || !emp || !/^\S+@\S+\.\S+$/.test(email)) {
      say("Preencha nome, construtora e um e-mail válido para continuar.", "--red");
      return;
    }
    const first = nome.split(" ")[0];
    if (form.site.value) { say(`Obrigado, ${first}.`, "--green"); return; } // robô
    if (!LEAD_URL) {
      say(`Obrigado, ${first}. (Página de demonstração: o envio ainda não está conectado a um sistema de vendas.)`, "--green");
      return;
    }
    const dados = new URLSearchParams({
      nome, empresa: emp, email, tel: form.tel.value.trim(),
      obras: form.obras.value, plano: form.plano.value,
      origem: "pagina-vendas", enviado: new Date().toISOString(),
    });
    btn.disabled = true; btn.textContent = "Enviando…";
    try {
      // Apps Script não devolve CORS: no-cors envia e a resposta fica opaca.
      await fetch(LEAD_URL, { method: "POST", mode: "no-cors", body: dados });
      form.reset();
      document.getElementById("f-plano").value = dados.get("plano");
      say(`Obrigado, ${first}. Recebemos o pedido de teste do plano ${dados.get("plano")} para ${emp}. Nossa equipe vai entrar em contato com você.`, "--green");
    } catch (err) {
      say("Não foi possível enviar agora. Confira a conexão e tente de novo; seus dados continuam preenchidos.", "--red");
    } finally {
      btn.disabled = false; btn.textContent = "Quero testar o Prumo";
    }
  });
})();
