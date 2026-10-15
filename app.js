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

// ---------- Maquetes holográficas ----------
// Mesmo 3D na seção "Veja funcionando" e na janela do botão "Ver a obra em 3D":
// uma torre original de 90 lajes que sobe laje por laje e o apartamento 1204 com paredes e móveis em linhas de luz.
(() => {
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const leve = matchMedia("(pointer: coarse)").matches;
  let threeP = null;
  const carregarThree = () => threeP || (threeP = new Promise((ok, erro) => {
    if (window.THREE) return ok();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js";
    s.onload = ok; s.onerror = () => { threeP = null; erro(); }; document.head.appendChild(s);
  }));

  // ----- materiais e utilidades -----
  function kit(T, corte) {
    const linha = (cor, op, cortar = true) => { const m = new T.LineBasicMaterial({ color: cor, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false }); if (cortar) m.clippingPlanes = [corte]; return m; };
    const segs = (pai, arr, mat) => { const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(arr, 3)); const l = new T.LineSegments(g, mat); pai.add(l); return l; };
    const ret = (arr, x0, z0, x1, z1, y = 0) => arr.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
    const caixa = (arr, x0, y0, z0, x1, y1, z1) => { ret(arr, x0, z0, x1, z1, y0); ret(arr, x0, z0, x1, z1, y1); [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach(([x, z]) => arr.push(x, y0, z, x, y1, z)); };
    const brilhoTex = () => { const c = document.createElement("canvas"); c.width = c.height = 128; const cx = c.getContext("2d"); const gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(140,195,245,.55)"); gr.addColorStop(1, "rgba(140,195,245,0)"); cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); };
    const chao = (pai, tam, op = 1) => { const m = new T.Mesh(new T.PlaneGeometry(tam, tam), new T.MeshBasicMaterial({ map: brilhoTex(), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.002; pai.add(m); };
    return { linha, segs, ret, caixa, chao,
      forte: linha(0xd6ecff, 0.95), fino: linha(0x8fc4f0, 0.32),
      planta: linha(0xa9d2f5, 0.55, false), grade: linha(0x6f9fc8, 0.14, false), cota: linha(0xa9d2f5, 0.3, false),
      frente: linha(0xffb98c, 0.95, false) };
  }

  // ----- a torre sobre a prancha -----
  function cenaTorre(T, K, corte) {
    const g = new T.Group(), FH = 0.048, LAJES = 90;
    const vidro = new T.MeshBasicMaterial({ color: 0x7fb8ea, transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }); vidro.clippingPlanes = [corte];
    const contorno = (r, lados, giro, sub, off) => {
      const v = []; for (let i = 0; i < lados; i++) { const a = giro + (i / lados) * Math.PI * 2; v.push([off[0] + Math.cos(a) * r, off[1] + Math.sin(a) * r]); }
      const p = []; v.forEach((a, i) => { const b = v[(i + 1) % lados]; for (let k = 0; k < sub; k++) { const t = k / sub; p.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } });
      return p;
    };
    const E = [
      { de: 0, ate: 5, r: 1.0, lados: 4, giro: Math.PI / 4, sub: 8, off: [0, 0] },
      { de: 5, ate: 34, r: 0.62, lados: 8, giro: Math.PI / 8, sub: 4, off: [0, 0] },
      { de: 34, ate: 56, r: 0.52, lados: 8, giro: Math.PI / 8, sub: 4, off: [0.05, 0.02] },
      { de: 56, ate: 72, r: 0.42, lados: 8, giro: Math.PI / 8, sub: 3, off: [0.09, 0.04] },
      { de: 72, ate: 82, r: 0.32, lados: 8, giro: Math.PI / 8, sub: 3, off: [0.12, 0.05] },
      { de: 82, ate: 90, r: 0.22, lados: 8, giro: Math.PI / 8, sub: 2, off: [0.14, 0.06] },
    ];
    const forte = [], fino = [], frentes = [];
    E.forEach((e) => {
      const pts = contorno(e.r, e.lados, e.giro, e.sub, e.off); e.pts = pts;
      for (let f = e.de; f <= e.ate; f++) { const y = f * FH, alvo = (f === e.de || f === e.ate || f % 5 === 0) ? forte : fino; pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length]; alvo.push(a[0], y, a[1], b[0], y, b[1]); }); }
      const y0 = e.de * FH, y1 = e.ate * FH;
      pts.forEach((a, i) => { (i % e.sub === 0 ? forte : fino).push(a[0], y0, a[1], a[0], y1, a[1]); });
      if (e.ate !== LAJES) pts.forEach((a, i) => { if (i % e.sub === 0) fino.push(a[0], y1, a[1], e.off[0] + (a[0] - e.off[0]) * 0.55, y1, e.off[1] + (a[1] - e.off[1]) * 0.55); });
      const m = new T.Mesh(new T.CylinderGeometry(e.r * 0.995, e.r * 0.995, y1 - y0, e.lados, 1, true), vidro); m.rotation.y = Math.PI / 2 - e.giro; m.position.set(e.off[0], (y0 + y1) / 2, e.off[1]); g.add(m);
      const anel = []; pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length]; anel.push(a[0], 0, a[1], b[0], 0, b[1]); });
      const l = K.segs(g, anel, K.frente); l.visible = false; frentes.push(l);
    });
    const topo = LAJES * FH, o = E[5].off;
    forte.push(o[0], topo, o[1], o[0], topo + 1.4, o[1]);
    [0.1, 0.2, 0.32, 0.46, 0.62, 0.8].forEach((h, i) => { const pts = contorno(0.13 - i * 0.019, 8, Math.PI / 8, 1, o); pts.forEach((a, k) => { const b = pts[(k + 1) % pts.length]; forte.push(a[0], topo + h, a[1], b[0], topo + h, b[1]); if (i === 0) fino.push(a[0], topo, a[1], o[0], topo + 0.4, o[1]); }); });
    K.segs(g, forte, K.forte); K.segs(g, fino, K.fino);
    // prancha
    const P = 2.3, prancha = [], grade = [], cota = [];
    K.ret(prancha, -P, -P, P, P); K.ret(cota, -P + 0.12, -P + 0.12, P - 0.12, P - 0.12);
    for (let k = -P + 0.25; k < P; k += 0.25) grade.push(k, 0, -P, k, 0, P, -P, 0, k, P, 0, k);
    E.forEach((e, i) => { if (i % 2) return; e.pts.forEach((a, k) => { const b = e.pts[(k + 1) % e.pts.length]; prancha.push(a[0], 0, a[1], b[0], 0, b[1]); }); });
    cota.push(-P + 0.3, 0, 0, P - 0.3, 0, 0, 0, 0, -P + 0.3, 0, 0, P - 0.3);
    [[-2.0, -2.0, -1.3, -0.9], [1.35, -2.0, 2.0, -1.1], [-2.0, 1.2, -1.1, 2.0], [1.25, 1.35, 2.0, 2.0], [-0.5, 1.55, 0.5, 2.0]].forEach((r) => K.ret(prancha, ...r));
    for (let x = -1.92; x < -1.35; x += 0.11) cota.push(x, 0, -2.0, x, 0, -0.9);
    for (let z = 1.45; z < 2.0; z += 0.09) cota.push(1.25, 0, z, 2.0, 0, z);
    [[-1.05, -1.5, 1.05, -1.5], [1.5, -1.05, 1.5, 1.05]].forEach(([x0, z0, x1, z1]) => { cota.push(x0, 0, z0, x1, 0, z1); const dx = z0 === z1 ? 0 : 0.06, dz = z0 === z1 ? 0.06 : 0; cota.push(x0 - dx, 0, z0 - dz, x0 + dx, 0, z0 + dz, x1 - dx, 0, z1 - dz, x1 + dx, 0, z1 + dz); });
    K.segs(g, prancha, K.planta); K.segs(g, grade, K.grade); K.segs(g, cota, K.cota);
    const folha = new T.Mesh(new T.PlaneGeometry(P * 2, P * 2), new T.MeshBasicMaterial({ color: 0x9cc6ee, transparent: true, opacity: 0.06, blending: T.AdditiveBlending, depthWrite: false }));
    folha.rotation.x = -Math.PI / 2; folha.position.y = -0.001; g.add(folha);
    K.chao(g, 3.4);
    return {
      grupo: g, altura: topo + 1.4, alvo: [0, 2.25, 0], dist: 10.2, largura: 4.4, elev: 0.53,
      rotulo: (h) => "Laje " + String(Math.min(LAJES, Math.floor(h / FH))).padStart(2, "0") + " de " + LAJES,
      quadro: (h, subindo) => { const laje = Math.floor(h / FH); frentes.forEach((l, i) => { const e = E[i], vis = subindo && laje >= e.de && laje < e.ate; l.visible = vis; if (vis) l.position.y = laje * FH; }); },
    };
  }

  // ----- o apartamento 1204 (medidas da demo: 9,00 × 10,90 m, 81 m²) -----
  function cenaApto(T, K, corte) {
    const g = new T.Group(), S = 0.42, H = 2.7 * S; // escala: 1 m = 0,42 unidade
    const COM = [
      ["Varanda gourmet", 0, -1.9, 5.2, 1.9], ["Sala de estar e jantar", 0, 0, 5.2, 4.6], ["Cozinha", 5.2, 0, 3.8, 2.8],
      ["Banho social", 5.2, 2.8, 1.8, 1.8], ["Lavanderia", 7.0, 2.8, 2.0, 1.8], ["Circulação", 0, 4.6, 9, 1.0],
      ["Suíte", 0, 5.6, 4.2, 3.4], ["Banho suíte", 4.2, 5.6, 1.6, 2.0], ["Closet", 4.2, 7.6, 1.6, 1.4], ["Quarto 2", 5.8, 5.6, 3.2, 3.4],
    ];
    const cx = 4.5, cz = 3.55; // centro da planta
    const X = (x) => (x - cx) * S, Z = (z) => (z - cz) * S;
    const forte = [], fino = [], piso = [], moveis = [];
    // paredes: cada aresta de cômodo vira parede (sem duplicar trechos iguais)
    const vistas = new Set();
    COM.forEach(([n, x, z, w, d]) => {
      const varanda = n.startsWith("Varanda"), h = varanda ? 1.1 * S : H; // guarda-corpo na varanda
      [[x, z, x + w, z], [x + w, z, x + w, z + d], [x, z + d, x + w, z + d], [x, z, x, z + d]].forEach(([a, b, c, e]) => {
        const k = [a, b, c, e].map((v) => v.toFixed(2)).join(","); if (vistas.has(k)) return; vistas.add(k);
        forte.push(X(a), 0, Z(b), X(c), 0, Z(e), X(a), h, Z(b), X(c), h, Z(e));
        forte.push(X(a), 0, Z(b), X(a), h, Z(b), X(c), 0, Z(e), X(c), h, Z(e));
        const len = Math.hypot(c - a, e - b), n2 = Math.floor(len / 0.6);
        for (let i = 1; i < n2; i++) { const t = i / n2; fino.push(X(a + (c - a) * t), 0, Z(b + (e - b) * t), X(a + (c - a) * t), h, Z(b + (e - b) * t)); }
        fino.push(X(a), h / 2, Z(b), X(c), h / 2, Z(e));
      });
      // piso em grade fina
      for (let gx = x + 0.5; gx < x + w; gx += 0.5) piso.push(X(gx), 0, Z(z), X(gx), 0, Z(z + d));
      for (let gz = z + 0.5; gz < z + d; gz += 0.5) piso.push(X(x), 0, Z(gz), X(x + w), 0, Z(gz));
    });
    // móveis em escala (metros)
    const mv = (x0, z0, x1, z1, h) => K.caixa(moveis, X(x0), 0, Z(z0), X(x1), h * S, Z(z1));
    mv(0.4, 0.4, 2.6, 1.3, 0.8); mv(0.4, 0.4, 2.6, 0.62, 0.85);           // sofá
    mv(1.0, 1.9, 2.2, 2.5, 0.4);                                           // mesa de centro
    mv(0.25, 3.2, 1.7, 3.9, 0.75); mv(0.25, 2.2, 0.45, 2.9, 1.2);          // mesa de jantar e aparador
    mv(5.3, 0.1, 8.9, 0.7, 0.9); mv(8.3, 0.7, 8.9, 2.6, 0.9);              // bancadas da cozinha
    mv(6.3, 1.4, 7.6, 2.1, 0.9);                                           // ilha
    mv(0.9, 6.6, 2.9, 8.7, 0.5); mv(0.9, 8.55, 2.9, 8.95, 1.0);           // cama de casal e cabeceira
    mv(6.4, 7.1, 7.4, 8.95, 0.5);                                          // cama de solteiro
    mv(8.3, 5.7, 8.9, 7.3, 2.1);                                           // armário
    mv(4.3, 7.7, 4.8, 8.9, 2.1);                                           // closet
    mv(5.3, 2.9, 5.9, 3.5, 0.45); mv(4.3, 5.7, 4.9, 6.3, 0.45);            // vasos
    mv(7.2, 2.9, 7.8, 3.5, 0.9); mv(7.9, 2.9, 8.5, 3.5, 0.9);              // lavadora e tanque
    mv(0.5, -1.6, 2.4, -0.7, 0.75);                                        // mesa da varanda
    K.segs(g, forte, K.forte); K.segs(g, fino, K.fino);
    K.segs(g, piso, K.linha(0x6f9fc8, 0.18));
    K.segs(g, moveis, K.linha(0xffc9a6, 0.75));
    // laje e contorno com cotas
    const laje = [], cota = [];
    K.ret(laje, X(-0.3), Z(-2.2), X(9.3), Z(9.3)); K.ret(cota, X(-0.7), Z(-2.6), X(9.7), Z(9.7));
    cota.push(X(0), 0, Z(9.9), X(9), 0, Z(9.9), X(9.9), 0, Z(-1.9), X(9.9), 0, Z(9));
    K.segs(g, laje, K.planta); K.segs(g, cota, K.cota);
    K.chao(g, 6, 0.8);
    // nomes dos cômodos
    const rotulos = [];
    COM.forEach(([n, x, z, w, d]) => {
      if (n === "Circulação") return;
      const c = document.createElement("canvas"); c.width = 512; c.height = 128; const t = c.getContext("2d");
      t.fillStyle = "rgba(214,236,255,.95)"; t.font = "500 40px 'Plus Jakarta Sans', sans-serif"; t.textAlign = "center"; t.fillText(n.toUpperCase(), 256, 58);
      t.fillStyle = "rgba(159,200,238,.8)"; t.font = "400 34px 'Plus Jakarta Sans', sans-serif"; t.fillText(`${(w * d).toFixed(1).replace(".", ",")} m²`, 256, 104);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false, depthTest: false, opacity: 0 }));
      const esc = Math.min(1.6, Math.max(1.0, w * 0.3)); sp.scale.set(esc, esc / 4, 1); sp.position.set(X(x + w / 2), H + 0.12, Z(z + d / 2)); g.add(sp); rotulos.push(sp);
    });
    return {
      grupo: g, altura: H + 0.05, alvo: [0, 0.3, 0.1], dist: 8.4, largura: 5.6, elev: 0.82,
      rotulo: () => "Apê 1204 · 81 m² · 2 quartos",
      quadro: (h) => { const k = Math.max(0, Math.min(1, (h / (H + 0.05) - 0.7) / 0.3)); rotulos.forEach((s) => (s.material.opacity = k)); },
    };
  }

  // ----- o visualizador -----
  function holograma(fig, tela, { cenas, info, repetir, arrastar = false, aoPronto }) {
    return carregarThree().then(() => {
      const T = window.THREE;
      let renderer;
      try { renderer = new T.WebGLRenderer({ canvas: tela, antialias: true, alpha: true }); } catch (e) { fig.classList.add("sem-3d"); return null; }
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, leve ? 1.75 : 2));
      renderer.setClearColor(0x000000, 0); renderer.localClippingEnabled = true;
      const cena = new T.Scene(), cam = new T.PerspectiveCamera(33, 1, 0.1, 100), giro = new T.Group(); cena.add(giro);
      const corte = new T.Plane(new T.Vector3(0, -1, 0), 0), K = kit(T, corte);
      const feitas = {}; let atual = null, nomeAtual = null;
      const medir = () => { const w = tela.clientWidth, h = tela.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      new ResizeObserver(medir).observe(tela); medir();

      let altura = 0, subindo = false, t0 = 0, comecou = false, visivel = true, rodando = false, ultimo = performance.now();
      let ang = -0.5, inc = 0, mx = 0, my = 0, sx = 0, sy = 0, arrasto = null, parado = 0;
      const DUR = 6000;
      const iniciar = () => { altura = calmo ? 1e3 : 0; subindo = !calmo; t0 = performance.now(); if (repetir) repetir.hidden = true; };
      const trocar = (nome) => {
        if (atual) giro.remove(atual.grupo);
        atual = feitas[nome] || (feitas[nome] = (nome === "apto" ? cenaApto : cenaTorre)(T, K, corte));
        nomeAtual = nome; giro.add(atual.grupo);
        if (comecou) iniciar();
      };
      trocar(cenas[0]);

      if (!leve && !arrastar) fig.addEventListener("pointermove", (e) => { const r = fig.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; });
      fig.addEventListener("pointerleave", () => { mx = my = 0; });
      if (arrastar) {
        tela.style.touchAction = "none"; tela.style.cursor = "grab";
        tela.addEventListener("pointerdown", (e) => { arrasto = { x: e.clientX, y: e.clientY, a: ang, i: inc }; tela.setPointerCapture(e.pointerId); tela.style.cursor = "grabbing"; });
        tela.addEventListener("pointermove", (e) => { if (!arrasto) return; ang = arrasto.a + (e.clientX - arrasto.x) * 0.008; inc = Math.max(-0.35, Math.min(0.5, arrasto.i + (e.clientY - arrasto.y) * 0.004)); parado = performance.now(); });
        const soltar = () => { arrasto = null; tela.style.cursor = "grab"; };
        tela.addEventListener("pointerup", soltar); tela.addEventListener("pointercancel", soltar);
      }
      if (repetir) repetir.addEventListener("click", iniciar);

      const ligar = () => { if (rodando) return; rodando = true; ultimo = performance.now(); requestAnimationFrame(quadro); };
      new IntersectionObserver((e) => { visivel = e[0].isIntersecting; if (visivel) ligar(); }).observe(fig);

      function quadro(agora) {
        if (!visivel) { rodando = false; return; }
        const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
        if (!comecou) { const r = fig.getBoundingClientRect(), vis = (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height; if (vis > 0.45) { comecou = true; iniciar(); } }
        const alvoH = atual.altura + 0.1;
        if (subindo) { const k = Math.min(1, (agora - t0) / DUR); altura = (1 - Math.pow(1 - k, 2.2)) * alvoH; if (k >= 1) { subindo = false; if (repetir) repetir.hidden = false; } }
        else if (comecou && altura > alvoH) altura = alvoH;
        corte.constant = comecou ? altura : 0;
        atual.quadro(corte.constant, subindo);
        if (info) info.textContent = atual.rotulo(corte.constant);
        if (!calmo && !arrasto && agora - parado > 1500) ang += dt * 0.16;
        giro.rotation.y = ang;
        sx += (mx - sx) * 0.05; sy += (my - sy) * 0.05;
        // distância que garante a maquete inteira na largura da tela (celular em pé)
        const meiaH = Math.atan(Math.tan((cam.fov * Math.PI) / 360) * cam.aspect);
        const [ax, ay, az] = atual.alvo, d = Math.max(atual.dist, atual.largura / Math.tan(meiaH) * 0.62), el = Math.max(0.15, atual.elev + inc - sy * 0.12);
        cam.position.set(ax + d * Math.cos(el) * Math.SQRT1_2 + sx * 0.7, ay + d * Math.sin(el), az + d * Math.cos(el) * Math.SQRT1_2 - sx * 0.7);
        cam.lookAt(ax, ay, az);
        renderer.render(cena, cam);
        requestAnimationFrame(quadro);
      }
      ligar();
      const api = { trocar, iniciar, medir, get nome() { return nomeAtual; } };
      if (aoPronto) aoPronto(api);
      return api;
    }).catch(() => { fig.classList.add("sem-3d"); return null; });
  }

  // ----- seção da página -----
  const fig = document.getElementById("holo");
  if (fig) {
    const vigia = new IntersectionObserver((e) => {
      if (!e[0].isIntersecting) return; vigia.disconnect();
      holograma(fig, document.getElementById("holoTela"), { cenas: ["torre"], info: document.getElementById("holoLaje"), repetir: document.getElementById("holoRepetir") });
    }, { rootMargin: "400px 0px" });
    vigia.observe(fig);
  }

  // ----- janela do botão "Ver a obra em 3D" -----
  const janela = document.getElementById("janela");
  if (janela) {
    let viewer = null;
    const abas = [...janela.querySelectorAll("[data-vista]")];
    const marcar = (n) => abas.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.vista === n)));
    const abrir = (vista = "torre") => {
      if (typeof janela.showModal === "function") janela.showModal(); else janela.setAttribute("open", "");
      marcar(vista);
      if (!viewer) viewer = holograma(janela.querySelector(".janela-tela"), document.getElementById("janelaTela"), { cenas: [vista], info: document.getElementById("janelaInfo"), repetir: document.getElementById("janelaRepetir"), arrastar: true });
      else viewer.then((v) => { if (!v) return; v.medir(); if (v.nome !== vista) v.trocar(vista); else v.iniciar(); });
    };
    document.querySelectorAll("[data-video]").forEach((b) => b.addEventListener("click", () => abrir(b.dataset.video || "torre")));
    abas.forEach((b) => b.addEventListener("click", () => { marcar(b.dataset.vista); viewer && viewer.then((v) => v && v.trocar(b.dataset.vista)); }));
    const fechar = () => { if (janela.open) janela.close(); };
    janela.querySelector("[data-fechar]").addEventListener("click", fechar);
    janela.addEventListener("click", (e) => { if (e.target === janela) fechar(); });
  }
})();
