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

// ---------- Maquete holográfica (seção "Veja funcionando") ----------
// Torre original em linhas de luz sobre a prancha do projeto. Sobe laje por laje quando a seção aparece.
(() => {
  const fig = document.getElementById("holo"); if (!fig) return;
  const tela = document.getElementById("holoTela"), rotLaje = document.getElementById("holoLaje"), repetir = document.getElementById("holoRepetir");
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const leve = matchMedia("(pointer: coarse)").matches;

  const carregarThree = () => new Promise((ok, erro) => {
    if (window.THREE) return ok();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js";
    s.onload = ok; s.onerror = erro; document.head.appendChild(s);
  });

  let iniciado = false;
  const vigia = new IntersectionObserver((e) => {
    if (!e[0].isIntersecting || iniciado) return; iniciado = true; vigia.disconnect();
    carregarThree().then(montar).catch(() => fig.classList.add("sem-3d"));
  }, { rootMargin: "400px 0px" });
  vigia.observe(fig);

  function montar() {
    const T = window.THREE;
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas: tela, antialias: true, alpha: true }); } catch (e) { fig.classList.add("sem-3d"); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, leve ? 1.75 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.localClippingEnabled = true;
    const cena = new T.Scene();
    const cam = new T.PerspectiveCamera(33, 0.8, 0.1, 100);
    const giro = new T.Group(); cena.add(giro);

    const FH = 0.048, LAJES = 90;
    const totalTxt = rotLaje.nextElementSibling; if (totalTxt) totalTxt.textContent = "de " + LAJES;
    const corte = new T.Plane(new T.Vector3(0, -1, 0), 0); // mostra só o que está abaixo da altura atual
    const linha = (cor, op) => new T.LineBasicMaterial({ color: cor, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false });
    const mTorre = linha(0xd6ecff, 0.95); mTorre.clippingPlanes = [corte];
    const mFino = linha(0x8fc4f0, 0.32); mFino.clippingPlanes = [corte];
    const mPlanta = linha(0xa9d2f5, 0.55), mGrade = linha(0x6f9fc8, 0.14), mCota = linha(0xa9d2f5, 0.3);
    const mVidro = new T.MeshBasicMaterial({ color: 0x7fb8ea, transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }); mVidro.clippingPlanes = [corte];

    // contorno de um pavimento: polígono com cantos chanfrados, subdividido para os montantes da fachada
    const contorno = (r, lados, giroAng, sub, off) => {
      const v = []; for (let i = 0; i < lados; i++) { const a = giroAng + (i / lados) * Math.PI * 2; v.push([off[0] + Math.cos(a) * r, off[1] + Math.sin(a) * r]); }
      const p = []; v.forEach((a, i) => { const b = v[(i + 1) % lados]; for (let k = 0; k < sub; k++) { const t = k / sub; p.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } });
      return p;
    };
    // torre em recuos (original): embasamento quadrado e corpo octogonal que afina e se desloca
    const ESTAGIOS = [
      { de: 0, ate: 5, r: 1.0, lados: 4, giro: Math.PI / 4, sub: 8, off: [0, 0] },
      { de: 5, ate: 34, r: 0.62, lados: 8, giro: Math.PI / 8, sub: 4, off: [0, 0] },
      { de: 34, ate: 56, r: 0.52, lados: 8, giro: Math.PI / 8, sub: 4, off: [0.05, 0.02] },
      { de: 56, ate: 72, r: 0.42, lados: 8, giro: Math.PI / 8, sub: 3, off: [0.09, 0.04] },
      { de: 72, ate: 82, r: 0.32, lados: 8, giro: Math.PI / 8, sub: 3, off: [0.12, 0.05] },
      { de: 82, ate: 90, r: 0.22, lados: 8, giro: Math.PI / 8, sub: 2, off: [0.14, 0.06] },
    ];
    const forte = [], fino = [], aneis = [];
    ESTAGIOS.forEach((e) => {
      const pts = contorno(e.r, e.lados, e.giro, e.sub, e.off); e.pts = pts;
      for (let f = e.de; f <= e.ate; f++) {
        const y = f * FH, alvo = (f === e.de || f === e.ate || f % 5 === 0) ? forte : fino;
        pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length]; alvo.push(a[0], y, a[1], b[0], y, b[1]); });
      }
      const y0 = e.de * FH, y1 = e.ate * FH;
      pts.forEach((a, i) => { (i % e.sub === 0 ? forte : fino).push(a[0], y0, a[1], a[0], y1, a[1]); });
      // laje de topo do recuo: liga o contorno ao miolo
      if (e.ate !== LAJES) pts.forEach((a, i) => { if (i % e.sub === 0) fino.push(a[0], y1, a[1], e.off[0] + (a[0] - e.off[0]) * 0.55, y1, e.off[1] + (a[1] - e.off[1]) * 0.55); });
      // vidro: prisma translúcido
      const g = new T.CylinderGeometry(e.r * 0.995, e.r * 0.995, y1 - y0, e.lados, 1, true);
      const m = new T.Mesh(g, mVidro); m.position.set(e.off[0], (y0 + y1) / 2, e.off[1]);
      // CylinderGeometry começa em +z; giramos para casar com os vértices do contorno
      m.rotation.y = Math.PI / 2 - e.giro; giro.add(m);
      const anel = []; pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length]; anel.push(a[0], 0, a[1], b[0], 0, b[1]); }); aneis.push({ e, anel });
    });
    // mastro e antena
    const topo = LAJES * FH, o = ESTAGIOS[5].off;
    forte.push(o[0], topo, o[1], o[0], topo + 1.4, o[1]);
    [0.1, 0.2, 0.32, 0.46, 0.62, 0.8].forEach((h, i) => {
      const r = 0.13 - i * 0.019, pts = contorno(r, 8, Math.PI / 8, 1, o);
      pts.forEach((a, k) => { const b = pts[(k + 1) % pts.length]; forte.push(a[0], topo + h, a[1], b[0], topo + h, b[1]); if (i === 0) fino.push(a[0], topo, a[1], o[0], topo + 0.4, o[1]); });
    });
    const segs = (arr, mat) => { const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(arr, 3)); const l = new T.LineSegments(g, mat); giro.add(l); return l; };
    segs(forte, mTorre); segs(fino, mFino);
    const ALTURA = topo + 1.4;

    // anel de luz na frente da obra (onde a laje está sendo concretada)
    const mFrente = new T.LineBasicMaterial({ color: 0xffb98c, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false });
    const frentes = aneis.map(({ anel }) => { const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(anel, 3)); const l = new T.LineSegments(g, mFrente); l.visible = false; giro.add(l); return l; });

    // prancha do projeto: margens, grade, planta baixa e cotas
    const P = 2.3, prancha = [], grade = [], cota = [];
    const ret = (arr, x0, z0, x1, z1) => arr.push(x0, 0, z0, x1, 0, z0, x1, 0, z0, x1, 0, z1, x1, 0, z1, x0, 0, z1, x0, 0, z1, x0, 0, z0);
    ret(prancha, -P, -P, P, P); ret(cota, -P + 0.12, -P + 0.12, P - 0.12, P - 0.12);
    for (let k = -P + 0.25; k < P; k += 0.25) { grade.push(k, 0, -P, k, 0, P, -P, 0, k, P, 0, k); }
    ESTAGIOS.forEach((e, i) => { if (i % 2) return; e.pts.forEach((a, k) => { const b = e.pts[(k + 1) % e.pts.length]; prancha.push(a[0], 0, a[1], b[0], 0, b[1]); }); });
    cota.push(-P + 0.3, 0, 0, P - 0.3, 0, 0, 0, 0, -P + 0.3, 0, 0, P - 0.3); // eixos
    // ambientes no entorno (estacionamento, praça, acessos)
    [[-2.0, -2.0, -1.3, -0.9], [1.35, -2.0, 2.0, -1.1], [-2.0, 1.2, -1.1, 2.0], [1.25, 1.35, 2.0, 2.0], [-0.5, 1.55, 0.5, 2.0]].forEach((r) => ret(prancha, ...r));
    for (let x = -1.92; x < -1.35; x += 0.11) cota.push(x, 0, -2.0, x, 0, -0.9);
    for (let z = 1.45; z < 2.0; z += 0.09) cota.push(1.25, 0, z, 2.0, 0, z);
    // cotas com marcas
    [[-1.05, -1.5, 1.05, -1.5], [1.5, -1.05, 1.5, 1.05]].forEach(([x0, z0, x1, z1]) => { cota.push(x0, 0, z0, x1, 0, z1); const dx = z0 === z1 ? 0 : 0.06, dz = z0 === z1 ? 0.06 : 0; cota.push(x0 - dx, 0, z0 - dz, x0 + dx, 0, z0 + dz, x1 - dx, 0, z1 - dz, x1 + dx, 0, z1 + dz); });
    segs(prancha, mPlanta); segs(grade, mGrade); segs(cota, mCota);
    // a folha da prancha, levemente iluminada
    const folha = new T.Mesh(new T.PlaneGeometry(P * 2, P * 2), new T.MeshBasicMaterial({ color: 0x9cc6ee, transparent: true, opacity: 0.06, blending: T.AdditiveBlending, depthWrite: false }));
    folha.rotation.x = -Math.PI / 2; folha.position.y = -0.001; giro.add(folha);
    // brilho da maquete sobre a prancha
    const c = document.createElement("canvas"); c.width = c.height = 128; const cx = c.getContext("2d");
    const gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(140,195,245,.55)"); gr.addColorStop(1, "rgba(140,195,245,0)"); cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
    const brilho = new T.Mesh(new T.PlaneGeometry(3.4, 3.4), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    brilho.rotation.x = -Math.PI / 2; brilho.position.y = 0.002; giro.add(brilho);

    // câmera de cima, como na foto da mesa
    const alvo = new T.Vector3(0, 2.25, 0);
    const posicionar = (px = 0, py = 0) => { cam.position.set(7.2 + px * 0.7, 5.6 - py * 0.7, 7.2 - px * 0.7); cam.lookAt(alvo); };
    const medir = () => { const w = tela.clientWidth, h = tela.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    new ResizeObserver(medir).observe(fig); medir(); posicionar();

    let mx = 0, my = 0, sx = 0, sy = 0;
    if (!leve) fig.addEventListener("pointermove", (e) => { const r = fig.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; });
    fig.addEventListener("pointerleave", () => { mx = my = 0; });

    let altura = calmo ? ALTURA + 0.1 : 0, subindo = false, t0 = performance.now(), visivel = true, rodando = false, ang = -0.5, ultimo = performance.now();
    const DUR = 6000;
    const ligar = () => { if (rodando) return; rodando = true; ultimo = performance.now(); requestAnimationFrame(quadro); };
    // só desenha enquanto a maquete está na tela
    new IntersectionObserver((e) => { visivel = e[0].isIntersecting; if (visivel) ligar(); }).observe(fig);
    let comecou = calmo;
    repetir.addEventListener("click", () => { altura = 0; subindo = true; t0 = performance.now(); repetir.hidden = true; });

    function quadro(agora) {
      if (!visivel) { rodando = false; return; }
      const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
      // a torre começa a subir quando boa parte da maquete está à vista
      if (!comecou) { const r = fig.getBoundingClientRect(), vis = (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height; if (vis > 0.45) { comecou = subindo = true; t0 = agora; } }
      if (subindo) {
        const k = Math.min(1, (agora - t0) / DUR), ease = 1 - Math.pow(1 - k, 2.2);
        altura = ease * (ALTURA + 0.1);
        if (k >= 1) { subindo = false; repetir.hidden = false; }
      }
      corte.constant = altura;
      const laje = Math.min(LAJES, Math.floor(altura / FH));
      rotLaje.textContent = "Laje " + String(laje).padStart(2, "0");
      // anel laranja na laje em execução
      frentes.forEach((l, i) => { const e = ESTAGIOS[i]; const vis = subindo && laje >= e.de && laje < e.ate; l.visible = vis; if (vis) l.position.y = laje * FH; });
      if (!calmo) ang += dt * 0.16;
      giro.rotation.y = ang;
      sx += (mx - sx) * 0.05; sy += (my - sy) * 0.05; posicionar(sx, sy);
      renderer.render(cena, cam);
      requestAnimationFrame(quadro);
    }
    ligar();
  }
})();
