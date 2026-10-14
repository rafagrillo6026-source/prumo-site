/* Prumo — demonstração: evolução da obra em 3D e gestão da construtora (dados fictícios, só na memória da página) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mesRel = (k) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + Math.round(k)); return `${MESES[d.getMonth()]}/${d.getFullYear()}`; };
  const mesCurto = (k) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + k); return `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`; };
  const dataRel = (dias) => { const d = new Date(); d.setDate(d.getDate() + dias); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; };
  const mi = (v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} mi`;
  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const num = (v, d = 0) => v.toLocaleString("pt-BR", { maximumFractionDigits: d });
  const mil = (v) => `R$ ${num(Math.round(v / 1000))} mil`;
  function toast(m) { const t = $("#toast"); t.textContent = m; clearTimeout(toast.h); toast.h = setTimeout(() => (t.textContent = ""), 3400); }
  const hashStr = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => { let s = seed % 233280 || 7; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- Dados ----------
  const H = 1, MEU_ANDAR = 12, MEU_LOTE = 24;
  const FUNCOES = [
    { id: "eng", n: "Engenheiro civil", q: 1, sal: 18500, hat: "#F2F2EE", d: "Responsável técnico. Planeja, mede e aprova cada etapa.", altura: false },
    { id: "mestre", n: "Mestre de obras", q: 1, sal: 9800, hat: "#F2F2EE", d: "Coordena as equipes no dia a dia e garante a qualidade do serviço.", altura: true },
    { id: "seg", n: "Técnico de segurança", q: 1, sal: 6400, hat: "#3FA86A", d: "Fiscaliza EPI, andaimes, tela de proteção e treina a equipe.", altura: true },
    { id: "arm", n: "Armador", q: 6, sal: 4300, hat: "#F2C230", d: "Corta, dobra e amarra o aço das lajes e pilares.", altura: true },
    { id: "carp", n: "Carpinteiro de fôrma", q: 5, sal: 4300, hat: "#F2C230", d: "Monta as fôrmas e escoras que dão forma ao concreto.", altura: true },
    { id: "ped", n: "Pedreiro", q: 12, sal: 4100, hat: "#F2C230", d: "Levanta a alvenaria de blocos cerâmicos e faz o reboco.", altura: true },
    { id: "fach", n: "Montador de fachada", q: 4, sal: 4600, hat: "#E07A2E", d: "Instala revestimento e caixilhos pelo balancim.", altura: true },
    { id: "serv", n: "Servente", q: 9, sal: 2900, hat: "#F2C230", d: "Transporta material e apoia todas as equipes.", altura: true },
    { id: "ele", n: "Eletricista", q: 3, sal: 4500, hat: "#2F6FD6", d: "Passa tubulação e fiação dentro das paredes.", altura: false },
    { id: "enc", n: "Encanador", q: 2, sal: 4400, hat: "#2F6FD6", d: "Instala água, esgoto e prumadas de gás.", altura: false },
    { id: "grua", n: "Operador de grua", q: 1, sal: 6200, hat: "#F2C230", d: "Iça aço, fôrmas e paletes até cada frente.", altura: true },
    { id: "sin", n: "Sinaleiro", q: 1, sal: 3400, hat: "#E2453A", d: "Orienta o operador da grua por rádio e sinais.", altura: false },
    { id: "alm", n: "Almoxarife", q: 1, sal: 3600, hat: "#F2C230", d: "Recebe, confere e controla estoque, ferramentas e EPI.", altura: false },
  ];
  const FN = Object.fromEntries(FUNCOES.map((f) => [f.id, f]));
  const isC = (o) => o.tipo === "condominio";
  const fnInfo = (o, id) => (isC(o) && id === "fach" ? { ...FN.fach, n: "Pintor", d: "Faz reboco fino, pintura e acabamento externo das casas." } : FN[id]);
  const ENCARGOS = 1.68;
  const PESOS = [["Fundação", 0.1], ["Estrutura", 0.27], ["Alvenaria", 0.11], ["Fachada", 0.13], ["Instalações", 0.155], ["Acabamentos", 0.18], ["Canteiro e administração", 0.055]];
  const PESOS_C = [["Terraplenagem", 0.08], ["Ruas e redes", 0.2], ["Muro e portaria", 0.07], ["Clube e lazer", 0.15], ["Casas", 0.38], ["Paisagismo", 0.05], ["Canteiro e administração", 0.07]];
  const OBRAS_BASE = [
    { id: "jardim", tipo: "predio", nome: "Vila Jardim Residence", curto: "Vila Jardim", end: "Rua Ipê Amarelo, 85 · Parque Verde", cfg: { floors: 6, pod: 1, tw: 8, pw: 9, estilo: "tijolo" }, unidades: 36, vendidas: 34, area: 4300, inicio: -16, entrega: 3, resp: "Eng. Paula Ribeiro", total: 12.6, desv: [0.02, 0.01, 0.03, 0.06, 0.02, 0, 0.04], escala: 0.6, semAcidente: 302,
      updates: [{ mes: -14, E: 0, A: 0, F: 0, t: "Fundação concluída", d: "Sapatas e vigas baldrame prontas." }, { mes: -10, E: 3, A: 1, F: 0, t: "Estrutura até o 3º andar", d: "Três lajes concretadas." }, { mes: -6, E: 6, A: 4, F: 1, t: "Estrutura concluída", d: "Última laje concretada. Alvenaria no 4º andar." }, { mes: -3, E: 6, A: 6, F: 3, t: "Alvenaria concluída", d: "Fachada de tijolo aparente no 3º andar." }, { mes: -1, E: 6, A: 6, F: 5, t: "Fachada no 5º andar", d: "Acabamentos internos começaram no térreo." }] },
    { id: "aurora", tipo: "predio", nome: "Edifício Aurora", curto: "Aurora", end: "Rua das Acácias, 410 · Vila Aurora", cfg: { floors: 14, pod: 2, tw: 6, pw: 7.6, estilo: "terra" }, unidades: 96, vendidas: 71, area: 11240, inicio: -12, entrega: 14, resp: "Eng. Carla Menezes", total: 31.4, desv: [0.045, 0.017, -0.03, 0.095, 0, 0, 0.03], escala: 1, semAcidente: 128,
      updates: [{ mes: -11, E: 0, A: 0, F: 0, t: "Fundação concluída", d: "Estacas e blocos de fundação finalizados. A estrutura começa no próximo mês." }, { mes: -9, E: 3, A: 0, F: 0, t: "Estrutura até o 2º pavimento", d: "Três lajes concretadas. O pódio de concreto já aparece na rua." }, { mes: -7, E: 5, A: 2, F: 0, t: "Alvenaria começou", d: "Paredes do térreo e do mezanino levantadas. Estrutura no 4º pavimento." }, { mes: -5, E: 7, A: 4, F: 2, t: "Pódio de concreto finalizado", d: "Fachada do térreo e do mezanino pronta. Começa a terracota da torre." }, { mes: -3, E: 9, A: 6, F: 4, t: "9 lajes concretadas", d: "Estrutura no 8º pavimento. Alvenaria e fachada seguem o ritmo previsto." }, { mes: -1, E: 11, A: 8, F: 5, t: "11ª laje concretada", d: "A fachada chegou ao 5º pavimento. Instalações elétricas começaram no térreo." }] },
    { id: "mirante", tipo: "predio", nome: "Residencial Mirante", curto: "Mirante", end: "Av. das Palmeiras, 2200 · Jardim Sul", cfg: { floors: 20, pod: 2, tw: 5.2, pw: 7, estilo: "branco" }, unidades: 152, vendidas: 88, area: 16800, inicio: -7, entrega: 22, resp: "Eng. Bruno Teixeira", total: 42.8, desv: [0.06, 0.03, 0, 0, 0, 0, 0.02], escala: 1.15, semAcidente: 61,
      updates: [{ mes: -6, E: 0, A: 0, F: 0, t: "Fundação concluída", d: "Estacas hélice contínua e blocos finalizados." }, { mes: -4, E: 2, A: 0, F: 0, t: "Pódio estrutural", d: "Térreo e garagem concretados." }, { mes: -2, E: 4, A: 1, F: 0, t: "Torre começou a subir", d: "4 lajes concretadas. Alvenaria no térreo." }, { mes: -1, E: 6, A: 3, F: 1, t: "6ª laje concretada", d: "Fachada do térreo em execução." }] },
    { id: "reserva", tipo: "condominio", nome: "Reserva das Águas", curto: "Reserva", end: "Estrada do Lago, km 4 · Recanto Azul", cfg: {}, unidades: 32, vendidas: 22, area: 19800, inicio: -11, entrega: 12, resp: "Eng. Marina Duarte", total: 28.6, desv: [0.01, 0.04, 0, 0.07, 0.02, 0, 0.03], escala: 0.8, semAcidente: 214,
      updates: [{ mes: -10, terra: 100, ruas: 0, muro: 0, clube: 0, k: 0, t: "Terraplenagem concluída", d: "Terreno nivelado e quadras demarcadas." }, { mes: -7, terra: 100, ruas: 40, muro: 25, clube: 0, k: 0, t: "Redes de água e esgoto", d: "Tubulação enterrada nas ruas e o muro começou a subir." }, { mes: -4, terra: 100, ruas: 70, muro: 55, clube: 15, k: 2, t: "Primeiras casas começaram", d: "Fundação das primeiras casas e da quadra poliesportiva." }, { mes: -2, terra: 100, ruas: 85, muro: 75, clube: 30, k: 4, t: "Portaria pronta", d: "Portaria e muro da frente concluídos. Clube social em estrutura." }, { mes: -1, terra: 100, ruas: 90, muro: 85, clube: 45, k: 5, t: "Primeira casa entregue", d: "A primeira casa ficou pronta. Avenida principal asfaltada." }] },
  ];
  // Lotes do condomínio: 4 fileiras × 8 lotes
  const LOTE_X = [-20.5, -15.5, -10.5, -5.5, 5.5, 10.5, 15.5, 20.5];
  const LOTE_FILAS = [{ zc: 14, d: 6, frente: -1, st: "VVVDVVRV" }, { zc: 6, d: 6, frente: 1, st: "VVDVVVVD" }, { zc: -2, d: 6, frente: -1, st: "DVVVRVVV" }, { zc: -10.5, d: 7, frente: 1, st: "VDVVDVDR" }];
  const INICIOS = [0, 1, 2, 3, 4, 9, 1, 2, 0, 3, 9, 2, 4, 1, 9, 3, 0, 2, 9, 4, 1, 3];
  const ALVOS_VISTA = { "Lago": [37, 0.6, -2], "Mata nativa": [0, 1.4, -36], "Praça da entrada": [0, 0.3, 19.3] };
  function gerarLotes() {
    const lotes = []; let n = 0, v = 0;
    LOTE_FILAS.forEach((f, fi) => LOTE_X.forEach((x, xi) => {
      n++;
      const s = f.st[xi], status = s === "V" ? "vendido" : s === "R" ? "reservado" : "disponivel";
      const vista = x === 20.5 ? "Lago" : fi === 3 ? "Mata nativa" : fi === 0 && Math.abs(x) === 5.5 ? "Praça da entrada" : "Rua interna";
      const esquina = Math.abs(x) === 5.5 || Math.abs(x) === 20.5;
      const area = Math.round(4.6 * 3 * f.d * 3);
      const pm2 = 1250 * (vista === "Lago" ? 1.25 : vista === "Mata nativa" ? 1.15 : vista === "Praça da entrada" ? 1.05 : 1) * (esquina ? 1.06 : 1);
      const inicio = status === "vendido" ? (n === MEU_LOTE ? 2 : INICIOS[v++ % INICIOS.length]) : 99;
      lotes.push({ id: n, x, zc: f.zc, d: f.d, frente: f.frente, status, vista, esquina, area, pm2: Math.round(pm2), preco: Math.round((area * pm2) / 1000) * 1000, inicio, estilo: n % 3 === 0 ? "telhado" : "moderna", cor: [0xe9e4da, 0xcfc6b8, 0xd9d4cc, 0xbdb5a8][n % 4] });
    }));
    return lotes;
  }
  const estagio = (l, k) => (l.status !== "vendido" || l.inicio >= 9 ? 0 : clamp(Math.floor(k - l.inicio), 0, 5));
  const ESTAGIOS = ["Lote vendido", "Fundação", "Paredes", "Telhado", "Acabamento", "Pronta"];
  const DEPS = [
    { id: "portaria", n: "Portaria 24h", d: "Controle de acesso com clausura para pedestres e veículos.", x: 4, z: 21.6, por: "muro", lim: 60, w: 6, dd: 3 },
    { id: "quadra", n: "Quadra poliesportiva", d: "Futsal, vôlei e basquete, com alambrado.", x: -16, z: -18, por: "clube", lim: 20, w: 6.4, dd: 3.8 },
    { id: "quiosque", n: "Espaço gourmet", d: "Três quiosques com churrasqueira ao lado da quadra.", x: -21.6, z: -18, por: "clube", lim: 35, w: 3, dd: 5 },
    { id: "clube", n: "Clube social", d: "Salão de festas, brinquedoteca e academia coberta.", x: 0, z: -18.2, por: "clube", lim: 40, w: 7, dd: 4.6 },
    { id: "piscina", n: "Piscinas adulto e infantil", d: "Raia de 15 m, deck molhado e solário.", x: -7, z: -18, por: "clube", lim: 50, w: 7, dd: 3.4 },
    { id: "tenis", n: "Quadra de tênis", d: "Piso de saibro com iluminação noturna.", x: 15.5, z: -18, por: "clube", lim: 60, w: 5.8, dd: 3.4 },
    { id: "play", n: "Playground", d: "Brinquedos com piso emborrachado.", x: 8, z: -18, por: "clube", lim: 80, w: 3, dd: 2.6 },
    { id: "academia", n: "Academia ao ar livre", d: "Aparelhos de ginástica junto ao playground.", x: 10.7, z: -18, por: "clube", lim: 85, w: 1.8, dd: 2.2 },
    { id: "praca", n: "Praça de entrada", d: "Jardins, bancos e espelho d'água logo após a portaria.", x: 0, z: 19.3, por: "clube", lim: 90, w: 13, dd: 2.6 },
    { id: "pet", n: "Pet place", d: "Área cercada para os cães, com obstáculos.", x: 22, z: -18.5, por: "clube", lim: 95, w: 3.2, dd: 2.8 },
    { id: "deck", n: "Deck do lago e trilha", d: "Píer sobre o lago e pista de caminhada de 1,2 km na margem.", x: 27.6, z: 0, por: "clube", lim: 100, w: 3.4, dd: 8 },
  ];
  const ARREDORES = [
    { n: "Acesso à rodovia", km: 1.5, min: 3, x: 10, z: 40, c: 0x5cc9ea, cor: "var(--cyan)" },
    { n: "Escola Municipal Recanto", km: 2.1, min: 5, x: -30, z: 34, c: 0x5cc9ea, cor: "var(--cyan)" },
    { n: "Supermercado Bom Dia", km: 3.2, min: 6, x: -44, z: 22, c: 0x4dc48c, cor: "var(--green)" },
    { n: "Parque Estadual · trilhas", km: 4, min: 8, x: 30, z: -46, c: 0x4dc48c, cor: "var(--green)" },
    { n: "Colégio Saber (particular)", km: 5.8, min: 10, x: -50, z: -6, c: 0x5cc9ea, cor: "var(--cyan)" },
    { n: "UPA 24h", km: 6.5, min: 11, x: -38, z: 48, c: 0xf06262, cor: "var(--red)" },
    { n: "Centro da cidade", km: 8, min: 13, x: -56, z: 52, c: 0xe6b85c, cor: "var(--gold)" },
    { n: "Shopping Regional", km: 14, min: 19, x: 52, z: 40, c: 0xe2805c, cor: "var(--terra-2)" },
  ];
  const NOMES = ["José", "Antônio", "Francisco", "Carlos", "Paulo", "Pedro", "Lucas", "Luiz", "Marcos", "Gabriel", "Daniel", "Marcelo", "Bruno", "Eduardo", "Felipe", "Raimundo", "Sebastião", "Jorge", "Ricardo", "André", "Fernando", "Rodrigo", "Fábio", "Diego", "Leandro", "Thiago", "Wellington", "Edson", "Valdir", "Cícero", "Geraldo", "Manoel", "Severino", "Josué", "Renato", "Adriano", "Mateus", "Vinícius", "Júlio", "Ronaldo", "Gilberto", "Benedito", "Reinaldo", "Hélio"];
  const SOBRE = ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Ferreira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Carvalho", "Araújo", "Ribeiro", "Gomes", "Barbosa", "Rocha", "Dias", "Moreira", "Cardoso", "Mendes", "Freitas", "Batista", "Vieira"];
  const FIXOS = { jardim: { eng: "Paula Ribeiro", mestre: "Raimundo Lopes", seg: "Juliana Prado", alm: "Patrícia Gomes" }, aurora: { eng: "Carla Menezes", mestre: "José Carlos Andrade", seg: "Renata Faria", alm: "Márcia Lima" }, mirante: { eng: "Bruno Teixeira", mestre: "Sebastião Nunes", seg: "Camila Rocha", alm: "Edson Moura" }, reserva: { eng: "Marina Duarte", mestre: "Valdir Souza", seg: "Tatiane Lopes", alm: "Rogério Pires" } };
  const CAPACETE = { "#F2F2EE": "branco", "#3FA86A": "verde", "#2F6FD6": "azul", "#E07A2E": "laranja", "#E2453A": "vermelho", "#F2C230": "amarelo" };
  const qtdFuncao = (o, f) => (["eng", "mestre", "seg", "grua", "sin", "alm"].includes(f.id) ? f.q : Math.max(1, Math.round(f.q * o.escala)));
  function gerarFuncionarios(o) {
    const r = rng(hashStr(o.id)), lista = []; let n = 0;
    FUNCOES.forEach((f) => {
      if ((o.id === "jardim" || isC(o)) && (f.id === "grua" || f.id === "sin")) return;
      for (let k = 0; k < qtdFuncao(o, f); k++) {
        n++;
        const nome = FIXOS[o.id][f.id] && k === 0 ? FIXOS[o.id][f.id] : `${NOMES[Math.floor(r() * NOMES.length)]} ${SOBRE[Math.floor(r() * SOBRE.length)]}`;
        const sorte = r(), status = sorte < 0.9 ? "presente" : sorte < 0.95 ? "falta" : sorte < 0.98 ? "ferias" : "afastado";
        const trein = [["NR-18 · Segurança no canteiro", 6 + Math.floor(r() * 18)], ["NR-06 · Uso de EPI", Math.floor(r() * 14) - 1]];
        if (f.altura) trein.push(["NR-35 · Trabalho em altura", Math.floor(r() * 20) - 2]);
        if (f.id === "ele") trein.push(["NR-10 · Segurança em eletricidade", Math.floor(r() * 18)]);
        if (f.id === "grua" || f.id === "sin") trein.push(["NR-11 · Movimentação de cargas", Math.floor(r() * 16)]);
        const epis = [[`Capacete (${CAPACETE[f.hat]})`], ["Botina de segurança"], ["Luva de vaqueta"], ["Óculos de proteção"], ["Protetor auricular"]];
        if (f.altura) epis.push(["Cinto paraquedista"]);
        if (["seg", "sin", "fach", "serv"].includes(f.id)) epis.push(["Colete refletivo"]);
        const presenca = [0, 1, 2, 3, 4, 5].map((d) => (status === "ferias" || status === "afastado" ? -1 : d === 5 ? (r() < 0.4 ? 1 : 0) : status === "falta" && d === 4 ? -2 : r() < 0.96 ? 1 : -2));
        lista.push({ id: `${o.id}-${String(n).padStart(3, "0")}`, mat: `${o.id.slice(0, 3).toUpperCase()}-${100 + n}`, nome, funcao: f.id, status, admissao: -Math.floor(r() * (Math.abs(o.inicio) + 6)) - 1, salario: Math.round((f.sal * (0.92 + r() * 0.16)) / 50) * 50, horas: 176 + Math.floor(r() * 24), extras: Math.floor(r() * 18), aso: Math.floor(r() * 14) - 1, trein: trein.map(([t, m]) => ({ t, m })), epis: epis.map(([e]) => ({ e, dias: -Math.floor(r() * 160) - 3, ca: String(10000 + Math.floor(r() * 39000)) })), presenca });
      }
    });
    return lista;
  }
  const EQUIP_BASE = [
    { id: "q1", n: "Grua torre · lança 50 m", tipo: "grua", posse: "Próprio", obra: "aurora", status: "uso", custo: 36000, hor: 3420, man: "Revisão em 80 h" },
    { id: "q2", n: "Grua torre · lança 45 m", tipo: "grua", posse: "Alugado", obra: "mirante", status: "uso", custo: 38000, hor: 1210, man: "Revisão em 290 h" },
    { id: "q3", n: "Caminhão betoneira 8 m³", tipo: "betoneira", posse: "Terceiro", obra: "aurora", status: "uso", custo: 0, hor: null, man: "Concreteira · concretagem da próxima laje hoje" },
    { id: "q4", n: "Caminhão basculante 14 m³", tipo: "basculante", posse: "Próprio", obra: "jardim", status: "uso", custo: 14500, hor: 8840, man: "Troca de óleo em 600 km" },
    { id: "q5", n: "Escavadeira hidráulica 20 t", tipo: "escavadeira", posse: "Alugado", obra: "mirante", status: "uso", custo: 42000, hor: 2630, man: "Revisão em 120 h" },
    { id: "q6", n: "Trator de esteira", tipo: "trator", posse: "Próprio", obra: "jardim", status: "uso", custo: 21000, hor: 6120, man: "Esteira com desgaste · avaliar" },
    { id: "q7", n: "Caminhão munck 10 t", tipo: "munck", posse: "Próprio", obra: "patio", status: "manutencao", custo: 16800, hor: 11200, man: "Troca do cabo de aço · volta em 3 dias" },
    { id: "q8", n: "Plataforma elevatória tesoura", tipo: "tesoura", posse: "Alugado", obra: "jardim", status: "uso", custo: 6900, hor: 410, man: "Em dia" },
    { id: "q9", n: "Elevador de obra cremalheira", tipo: "elevador", posse: "Alugado", obra: "aurora", status: "uso", custo: 12400, hor: 1980, man: "Inspeção NR-18 em 9 dias" },
    { id: "q10", n: "Gerador 150 kVA", tipo: "gerador", posse: "Próprio", obra: "mirante", status: "uso", custo: 5200, hor: 2310, man: "Troca de filtro em 40 h" },
    { id: "q11", n: "Betoneira 400 L", tipo: "bet400", posse: "Próprio", obra: "aurora", status: "uso", custo: 450, hor: null, man: "Em dia" },
    { id: "q12", n: "Betoneira 400 L", tipo: "bet400", posse: "Próprio", obra: "jardim", status: "disponivel", custo: 450, hor: null, man: "Em dia" },
    { id: "q13", n: "Compactador de solo", tipo: "compactador", posse: "Próprio", obra: "patio", status: "disponivel", custo: 380, hor: 940, man: "Em dia" },
    { id: "q14", n: "Retroescavadeira", tipo: "retro", posse: "Alugado", obra: "reserva", status: "uso", custo: 24000, hor: 5120, man: "Abrindo valas da rede de esgoto" },
    { id: "q15", n: "Rolo compactador de asfalto", tipo: "rolo", posse: "Alugado", obra: "reserva", status: "uso", custo: 19800, hor: 860, man: "Em dia" },
    { id: "q16", n: "Caminhão basculante 10 m³", tipo: "basculante", posse: "Próprio", obra: "reserva", status: "uso", custo: 13200, hor: 5400, man: "Pneus trocados há 2 semanas" },
    { id: "q17", n: "Betoneira 400 L", tipo: "bet400", posse: "Próprio", obra: "reserva", status: "uso", custo: 450, hor: null, man: "Em dia" },
  ];
  const INSUMOS_BASE = [
    { id: "cim", n: "Cimento CP-II 50 kg", un: "sacos", est: 420, min: 300, sem: 260, lote: 50 }, { id: "aco", n: "Aço CA-50", un: "t", est: 8.4, min: 6, sem: 3.1, lote: 2 },
    { id: "blo", n: "Bloco cerâmico 14x19x29", un: "milheiros", est: 18, min: 12, sem: 9, lote: 4 }, { id: "are", n: "Areia média", un: "m³", est: 22, min: 15, sem: 14, lote: 8 },
    { id: "bri", n: "Brita 1", un: "m³", est: 30, min: 20, sem: 12, lote: 8 }, { id: "arg", n: "Argamassa de assentamento", un: "sacos", est: 180, min: 200, sem: 140, lote: 40 },
    { id: "rev", n: "Revestimento de fachada", un: "peças", est: 1240, min: 800, sem: 380, lote: 200 }, { id: "elt", n: "Eletroduto corrugado 25 mm", un: "rolos", est: 34, min: 20, sem: 6, lote: 10 },
  ];
  const INSUMOS_C = [{ id: "cbuq", n: "Asfalto CBUQ", un: "t", est: 46, min: 60, sem: 38, lote: 20 }, { id: "tub", n: "Tubo PVC esgoto 150 mm", un: "barras", est: 120, min: 80, sem: 30, lote: 20 }, { id: "tel", n: "Telha cerâmica", un: "milheiros", est: 6, min: 4, sem: 1.5, lote: 2 }];
  const FERR_BASE = [
    { n: "Martelete rompedor", tot: 3, uso: 2, man: 0 }, { n: "Furadeira de impacto", tot: 8, uso: 6, man: 1 }, { n: "Serra circular", tot: 6, uso: 4, man: 0 },
    { n: "Vibrador de concreto", tot: 4, uso: 2, man: 1 }, { n: "Nível a laser", tot: 2, uso: 1, man: 0 }, { n: "Máquina de solda", tot: 3, uso: 2, man: 0 },
    { n: "Esmerilhadeira", tot: 7, uso: 5, man: 0 }, { n: "Policorte", tot: 2, uso: 1, man: 1 }, { n: "Andaime (módulos)", tot: 60, uso: 48, man: 0 },
  ];
  const EPI_BASE = [
    { id: "cap", n: "Capacete de segurança", est: 24, min: 15, ca: "31469", lote: 10 }, { id: "bot", n: "Botina de segurança", est: 14, min: 20, ca: "42291", lote: 10 },
    { id: "luv", n: "Luva de vaqueta", est: 60, min: 40, ca: "37808", lote: 20 }, { id: "ocu", n: "Óculos de proteção", est: 35, min: 20, ca: "11268", lote: 10 },
    { id: "pro", n: "Protetor auricular", est: 200, min: 100, ca: "29176", lote: 50 }, { id: "cin", n: "Cinto paraquedista NR-35", est: 6, min: 10, ca: "35529", lote: 5 },
    { id: "pff", n: "Máscara PFF2", est: 80, min: 60, ca: "46124", lote: 20 }, { id: "col", n: "Colete refletivo", est: 12, min: 10, ca: "38455", lote: 5 },
  ];
  function seed() {
    const obras = OBRAS_BASE.map((b) => { const o = structuredClone(b); o.updates.forEach((u) => (u.fund = true)); return o; });
    const S = { obras, equip: structuredClone(EQUIP_BASE), insumos: {}, epi: {}, ferr: {}, func: {}, mov: [], lotes: gerarLotes() };
    obras.forEach((o) => {
      const k = o.escala, r = rng(hashStr(o.id + "m"));
      const base = isC(o) ? [...INSUMOS_BASE.filter((i) => i.id !== "rev"), ...INSUMOS_C] : INSUMOS_BASE;
      S.insumos[o.id] = base.map((i) => ({ ...i, est: +(i.est * k * (0.7 + r() * 0.6)).toFixed(i.est < 50 ? 1 : 0), min: +(i.min * k).toFixed(i.min < 50 ? 1 : 0), sem: +(i.sem * k * (o.id === "jardim" && ["aco", "blo"].includes(i.id) ? 0.1 : 1)).toFixed(1) }));
      S.epi[o.id] = EPI_BASE.map((e) => ({ ...e, est: Math.round(e.est * k * (0.8 + r() * 0.4)), min: Math.round(e.min * k) }));
      S.ferr[o.id] = FERR_BASE.map((f) => ({ ...f, tot: Math.max(1, Math.round(f.tot * k)), uso: Math.max(0, Math.round(f.uso * k)) }));
      S.func[o.id] = gerarFuncionarios(o);
    });
    S.epi.aurora.find((e) => e.id === "cin").est = 4;
    return S;
  }
  let D = seed();
  const ui = { apMode: "planta", apRoom: null, pessoas: true, cotas: true, noite: false, persp: "comprador", compra: "aurora", tab: null, obraId: "aurora", viewIdx: null, novo: false, meuApe: true, moveis: true, room: null, pico: true, trips: [], tripSel: null, upload: null, rascunho: null, bonecos: true, funcaoSel: null, empSel: null, ficha: null, busca: "", filtroSt: "todos", matAba: "equip", frota: false, equipSel: null, transf: null, loteSel: null, filtroLote: "todos", vista: null, depSel: null, poiSel: null };
  const obraAtiva = () => D.obras.find((o) => o.id === ui.obraId);
  const obraPorId = (id) => D.obras.find((o) => o.id === id);
  const atualDe = (o) => o.updates[o.updates.length - 1];
  const vista = () => { const o = obraAtiva(); return ui.viewIdx == null ? atualDe(o) : o.updates[ui.viewIdx]; };
  const lotesVendidos = () => D.lotes.filter((l) => l.status === "vendido");
  const casasPct = (k) => { const v = lotesVendidos(); return (v.reduce((s, l) => s + estagio(l, k), 0) / (v.length * 5)) * 100; };
  const contaCasas = (k) => { const e = lotesVendidos().map((l) => estagio(l, k)); return { obra: e.filter((x) => x > 0 && x < 5).length, prontas: e.filter((x) => x === 5).length }; };
  function avancoDe(o, s) {
    if (isC(o)) return Math.round(s.terra * 0.08 + s.ruas * 0.2 + s.muro * 0.07 + s.clube * 0.15 + casasPct(s.k) * 0.43 + Math.max(0, s.clube - 60) * 0.07);
    const f = o.cfg.floors; return Math.round((s.fund ? 8 : 0) + (s.E / f) * 36 + (s.A / f) * 20 + (s.F / f) * 16 + (s.F / f) * 5);
  }
  const avanco = (s) => avancoDe(obraAtiva(), s);
  const entregaDe = (o) => mesRel(o.entrega);
  function orcDe(o) {
    const s = atualDe(o), dur = o.entrega - o.inicio, tempo = Math.min(1, -o.inicio / dur);
    let pct, pesos;
    if (isC(o)) { pesos = PESOS_C; pct = [s.terra, s.ruas, s.muro, s.clube, casasPct(s.k), Math.max(0, (s.clube - 60) * 2.5), tempo * 100]; }
    else { const f = o.cfg.floors; pesos = PESOS; pct = [100, (s.E / f) * 100, (s.A / f) * 100, (s.F / f) * 100, Math.min(100, (s.A / f) * 28), Math.max(0, (s.F / f - 0.7) * 60), tempo * 100]; }
    const datas = [[o.inicio, o.inicio + 2], [o.inicio + 2, Math.round(o.inicio + 2 + dur * 0.55)], [o.inicio + 5, Math.round(o.inicio + dur * 0.75)], [o.inicio + 7, Math.round(o.inicio + dur * 0.85)], [o.inicio + 9, o.entrega - 2], [Math.round(o.inicio + dur * 0.6), o.entrega], [o.inicio, o.entrega]];
    return pesos.map(([n, w], i) => { const orc = o.total * w, p = orc * (1 + o.desv[i]), pc = Math.round(clamp(pct[i], 0, 100)); return { n, o: orc, r: (p * pc) / 100, p, pct: pc, ini: datas[i][0], fim: datas[i][1] }; });
  }
  const totaisDe = (o) => { const e = orcDe(o); return { o: e.reduce((s, x) => s + x.o, 0), r: e.reduce((s, x) => s + x.r, 0), p: e.reduce((s, x) => s + x.p, 0) }; };
  const funcDe = (o) => D.func[o.id];
  const folhaDe = (o) => funcDe(o).reduce((s, p) => s + p.salario * ENCARGOS, 0);
  const presentesDe = (o) => funcDe(o).filter((p) => p.status === "presente").length;
  function ondeTrabalha(o, f) {
    const s = atualDe(o);
    if (isC(o)) return { arm: "Clube · estrutura", carp: "Clube · estrutura e telhados", ped: "Casas em alvenaria", fach: "Casas em pintura", ele: "Redes e casas", enc: "Redes de água e esgoto", alm: "Almoxarifado", eng: "Canteiro e escritório", mestre: "Todas as frentes", seg: "Ronda no condomínio", serv: "Todas as frentes" }[f];
    const fl = o.cfg.floors;
    return { arm: s.E < fl ? `Laje ${s.E + 1}` : "Estrutura concluída", carp: s.E < fl ? `Laje ${s.E + 1}` : "Estrutura concluída", ped: s.A < s.E ? `Alvenaria · ${s.A}º andar` : s.A >= fl ? "Reboco interno" : "Aguardando estrutura", fach: s.F < s.A ? `Fachada · ${s.F}º andar` : "Aguardando alvenaria", ele: "Instalações internas", enc: "Instalações internas", grua: "Cabine da grua", sin: "Base da grua", alm: "Almoxarifado", eng: "Canteiro e escritório", mestre: "Todas as frentes", seg: "Ronda no canteiro", serv: "Todas as frentes" }[f];
  }
  const treinoSt = (m) => (m < 0 ? "bad" : m < 2 ? "warn" : "ok");
  const alertasPessoa = (p) => { const a = []; if (p.aso < 0) a.push("ASO vencido"); else if (p.aso < 1) a.push("ASO vence este mês"); p.trein.forEach((t) => { if (t.m < 0) a.push(`${t.t.split(" · ")[0]} vencida`); }); return a; };
  const diasEstoque = (i) => (i.sem > 0 ? Math.floor(i.est / (i.sem / 7)) : 999);
  const stEstoque = (i) => (i.est < i.min * 0.6 || (i.sem && diasEstoque(i) < 5) ? "bad" : i.est < i.min ? "warn" : "ok");
  const resumoObra = (o, s) => (isC(o) ? (() => { const c = contaCasas(s.k); return `${c.obra} casas em obra · ${c.prontas} pronta${c.prontas === 1 ? "" : "s"}`; })() : `${s.E} de ${o.cfg.floors} lajes`);

  // ---------- Motor 3D ----------
  const canvas = $("#gl"), vp = $("#viewport"), labelsBox = $("#labels");
  const T = window.THREE;
  if (!T) { $("#loading").textContent = "Não foi possível carregar o 3D neste navegador."; return; }
  // Modo leve para celular e tablet: menos pixels, sombras menores e 30 quadros por segundo.
  const LEVE = matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 768;
  const SOMBRA = LEVE ? 1024 : 2048;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: LEVE ? "low-power" : "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LEVE ? 1.5 : 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = LEVE ? T.PCFShadowMap : T.PCFSoftShadowMap;
  // Se o celular derrubar o 3D por falta de memória, avisa em vez de congelar a tela.
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); const m = document.createElement("button"); m.className = "gl-perdido mono"; m.type = "button"; m.textContent = "O celular pausou o 3D para economizar memória. Toque para recarregar."; m.onclick = () => location.reload(); vp.appendChild(m); });
  let envTex = null;
  try { envTex = new T.PMREMGenerator(renderer).fromScene(new T.RoomEnvironment(), 0.04).texture; } catch { envTex = null; }
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  function tex(w, h, draw, rep = [1, 1]) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = maxAniso; return t;
  }
  const rnd = rng(11);
  const ruido = (g, w, h, n, a, cores) => { for (let i = 0; i < n; i++) { g.fillStyle = cores[Math.floor(rnd() * cores.length)]; g.globalAlpha = a * rnd(); const s = 1 + rnd() * 3; g.fillRect(rnd() * w, rnd() * h, s, s); } g.globalAlpha = 1; };
  const linhas = (g, w, h, passoX, passoY, cor) => { g.strokeStyle = cor; for (let y = 0; y <= h; y += passoY) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); } for (let x = 0; x <= w; x += passoX) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); } };
  const TX = {
    terra: tex(64, 256, (g, w, h) => { g.fillStyle = "#8c3c27"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { g.fillStyle = "rgba(60,18,10,.45)"; g.fillRect(x, 0, 2, h); g.fillStyle = "rgba(200,110,80,.25)"; g.fillRect(x + 3, 0, 1, h); } for (let y = 0; y < h; y += 64) { g.fillStyle = "rgba(40,12,6,.5)"; g.fillRect(0, y, w, 1); } ruido(g, w, h, 900, 0.35, ["#5d2416", "#b0583c", "#7a3220"]); }),
    conc: tex(256, 256, (g, w, h) => { g.fillStyle = "#8f8d88"; g.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(60,58,55,.07)" : "rgba(210,208,200,.07)"; g.beginPath(); g.arc(rnd() * w, rnd() * h, 6 + rnd() * 34, 0, 7); g.fill(); } linhas(g, w, h, 64, 128, "rgba(55,53,50,.35)"); g.fillStyle = "rgba(40,38,36,.55)"; for (let x = 32; x < w; x += 64) for (let y = 32; y < h; y += 64) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); } ruido(g, w, h, 2400, 0.3, ["#6c6a66", "#b3b1ab"]); }, [2, 2]),
    branco: tex(128, 128, (g, w, h) => { g.fillStyle = "#e9e6df"; g.fillRect(0, 0, w, h); ruido(g, w, h, 1500, 0.18, ["#cfcac0", "#ffffff"]); }),
    tijolo: tex(256, 256, (g, w, h) => { g.fillStyle = "#cfc8bb"; g.fillRect(0, 0, w, h); for (let r = 0; r < h / 16; r++) for (let c = -1; c < w / 48 + 1; c++) { const x = c * 48 + (r % 2 ? 24 : 0), y = r * 16, t = rnd(); g.fillStyle = `rgb(${150 + t * 40},${62 + t * 22},${42 + t * 14})`; g.fillRect(x + 1.5, y + 1.5, 45, 13); } ruido(g, w, h, 1600, 0.25, ["#5a2414", "#d58a62"]); }, [2, 2]),
    bloco: tex(256, 128, (g, w, h) => { g.fillStyle = "#9b9389"; g.fillRect(0, 0, w, h); for (let r = 0; r < h / 32; r++) for (let c = -1; c < w / 64 + 1; c++) { const x = c * 64 + (r % 2 ? 32 : 0), y = r * 32, tone = 150 + Math.floor(rnd() * 35); g.fillStyle = `rgb(${tone + 40},${tone - 40},${tone - 85})`; g.fillRect(x + 2, y + 2, 60, 28); g.fillStyle = "rgba(70,30,10,.25)"; for (let k = 0; k < 4; k++) g.fillRect(x + 8 + k * 13, y + 9, 9, 12); } ruido(g, w, h, 900, 0.25, ["#6b3320", "#e09670"]); }, [3, 1]),
    compensado: tex(256, 256, (g, w, h) => { g.fillStyle = "#b9894d"; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(110,70,30,${0.08 + rnd() * 0.12})`; g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + rnd() * 10 - 5, w * 0.7, y + rnd() * 10 - 5, w, y); g.stroke(); } g.strokeStyle = "rgba(80,50,20,.6)"; g.strokeRect(0.5, 0.5, w - 1, h / 2); g.strokeRect(0.5, h / 2, w - 1, h / 2 - 1); }, [3, 3]),
    tela: tex(64, 64, (g, w, h) => { g.fillStyle = "rgba(20,70,45,.38)"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(60,150,95,.9)"; g.lineWidth = 2; for (let k = -w; k < w * 2; k += 8) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h, h); g.stroke(); g.beginPath(); g.moveTo(k, h); g.lineTo(k + h, 0); g.stroke(); } }, [8, 1]),
    tapume: tex(128, 64, (g, w, h) => { for (let x = 0; x < w; x += 8) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, "#9aa0a4"); gr.addColorStop(0.5, "#e6e8ea"); gr.addColorStop(1, "#8a9094"); g.fillStyle = gr; g.fillRect(x, 0, 8, h); } }, [10, 1]),
    chao: tex(256, 256, (g, w, h) => { g.fillStyle = "#4b4339"; g.fillRect(0, 0, w, h); ruido(g, w, h, 6000, 0.5, ["#3a332b", "#5d5447", "#6b6152", "#2f2a24"]); }, [5, 5]),
    calcada: tex(128, 128, (g, w, h) => { g.fillStyle = "#77746e"; g.fillRect(0, 0, w, h); linhas(g, w, h, 32, 32, "rgba(40,40,38,.5)"); }, [8, 1]),
    container: tex(256, 128, (g, w, h) => { g.fillStyle = "#c9cdd0"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 10) { g.fillStyle = "rgba(90,96,100,.35)"; g.fillRect(x, 0, 3, h); } g.fillStyle = "#1f2a33"; g.fillRect(30, 34, 60, 38); g.fillRect(150, 34, 60, 38); g.fillStyle = "#16181c"; g.font = "700 15px Arial"; g.fillText("ESCRITÓRIO DA OBRA", 70, 108); }),
    grama: tex(256, 256, (g, w, h) => { g.fillStyle = "#4d6a36"; g.fillRect(0, 0, w, h); ruido(g, w, h, 9000, 0.5, ["#3e5a2b", "#5c7b41", "#6a8a4a", "#44602f"]); }, [30, 30]),
    gramaLote: tex(128, 128, (g, w, h) => { g.fillStyle = "#5a7a3e"; g.fillRect(0, 0, w, h); ruido(g, w, h, 2500, 0.45, ["#4a6a31", "#6c8e4c"]); }, [2, 2]),
    asfalto: tex(256, 256, (g, w, h) => { g.fillStyle = "#2c2e32"; g.fillRect(0, 0, w, h); ruido(g, w, h, 5000, 0.35, ["#1f2024", "#3c3f44", "#4a4d52"]); }, [4, 4]),
    saibro: tex(128, 128, (g, w, h) => { g.fillStyle = "#b45f3b"; g.fillRect(0, 0, w, h); ruido(g, w, h, 2500, 0.35, ["#9a4e2f", "#c87650"]); }),
  };
  const bannerTex = (o) => tex(1024, 256, (g, w, h) => { g.fillStyle = "#16181c"; g.fillRect(0, 0, w, h); g.fillStyle = "#c55a3d"; g.fillRect(0, h - 18, w, 18); g.fillStyle = "#edebe7"; g.font = "700 84px Arial Narrow, Arial, sans-serif"; g.fillText(o.nome.toUpperCase(), 48, 112); g.fillStyle = "#9ba1ab"; g.font = "500 32px Arial, sans-serif"; g.fillText("Silva & Filhos Construções · acompanhe pelo Prumo", 50, 172); g.fillStyle = "#e6b85c"; g.font = "600 30px Arial, sans-serif"; g.fillText(`ENTREGA ${entregaDe(o).toUpperCase()}`, 50, 218); });

  const cenas = {};
  let ativa = null;
  function novaCena(nome, camPos, alvo, opts = {}) {
    const scene = new T.Scene(); if (envTex) scene.environment = envTex;
    const camera = new T.PerspectiveCamera(opts.fov || 38, 1, 0.1, 900); camera.position.set(...camPos);
    const controls = new T.OrbitControls(camera, canvas); controls.target.set(...alvo);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = opts.min || 6; controls.maxDistance = opts.max || 60; controls.maxPolarAngle = opts.polar || 1.45; controls.enabled = false;
    const c = { nome, scene, camera, controls, labels: [], tick: null, alvoAnim: null, camAnim: null, minPadrao: opts.min || 6 };
    controls.addEventListener("start", () => { controls.autoRotate = false; c.camAnim = null; });
    cenas[nome] = c; return c;
  }
  function luzes(scene, sombra = true) {
    scene.add(new T.HemisphereLight(0xe3ebf5, 0x2a2420, 0.45));
    const s = new T.DirectionalLight(0xffe7cc, 1.55); s.position.set(15, 30, 13);
    if (sombra) { s.castShadow = true; s.shadow.mapSize.set(SOMBRA, SOMBRA); Object.assign(s.shadow.camera, { left: -20, right: 20, top: 28, bottom: -14, near: 1, far: 140 }); s.shadow.bias = -0.0005; s.shadow.normalBias = 0.02; }
    scene.add(s);
    const rim = new T.DirectionalLight(0x9fbcff, 0.35); rim.position.set(-18, 10, -14); scene.add(rim);
    return s;
  }
  function label(c, html, pos, cls = "", show = () => true) {
    const el = document.createElement("div"); el.className = "lbl " + cls; el.innerHTML = html;
    const l = { el, pos: pos.clone ? pos.clone() : new T.Vector3(...pos), show };
    c.labels.push(l); if (ativa === c) labelsBox.appendChild(el); return l;
  }
  function removerLabel(c, l) { c.labels = c.labels.filter((x) => x !== l); l.el.remove(); }
  const box = (w, h, d, m, x = 0, y = 0, z = 0, sombra = true) => { const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); mesh.castShadow = sombra; mesh.receiveShadow = true; return mesh; };
  const cil = (r1, r2, h, m, x, y, z, seg = 16) => { const mesh = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg), m); mesh.position.set(x, y, z); mesh.castShadow = true; return mesh; };
  const mat = (color, o = {}) => new T.MeshStandardMaterial({ color, map: o.map || null, roughness: o.r ?? 0.85, metalness: o.m ?? 0, transparent: o.op != null, opacity: o.op ?? 1, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, depthWrite: o.dw ?? true, side: o.side ?? T.FrontSide });
  const FACES = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  function juntar(lista, m, faces = FACES, sombra = true) {
    const geos = [];
    faces.forEach((rot) => lista.forEach(([w, h, d, x, y, z]) => { const g = new T.BoxGeometry(w, h, d); g.translate(x, y, z); g.rotateY(rot); geos.push(g); }));
    const mesh = new T.Mesh(T.BufferGeometryUtils.mergeBufferGeometries(geos, false), m);
    geos.forEach((g) => g.dispose()); mesh.castShadow = sombra; mesh.receiveShadow = true; return mesh;
  }
  const contorno = (w, h, d, cor = 0x5cc9ea, op = 0.35) => new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w, h, d)), new T.LineBasicMaterial({ color: cor, transparent: true, opacity: op }));
  const M = {
    conc: mat(0xffffff, { map: TX.conc, r: 0.92 }), terra: mat(0xffffff, { map: TX.terra, r: 0.68 }), terraEsc: mat(0xb08070, { map: TX.terra, r: 0.75 }),
    branco: mat(0xffffff, { map: TX.branco, r: 0.7 }), tijolo: mat(0xffffff, { map: TX.tijolo, r: 0.9 }), granito: mat(0x3b3c40, { r: 0.35, m: 0.2 }),
    bloco: mat(0xffffff, { map: TX.bloco, r: 0.95 }), pod: mat(0xb5b2ac, { map: TX.conc, r: 0.9 }), escuro: mat(0x1b1c1f, { r: 0.45, m: 0.4 }),
    caixilho: mat(0x2a2c30, { r: 0.35, m: 0.8 }), caixBranco: mat(0xf0efec, { r: 0.4, m: 0.3 }), metal: mat(0x3a3d42, { r: 0.4, m: 0.85 }), lobby: mat(0x2b2116, { e: 0xffc27a, ei: 1.3 }),
    led: mat(0xffffff, { e: 0xfff1d6, ei: 2.2 }), compensado: mat(0xffffff, { map: TX.compensado, r: 0.8 }), aco: mat(0x6b4a33, { r: 0.6, m: 0.5 }),
    tela: mat(0xffffff, { map: TX.tela, op: 1, dw: false, side: T.DoubleSide, r: 1 }), grua: mat(0xe0a21c, { r: 0.55, m: 0.35 }), chao: mat(0xffffff, { map: TX.chao, r: 1 }),
    calcada: mat(0xffffff, { map: TX.calcada, r: 0.95 }), tapume: mat(0xffffff, { map: TX.tapume, r: 0.45, m: 0.6 }),
    container: mat(0xffffff, { map: TX.container, r: 0.6, m: 0.3 }), areia: mat(0xc9a878, { r: 1 }), arvore: mat(0x0f1f0b, { r: 1 }), tronco: mat(0x4a3628, { r: 1 }),
    amarelo: mat(0xe8b21c, { r: 0.5, m: 0.25 }), laranja: mat(0xe0702a, { r: 0.5, m: 0.2 }), brancoV: mat(0xe9eaec, { r: 0.4, m: 0.3 }), pneu: mat(0x141414, { r: 0.9 }), verde: mat(0x2f6b4a, { r: 0.6, m: 0.3 }),
    grama: mat(0xffffff, { map: TX.grama, r: 1 }), gramaLote: mat(0xffffff, { map: TX.gramaLote, r: 1 }), asfalto: mat(0xffffff, { map: TX.asfalto, r: 0.9 }), terraBatida: mat(0x7a6650, { map: TX.chao, r: 1 }),
    muro: mat(0xd8d3ca, { map: TX.branco, r: 0.85 }), madeira: mat(0x7a5638, { r: 0.7 }), telha: mat(0x9a4a32, { map: TX.terra, r: 0.75 }), saibro: mat(0xffffff, { map: TX.saibro, r: 0.95 }),
    quadra: mat(0x2f6c8f, { r: 0.7 }), linhaB: mat(0xf2f2ee, { r: 0.6 }), borracha: mat(0x3a7d5a, { r: 0.9 }), vermelho: mat(0xc0392b, { r: 0.5 }), azul: mat(0x2f6fd6, { r: 0.5 }),
    agua: new T.MeshPhysicalMaterial({ color: 0x2c8fb0, roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9, envMapIntensity: 1.5 }),
    lago: new T.MeshPhysicalMaterial({ color: 0x1d4a60, roughness: 0.18, metalness: 0.1, clearcoat: 0.6, envMapIntensity: 0.55 }),
    vidroCab: new T.MeshPhysicalMaterial({ color: 0x223744, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.7 }),
    vidro: new T.MeshPhysicalMaterial({ color: 0x24353f, roughness: 0.06, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.86, envMapIntensity: 1.6 }),
    vidroAzul: new T.MeshPhysicalMaterial({ color: 0x2e5367, roughness: 0.04, metalness: 0.25, clearcoat: 1, transparent: true, opacity: 0.84, envMapIntensity: 1.8 }),
    gradeVidro: new T.MeshPhysicalMaterial({ color: 0xbfd8e6, roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }),
    alambrado: mat(0x9aa3ad, { op: 0.35, dw: false, side: T.DoubleSide, m: 0.6 }),
    base: new T.MeshPhysicalMaterial({ color: 0xb8c6d2, roughness: 0.05, transparent: true, opacity: 0.16, envMapIntensity: 1.2 }),
  };
  // copa de árvore: vários volumes irregulares fundidos
  const COPA = (() => {
    const r = rng(99), gs = [];
    for (let i = 0; i < 8; i++) {
      let g = new T.IcosahedronGeometry(0.4 + r() * 0.2, 2); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = T.BufferGeometryUtils.mergeVertices(g, 1e-4);
      const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const f = 0.85 + r() * 0.3; p.setXYZ(k, p.getX(k) * f, p.getY(k) * f * 0.9, p.getZ(k) * f); }
      const a = r() * 6.28, d = i ? 0.3 + r() * 0.22 : 0; g.translate(Math.cos(a) * d, i ? r() * 0.45 - 0.05 : 0.2, Math.sin(a) * d); gs.push(g);
    }
    const m = T.BufferGeometryUtils.mergeBufferGeometries(gs); m.computeVertexNormals(); return m;
  })();
  const OUT = { disponivel: new T.LineBasicMaterial({ color: 0x4dc48c }), reservado: new T.LineBasicMaterial({ color: 0xe6b85c }), vendido: new T.LineBasicMaterial({ color: 0x9ba1ab, transparent: true, opacity: 0.5 }), sel: new T.LineBasicMaterial({ color: 0xe6b85c }), meu: new T.LineBasicMaterial({ color: 0xe6b85c }) };

  // ---------- Cena 1: as obras ----------
  const obra = novaCena("obra", [18, 12, 21], [0, 6.2, 0], { min: 9, max: 140 });
  obra.scene.fog = new T.Fog(0x15171b, 80, 200);
  const sol = luzes(obra.scene);
  const gridChao = new T.GridHelper(260, 260, 0x262b33, 0x1a1d22); gridChao.position.y = -0.5; obra.scene.add(gridChao);
  const PREDIOS = {};
  const novaParte = (B, g, cond, modo = "y", ordem = 0) => { g.scale.set(modo === "xyz" ? 0.001 : 1, 0.001, modo === "xyz" ? 0.001 : 1); g.visible = false; B.partes.push({ g, cond, modo, ordem, t: 0, alvo: 0, desde: 0 }); return g; };

  function construirPredio(o) {
    const { floors, pod: nPod, tw: TW, pw: PW, estilo } = o.cfg;
    const root = new T.Group(); obra.scene.add(root);
    const B = { o, root, partes: [], ghost: [], net: [], cfg: o.cfg, usados: 0 };
    const est = { terra: { pil: M.terra, faixa: M.terra, vidro: M.vidro, caix: M.caixilho, podM: M.pod }, branco: { pil: M.branco, faixa: M.branco, vidro: M.vidroAzul, caix: M.caixBranco, podM: M.granito }, tijolo: { pil: M.tijolo, faixa: M.caixBranco, vidro: M.vidro, caix: M.caixBranco, podM: M.tijolo } }[estilo];
    const disco = new T.Mesh(new T.CylinderGeometry(12.5, 12.5, 0.3, 120), M.base); disco.position.y = -0.17; disco.receiveShadow = true; root.add(disco);
    const aro = new T.Mesh(new T.TorusGeometry(12.5, 0.05, 8, 140), new T.MeshBasicMaterial({ color: 0xaebfce, transparent: true, opacity: 0.5 })); aro.rotation.x = Math.PI / 2; aro.position.y = -0.02; root.add(aro); B.discos = [disco, aro];
    root.add(box(30, 0.05, 4.2, M.asfalto, 0, -0.03, 10.85, false));
    root.add(box(15, 0.06, 15, M.chao, 0, -0.01, 0, false));
    root.add(box(15, 0.08, 1.3, M.calcada, 0, 0, 8.1, false));
    [-5.5, -2, 2, 5.5].forEach((x) => { root.add(box(0.07, 0.8, 0.07, M.tronco, x, 0.4, 8.2)); const c = new T.Mesh(COPA, M.arvore); c.position.set(x, 1.15, 8.2); c.scale.setScalar(0.62); c.rotation.y = x * 2; c.castShadow = true; c.receiveShadow = true; root.add(c); });
    const L = 7.3, hT = 0.8;
    root.add(box(14.6, hT, 0.05, M.tapume, 0, hT / 2, -L)); root.add(box(0.05, hT, 14.6, M.tapume, -L, hT / 2, 0)); root.add(box(0.05, hT, 14.6, M.tapume, L, hT / 2, 0));
    root.add(box(5.4, hT, 0.05, M.tapume, -4.6, hT / 2, L)); root.add(box(3.2, hT, 0.05, M.tapume, 5.7, hT / 2, L));
    const ban = new T.Mesh(new T.PlaneGeometry(4.6, 1.15), mat(0xffffff, { map: bannerTex(o), r: 0.6 })); ban.position.set(-4.6, 1.15, L + 0.04); root.add(ban);
    root.add(box(0.08, 1.75, 0.08, M.metal, -6.8, 0.87, L + 0.02)); root.add(box(0.08, 1.75, 0.08, M.metal, -2.4, 0.87, L + 0.02));
    root.add(box(2.6, 0.95, 0.85, M.container, 5.2, 0.48, -5.9));
    for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) root.add(box(0.5, 0.32, 0.5, M.bloco, -6.2 + k * 0.6, 0.16 + j * 0.32, 3.8));
    const areia = new T.Mesh(new T.ConeGeometry(0.8, 0.55, 24), M.areia); areia.position.set(-6.2, 0.28, 5.6); areia.castShadow = true; root.add(areia);
    for (let i = 0; i < floors; i++) {
      const pod = i < nPod, w = pod ? PW : TW, d = w;
      const andar = new T.Group(); andar.position.y = i * H; root.add(andar);
      const eg = new T.Group();
      eg.add(box(w, 0.16, d, M.conc, 0, 0.08, 0));
      const pil = []; [-1, 0, 1].forEach((a) => [-1, 0, 1].forEach((b) => { if (a || b) pil.push([0.28, H - 0.16, 0.28, a * (w / 2 - 0.22), 0.16 + (H - 0.16) / 2, b * (d / 2 - 0.22)]); }));
      eg.add(juntar(pil, M.conc, [0]));
      const alv = new T.Group(); alv.add(box(w - 0.8, H - 0.18, d - 0.8, M.bloco, 0, 0.16 + (H - 0.18) / 2, 0));
      const fac = new T.Group();
      if (pod) {
        fac.add(box(w + 0.1, H, d + 0.1, est.podM, 0, H / 2, 0));
        if (estilo !== "tijolo") { const aletas = []; for (let k = -3; k <= 3; k++) aletas.push([0.2, H, 0.5, k * (w / 7.2), H / 2, d / 2 + 0.22]); fac.add(juntar(aletas, est.podM, [Math.PI / 2, Math.PI, -Math.PI / 2])); }
        else fac.add(juntar([[w * 0.8, H * 0.5, 0.04, 0, H * 0.55, d / 2 + 0.06]], M.vidro, [Math.PI / 2, Math.PI, -Math.PI / 2], false));
        if (i === 0) {
          const hp = nPod * H;
          fac.add(box(3.0, hp, 0.8, est.podM, 0, hp / 2, d / 2 + 0.4));
          fac.add(box(2.3, hp - 0.22, 0.82, M.escuro, 0, (hp - 0.22) / 2, d / 2 + 0.42));
          const lobby = new T.Mesh(new T.PlaneGeometry(2.2, hp - 0.3), M.lobby); lobby.position.set(0, (hp - 0.3) / 2 + 0.01, d / 2 + 0.84); fac.add(lobby);
          const grade = []; for (let k = -10; k <= 10; k++) grade.push([0.025, hp - 0.28, 0.025, k * 0.105, (hp - 0.28) / 2, d / 2 + 0.86]);
          fac.add(juntar(grade, M.metal, [0], false));
          fac.add(box(2.2, 0.03, 0.06, M.led, 0, hp - 0.24, d / 2 + 0.84, false));
          if (nPod > 1) [-1, 1].forEach((sx) => fac.add(box(1.6, 2.9, 1.6, est.podM, sx * (w / 2 - 0.6), 1.45, d / 2 + 0.25)));
          for (let k = 0; k < 3; k++) fac.add(box(2.6 - k * 0.2, 0.06, 0.25, M.conc, 0, 0.03 + k * 0.06, d / 2 + 1.0 + (2 - k) * 0.2));
        }
      } else {
        fac.add(box(w - 0.08, H - 0.2, d - 0.08, est.vidro, 0, 0.16 + (H - 0.2) / 2, 0, false));
        const nb = Math.max(4, Math.round(w / 1.2)), passo = w / nb, pilastras = [], caix = [];
        for (let k = 0; k <= nb; k++) pilastras.push([estilo === "tijolo" ? 0.5 : 0.26, H, estilo === "tijolo" ? 0.14 : 0.38, -w / 2 + k * passo, H / 2, d / 2 + (estilo === "tijolo" ? 0.04 : 0.1)]);
        for (let k = 0; k < nb; k++) caix.push([0.035, H - 0.2, 0.05, -w / 2 + passo * (k + 0.5), 0.16 + (H - 0.2) / 2, d / 2 - 0.02]);
        caix.push([w, 0.035, 0.05, 0, 0.62, d / 2 - 0.02]);
        fac.add(juntar(pilastras, est.pil)); fac.add(juntar(caix, est.caix, FACES, false)); fac.add(juntar([[w + 0.4, 0.17, 0.3, 0, 0.085, d / 2 + 0.06]], est.faixa));
        if (estilo === "branco") { fac.add(juntar([[w * 0.72, 0.07, 0.75, 0, 0.12, d / 2 + 0.45]], M.branco, [0, Math.PI])); fac.add(juntar([[w * 0.72, 0.42, 0.03, 0, 0.37, d / 2 + 0.81]], M.gradeVidro, [0, Math.PI], false)); }
        if (i === floors - 1) {
          if (estilo === "terra") {
            const bw = passo - 0.26, r = bw / 2 - 0.05, hP = 0.62;
            const forma = new T.Shape(); forma.moveTo(-bw / 2, 0); forma.lineTo(-r, 0); forma.absarc(0, 0, r, Math.PI, 0, true); forma.lineTo(bw / 2, 0); forma.lineTo(bw / 2, hP); forma.lineTo(-bw / 2, hP); forma.lineTo(-bw / 2, 0);
            const geos = []; FACES.forEach((rot) => { for (let k = 0; k < nb; k++) { const g = new T.ExtrudeGeometry(forma, { depth: 0.3, bevelEnabled: false, curveSegments: 16 }); g.translate(-w / 2 + passo * (k + 0.5), H - hP, d / 2 - 0.08); g.rotateY(rot); geos.push(g); } });
            const arcos = new T.Mesh(T.BufferGeometryUtils.mergeBufferGeometries(geos, false), M.terra); arcos.castShadow = true; fac.add(arcos);
            fac.add(box(w + 0.46, 0.42, d + 0.46, M.terraEsc, 0, H + 0.21, 0));
          } else if (estilo === "branco") { fac.add(box(w + 0.42, 0.3, d + 0.42, M.branco, 0, H + 0.15, 0)); fac.add(box(w * 0.55, 0.8, d * 0.55, M.vidroAzul, 0, H + 0.7, 0)); fac.add(box(w * 0.6, 0.08, d * 0.6, M.branco, 0, H + 1.12, 0)); }
          else { fac.add(box(w + 0.2, 0.45, d + 0.2, M.tijolo, 0, H + 0.22, 0)); fac.add(box(w + 0.3, 0.06, d + 0.3, M.caixBranco, 0, H + 0.47, 0)); }
          fac.add(box(Math.min(1.6, w * 0.3), 0.5, 1.2, M.metal, w * 0.18, H + 0.3, -d * 0.12));
        }
      }
      const net = new T.Mesh(new T.BoxGeometry(w + 0.7, H, d + 0.7), M.tela); net.position.y = H / 2; net.visible = false; andar.add(net);
      const ghost = contorno(w, H, d, 0x5cc9ea, 0.3); ghost.position.y = H / 2; andar.add(ghost);
      [eg, alv, fac].forEach((g, k) => { andar.add(g); novaParte(B, g, (s) => i < (k === 0 ? s.E : k === 1 ? s.A : s.F), "y", i); });
      B.ghost.push(ghost); B.net.push(net);
    }
    const deck = new T.Group(); root.add(deck);
    deck.add(box(TW + 0.2, 0.05, TW + 0.2, M.compensado, 0, 0.025, 0));
    const ferro = [], nf = Math.floor(TW / 0.88); for (let k = -nf; k <= nf; k++) { ferro.push([TW - 0.3, 0.02, 0.02, 0, 0.07, k * 0.44]); ferro.push([0.02, 0.02, TW - 0.3, k * 0.44, 0.08, 0]); }
    deck.add(juntar(ferro, M.aco, [0], false));
    const escG = []; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) escG.push([0.04, H - 0.2, 0.04, a * (TW / 5.2) + 0.3, -(H - 0.2) / 2, b * (TW / 5.2) + 0.3]);
    deck.add(juntar(escG, M.metal, [0], false));
    B.deck = deck;
    const gon = new T.Group(); root.add(gon);
    gon.add(box(2.6, 0.05, 0.5, M.metal, 0, 0, 0)); gon.add(box(2.6, 0.03, 0.03, M.grua, 0, 0.36, 0.24, false)); gon.add(box(2.6, 0.03, 0.03, M.grua, 0, 0.36, -0.24, false));
    [-1.28, 1.28].forEach((x) => gon.add(box(0.03, 0.38, 0.5, M.grua, x, 0.19, 0, false)));
    const cabos = new T.LineSegments(new T.BufferGeometry().setAttribute("position", new T.Float32BufferAttribute([-1.1, 0, 0, -1.1, 10, 0, 1.1, 0, 0, 1.1, 10, 0], 3)), new T.LineBasicMaterial({ color: 0x222222 })); gon.add(cabos);
    B.gondola = { g: gon, cabos };
    if (D.equip.some((e) => e.tipo === "grua" && e.obra === o.id)) {
      const segGeos = []; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const g = new T.BoxGeometry(0.045, 1, 0.045); g.translate(a * 0.19, 0.5, b * 0.19); segGeos.push(g); });
      FACES.forEach((rot) => { const g = new T.BoxGeometry(0.03, 0.55, 0.03); g.rotateZ(0.6); g.translate(0, 0.5, 0.19); g.rotateY(rot); segGeos.push(g); const h2 = new T.BoxGeometry(0.38, 0.03, 0.03); h2.translate(0, 0.02, 0.19); h2.rotateY(rot); segGeos.push(h2); });
      const mastro = new T.InstancedMesh(T.BufferGeometryUtils.mergeBufferGeometries(segGeos, false), M.grua, floors + 6); mastro.castShadow = true;
      const grua = new T.Group(); grua.position.set(-TW / 2 - 2.3, 0, -TW / 2 - 1.5); grua.add(mastro); grua.add(box(1.2, 0.3, 1.2, M.conc, 0, 0.15, 0));
      const topo = new T.Group(); grua.add(topo);
      const lanca = [[11, 0.05, 0.05, 3.3, 0.38, 0], [11, 0.05, 0.05, 3.3, 0, 0.2], [11, 0.05, 0.05, 3.3, 0, -0.2]];
      for (let k = 0; k < 22; k++) lanca.push([0.03, 0.42, 0.03, -2.2 + k * 0.5, 0.19, k % 2 ? 0.1 : -0.1]);
      topo.add(juntar(lanca, M.grua, [0])); topo.add(box(1.6, 0.5, 0.8, M.conc, -2.6, -0.05, 0)); topo.add(box(0.75, 0.62, 0.62, M.escuro, 0.35, -0.42, 0.42)); topo.add(box(0.12, 1.5, 0.12, M.grua, 0, 0.95, 0));
      const tro = new T.Group(); topo.add(tro); tro.add(box(0.3, 0.12, 0.42, M.metal, 0, -0.05, 0));
      const cabo = box(0.02, 1, 0.02, M.escuro, 0, -0.5, 0, false); tro.add(cabo);
      const carga = new T.Group(); tro.add(carga);
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) carga.add(box(0.28, 0.2, 0.28, M.bloco, a * 0.3 - 0.15, 0.1, b * 0.3 - 0.15));
      carga.add(box(0.66, 0.05, 0.66, M.compensado, 0, -0.02, 0));
      root.add(grua);
      B.crane = { grua, mastro, topo, tro, cabo, carga, fase: hashStr(o.id) % 10 };
    }
    if (o.id === "aurora") {
      const ug = new T.Group(); ug.position.set(TW / 4 + 0.2, MEU_ANDAR * H + H / 2, TW / 4 + 0.2);
      const uBox = new T.Mesh(new T.BoxGeometry(TW / 2 + 0.5, H * 0.98, TW / 2 + 0.5), mat(0xe6b85c, { op: 0.2, dw: false, e: 0xe6b85c, ei: 0.5 }));
      ug.add(uBox, new T.LineSegments(new T.EdgesGeometry(uBox.geometry), new T.LineBasicMaterial({ color: 0xe6b85c }))); root.add(ug);
      B.unit = { g: ug, box: uBox };
      label(obra, "Seu apê · 1204", new T.Vector3(TW / 2 + 0.45, MEU_ANDAR * H + H + 0.2, TW / 2 + 0.45), "gold", () => ui.meuApe && ui.persp === "comprador" && ui.obraId === "aurora");
    }
    B.topLbl = label(obra, "", new T.Vector3(), "terra", () => ui.tab !== "carteira" && ui.obraId === o.id);
    B.nomeLbl = label(obra, "", new T.Vector3(), "terra", () => ui.tab === "carteira");
    B.slots = [[-4.4, 5.4, 0.35], [5.6, 2.2, -Math.PI / 2], [1.8, -6.0, Math.PI], [-6.0, -1.0, Math.PI / 2], [-2.4, -6.0, 0], [6.0, -3.2, -Math.PI / 2], [3.6, 5.6, 0.2]];
    PREDIOS[o.id] = B;
  }

  // ---------- Condomínio de casas ----------
  function modeloCasa(l) {
    const g = new T.Group(); const p = {};
    const pint = mat(l.cor, { map: TX.branco, r: 0.8 });
    p.piso = new T.Group(); p.piso.add(box(3.7, 0.1, 3.1, M.conc, 0, 0.05, 0));
    p.bloco = new T.Group(); p.bloco.add(box(2.6, 1.0, 2.6, M.bloco, -0.45, 0.6, -0.15)); p.bloco.add(box(1.05, 0.78, 1.7, M.bloco, 1.33, 0.49, 0.3));
    p.telhado = new T.Group();
    if (l.estilo === "telhado") {
      const forma = new T.Shape(); forma.moveTo(-1.55, 0); forma.lineTo(1.55, 0); forma.lineTo(0, 0.8); forma.lineTo(-1.55, 0);
      const geo = new T.ExtrudeGeometry(forma, { depth: 3.0, bevelEnabled: false }); geo.translate(0, 0, -1.5);
      const tel = new T.Mesh(geo, M.telha); tel.position.set(-0.45, 1.1, -0.15); tel.castShadow = true; p.telhado.add(tel);
      p.telhado.add(box(1.25, 0.1, 1.9, M.telha, 1.33, 0.93, 0.3));
    } else {
      p.telhado.add(box(2.95, 0.14, 2.95, M.branco, -0.45, 1.17, -0.15)); p.telhado.add(box(1.3, 0.12, 2.0, M.branco, 1.33, 0.94, 0.3));
      p.telhado.add(box(0.8, 0.28, 0.8, M.madeira, -0.9, 1.38, -0.5));
    }
    p.pint = new T.Group();
    p.pint.add(box(2.64, 1.0, 2.64, pint, -0.45, 0.6, -0.15)); p.pint.add(box(1.09, 0.78, 1.74, pint, 1.33, 0.49, 0.3));
    p.pint.add(box(1.4, 0.55, 0.03, M.vidro, -0.75, 0.72, 1.18, false)); p.pint.add(box(0.36, 0.7, 0.04, M.madeira, 0.35, 0.47, 1.18, false));
    p.pint.add(box(0.85, 0.6, 0.03, M.metal, 1.33, 0.4, 1.18, false)); p.pint.add(box(0.5, 1.0, 0.05, M.madeira, -1.55, 0.6, 1.18));
    p.extra = new T.Group();
    if (l.estilo === "moderna") p.extra.add(box(1.4, 0.05, 0.75, M.agua, -0.4, 0.06, -2.1));
    p.extra.add(box(0.55, 0.32, 1.0, mat([0x3b4a5c, 0x8a1f1f, 0xd9d9d9, 0x222222][l.id % 4], { r: 0.3, m: 0.6 }), 1.33, 0.26, 0.45));
    p.extra.add(box(0.7, 0.03, 1.6, M.calcada, 0.35, 0.03, 2.0, false));
    [[-1.6, 2.2], [1.7, -2.3]].forEach(([x, z]) => { p.extra.add(box(0.08, 0.5, 0.08, M.tronco, x, 0.25, z)); const c = new T.Mesh(new T.IcosahedronGeometry(0.42, 1), M.arvore); c.position.set(x, 0.75, z); c.castShadow = true; p.extra.add(c); });
    p.extra.add(box(0.12, 0.05, 0.12, M.led, 0.35, 0.95, 1.25, false));
    Object.values(p).forEach((x) => g.add(x));
    return { g, p };
  }
  function construirCondo(o) {
    const root = new T.Group(); obra.scene.add(root);
    const B = { o, root, partes: [], cfg: o.cfg, usados: 0, condo: true, lotes: [], deps: {}, arred: [] };
    const ent = new T.Group(); root.add(ent); B.entorno = ent;
    ent.add(box(400, 0.1, 400, M.grama, 0, -0.1, 0, false));
    ent.add(box(400, 0.06, 3.2, M.asfalto, 0, -0.02, 25, false));
    B.pad = box(80, 0.1, 50, M.grama, 11.5, -0.1, 0, false); B.pad.visible = false; root.add(B.pad);
    const lago = new T.Mesh(new T.CircleGeometry(1, 64), M.lago); lago.rotation.x = -Math.PI / 2; lago.scale.set(10, 21, 1); lago.position.set(38, 0.0, -2); root.add(lago);
    const margem = new T.Mesh(new T.CircleGeometry(1, 64), M.areia); margem.rotation.x = -Math.PI / 2; margem.scale.set(11, 22.2, 1); margem.position.set(38, -0.03, -2); root.add(margem);
    B.lago = lago;
    // mata nativa
    const nArv = 340, mata = new T.InstancedMesh(COPA, mat(0xffffff, { r: 1 }), nArv), mtx = new T.Matrix4(), cor = new T.Color();
    const r = rng(77); let k = 0;
    while (k < nArv) {
      let x, z; if (k < 230) { x = -60 + r() * 120; z = -26 - r() * 34; } else { x = 50 + r() * 22; z = -40 + r() * 70; }
      const s = 0.9 + r() * 1.4; mtx.compose(new T.Vector3(x, s * 0.9, z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), r() * 6.28), new T.Vector3(s, s * 1.15, s)); mata.setMatrixAt(k, mtx);
      cor.setHSL(0.24 + r() * 0.08, 0.3 + r() * 0.2, 0.09 + r() * 0.07); mata.setColorAt(k, cor); k++;
    }
    mata.castShadow = true; ent.add(mata);
    // centro da cidade (fora de escala)
    const rc = rng(5); for (let i = 0; i < 18; i++) { const h = 1 + rc() * 4; ent.add(box(2 + rc() * 2, h, 2 + rc() * 2, M.muro, -58 + rc() * 14 - 4, h / 2, 50 + rc() * 12 - 4, false)); }
    // ruas: leito de terra sempre; asfalto conforme o avanço
    const RUAS = [];
    for (let i = 0; i < 5; i++) RUAS.push([3, 7, 0, 21 - 3.5 - i * 7]);
    [10, -6].forEach((z) => { [0, 1, 2].forEach((j) => { RUAS.push([8, 2.2, 1.5 + 4 + j * 8, z]); RUAS.push([8, 2.2, -(1.5 + 4 + j * 8), z]); }); });
    RUAS.forEach(([w, d, x, z], i) => {
      root.add(box(w, 0.04, d, M.terraBatida, x, 0.02, z, false));
      const a = box(w, 0.06, d, M.asfalto, x, 0.04, z, false); root.add(a);
      novaParte(B, a, (s) => (i + 1) / RUAS.length * 100 <= s.ruas + 0.01, "xyz", i);
    });
    // postes
    for (let i = 0; i < 6; i++) { const pg = new T.Group(); pg.add(box(0.06, 1.3, 0.06, M.metal, 0, 0.65, 0)); pg.add(box(0.4, 0.05, 0.08, M.metal, 0.17, 1.3, 0)); pg.add(box(0.16, 0.04, 0.1, M.led, 0.32, 1.27, 0, false)); pg.position.set(1.8, 0, 18 - i * 6); pg.rotation.y = Math.PI; root.add(pg); novaParte(B, pg, (s) => s.ruas >= 90, "y", i); }
    // muro em trechos
    const trechos = [], L = 25, Z = 21;
    const linhaMuro = (x1, z1, x2, z2, n) => { for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n; trechos.push([x1 + (x2 - x1) * a, z1 + (z2 - z1) * a, x1 + (x2 - x1) * b, z1 + (z2 - z1) * b]); } };
    linhaMuro(-2.6, Z, -L, Z, 4); linhaMuro(2.6, Z, L, Z, 4); linhaMuro(L, Z, L, -Z, 6); linhaMuro(-L, Z, -L, -Z, 6); linhaMuro(-L, -Z, L, -Z, 8);
    trechos.forEach(([x1, z1, x2, z2], i) => {
      const len = Math.hypot(x2 - x1, z2 - z1), hor = Math.abs(z2 - z1) < 0.01;
      const m = box(hor ? len + 0.15 : 0.15, 0.85, hor ? 0.15 : len + 0.15, M.muro, (x1 + x2) / 2, 0.425, (z1 + z2) / 2); root.add(m);
      novaParte(B, m, (s) => (i + 1) / trechos.length * 100 <= s.muro + 0.01, "y", i);
    });
    // lotes e casas
    D.lotes.forEach((l) => {
      const chao = box(4.6, 0.05, l.d, M.gramaLote, l.x, 0.03, l.zc, false); root.add(chao);
      const out = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(4.6, 0.06, l.d)), OUT[l.status]); out.position.set(l.x, 0.08, l.zc); root.add(out);
      const casa = modeloCasa(l); casa.g.position.set(l.x, 0.04, l.zc + (l.frente > 0 ? 0.3 : -0.3)); casa.g.rotation.y = l.frente > 0 ? 0 : Math.PI; root.add(casa.g);
      ["piso", "bloco", "telhado", "pint", "extra"].forEach((nome, idx) => novaParte(B, casa.p[nome], (s) => { const e = estagio(l, s.k); return nome === "piso" ? e >= 1 : nome === "bloco" ? e >= 2 && e < 4 : nome === "telhado" ? e >= 3 : nome === "pint" ? e >= 4 : e >= 5; }, "y", l.id * 0.2 + idx));
      const placa = new T.Group(); placa.add(box(0.05, 0.6, 0.05, M.madeira, 0, 0.3, 0)); placa.add(box(0.6, 0.35, 0.03, mat(0x4dc48c, { e: 0x1d5a3c, ei: 0.4 }), 0, 0.68, 0, false)); placa.position.set(l.x + 1.6, 0, l.zc + l.frente * (l.d / 2 - 0.4)); root.add(placa);
      const lbl = label(obra, "", new T.Vector3(l.x, 0.4, l.zc), "", () => ui.obraId === o.id && ui.tab !== "carteira" && !ui.vista && ((ui.tab === "lotes" && (l.status === "disponivel" || ui.loteSel === l.id)) || (ui.persp === "comprador" && l.id === MEU_LOTE)));
      B.lotes.push({ l, chao, out, casa, placa, lbl });
    });
    // portaria, praça e clube
    const dep = (id, montar) => { const d = DEPS.find((x) => x.id === id); const g = new T.Group(); g.position.set(d.x, 0, d.z); montar(g); root.add(g); const gh = contorno(d.w, 1, d.dd, 0x5cc9ea, 0.32); gh.position.set(d.x, 0.5, d.z); root.add(gh); novaParte(B, g, (s) => s[d.por] >= d.lim, "y", 0); B.deps[id] = { d, g, gh }; };
    dep("portaria", (g) => {
      g.add(box(2.4, 1.0, 1.8, M.branco, 0, 0.5, -0.1)); g.add(box(1.8, 0.5, 0.04, M.vidro, 0, 0.6, 0.82, false)); g.add(box(3.0, 0.12, 2.4, M.branco, 0, 1.06, -0.1));
      g.add(box(5.2, 0.12, 2.6, M.madeira, -4, 1.3, -0.1)); [-6.4, -1.6].forEach((x) => g.add(box(0.18, 1.3, 0.18, M.granito, x, 0.65, 0.9)));
      const grade = []; for (let i = -10; i <= 10; i++) grade.push([0.03, 0.9, 0.03, -4 + i * 0.11, 0.45, 0.4]); g.add(juntar(grade, M.metal, [0], false));
      const placa = new T.Mesh(new T.PlaneGeometry(3.2, 0.6), mat(0xffffff, { map: tex(512, 96, (c, w, h) => { c.fillStyle = "#2a2c30"; c.fillRect(0, 0, w, h); c.fillStyle = "#edebe7"; c.font = "700 46px Arial Narrow, Arial"; c.fillText("RESERVA DAS ÁGUAS", 22, 62); }), r: 0.5 })); placa.position.set(-9, 0.6, 0.12); g.add(placa); g.add(box(3.4, 0.8, 0.2, M.granito, -9, 0.45, 0));
    });
    dep("praca", (g) => {
      [-4.3, 4.3].forEach((x) => { g.add(box(4.4, 0.06, 2.3, M.gramaLote, x, 0.05, 0, false)); [-1.4, 1.4].forEach((dx) => { const t = new T.Mesh(new T.IcosahedronGeometry(0.5, 1), M.arvore); t.position.set(x + dx, 0.85, 0); t.castShadow = true; g.add(t); g.add(box(0.08, 0.6, 0.08, M.tronco, x + dx, 0.3, 0)); }); g.add(box(0.9, 0.12, 0.3, M.madeira, x, 0.2, 0.9)); });
      g.add(cil(0.9, 0.9, 0.18, M.granito, -7.2, 0.09, 0)); const ag = cil(0.75, 0.75, 0.04, M.agua, -7.2, 0.2, 0, 32); g.add(ag);
    });
    dep("clube", (g) => {
      g.add(box(6.4, 0.1, 3.8, M.conc, 0, 0.05, 0)); g.add(box(5.8, 1.1, 3.0, M.branco, 0, 0.65, -0.2)); g.add(box(5.2, 0.85, 0.04, M.vidro, 0, 0.6, 1.32, false));
      g.add(box(7, 0.12, 4.4, M.branco, 0, 1.27, 0)); const per = []; for (let i = 0; i < 9; i++) per.push([0.07, 0.07, 1.4, -2.8 + i * 0.7, 1.24, 2.6]); g.add(juntar(per, M.madeira, [0])); [-3.2, 3.2].forEach((x) => g.add(box(0.12, 1.2, 0.12, M.madeira, x, 0.6, 3.2)));
    });
    dep("piscina", (g) => {
      g.add(box(7, 0.06, 3.4, M.madeira, 0, 0.03, 0)); g.add(box(4.8, 0.05, 2.0, M.agua, -0.7, 0.07, 0, false)); g.add(box(1.3, 0.05, 1.3, M.agua, 2.4, 0.07, -0.4, false));
      for (let i = 0; i < 3; i++) g.add(box(0.3, 0.1, 0.7, M.caixBranco, -2.4 + i * 0.9, 0.12, 1.35)); [-2.8, 1.6].forEach((x) => g.add(cil(0.04, 0.04, 0.8, M.metal, x, 0.4, -1.4)));
    });
    const quadraLinhas = (g, w, d) => { const ls = [[w, 0.02, 0.05, 0, 0.06, d / 2 - 0.1], [w, 0.02, 0.05, 0, 0.06, -d / 2 + 0.1], [0.05, 0.02, d, w / 2 - 0.1, 0.06, 0], [0.05, 0.02, d, -w / 2 + 0.1, 0.06, 0], [0.05, 0.02, d, 0, 0.06, 0]]; g.add(juntar(ls, M.linhaB, [0], false)); };
    const alambrado = (g, w, d, h) => { g.add(box(w, h, 0.02, M.alambrado, 0, h / 2, d / 2, false)); g.add(box(w, h, 0.02, M.alambrado, 0, h / 2, -d / 2, false)); g.add(box(0.02, h, d, M.alambrado, w / 2, h / 2, 0, false)); g.add(box(0.02, h, d, M.alambrado, -w / 2, h / 2, 0, false)); };
    dep("quadra", (g) => { g.add(box(6.4, 0.04, 3.8, M.quadra, 0, 0.02, 0, false)); quadraLinhas(g, 5.8, 3.2); alambrado(g, 6.4, 3.8, 1.0); [-2.7, 2.7].forEach((x) => g.add(box(0.06, 0.5, 0.6, M.caixBranco, x, 0.3, 0))); });
    dep("tenis", (g) => { g.add(box(5.8, 0.04, 3.4, M.saibro, 0, 0.02, 0, false)); quadraLinhas(g, 5.2, 2.8); g.add(box(0.03, 0.2, 2.8, M.caixBranco, 0, 0.12, 0, false)); alambrado(g, 5.8, 3.4, 1.0); });
    dep("play", (g) => { g.add(box(3, 0.03, 2.6, M.borracha, 0, 0.02, 0, false)); g.add(box(0.7, 0.7, 0.7, M.vermelho, -0.8, 0.35, -0.4)); const esc2 = box(0.3, 0.04, 1.2, M.amarelo, -0.8, 0.4, 0.4); esc2.rotation.x = 0.5; g.add(esc2); g.add(box(1.2, 0.06, 0.06, M.azul, 0.7, 0.7, 0)); [0.15, 1.25].forEach((x) => g.add(box(0.05, 0.7, 0.05, M.azul, x, 0.35, 0))); g.add(box(0.2, 0.04, 0.12, M.amarelo, 0.7, 0.25, 0)); });
    dep("academia", (g) => { g.add(box(1.8, 0.03, 2.2, M.calcada, 0, 0.02, 0, false)); for (let i = 0; i < 4; i++) g.add(box(0.25, 0.45, 0.25, i % 2 ? M.amarelo : M.azul, -0.5 + (i % 2) * 1, 0.23, -0.6 + Math.floor(i / 2) * 1.2)); });
    dep("quiosque", (g) => { [-1.6, 0, 1.6].forEach((z) => { g.add(box(1.3, 0.05, 1.3, M.calcada, 0, 0.03, z, false)); [-0.55, 0.55].forEach((x) => [-0.55, 0.55].forEach((zz) => g.add(box(0.06, 0.8, 0.06, M.madeira, x, 0.4, z + zz)))); const tl = new T.Mesh(new T.ConeGeometry(1.05, 0.45, 4), M.telha); tl.position.set(0, 1.02, z); tl.rotation.y = Math.PI / 4; tl.castShadow = true; g.add(tl); g.add(box(0.5, 0.45, 0.35, M.tijolo, 0, 0.23, z - 0.35)); }); });
    dep("pet", (g) => { g.add(box(3.2, 0.03, 2.8, M.gramaLote, 0, 0.03, 0, false)); alambrado(g, 3.2, 2.8, 0.45); [-0.8, 0.4].forEach((x) => { g.add(box(0.04, 0.3, 0.5, M.amarelo, x, 0.15, 0)); }); });
    dep("deck", (g) => { g.add(box(3.4, 0.08, 1.2, M.madeira, 1.2, 0.06, 0)); g.add(box(0.8, 0.03, 8, M.areia, -0.8, 0.02, 0, false)); [0.2, 1.2, 2.2].forEach((x) => g.add(box(0.08, 0.35, 0.08, M.madeira, x, 0.2, 0.55))); });
    // contêiner e materiais do canteiro
    root.add(box(2.6, 0.95, 0.85, M.container, -21.8, 0.48, 19.2));
    for (let i = 0; i < 4; i++) root.add(box(0.5, 0.32, 0.5, M.bloco, -18.8 + i * 0.6, 0.16, 19.6));
    // arredores
    const portaria = new T.Vector3(0, 0.25, 22.5);
    ARREDORES.forEach((p) => {
      ent.add(box(0.15, 3.5, 0.15, mat(p.c, { e: p.c, ei: 0.3 }), p.x, 1.75, p.z, false));
      const bola = new T.Mesh(new T.SphereGeometry(0.7, 16, 12), mat(p.c, { e: p.c, ei: 0.6 })); bola.position.set(p.x, 3.8, p.z); ent.add(bola);
      const geo = new T.BufferGeometry().setFromPoints([portaria, new T.Vector3(p.x, 0.25, p.z)]);
      const lin = new T.Line(geo, new T.LineDashedMaterial({ color: p.c, dashSize: 0.8, gapSize: 0.6 })); lin.computeLineDistances(); lin.visible = false; ent.add(lin);
      const lbl = label(obra, `${esc(p.n)} · ${num(p.km, 1)} km`, new T.Vector3(p.x, 4.8, p.z), "poi", () => ui.obraId === o.id && (ui.tab === "perto" || ui.poiSel === p.n) && !ui.vista);
      B.arred.push({ p, lin, lbl });
    });
    B.topLbl = label(obra, "", new T.Vector3(0, 3.2, -18.2), "terra", () => ui.tab !== "carteira" && ui.obraId === o.id && !ui.vista && ui.tab !== "lotes");
    B.nomeLbl = label(obra, "", new T.Vector3(), "terra", () => ui.tab === "carteira");
    B.slots = [[-12, 10, 0], [12, -6, Math.PI], [-1.2, 4, Math.PI / 2], [-18, -6, 0], [17, 10, Math.PI], [-6.5, 19.4, 0], [8, 10, 0]];
    PREDIOS[o.id] = B;
  }
  D.obras.forEach((o) => (isC(o) ? construirCondo(o) : construirPredio(o)));

  // ---------- Equipamentos em 3D ----------
  const EQ3D = {};
  function roda(r = 0.17, l = 0.14) { const m = new T.Mesh(new T.CylinderGeometry(r, r, l, 18), M.pneu); m.rotation.x = Math.PI / 2; m.castShadow = true; return m; }
  function cabine(g, cor, x = 0.78, comp = 0.55) { g.add(box(comp, 0.55, 0.78, cor, x, 0.62, 0)); g.add(box(0.05, 0.28, 0.66, M.vidroCab, x + comp / 2 + 0.01, 0.74, 0, false)); g.add(box(comp * 0.7, 0.24, 0.8, M.vidroCab, x + 0.04, 0.74, 0, false)); }
  function chassi(g, comp, eixos) { g.add(box(comp, 0.12, 0.62, M.escuro, -0.1, 0.28, 0)); eixos.forEach((x) => [-0.36, 0.36].forEach((z) => { const w = roda(); w.position.set(x, 0.17, z); g.add(w); })); }
  function modeloEquip(e) {
    const g = new T.Group(); const anim = {};
    if (e.tipo === "betoneira") {
      chassi(g, 2.1, [0.75, -0.45, -0.85]); cabine(g, M.brancoV);
      const tambor = new T.Group(); tambor.position.set(-0.45, 0.82, 0); tambor.rotation.z = 0.32;
      const tb = new T.Mesh(new T.CylinderGeometry(0.22, 0.38, 1.25, 20), M.laranja); tb.rotation.z = Math.PI / 2; tb.castShadow = true; tambor.add(tb);
      const fx = new T.Mesh(new T.TorusGeometry(0.34, 0.025, 6, 24), M.brancoV); fx.rotation.y = Math.PI / 2; tambor.add(fx);
      g.add(tambor); anim.tambor = tambor;
    } else if (e.tipo === "basculante" || e.tipo === "munck") {
      chassi(g, 2.1, [0.75, -0.45, -0.85]); cabine(g, e.tipo === "munck" ? M.brancoV : M.amarelo);
      if (e.tipo === "basculante") { const c = new T.Group(); c.position.set(-1.0, 0.36, 0); c.add(box(1.5, 0.08, 0.76, M.amarelo, 0.75, 0, 0)); c.add(box(1.5, 0.42, 0.05, M.amarelo, 0.75, 0.22, 0.37)); c.add(box(1.5, 0.42, 0.05, M.amarelo, 0.75, 0.22, -0.37)); c.add(box(0.05, 0.42, 0.76, M.amarelo, 0, 0.22, 0)); c.add(box(1.3, 0.2, 0.62, M.areia, 0.75, 0.14, 0, false)); g.add(c); anim.cacamba = c; }
      else { g.add(box(1.6, 0.06, 0.76, M.metal, -0.4, 0.38, 0)); const br = new T.Group(); br.position.set(0.35, 0.42, 0); br.add(box(0.15, 0.4, 0.15, M.brancoV, 0, 0.2, 0)); const arm = box(1.6, 0.1, 0.1, M.amarelo, -0.7, 0.42, 0); arm.rotation.z = 0.25; br.add(arm); g.add(br); }
    } else if (e.tipo === "escavadeira" || e.tipo === "retro") {
      [-0.38, 0.38].forEach((z) => g.add(box(1.5, 0.26, 0.24, M.escuro, 0, 0.13, z)));
      const sup = new T.Group(); sup.position.y = 0.3; g.add(sup);
      sup.add(box(1.2, 0.45, 0.85, M.amarelo, -0.15, 0.28, 0)); sup.add(box(0.45, 0.45, 0.42, M.vidroCab, 0.3, 0.72, 0.18, false)); sup.add(box(0.48, 0.05, 0.45, M.amarelo, 0.3, 0.96, 0.18));
      const lanca = new T.Group(); lanca.position.set(0.4, 0.45, -0.15); sup.add(lanca); lanca.add(box(1.3, 0.14, 0.14, M.amarelo, 0.6, 0, 0)); lanca.rotation.z = 0.55;
      const braco = new T.Group(); braco.position.set(1.25, 0, 0); lanca.add(braco); braco.add(box(0.9, 0.11, 0.11, M.amarelo, 0.42, 0, 0)); braco.add(box(0.28, 0.24, 0.4, M.metal, 0.9, 0, 0)); braco.rotation.z = -1.5;
      anim.sup = sup; anim.lanca = lanca; anim.braco = braco;
    } else if (e.tipo === "trator") {
      [-0.42, 0.42].forEach((z) => g.add(box(1.4, 0.3, 0.26, M.escuro, 0, 0.15, z)));
      g.add(box(1.0, 0.5, 0.75, M.amarelo, -0.15, 0.55, 0)); g.add(box(0.45, 0.45, 0.6, M.vidroCab, -0.4, 1.02, 0, false)); g.add(box(0.5, 0.05, 0.65, M.amarelo, -0.4, 1.25, 0));
      const lam = box(0.1, 0.4, 1.3, M.metal, 1.0, 0.22, 0); lam.rotation.z = -0.15; g.add(lam); [-0.3, 0.3].forEach((z) => g.add(box(0.6, 0.06, 0.06, M.amarelo, 0.65, 0.4, z)));
      anim.vaivem = true;
    } else if (e.tipo === "rolo") {
      const tb = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.95, 24), M.metal); tb.rotation.x = Math.PI / 2; tb.position.set(0.75, 0.32, 0); tb.castShadow = true; g.add(tb);
      g.add(box(0.2, 0.25, 1.0, M.amarelo, 0.75, 0.66, 0)); g.add(box(1.0, 0.45, 0.8, M.amarelo, -0.2, 0.45, 0)); [-0.38, 0.38].forEach((z) => { const w = roda(0.24, 0.16); w.position.set(-0.45, 0.24, z); g.add(w); });
      [-0.55, 0.15].forEach((x) => [-0.32, 0.32].forEach((z) => g.add(box(0.04, 0.6, 0.04, M.escuro, x, 0.98, z)))); g.add(box(0.85, 0.05, 0.75, M.amarelo, -0.2, 1.28, 0));
      anim.vaivem = true;
    } else if (e.tipo === "tesoura") {
      g.add(box(1.2, 0.2, 0.7, M.laranja, 0, 0.18, 0)); [-0.4, 0.4].forEach((x) => [-0.3, 0.3].forEach((z) => { const w = roda(0.09, 0.08); w.position.set(x, 0.09, z); g.add(w); }));
      for (let k = 0; k < 3; k++) [-0.3, 0.3].forEach((z) => { [0.38, -0.38].forEach((ang) => { const a = box(1.1, 0.05, 0.04, M.escuro, 0, 0.45 + k * 0.42, z, false); a.rotation.z = ang; g.add(a); }); });
      g.add(box(1.3, 0.06, 0.75, M.laranja, 0, 1.55, 0)); g.add(box(1.3, 0.4, 0.03, M.amarelo, 0, 1.78, 0.36, false)); g.add(box(1.3, 0.4, 0.03, M.amarelo, 0, 1.78, -0.36, false));
    } else if (e.tipo === "elevador") {
      const mastro = box(0.2, 1, 0.2, M.amarelo, 0, 0.5, 0); g.add(mastro); const cab = box(0.7, 0.9, 0.7, M.metal, 0.5, 0.5, 0); g.add(cab); anim.mastro = mastro; anim.cab = cab;
    } else if (e.tipo === "gerador") {
      g.add(box(1.2, 0.6, 0.6, M.verde, 0, 0.32, 0)); for (let k = 0; k < 5; k++) g.add(box(0.02, 0.35, 0.5, M.escuro, -0.4 + k * 0.2, 0.36, 0.31, false));
    } else if (e.tipo === "bet400") {
      const t = cil(0.16, 0.26, 0.45, M.laranja, 0, 0.5, 0); t.rotation.z = 0.6; g.add(t); g.add(box(0.5, 0.06, 0.4, M.metal, 0, 0.22, 0)); [-0.18, 0.18].forEach((z) => { const w = roda(0.1, 0.05); w.position.set(-0.2, 0.1, z); g.add(w); }); anim.bet = t;
    } else if (e.tipo === "compactador") {
      g.add(box(0.4, 0.12, 0.3, M.metal, 0, 0.06, 0)); g.add(box(0.25, 0.3, 0.25, M.amarelo, 0, 0.27, 0)); g.add(box(0.04, 0.5, 0.04, M.escuro, -0.15, 0.55, 0));
    } else return null;
    const anel = new T.Mesh(new T.RingGeometry(1.25, 1.45, 40), new T.MeshBasicMaterial({ color: 0xe6b85c, transparent: true, opacity: 0.8, side: T.DoubleSide })); anel.rotation.x = -Math.PI / 2; anel.position.y = 0.06; anel.visible = false; g.add(anel);
    g.traverse((m) => { if (m.isMesh && m !== anel) m.castShadow = true; });
    return { g, anim, anel, fase: rnd() * 5 };
  }
  function posicionarEquipamentos() {
    Object.values(PREDIOS).forEach((B) => (B.usados = 0));
    D.equip.forEach((e) => {
      if (e.tipo === "grua") return;
      const B = PREDIOS[e.obra]; let m = EQ3D[e.id];
      if (!B) { if (m) m.g.removeFromParent(); return; }
      if (!m) { m = modeloEquip(e); if (!m) return; EQ3D[e.id] = m; m.lbl = label(obra, esc(e.n), new T.Vector3(), "gold", () => ui.equipSel === e.id && !!m.g.parent && ui.tab !== "carteira"); }
      if (e.tipo === "elevador" && !B.condo) { const hg = Math.max(1, atualDe(B.o).E) * H + 0.5; m.g.position.set(B.cfg.tw / 2 + 0.85, 0, 0.6); m.g.rotation.y = 0; m.anim.mastro.scale.y = hg; m.anim.mastro.position.y = hg / 2; m.anim.hgt = hg; }
      else { const sl = B.slots[B.usados++ % B.slots.length]; m.g.position.set(sl[0], 0, sl[1]); m.g.rotation.y = sl[2]; m.base = m.g.position.clone(); if (m.anim.mastro) { m.anim.mastro.scale.y = 1.5; m.anim.mastro.position.y = 0.75; m.anim.hgt = 1.5; } }
      B.root.add(m.g);
    });
  }
  posicionarEquipamentos();

  // ---------- Bonecos ----------
  const W = { lista: [], grupo: new T.Group() };
  obra.scene.add(W.grupo);
  const WG = { perna: new T.CylinderGeometry(0.034, 0.03, 0.27, 8).translate(0, -0.135, 0), tronco: new T.CylinderGeometry(0.075, 0.062, 0.25, 10), braco: new T.CylinderGeometry(0.024, 0.021, 0.23, 8).translate(0, -0.115, 0), cabeca: new T.SphereGeometry(0.052, 14, 10), casco: new T.SphereGeometry(0.064, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), aba: new T.CylinderGeometry(0.078, 0.078, 0.012, 16), faixa: new T.CylinderGeometry(0.077, 0.077, 0.02, 10, 1, true), bota: new T.BoxGeometry(0.06, 0.035, 0.1), anel: new T.RingGeometry(0.16, 0.21, 28) };
  const WM = { pele: [0xc68e6a, 0x8d5a3b, 0xe0b08b, 0x6a4128, 0xb47a55].map((c) => mat(c, { r: 0.7 })), calca: mat(0x2b3a55, { r: 0.9 }), calca2: mat(0x3c3c3a, { r: 0.9 }), colete: mat(0xff7a1a, { r: 0.6, e: 0x5a2000, ei: 0.25 }), colete2: mat(0xc6e230, { r: 0.6, e: 0x2f3a00, ei: 0.25 }), faixa: mat(0xdadada, { r: 0.2, m: 0.6 }), bota: mat(0x2a1d14), camisa: mat(0x4b5a6a, { r: 0.9 }), anel: new T.MeshBasicMaterial({ color: 0xe6b85c, transparent: true, opacity: 0.85, side: T.DoubleSide }) };
  function boneco(funcao, papel, extra) {
    const f = FN[funcao], g = new T.Group(), corpo = new T.Group(); g.add(corpo);
    const n = W.lista.length, pele = WM.pele[n % WM.pele.length];
    const m = (geo, mt, x, y, z) => { const ms = new T.Mesh(geo, mt); ms.position.set(x, y, z); ms.castShadow = true; return ms; };
    const perna = (x) => { const p = new T.Group(); p.position.set(x, 0.29, 0); p.add(m(WG.perna, n % 2 ? WM.calca : WM.calca2, 0, 0, 0)); p.add(m(WG.bota, WM.bota, 0, -0.27, 0.02)); return p; };
    const braco = (x) => { const b = new T.Group(); b.position.set(x, 0.53, 0); b.add(m(WG.braco, WM.camisa, 0, 0, 0)); const mao = m(WG.cabeca, pele, 0, -0.235, 0); mao.scale.setScalar(0.42); b.add(mao); return b; };
    const pernaE = perna(-0.04), pernaD = perna(0.04), bE = braco(-0.095), bD = braco(0.095);
    const cab = new T.Group(); cab.position.y = 0.62; cab.add(m(WG.cabeca, pele, 0, 0, 0));
    const hatM = mat(new T.Color(f.hat).getHex(), { r: 0.35 }); cab.add(m(WG.casco, hatM, 0, 0.012, 0)); cab.add(m(WG.aba, hatM, 0, 0.012, 0.012));
    corpo.add(pernaE, pernaD, m(WG.tronco, ["fach", "seg", "sin"].includes(funcao) ? WM.colete2 : WM.colete, 0, 0.42, 0), m(WG.faixa, WM.faixa, 0, 0.4, 0), bE, bD, cab);
    if (papel === "carregar") corpo.add(box(0.2, 0.13, 0.2, M.bloco, 0, 0.47, 0.16));
    if (papel === "prancheta") { const it = box(0.11, 0.15, 0.012, mat(0x101317, { e: 0x3a7fd0, ei: 0.6 }), 0.02, 0.43, 0.13, false); it.rotation.x = -0.6; corpo.add(it); }
    if (papel === "martelar") { const it = new T.Group(); it.add(box(0.015, 0.14, 0.015, M.tronco, 0, -0.29, 0, false)); it.add(box(0.06, 0.03, 0.03, M.metal, 0, -0.36, 0, false)); bD.add(it); }
    let faisca = null;
    if (papel === "soldar") { faisca = new T.PointLight(0x9fd4ff, 0, 1.6); faisca.position.set(0.05, 0.12, 0.2); faisca.add(new T.Mesh(new T.SphereGeometry(0.025, 8, 6), new T.MeshBasicMaterial({ color: 0xdff2ff }))); corpo.add(faisca); }
    if (papel === "empurrar") { const c = new T.Group(); c.position.set(0, 0, 0.36); const cc = box(0.3, 0.12, 0.38, M.metal, 0, 0.22, 0.05); cc.rotation.x = 0.12; c.add(cc); c.add(box(0.26, 0.06, 0.3, M.areia, 0, 0.29, 0.05, false)); const rd = new T.Mesh(new T.TorusGeometry(0.07, 0.025, 8, 16), M.escuro); rd.rotation.y = Math.PI / 2; rd.position.set(0, 0.08, 0.25); c.add(rd); [-0.1, 0.1].forEach((x) => c.add(box(0.02, 0.02, 0.4, M.metal, x, 0.3, -0.15, false))); g.add(c); }
    const anel = new T.Mesh(WG.anel, WM.anel); anel.rotation.x = -Math.PI / 2; anel.position.y = 0.01; anel.visible = false; g.add(anel);
    g.scale.setScalar(0.9); W.grupo.add(g);
    const w = { g, corpo, pernaE, pernaD, bE, bD, cab, faisca, anel, funcao, papel, fase: rnd() * 6, a: null, b: null, ativo: true, frente: extra.frente, off: extra.off, c: extra.c, ang: extra.ang ?? 0, angC: extra.angC, empId: null };
    w.lbl = label(obra, "", new T.Vector3(), "gold", () => ui.bonecos && w.g.visible && ui.tab !== "carteira" && (ui.funcaoSel === funcao || (!!ui.empSel && ui.empSel === w.empId)));
    W.lista.push(w);
  }
  [
    ["arm", "soldar", { frente: "laje", off: [-0.27, 0.15], ang: 0.4 }], ["arm", "soldar", { frente: "laje", off: [0.22, -0.25], ang: 2.6 }],
    ["carp", "martelar", { frente: "laje", off: [0.1, 0.32], ang: -0.3 }], ["carp", "martelar", { frente: "laje", off: [-0.35, -0.32], ang: 3.5 }],
    ["serv", "carregar", { frente: "laje", off: [-0.38, 0.42, 0.37, 0.42] }],
    ["ped", "martelar", { frente: "alv", off: [1, 0.12], ang: -Math.PI / 2 }], ["ped", "martelar", { frente: "alv", off: [-1, -0.18], ang: Math.PI / 2 }],
    ["serv", "carregar", { frente: "alv", off: [-0.4, 1, 0.4, 1] }],
    ["fach", "martelar", { frente: "fach", off: [-0.6], ang: Math.PI }], ["fach", "soldar", { frente: "fach", off: [0.7], ang: Math.PI }],
    ["eng", "prancheta", { frente: "chao", off: [5.0, 4.4], ang: -2.3, c: [5.8, 18.6], angC: -2.6 }], ["mestre", "prancheta", { frente: "chao", off: [4.2, 5.2], ang: -2.6, c: [6.6, 17.8], angC: -2.2 }],
    ["seg", "andar", { frente: "chao", off: [-5.6, 2.2, -1.6, 6.4], c: [0.9, 17, 0.9, -12] }], ["serv", "empurrar", { frente: "chao", off: [2.6, 6.5, -3.4, 6.5], c: [-14, 10.4, -4, 10.4] }],
    ["sin", "sinalizar", { frente: "chao", off: [-5.2, -3.0], ang: 0.9 }], ["ped", "carregar", { frente: "chao", off: [-5.4, 3.2, -5.0, -0.2], c: [-21, 18.2, -17, 12.6] }],
    ["alm", "prancheta", { frente: "chao", off: [3.9, -4.9], ang: 0.3, c: [-20.6, 18.4], angC: 0.5 }],
  ].forEach(([f, p, x]) => boneco(f, p, x));

  function atribuirPessoas(o) {
    const pessoas = funcDe(o).filter((p) => p.status === "presente"), usados = {};
    W.lista.forEach((w) => { const cand = pessoas.filter((p) => p.funcao === w.funcao), k = (usados[w.funcao] = (usados[w.funcao] ?? -1) + 1), p = cand[k]; w.empId = p?.id || null; if (!p) w.ativo = false; w.lbl.el.textContent = p ? `${p.nome} · ${fnInfo(o, w.funcao).n}` : ""; });
  }
  function posicionarBonecos(o, s) {
    if (isC(o)) return posicionarBonecosCondo(o, s);
    const { floors, tw, pw, pod } = o.cfg, B = PREDIOS[o.id];
    const temLaje = s.E > 0 && s.E < floors, temAlv = s.A < s.E && s.A >= 1, temFach = s.F < s.A && s.F >= pod;
    const yLaje = s.E * H + 0.09, yAlv = s.A * H + 0.16, yFach = s.F * H + 0.23;
    W.lista.forEach((w) => {
      let ok = true; const v = w.off;
      if (w.frente === "laje") { const L = s.E < pod ? pw : tw; ok = temLaje; w.a = new T.Vector3(v[0] * L, yLaje, v[1] * L); w.b = v.length > 2 ? new T.Vector3(v[2] * L, yLaje, v[3] * L) : null; }
      else if (w.frente === "alv") { const L = s.A < pod ? pw : tw, e = L / 2 - 0.22, cv = (x) => (Math.abs(x) === 1 ? Math.sign(x) * e : x * L); ok = temAlv; w.a = new T.Vector3(cv(v[0]), yAlv, cv(v[1])); w.b = v.length > 2 ? new T.Vector3(cv(v[2]), yAlv, cv(v[3])) : null; }
      else if (w.frente === "fach") { ok = temFach; w.a = new T.Vector3(v[0], yFach, tw / 2 + 0.72); w.b = null; }
      else { if (w.funcao === "sin") ok = !!B.crane && s.E < floors; w.a = new T.Vector3(v[0], 0, v[1]); w.b = v.length > 2 ? new T.Vector3(v[2], 0, v[3]) : null; }
      w.ativo = ok; w.angAtual = w.ang;
    });
    atribuirPessoas(o);
    B.deck.visible = temLaje; B.deck.position.y = s.E * H; const ks = s.E < pod ? pw / tw : 1; B.deck.scale.set(ks, 1, ks);
    B.gondola.g.visible = temFach; B.gondola.g.position.set(0, yFach - 0.03, tw / 2 + 0.72); B.gondola.cabos.scale.y = Math.max(0.1, (s.E * H + 0.6 - yFach) / 10);
  }
  function posicionarBonecosCondo(o, s) {
    const lotes = lotesVendidos(), alv = lotes.find((l) => [2, 3].includes(estagio(l, s.k))), pint = lotes.find((l) => estagio(l, s.k) === 4);
    const clubeObra = s.clube >= 10 && s.clube < 100;
    const centro = (l) => new T.Vector3(l.x, 0.1, l.zc + (l.frente > 0 ? 0.3 : -0.3));
    const clubeOff = [[-2.8, -16.2, 0.3], [2.6, -16.4, -0.4], [1.0, -20.4, 2.8], [-1.6, -20.4, 3.4]];
    let iL = 0, iA = 0, iF = 0;
    W.lista.forEach((w) => {
      let ok = true; w.angAtual = w.ang;
      if (w.frente === "laje") {
        ok = clubeObra;
        if (w.papel === "carregar") { w.a = new T.Vector3(-3, 0, -15.6); w.b = new T.Vector3(3, 0, -15.6); }
        else { const c = clubeOff[iL++ % 4]; w.a = new T.Vector3(c[0], 0.1, c[1]); w.b = null; w.angAtual = c[2]; }
      } else if (w.frente === "alv") {
        ok = !!alv; if (alv) { const c = centro(alv);
          if (w.papel === "carregar") { const zf = c.z + alv.frente * 1.9; w.a = new T.Vector3(c.x - 2.0, 0.05, zf); w.b = new T.Vector3(c.x + 2.0, 0.05, zf); }
          else { const lado = iA++ % 2 ? -1 : 1; w.a = new T.Vector3(c.x + lado * 2.0, 0.05, c.z + (lado > 0 ? -0.3 : 0.4)); w.b = null; w.angAtual = lado > 0 ? -Math.PI / 2 : Math.PI / 2; } }
      } else if (w.frente === "fach") {
        ok = !!pint; if (pint) { const c = centro(pint), lado = iF++ % 2 ? 0.7 : -0.6; w.a = new T.Vector3(c.x + lado, 0.05, c.z + pint.frente * 1.75); w.b = null; w.angAtual = pint.frente > 0 ? Math.PI : 0; }
      } else {
        if (!w.c) ok = false; else { w.a = new T.Vector3(w.c[0], 0, w.c[1]); w.b = w.c.length > 2 ? new T.Vector3(w.c[2], 0, w.c[3]) : null; w.angAtual = w.angC ?? w.ang; }
      }
      w.ativo = ok;
    });
    atribuirPessoas(o);
  }
  let relogio = 0;
  function animarBonecos(dt) {
    const visCena = ui.bonecos && CENA_DA_ABA[ui.tab] === "obra" && !ui.vista;
    W.lista.forEach((w) => {
      const vis = visCena && w.ativo; w.g.visible = vis; if (!vis) return;
      w.fase += dt; const t = w.fase, sel = ui.funcaoSel === w.funcao || (!!ui.empSel && ui.empSel === w.empId);
      w.anel.visible = sel; if (sel) w.anel.material.opacity = 0.55 + Math.sin(relogio * 6) * 0.35;
      w.pernaE.rotation.x = w.pernaD.rotation.x = 0; w.bE.rotation.set(0, 0, -0.08); w.bD.rotation.set(0, 0, 0.08); w.corpo.position.y = 0; w.corpo.rotation.x = 0; w.cab.rotation.set(0, 0, 0);
      if (w.b && ["andar", "carregar", "empurrar"].includes(w.papel)) {
        const dist = w.a.distanceTo(w.b), vel = w.papel === "empurrar" ? 0.35 : w.papel === "andar" ? 0.6 : 0.45, ciclo = Math.max(1, (dist / vel) * 2);
        const u = (t % ciclo) / ciclo, ida = u < 0.5, k = ida ? u * 2 : (1 - u) * 2, e = k < 0.06 ? 0 : k > 0.94 ? 1 : (k - 0.06) / 0.88;
        w.g.position.lerpVectors(w.a, w.b, e);
        const dir = ida ? 1 : -1; w.g.rotation.y = Math.atan2((w.b.x - w.a.x) * dir, (w.b.z - w.a.z) * dir);
        const sw = Math.sin(t * 7.5) * 0.55; w.pernaE.rotation.x = sw; w.pernaD.rotation.x = -sw; w.corpo.position.y = Math.abs(Math.cos(t * 7.5)) * 0.012;
        if (w.papel === "andar") { w.bE.rotation.x = -sw * 0.7; w.bD.rotation.x = sw * 0.7; } else { w.bE.rotation.x = w.bD.rotation.x = -1.15; w.corpo.rotation.x = w.papel === "empurrar" ? 0.18 : 0; }
      } else {
        w.g.position.copy(w.a); w.g.rotation.y = w.angAtual ?? w.ang;
        if (w.papel === "martelar") { w.corpo.rotation.x = 0.25; w.bD.rotation.x = -1.7 + Math.max(0, Math.sin(t * 9)) * 1.1; w.bE.rotation.x = -0.9; }
        else if (w.papel === "soldar") { w.corpo.position.y = -0.13; w.pernaE.rotation.x = -1.3; w.pernaD.rotation.x = -0.3; w.corpo.rotation.x = 0.5; w.bE.rotation.x = w.bD.rotation.x = -1.0; const on = Math.sin(t * 23) + Math.sin(t * 37) > 0.4; w.faisca.intensity = on ? 2.4 : 0; w.faisca.children[0].visible = on; }
        else if (w.papel === "prancheta") { w.bE.rotation.x = w.bD.rotation.x = -0.95; w.cab.rotation.y = Math.sin(t * 0.7) * 0.5; }
        else if (w.papel === "sinalizar") { w.bD.rotation.z = 2.6 + Math.sin(t * 3) * 0.35; w.bE.rotation.x = -0.3; w.cab.rotation.x = -0.25; }
      }
      if (sel) w.lbl.pos.set(w.g.position.x * W.grupo.scale.x + W.grupo.position.x, w.g.position.y + 0.9, w.g.position.z * W.grupo.scale.x);
    });
  }

  function aplicarEstado(s, escalonar = true, o = obraAtiva()) {
    const B = PREDIOS[o.id];
    let n = 0;
    B.partes.forEach((p) => { const alvo = p.cond(s) ? 1 : 0; if (alvo !== p.alvo) { p.alvo = alvo; p.desde = relogio + (escalonar && alvo ? Math.min(2.2, (B.condo ? n++ * 0.04 : Math.max(0, p.ordem - ((s.E ?? 0) - 3)) * 0.12)) : 0); } });
    if (B.condo) {
      Object.values(B.deps).forEach(({ d, gh }) => (gh.visible = s[d.por] < d.lim));
      B.topLbl.el.textContent = s.clube >= 100 ? "Clube pronto" : `Clube ${s.clube}% · ${contaCasas(s.k).obra} casas em obra`;
      atualizarLotes(o, s);
    } else {
      const fl = o.cfg.floors;
      B.ghost.forEach((g, i) => (g.visible = i >= s.E));
      B.net.forEach((nn, i) => (nn.visible = i < s.E && i >= s.F && i >= s.E - 4));
      if (B.crane) {
        const c = B.crane, h = Math.ceil(Math.min(s.E + 4, fl + 4));
        c.grua.visible = s.E < fl; c.mastro.count = h;
        const mtx = new T.Matrix4(); for (let k = 0; k < h; k++) { mtx.makeTranslation(0, k, 0); c.mastro.setMatrixAt(k, mtx); }
        c.mastro.instanceMatrix.needsUpdate = true; c.topo.position.y = h + 0.1;
      }
      B.topLbl.pos.set(-o.cfg.tw / 2 - 0.3, Math.max(s.E, 0.4) * H + 0.45, o.cfg.tw / 2 + 0.3);
      B.topLbl.el.textContent = s.E ? (s.E < fl ? `Laje ${s.E + 1} em execução` : "Estrutura concluída") : "Fundação concluída";
    }
    if (o.id === ui.obraId) posicionarBonecos(o, s);
  }
  function atualizarLotes(o, s = atualDe(o)) {
    const B = PREDIOS[o.id];
    B.lotes.forEach(({ l, chao, out, placa, lbl }) => {
      const e = estagio(l, s.k), sel = ui.loteSel === l.id, meu = ui.persp === "comprador" && l.id === MEU_LOTE;
      chao.material = l.status === "vendido" && e > 0 && e < 5 ? M.terraBatida : M.gramaLote;
      out.material = sel || meu ? OUT.sel : OUT[l.status];
      out.visible = ui.tab === "lotes" || sel || meu;
      placa.visible = l.status === "disponivel";
      const pre = l.status === "disponivel" ? ` · ${mil(l.preco)}` : l.status === "reservado" ? " · reservado" : "";
      lbl.el.className = "lbl " + (meu ? "gold" : sel ? "gold" : l.status === "disponivel" ? "cyan" : "");
      lbl.el.textContent = meu ? `Seu lote · ${String(l.id).padStart(2, "0")}` : `Lote ${String(l.id).padStart(2, "0")}${pre}`;
    });
  }
  D.obras.forEach((o) => aplicarEstado(atualDe(o), false, o));

  obra.tick = (dt) => {
    Object.values(PREDIOS).forEach((B) => {
      if (!B.root.visible) return;
      B.partes.forEach((p) => {
        if (relogio < p.desde) return;
        p.t += (p.alvo - p.t) * Math.min(1, dt * 5); if (Math.abs(p.alvo - p.t) < 0.002) p.t = p.alvo;
        const e = Math.max(1 - Math.pow(1 - p.t, 3), 0.001);
        if (p.modo === "xyz") p.g.scale.set(e, e, e); else p.g.scale.y = e;
        p.g.visible = p.t > 0.004;
      });
      const c = B.crane;
      if (c) { const r = relogio + c.fase, ciclo = (Math.sin(r * 0.35) + 1) / 2, desc = 1.4 + (1 - ciclo) * (c.topo.position.y - 2.5); c.topo.rotation.y = Math.sin(r * 0.12) * 1.1 + 0.6; c.tro.position.set(1.5 + ciclo * 5.5, -0.05, 0); c.cabo.scale.y = desc; c.cabo.position.y = -desc / 2; c.carga.position.y = -desc - 0.2; }
      if (B.unit) { B.unit.g.visible = ui.meuApe && ui.persp === "comprador"; B.unit.box.material.opacity = 0.16 + Math.sin(relogio * 3) * 0.08; }
      if (B.condo) { OUT.sel.color.setHSL(0.11, 0.7, 0.55 + Math.sin(relogio * 4) * 0.15); }
    });
    Object.entries(EQ3D).forEach(([id, m]) => {
      if (!m.g.parent) return; const t = relogio + m.fase, a = m.anim;
      if (a.tambor) a.tambor.rotation.x += dt * 2.2;
      if (a.sup) { a.sup.rotation.y = Math.sin(t * 0.5) * 0.9; a.lanca.rotation.z = 0.45 + Math.sin(t * 0.9) * 0.2; a.braco.rotation.z = -1.4 + Math.sin(t * 0.9 + 1) * 0.35; }
      if (a.cacamba) a.cacamba.rotation.z = Math.max(0, Math.sin(t * 0.4)) * 0.6;
      if (a.bet) a.bet.rotation.y += dt * 3;
      if (a.cab && a.hgt) a.cab.position.y = 0.5 + ((Math.sin(t * 0.3) + 1) / 2) * Math.max(0, a.hgt - 1.2);
      if (a.vaivem && m.base) { const dx = Math.sin(t * 0.4) * 1.2; m.g.position.x = m.base.x + Math.cos(m.g.rotation.y) * dx; m.g.position.z = m.base.z - Math.sin(m.g.rotation.y) * dx; }
      m.anel.visible = ui.equipSel === id; if (m.anel.visible) m.anel.material.opacity = 0.5 + Math.sin(relogio * 5) * 0.35;
      if (ui.equipSel === id) { const p = new T.Vector3(); m.g.getWorldPosition(p); m.lbl.pos.set(p.x, p.y + 2.2, p.z); }
    });
    animarBonecos(dt); animarManequins(dt);
    aguaN.offset.x += dt * 0.012; aguaN.offset.y += dt * 0.006; aguaN2.offset.x -= dt * 0.02;
  };

  const CARTEIRA = { jardim: [-44, 1], aurora: [-16, 1], mirante: [12, 1], reserva: [44, 0.36] };
  function layoutCarteira(on) {
    D.obras.forEach((o) => {
      const B = PREDIOS[o.id], [x, sc] = CARTEIRA[o.id], s = atualDe(o);
      B.root.visible = on || o.id === ui.obraId; B.root.position.x = on ? x : 0; B.root.scale.setScalar(on ? sc : 1);
      if (B.condo) { B.entorno.visible = !on; B.pad.visible = on; }
      B.nomeLbl.el.textContent = `${o.curto} · ${avancoDe(o, s)}%`; B.nomeLbl.pos.set(on ? x : 0, isC(o) ? 5 : Math.max(s.E, 1) * H + 2.6, 0);
    });
    const R = PREDIOS[ui.obraId].root; W.grupo.position.x = R.position.x; W.grupo.scale.setScalar(R.scale.x);
    const cond = isC(obraAtiva());
    const b = on ? 75 : cond ? 45 : 20;
    Object.assign(sol.shadow.camera, { left: -b, right: b, top: on ? 50 : cond ? 45 : 28, bottom: on ? -40 : cond ? -45 : -14 }); sol.shadow.camera.updateProjectionMatrix();
  }
  function cameraPara(o, carteira) {
    ui.vista = null; obra.controls.minDistance = obra.minPadrao;
    if (carteira) { obra.camAnim = { pos: new T.Vector3(0, 62, 158), alvo: new T.Vector3(0, 3, 0) }; return; }
    if (isC(o)) { obra.camAnim = ui.tab === "perto" ? { pos: new T.Vector3(-9, 128, 104), alvo: new T.Vector3(-9, 0, 3) } : { pos: new T.Vector3(21, 38, 56), alvo: new T.Vector3(12, 0, -2) }; return; }
    const f = o.cfg.floors, k = Math.max(0.85, f / 14);
    obra.camAnim = { pos: new T.Vector3(18 * k, 12 * k, 21 * k), alvo: new T.Vector3(0, f * H * 0.44, 0) };
  }
  function verVista(l) {
    const alvo = l.vista === "Rua interna" ? new T.Vector3(l.x, 0.5, l.zc + l.frente * 8) : new T.Vector3(...ALVOS_VISTA[l.vista]);
    const p = new T.Vector3(l.x, 1.75, l.zc), dir = alvo.clone().sub(p).setY(0).normalize();
    obra.controls.minDistance = 0.5; obra.controls.autoRotate = false;
    const longe = p.clone().addScaledVector(dir, Math.max(16, alvo.clone().setY(p.y).distanceTo(p)));
    obra.camAnim = { pos: p.clone().addScaledVector(dir, -1.2), alvo: new T.Vector3(longe.x, 0.9, longe.z) };
    ui.vista = l.id;
  }

  // ---------- Cena 2: apartamento (escala real: 1 unidade = 1 metro) ----------
  const apto = novaCena("apto", [7.5, 12.5, 12.5], [0, 0, 0.3], { min: 4, max: 30, polar: 1.3, fov: 40 });
  renderer.localClippingEnabled = true;
  const CORTE_H = 1.25, CORTE = new T.Plane(new T.Vector3(0, -1, 0), CORTE_H);
  const OFF = new T.Vector3(-4.5, 0, -3.6), ALT = 2.7, ESP = 0.12, OLHO = 1.6;
  const AP = { plantas: [], poltronas: [], rooms: [], moveis: new T.Group(), pessoas: [], tampas: [], luzes: [], brilhos: [], cotas: [], cotaG: new T.Group(), teto: new T.Group() };
  const am = (c, o = {}) => { const m = mat(c, o); m.side = T.DoubleSide; m.clippingPlanes = [CORTE]; m.clipShadows = true; return m; };
  const vidroAp = (cor, op) => { const m = new T.MeshPhysicalMaterial({ color: cor, roughness: 0.03, metalness: 0.05, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.4 }); m.clippingPlanes = [CORTE]; return m; };
  const uvEsc = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
  // texturas
  const TA = {
    carvalho: tex(512, 512, (g, w, h) => { const linhas = 6, ph = h / linhas; for (let r = 0; r < linhas; r++) { let x = -rnd() * 200; while (x < w) { const L = 160 + rnd() * 260, t = rnd(); g.fillStyle = `rgb(${168 + t * 30},${122 + t * 24},${80 + t * 18})`; g.fillRect(x, r * ph, L, ph); for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(110,70,35,${0.07 + rnd() * 0.1})`; g.beginPath(); const y = r * ph + rnd() * ph; g.moveTo(x, y); g.bezierCurveTo(x + L * 0.3, y + rnd() * 6 - 3, x + L * 0.7, y + rnd() * 6 - 3, x + L, y); g.stroke(); } g.fillStyle = "rgba(60,35,15,.55)"; g.fillRect(x, r * ph, 1.5, ph); x += L; } g.fillStyle = "rgba(60,35,15,.6)"; g.fillRect(0, r * ph, w, 1.5); } }),
    porc: tex(512, 512, (g, w, h) => { g.fillStyle = "#d9d5ce"; g.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(150,145,138,${0.08 + rnd() * 0.12})`; g.lineWidth = 0.6 + rnd() * 1.4; g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rnd() * 120 - 40; y += rnd() * 80 - 40; g.lineTo(x, y); } g.stroke(); } ruido(g, w, h, 3000, 0.12, ["#c7c2ba", "#ece9e4"]); g.fillStyle = "rgba(120,115,108,.6)"; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(0, h / 2, w, 2); g.fillRect(w / 2, 0, 2, h); }),
    ban: tex(256, 256, (g, w, h) => { g.fillStyle = "#c9ccce"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const t = rnd() * 10; g.fillStyle = `rgb(${226 + t},${228 + t},${230 + t})`; g.fillRect(x + 1.5, y + 1.5, 29, 29); } }),
    azulejo: tex(256, 256, (g, w, h) => { g.fillStyle = "#b9c0c4"; g.fillRect(0, 0, w, h); for (let r = 0; r < h / 21; r++) for (let c = -1; c < w / 64 + 1; c++) { const x = c * 64 + (r % 2 ? 32 : 0), t = rnd() * 8; g.fillStyle = `rgb(${236 + t},${240 + t},${241 + t})`; g.fillRect(x + 1.5, r * 21.33 + 1.5, 61, 18); } }, [1, 1]),
    deck: tex(512, 512, (g, w, h) => { for (let x = 0; x < w; x += 64) { const t = rnd(); g.fillStyle = `rgb(${120 + t * 25},${92 + t * 18},${70 + t * 12})`; g.fillRect(x, 0, 62, h); for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(70,45,25,${0.08 + rnd() * 0.08})`; g.fillRect(x + rnd() * 60, 0, 1, h); } } }),
    tapete: tex(512, 512, (g, w, h) => { g.fillStyle = "#cdbfa9"; g.fillRect(0, 0, w, h); ruido(g, w, h, 8000, 0.25, ["#b6a78f", "#ddd1bd"]); g.strokeStyle = "#8a7660"; g.lineWidth = 10; g.strokeRect(26, 26, w - 52, h - 52); g.lineWidth = 3; g.strokeRect(48, 48, w - 96, h - 96); }),
    tapete2: tex(256, 256, (g, w, h) => { g.fillStyle = "#7d8f9c"; g.fillRect(0, 0, w, h); ruido(g, w, h, 5000, 0.3, ["#6b7c88", "#93a4b0"]); g.strokeStyle = "rgba(240,236,228,.6)"; g.lineWidth = 3; for (let r = 30; r < 128; r += 26) { g.beginPath(); g.arc(w / 2, h / 2, r, 0, 7); g.stroke(); } }),
    marmore: tex(512, 256, (g, w, h) => { g.fillStyle = "#f1efeb"; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { g.strokeStyle = `rgba(140,138,135,${0.15 + rnd() * 0.2})`; g.lineWidth = 0.5 + rnd() * 1.5; g.beginPath(); let x = rnd() * w, y = 0; g.moveTo(x, y); while (y < h) { x += rnd() * 40 - 20; y += 15 + rnd() * 20; g.lineTo(x, y); } g.stroke(); } }),
    madeiraMovel: tex(256, 256, (g, w, h) => { g.fillStyle = "#b08559"; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(110,72,38,${0.06 + rnd() * 0.1})`; g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + rnd() * 8 - 4, w * 0.7, y + rnd() * 8 - 4, w, y); g.stroke(); } }),
    nogueira: tex(256, 256, (g, w, h) => { g.fillStyle = "#5e4030"; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(35,20,10,${0.1 + rnd() * 0.15})`; g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + rnd() * 8 - 4, w * 0.7, y + rnd() * 8 - 4, w, y); g.stroke(); } }),
    tela: tex(512, 288, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f2a65a"); gr.addColorStop(0.55, "#e0677a"); gr.addColorStop(1, "#3b2f5c"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#ffd59a"; g.beginPath(); g.arc(w * 0.62, h * 0.52, 34, 0, 7); g.fill(); [["#4a3a6a", 0.62], ["#2b2348", 0.75], ["#1a1630", 0.88]].forEach(([c, b]) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 32) g.lineTo(x, h * b - Math.abs(Math.sin(x * 0.013 + b * 9)) * 60); g.lineTo(w, h); g.fill(); }); }),
    arte1: tex(256, 160, (g, w, h) => { g.fillStyle = "#efe8dc"; g.fillRect(0, 0, w, h); g.fillStyle = "#c55a3d"; g.beginPath(); g.arc(90, 90, 46, 0, 7); g.fill(); g.fillStyle = "#2f4b5c"; g.fillRect(140, 30, 70, 100); g.fillStyle = "#e6b85c"; g.fillRect(40, 120, 120, 10); }),
    arte2: tex(160, 256, (g, w, h) => { g.fillStyle = "#24343d"; g.fillRect(0, 0, w, h); g.strokeStyle = "#e9dfcf"; g.lineWidth = 3; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(w / 2, h, 30 + i * 22, Math.PI, 0); g.stroke(); } }),
  };
  function ceuTex(noite) {
    const r = rng(41);
    return tex(4096, 1024, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h * 0.7);
      if (noite) { gr.addColorStop(0, "#04070f"); gr.addColorStop(1, "#1d2440"); } else { gr.addColorStop(0, "#5f93c9"); gr.addColorStop(1, "#dce8f1"); }
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      if (!noite) { g.fillStyle = "rgba(255,255,255,.55)"; for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h * 0.35; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + k * 22, y + r() * 8, 40 + r() * 30, 10 + r() * 8, 0, 0, 7); g.fill(); } } }
      [[0.47, 0.18, ["#aebdca", "#151c2c"]], [0.55, 0.14, ["#91a1af", "#10151f"]], [0.66, 0.1, ["#76838f", "#0b0f17"]]].forEach(([base, var_, cores]) => {
        let x = 0;
        while (x < w) {
          const bw = 70 + r() * 190, top = h * base - r() * h * var_;
          g.fillStyle = noite ? cores[1] : cores[0]; g.fillRect(x, top, bw, h - top);
          for (let yy = top + 10; yy < h; yy += 14) for (let xx = x + 8; xx < x + bw - 8; xx += 12) if (r() < (noite ? 0.32 : 0.6)) { g.fillStyle = noite ? (r() < 0.8 ? "#f3c98b" : "#bcd6ff") : "rgba(50,70,90,.3)"; g.fillRect(xx, yy, 5, 6); }
          x += bw + 4 + r() * 10;
        }
      });
      g.fillStyle = noite ? "#05070b" : "#59616b"; g.fillRect(0, h * 0.94, w, h * 0.06);
    });
  }
  const CEU = { dia: ceuTex(false), noite: ceuTex(true) };
  const A = {
    parede: am(0xe7e2d9, { r: 0.92 }), rodape: am(0xf7f6f3, { r: 0.4 }), batente: am(0xf3f2ef, { r: 0.35 }), folhaPorta: am(0xf1efea, { r: 0.3 }), entrada: am(0xffffff, { map: TA.nogueira, r: 0.45 }),
    alu: am(0x2b2d31, { r: 0.35, m: 0.7 }), peitoril: am(0xffffff, { map: TA.marmore, r: 0.15 }), vidro: vidroAp(0xdcecf5, 0.16), vidroBox: vidroAp(0xe8f4f8, 0.22),
    espelho: (() => { const m = new T.MeshStandardMaterial({ color: 0xd8e2e8, roughness: 0.02, metalness: 1, envMapIntensity: 1.3 }); m.clippingPlanes = [CORTE]; return m; })(),
    tecido: am(0x5b5c57, { r: 0.97 }), tecido2: am(0x2b3742, { r: 0.97 }), tecidoClaro: am(0xcfc5b4, { r: 0.97 }), almofada1: am(0xc55a3d, { r: 0.95 }), almofada2: am(0xe6b85c, { r: 0.95 }), almofada3: am(0x2f4b5c, { r: 0.95 }),
    madeira: am(0xffffff, { map: TA.madeiraMovel, r: 0.55 }), nogueira: am(0xffffff, { map: TA.nogueira, r: 0.5 }), preto: am(0x1d1e21, { r: 0.4, m: 0.4 }), pretoFosco: am(0x26272a, { r: 0.8 }),
    grafite: am(0x3b3e44, { r: 0.6 }), brancoLaca: am(0xf2f1ee, { r: 0.28 }), quartzo: am(0xffffff, { map: TA.marmore, r: 0.18 }), inox: am(0xc3c6ca, { r: 0.28, m: 0.95 }), latao: am(0xc8a464, { r: 0.3, m: 0.9 }),
    ceramica: am(0xfbfbfa, { r: 0.12 }), azulejo: am(0xffffff, { map: TA.azulejo, r: 0.2 }), lencol: am(0xf3f1ec, { r: 0.95 }), edredom: am(0xb8c3c9, { r: 0.97 }), edredom2: am(0xd9a77a, { r: 0.97 }), linho: am(0xe9e2d6, { r: 0.98, op: 0.93 }),
    vaso: am(0xb6643f, { r: 0.85 }), vasoConcreto: am(0x9a9893, { r: 0.9 }), folha: am(0x3f6b3a, { r: 0.7 }), folha2: am(0x557f3f, { r: 0.7 }), terra2: am(0x3a2a1f),
    pedra: am(0x5c5b58, { r: 0.85 }), tapete: am(0xffffff, { map: TA.tapete, r: 1 }), tapete2: am(0xffffff, { map: TA.tapete2, r: 1 }), livro: [0xc55a3d, 0x2f4b5c, 0xe6b85c, 0x6b8f71, 0xe9e2d6].map((c) => am(c, { r: 0.8 })),
    tela: (() => { const m = new T.MeshBasicMaterial({ map: TA.tela }); m.clippingPlanes = [CORTE]; return m; })(),
    lampada: new T.MeshStandardMaterial({ color: 0xfff3dd, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.6 }),
    cupula: new T.MeshStandardMaterial({ color: 0xf1e8d8, emissive: 0xffc98a, emissiveIntensity: 0, roughness: 0.9, side: T.DoubleSide }),
    tampa: new T.MeshBasicMaterial({ color: 0x2b2e34 }), teto: new T.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.95, side: T.DoubleSide }),
  };
  A.cupula.clippingPlanes = [CORTE];
  // geometria arredondada (estofados, colchões)
  const rgCache = new Map();
  function rgeo(w, h, d, r = 0.03) {
    const k = [w, h, d, r].map((v) => v.toFixed(3)).join();
    if (rgCache.has(k)) return rgCache.get(k);
    r = Math.min(r, w * 0.45, h * 0.45, d * 0.45);
    const iw = w - 2 * r, ih = h - 2 * r, c = Math.min(iw, ih) * 0.25, s = new T.Shape();
    s.moveTo(-iw / 2 + c, -ih / 2); s.lineTo(iw / 2 - c, -ih / 2); s.quadraticCurveTo(iw / 2, -ih / 2, iw / 2, -ih / 2 + c); s.lineTo(iw / 2, ih / 2 - c); s.quadraticCurveTo(iw / 2, ih / 2, iw / 2 - c, ih / 2);
    s.lineTo(-iw / 2 + c, ih / 2); s.quadraticCurveTo(-iw / 2, ih / 2, -iw / 2, ih / 2 - c); s.lineTo(-iw / 2, -ih / 2 + c); s.quadraticCurveTo(-iw / 2, -ih / 2, -iw / 2 + c, -ih / 2);
    let g = new T.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 3 });
    g.translate(0, 0, -(d - 2 * r) / 2); g.deleteAttribute("uv"); g.deleteAttribute("normal");
    g = T.BufferGeometryUtils.mergeVertices(g, 1e-4); g.computeVertexNormals();
    rgCache.set(k, g); return g;
  }
  const sombra = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const rb = (p, w, h, d, m, x, y, z, r = 0.03) => { const ms = sombra(new T.Mesh(rgeo(w, h, d, r), m)); ms.position.set(x, y, z); p.add(ms); return ms; };
  const bx = (p, w, h, d, m, x, y, z) => { const ms = sombra(new T.Mesh(new T.BoxGeometry(w, h, d), m)); ms.position.set(x, y, z); p.add(ms); return ms; };
  const cl = (p, r1, r2, h, m, x, y, z, seg = 20) => { const ms = sombra(new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg), m)); ms.position.set(x, y, z); p.add(ms); return ms; };
  const grupo = (p, x, z, rot = 0, y = 0) => { const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = rot; p.add(g); return g; };
  const ROOMS = [
    { n: "Varanda gourmet", x: 0, z: -1.9, w: 5.2, d: 1.9, p: "deck", ext: true, v: [[4.3, -0.35], [0, -1.9]] },
    { n: "Sala de estar e jantar", x: 0, z: 0, w: 5.2, d: 4.6, p: "mad", v: [[4.85, 0.4], [0.3, 3.4]] },
    { n: "Cozinha", x: 5.2, z: 0, w: 3.8, d: 2.8, p: "por", v: [[6.2, 2.55], [8.6, 0.5]] },
    { n: "Banho social", x: 5.2, z: 2.8, w: 1.8, d: 1.8, p: "ban", v: [[6.0, 4.45], [5.5, 3.1]] },
    { n: "Lavanderia", x: 7.0, z: 2.8, w: 2.0, d: 1.8, p: "por", v: [[7.6, 3.0], [8.9, 4.2]] },
    { n: "Circulação", x: 0, z: 4.6, w: 9, d: 1.0, p: "mad", mini: true, v: [[0.45, 5.1], [8.9, 5.1]] },
    { n: "Suíte", x: 0, z: 5.6, w: 4.2, d: 3.4, p: "mad", v: [[3.7, 6.55], [0.4, 7.9]] },
    { n: "Banho suíte", x: 4.2, z: 5.6, w: 1.6, d: 2.0, p: "ban", v: [[4.45, 6.75], [5.7, 6.0]] },
    { n: "Closet", x: 4.2, z: 7.6, w: 1.6, d: 1.4, p: "mad", v: [[4.45, 8.3], [5.7, 8.3]] },
    { n: "Quarto 2", x: 5.8, z: 5.6, w: 3.2, d: 3.4, p: "mad", v: [[6.6, 6.05], [8.6, 8.5]] },
  ];
  const fmtM = (v) => num(v, 2).replace(/,(\d)$/, ",$10");
  const G = new T.Group(); G.position.copy(OFF); apto.scene.add(G);
  // luzes
  AP.hemi = new T.HemisphereLight(0xe8eef5, 0x3a3128, 0.35); apto.scene.add(AP.hemi);
  AP.sol = new T.DirectionalLight(0xffecd2, 1.6); AP.sol.position.set(-9, 14, -12); AP.sol.castShadow = true; AP.sol.shadow.mapSize.set(SOMBRA, SOMBRA);
  Object.assign(AP.sol.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 50 }); AP.sol.shadow.bias = -0.0004; AP.sol.shadow.normalBias = 0.02; apto.scene.add(AP.sol);
  [[1.8, 2.3], [4.15, 3.45], [7.2, 1.4], [2.0, 7.3], [7.4, 7.6], [2.6, -0.9]].forEach(([x, z]) => { const l = new T.PointLight(0xffd3a0, 0, 7, 2); l.position.set(x + OFF.x, 2.35, z + OFF.z); apto.scene.add(l); AP.luzes.push(l); });
  // laje, céu, chão de referência
  bx(G, 9.6, 0.25, 11.3, am(0x8f8d88, { map: TX.conc, r: 0.9 }), 4.5, -0.13, 3.55);
  AP.grade = new T.Group(); apto.scene.add(AP.grade);
  AP.grade.add(box(60, 0.05, 60, new T.MeshBasicMaterial({ color: 0x15171b }), 0, -0.3, 0, false));
  const gr0 = new T.GridHelper(60, 60, 0x252a33, 0x1c1f25); gr0.position.y = -0.27; AP.grade.add(gr0);
  AP.ceu = new T.Mesh(new T.CylinderGeometry(70, 70, 90, 64, 1, true), new T.MeshBasicMaterial({ map: CEU.dia, side: T.BackSide, toneMapped: false, fog: false }));
  AP.ceu.position.y = -18; apto.scene.add(AP.ceu);
  const chaoLonge = new T.Mesh(new T.CircleGeometry(70, 48), new T.MeshBasicMaterial({ color: 0x3d434a })); chaoLonge.rotation.x = -Math.PI / 2; chaoLonge.position.y = -60; AP.ceu.add(chaoLonge); chaoLonge.position.y = -42;
  // pisos
  const pisoMap = { mad: TA.carvalho, por: TA.porc, ban: TA.ban, deck: TA.deck }, pisoEsc = { mad: 2.2, por: 1.2, ban: 0.25, deck: 1.4 };
  ROOMS.forEach((r) => {
    const geo = uvEsc(new T.BoxGeometry(r.w, 0.04, r.d), r.w / pisoEsc[r.p], r.d / pisoEsc[r.p]);
    const m = new T.MeshStandardMaterial({ map: pisoMap[r.p], roughness: r.p === "mad" ? 0.5 : r.p === "deck" ? 0.75 : 0.22, metalness: 0, envMapIntensity: 0.8 });
    const f = new T.Mesh(geo, m); f.position.set(r.x + r.w / 2, 0.02, r.z + r.d / 2); f.receiveShadow = true; G.add(f);
    const room = { ...r, mesh: f, area: +(r.w * r.d).toFixed(2) }; AP.rooms.push(room);
    if (!r.mini) room.lbl = label(apto, `${esc(r.n)}<small>${num(room.area, 1)} m²</small>`, new T.Vector3(r.x + r.w / 2, 0.15, r.z + r.d / 2).add(OFF), "room", () => ui.apMode === "planta");
  });
  // paredes, portas e janelas
  function abertura(g, o) {
    const { a, w, b, h } = o;
    if (o.t === "porta" || o.t === "entrada") {
      bx(g, 0.06, h + 0.06, ESP + 0.04, A.batente, a + 0.03, (h + 0.06) / 2, 0); bx(g, 0.06, h + 0.06, ESP + 0.04, A.batente, a + w - 0.03, (h + 0.06) / 2, 0); bx(g, w, 0.06, ESP + 0.04, A.batente, a + w / 2, h + 0.03, 0);
      const piv = new T.Group(); piv.position.set(a + 0.06, 0, 0); piv.rotation.y = -(o.t === "entrada" ? 0.12 : 1.25) * o.lado; g.add(piv);
      bx(piv, w - 0.12, h - 0.01, 0.035, o.t === "entrada" ? A.entrada : A.folhaPorta, (w - 0.12) / 2, h / 2, 0);
      [-1, 1].forEach((s) => { bx(piv, 0.12, 0.02, 0.02, A.inox, w - 0.24, 1.02, s * 0.04); });
    } else if (o.t === "janela") {
      bx(g, w + 0.12, 0.03, ESP + 0.1, A.peitoril, a + w / 2, b - 0.015, 0);
      [[w, 0.05, a + w / 2, b + 0.025], [w, 0.05, a + w / 2, b + h - 0.025]].forEach(([ww, hh, x, y]) => bx(g, ww, hh, 0.08, A.alu, x, y, 0));
      [a + 0.025, a + w / 2, a + w - 0.025].forEach((x) => bx(g, 0.05, h, 0.08, A.alu, x, b + h / 2, 0));
      [[a + w * 0.25, -0.015], [a + w * 0.75, 0.015]].forEach(([x, z]) => { const v = new T.Mesh(new T.BoxGeometry(w / 2 - 0.05, h - 0.1, 0.008), A.vidro); v.position.set(x, b + h / 2, z); g.add(v); });
    } else if (o.t === "vidro") {
      bx(g, w, 0.05, 0.1, A.alu, a + w / 2, h - 0.025, 0); bx(g, w, 0.03, 0.12, A.alu, a + w / 2, 0.015, 0);
      for (let i = 0; i <= 4; i++) bx(g, 0.05, h, 0.09, A.alu, a + (w / 4) * i, h / 2, (i % 2 ? 0.02 : -0.02));
      for (let i = 0; i < 4; i++) { const v = new T.Mesh(new T.BoxGeometry(w / 4 - 0.05, h - 0.08, 0.008), A.vidro); v.position.set(a + (w / 4) * (i + 0.5), h / 2, i % 2 ? 0.02 : -0.02); g.add(v); }
    }
  }
  function parede(x1, z1, x2, z2, ab = []) {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), g = new T.Group();
    g.position.set(x1, 0, z1); g.rotation.y = Math.atan2(-dz, dx); G.add(g);
    const ini = -ESP / 2, fim = len + ESP / 2, ops = ab.slice().sort((p, q) => p.a - q.a);
    const solido = (u0, u1, y0, y1) => {
      if (u1 - u0 < 0.005 || y1 - y0 < 0.005) return;
      const m = sombra(new T.Mesh(new T.BoxGeometry(u1 - u0, y1 - y0, ESP), A.parede)); m.position.set((u0 + u1) / 2, (y0 + y1) / 2, 0); g.add(m);
      if (y0 < 0.01) bx(g, u1 - u0, 0.07, ESP + 0.02, A.rodape, (u0 + u1) / 2, 0.035, 0);
    };
    let u = ini;
    ops.forEach((o) => { solido(u, o.a, 0, ALT); solido(o.a, o.a + o.w, 0, o.b); solido(o.a, o.a + o.w, o.b + o.h, ALT); abertura(g, o); u = o.a + o.w; });
    solido(u, fim, 0, ALT);
    const tampa = (u0, u1) => { if (u1 - u0 < 0.01) return; const t = new T.Mesh(new T.BoxGeometry(u1 - u0, 0.012, ESP + 0.006), A.tampa); t.position.set((u0 + u1) / 2, CORTE_H, 0); g.add(t); AP.tampas.push(t); };
    let cu = ini; ops.filter((o) => o.b < CORTE_H && o.b + o.h > CORTE_H).forEach((o) => { tampa(cu, o.a); cu = o.a + o.w; }); tampa(cu, fim);
    return g;
  }
  const P_ = (a, w, lado, t = "porta") => ({ a, w, b: 0, h: 2.1, t, lado });
  const J_ = (a, w, b, h) => ({ a, w, b, h, t: "janela" });
  [
    [0, 0, 0, 4.6], [0, 4.6, 0, 5.6, [P_(0.05, 0.9, -1, "entrada")]], [0, 5.6, 0, 9], [0, 9, 4.2, 9, [J_(0.9, 2.4, 0.95, 1.3)]], [4.2, 9, 5.8, 9], [5.8, 9, 9, 9, [J_(0.8, 1.8, 0.95, 1.3)]],
    [9, 9, 9, 4.6], [9, 4.6, 9, 2.8, [J_(0.5, 0.8, 1.5, 0.6)]], [9, 2.8, 9, 0], [9, 0, 5.2, 0, [J_(0.8, 1.6, 1.1, 1.0)]], [0, 0, 5.2, 0, [{ a: 0.08, w: 5.04, b: 0, h: 2.45, t: "vidro" }]], [5.2, 0, 5.2, -1.9],
    [5.2, 0, 5.2, 0.6], [5.2, 2.8, 5.2, 4.6], [5.2, 2.8, 7.0, 2.8], [7.0, 2.8, 9, 2.8, [P_(0.2, 0.8, 1)]], [7.0, 2.8, 7.0, 4.6],
    [0, 4.6, 5.2, 4.6, [{ a: 3.8, w: 1.2, b: 0, h: 2.3, t: "vao" }]], [5.2, 4.6, 7.0, 4.6, [P_(0.3, 0.75, -1)]], [7.0, 4.6, 9, 4.6],
    [0, 5.6, 4.2, 5.6, [P_(3.2, 0.8, 1)]], [4.2, 5.6, 5.8, 5.6], [5.8, 5.6, 9, 5.6, [P_(0.3, 0.8, 1)]],
    [4.2, 5.6, 4.2, 7.6, [P_(0.4, 0.75, -1)]], [4.2, 7.6, 4.2, 9, [{ a: 0.2, w: 1.0, b: 0, h: 2.2, t: "vao" }]], [4.2, 7.6, 5.8, 7.6], [5.8, 5.6, 5.8, 9],
  ].forEach(([a, b, c, d, ab]) => parede(a, b, c, d, ab));
  // guarda-corpo de vidro da varanda
  [[0, -1.9, 5.2, -1.9], [0, -1.9, 0, 0]].forEach(([x1, z1, x2, z2]) => {
    const hor = z1 === z2, L = hor ? x2 - x1 : z2 - z1, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const v = new T.Mesh(new T.BoxGeometry(hor ? L : 0.012, 1.05, hor ? 0.012 : L), A.vidro); v.position.set(cx, 0.55, cz); G.add(v);
    bx(G, hor ? L + 0.04 : 0.06, 0.04, hor ? 0.06 : L + 0.04, A.alu, cx, 1.1, cz); bx(G, hor ? L : 0.1, 0.05, hor ? 0.1 : L, A.alu, cx, 0.025, cz);
  });
  // teto com spots (só no modo "andar")
  G.add(AP.teto);
  const teto = new T.Mesh(new T.PlaneGeometry(9.12, 11.02), A.teto); teto.rotation.x = Math.PI / 2; teto.position.set(4.5, ALT, 3.55); AP.teto.add(teto);
  const spotG = new T.CircleGeometry(0.045, 16);
  [[1.2, 1.2], [1.2, 3.4], [2.6, 1.2], [2.6, 3.4], [3.6, 0.6], [6.4, 1.0], [7.8, 1.0], [6.4, 2.0], [7.8, 2.0], [1, 5.1], [3, 5.1], [5, 5.1], [7, 5.1], [1.2, 6.4], [3, 6.4], [1.2, 8.3], [3, 8.3], [6.8, 6.6], [8.2, 6.6], [6.8, 8.2], [8.2, 8.2], [6.1, 3.7], [8, 3.7], [5, 6.6], [5, 8.3], [1.3, -0.95], [3.9, -0.95]].forEach(([x, z]) => { const s = new T.Mesh(spotG, A.lampada); s.rotation.x = Math.PI / 2; s.position.set(x, ALT - 0.005, z); AP.teto.add(s); });

  // ---------- Móveis em tamanho real ----------
  const MV = AP.moveis; G.add(MV);
  const pernas = (p, w, d, h, m, r = 0.018, ins = 0.05) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cl(p, r, r * 0.8, h, m, a * (w / 2 - ins), h / 2, b * (d / 2 - ins), 8));
  function sofa(p, x, z, rot, len = 2.2, m = A.tecido) {
    const g = grupo(p, x, z, rot), n = len > 1.2 ? 3 : 1, cw = (len - 0.34) / n;
    pernas(g, len - 0.1, 0.8, 0.08, A.preto, 0.015);
    rb(g, len, 0.22, 0.92, m, 0, 0.19, 0, 0.03);
    for (let i = 0; i < n; i++) { rb(g, cw - 0.01, 0.15, 0.66, m, -len / 2 + 0.17 + cw * (i + 0.5), 0.375, 0.1, 0.05); const enc = rb(g, cw - 0.02, 0.44, 0.2, m, -len / 2 + 0.17 + cw * (i + 0.5), 0.66, -0.28, 0.07); enc.rotation.x = -0.12; }
    rb(g, len, 0.42, 0.16, m, 0, 0.5, -0.38, 0.03);
    [-1, 1].forEach((s) => rb(g, 0.17, 0.36, 0.92, m, s * (len / 2 - 0.085), 0.47, 0, 0.05));
    if (n > 1) { const a1 = rb(g, 0.44, 0.42, 0.13, A.almofada1, -len / 2 + 0.42, 0.62, -0.16, 0.05); a1.rotation.set(-0.25, 0.25, 0.08); const a2 = rb(g, 0.42, 0.42, 0.13, A.almofada3, len / 2 - 0.42, 0.62, -0.16, 0.05); a2.rotation.set(-0.25, -0.2, -0.06); const a3 = rb(g, 0.36, 0.36, 0.12, A.almofada2, len / 2 - 0.72, 0.6, -0.1, 0.05); a3.rotation.set(-0.3, 0.1, 0.1); }
    return g;
  }
  function cadeira(p, x, z, rot, assento = A.tecidoClaro, est = A.madeira) {
    const g = grupo(p, x, z, rot); pernas(g, 0.44, 0.44, 0.45, est, 0.016, 0.04);
    rb(g, 0.46, 0.06, 0.46, assento, 0, 0.47, 0, 0.02); const enc = rb(g, 0.44, 0.38, 0.04, est, 0, 0.75, -0.21, 0.015); enc.rotation.x = -0.1;
    [-0.18, 0.18].forEach((dx) => bx(g, 0.03, 0.42, 0.03, est, dx, 0.66, -0.2));
    return g;
  }
  function planta(p, x, z, alt = 1.3, vaso = A.vaso, rot = 0) {
    const g = grupo(p, x, z, rot), r = rng(hashStr(x + "," + z));
    cl(g, 0.2, 0.15, 0.4, vaso, 0, 0.2, 0, 20); cl(g, 0.18, 0.18, 0.02, A.terra2, 0, 0.39, 0);
    const n = Math.round(9 + alt * 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r(), h = 0.4 + r() * (alt - 0.4), inc = 0.25 + r() * 0.5;
      const haste = new T.Mesh(new T.CylinderGeometry(0.006, 0.008, h, 5), A.folha); haste.position.set(Math.sin(a) * h * inc * 0.5, 0.4 + (h / 2) * Math.cos(inc), Math.cos(a) * h * inc * 0.5); haste.rotation.set(Math.cos(a) * inc, 0, -Math.sin(a) * inc); g.add(haste);
      const f = sombra(new T.Mesh(new T.SphereGeometry(1, 10, 6), r() < 0.5 ? A.folha : A.folha2)); f.scale.set(0.09 + r() * 0.06, 0.012, 0.16 + r() * 0.08);
      f.position.set(Math.sin(a) * h * inc, 0.4 + h * Math.cos(inc), Math.cos(a) * h * inc); f.rotation.set(0.4 + r() * 0.5, a, 0); g.add(f);
    }
    AP.plantas.push({ g, alt });
    return g;
  }
  function luminaria(p, x, z, h, rCup = 0.2) { // pendente ou de chão
    const g = grupo(p, x, z);
    const cup = sombra(new T.Mesh(new T.CylinderGeometry(rCup * 0.55, rCup, rCup * 0.9, 24, 1, true), A.cupula)); cup.position.y = h; cup.castShadow = false; g.add(cup);
    const b = new T.Mesh(new T.SphereGeometry(0.04, 12, 8), A.lampada); b.position.y = h - 0.05; g.add(b);
    return g;
  }
  function cama(p, x, z, rot, larg, comp, cor = A.edredom, cab = A.tecido2) {
    const g = grupo(p, x, z, rot);
    pernas(g, larg, comp, 0.12, A.preto, 0.02); rb(g, larg + 0.02, 0.24, comp + 0.02, A.tecidoClaro, 0, 0.24, 0, 0.02);
    rb(g, larg, 0.26, comp, A.lencol, 0, 0.49, 0, 0.06);
    const ed = rb(g, larg + 0.08, 0.07, comp * 0.68, cor, 0, 0.63, comp * 0.16, 0.035); ed.scale.y = 1;
    rb(g, larg + 0.1, 0.03, 0.45, A.almofada2, 0, 0.67, comp * 0.36, 0.015);
    const np = larg > 1.2 ? 2 : 1;
    for (let i = 0; i < np; i++) { const tr = rb(g, 0.5, 0.14, 0.34, A.lencol, np > 1 ? (i - 0.5) * 0.66 : 0, 0.7, -comp / 2 + 0.25, 0.06); tr.rotation.x = -0.25; }
    rb(g, larg + 0.24, larg > 1.2 ? 1.15 : 0.95, 0.09, cab, 0, larg > 1.2 ? 0.6 : 0.5, -comp / 2 - 0.05, 0.035);
    return g;
  }
  function criado(p, x, z, rot) {
    const g = grupo(p, x, z, rot); rb(g, 0.46, 0.46, 0.4, A.madeira, 0, 0.36, 0, 0.012); bx(g, 0.4, 0.004, 0.003, A.preto, 0, 0.36, 0.201); pernas(g, 0.42, 0.36, 0.13, A.preto, 0.012, 0.03);
    cl(g, 0.07, 0.09, 0.03, A.ceramica, 0.08, 0.605, -0.02); cl(g, 0.012, 0.012, 0.3, A.latao, 0.08, 0.76, -0.02, 8); luminaria(g, 0.08, -0.02, 0.96, 0.13);
    [0, 1].forEach((i) => bx(g, 0.18, 0.025, 0.24, A.livro[i], -0.1, 0.6 + i * 0.026, 0.02));
    return g;
  }
  function armario(p, x, z, rot, w, h, d, cor, portas, y = 0, puxador = "v") {
    const g = grupo(p, x, z, rot, y); bx(g, w, h, d, cor, 0, h / 2, 0);
    const pw = w / portas;
    for (let i = 1; i < portas; i++) bx(g, 0.004, h - 0.01, 0.004, A.preto, -w / 2 + i * pw, h / 2, d / 2 + 0.001);
    for (let i = 0; i < portas; i++) { const cx = -w / 2 + (i + 0.5) * pw; if (puxador === "v") bx(g, 0.012, Math.min(0.5, h * 0.3), 0.02, A.inox, cx + (i % 2 ? -pw / 2 + 0.05 : pw / 2 - 0.05), h * 0.55, d / 2 + 0.012); else bx(g, Math.min(0.3, pw * 0.5), 0.012, 0.02, A.inox, cx, h - 0.06, d / 2 + 0.012); }
    return g;
  }
  function quadro(p, x, y, z, rot, w, h, m) { const g = grupo(p, x, z, rot, y); bx(g, w + 0.04, h + 0.04, 0.03, A.preto, 0, 0, 0); const t = new T.Mesh(new T.PlaneGeometry(w, h), m); t.position.z = 0.016; g.add(t); return g; }
  function cortina(p, x1, x2, z, lado) {
    [[x1 - 0.15, x1 + 0.35], [x2 - 0.35, x2 + 0.15]].forEach(([a, b]) => {
      const w = b - a, geo = new T.PlaneGeometry(w, 2.55, 36, 1), pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 42) * 0.035);
      geo.computeVertexNormals(); const c = sombra(new T.Mesh(geo, A.linho)); c.position.set((a + b) / 2, 1.3, z + lado * 0.12); p.add(c);
    });
    bx(p, x2 - x1 + 0.5, 0.025, 0.025, A.preto, (x1 + x2) / 2, 2.6, z + lado * 0.12);
  }
  function vaso(p, x, z, rot) { // vaso sanitário, frente para +z local
    const g = grupo(p, x, z, rot);
    const base = sombra(new T.Mesh(new T.CylinderGeometry(0.17, 0.13, 0.38, 24), A.ceramica)); base.scale.z = 1.4; base.position.set(0, 0.19, 0.05); g.add(base);
    const ass = sombra(new T.Mesh(new T.TorusGeometry(0.15, 0.025, 8, 28), A.ceramica)); ass.rotation.x = Math.PI / 2; ass.scale.y = 1.3; ass.position.set(0, 0.4, 0.07); g.add(ass);
    rb(g, 0.36, 0.34, 0.16, A.ceramica, 0, 0.5, -0.2, 0.03);
    return g;
  }
  function gabinete(p, x, z, rot, w, comEspelho = true) {
    const g = grupo(p, x, z, rot); rb(g, w, 0.42, 0.46, A.madeira, 0, 0.62, 0, 0.01); bx(g, w + 0.02, 0.025, 0.5, A.quartzo, 0, 0.845, 0.01);
    const cuba = sombra(new T.Mesh(new T.CylinderGeometry(0.2, 0.16, 0.12, 28), A.ceramica)); cuba.scale.z = 0.8; cuba.position.set(0, 0.92, 0.04); g.add(cuba);
    cl(g, 0.014, 0.014, 0.28, A.inox, 0, 1.0, -0.17, 10); bx(g, 0.02, 0.02, 0.15, A.inox, 0, 1.13, -0.1);
    if (comEspelho) { bx(g, w - 0.05, 0.75, 0.015, A.espelho, 0, 1.5, -0.222); bx(g, w - 0.1, 0.02, 0.03, A.lampada, 0, 1.9, -0.21); }
    rb(g, 0.06, 0.4, 0.3, A.edredom, w / 2 + 0.06, 0.95, -0.12, 0.02);
    return g;
  }
  function box_(p, x0, x1, z0, z1, ladoPorta) { // box de banho com piso escuro, vidro e chuveiro
    bx(p, x1 - x0, 0.01, z1 - z0, A.grafite, (x0 + x1) / 2, 0.045, (z0 + z1) / 2);
    ladoPorta.forEach(([tipo, v]) => { const L = tipo === "x" ? z1 - z0 : x1 - x0; const vg = new T.Mesh(new T.BoxGeometry(tipo === "x" ? 0.01 : L, 1.95, tipo === "x" ? L : 0.01), A.vidroBox); vg.position.set(tipo === "x" ? v : (x0 + x1) / 2, 1.02, tipo === "x" ? (z0 + z1) / 2 : v); p.add(vg); bx(p, tipo === "x" ? 0.02 : L, 0.02, tipo === "x" ? L : 0.02, A.preto, vg.position.x, 2.0, vg.position.z); });
    cl(p, 0.11, 0.11, 0.015, A.inox, (x0 + x1) / 2, 2.15, (z0 + z1) / 2, 24); cl(p, 0.01, 0.01, 0.4, A.inox, (x0 + x1) / 2, 2.35, (z0 + z1) / 2, 8);
  }
  const azulejo = (p, x, z, w, d, h = 2.3) => bx(p, w, h, d, A.azulejo, x, h / 2 + 0.04, z);

  // Sala de estar
  const rip = []; for (let z = 0.62; z < 4.0; z += 0.07) rip.push([0.022, 2.6, 0.04, 0.08, 1.34, z]);
  MV.add(sombra(juntar(rip, A.nogueira, [0])));
  rb(MV, 0.42, 0.42, 2.0, A.nogueira, 0.3, 0.36, 2.3, 0.01); bx(MV, 0.03, 0.4, 1.96, A.preto, 0.515, 0.36, 2.3);
  const tv = grupo(MV, 0.15, 2.3, Math.PI / 2, 1.25); bx(tv, 1.23, 0.71, 0.035, A.preto, 0, 0, 0); const tela = new T.Mesh(new T.PlaneGeometry(1.2, 0.68), A.tela); tela.position.z = 0.019; tv.add(tela);
  bx(MV, 0.3, 0.05, 0.5, A.preto, 0.32, 0.6, 1.7); [0, 1, 2].forEach((i) => bx(MV, 0.2, 0.03, 0.26, A.livro[i + 1], 0.3, 0.6 + i * 0.03, 2.95)); { const pp = planta(MV, 0.32, 3.15, 0.5, A.vasoConcreto); pp.scale.setScalar(0.45); pp.position.y = 0.57; }
  bx(MV, 2.0, 0.012, 3.0, A.tapete, 2.0, 0.046, 2.3);
  AP.sofaSala = sofa(MV, 2.95, 2.3, -Math.PI / 2, 2.2);
  const mc = grupo(MV, 1.75, 2.3); rb(mc, 0.6, 0.04, 1.1, A.madeira, 0, 0.4, 0, 0.012); pernas(mc, 0.56, 1.06, 0.38, A.preto, 0.012, 0.04);
  [0, 1].forEach((i) => bx(mc, 0.22, 0.03, 0.3, A.livro[i * 2], 0.05, 0.435 + i * 0.03, -0.25)); cl(mc, 0.06, 0.04, 0.14, A.ceramica, -0.05, 0.49, 0.25, 16);
  AP.poltronas.push(sofa(MV, 1.55, 0.5, 0.15, 0.85, A.tecido2));
  luminaria(MV, 3.1, 0.75, 1.5, 0.22); cl(MV, 0.14, 0.14, 0.02, A.preto, 3.1, 0.01, 0.75); cl(MV, 0.012, 0.012, 1.45, A.preto, 3.1, 0.73, 0.75, 8);
  planta(MV, 0.4, 0.4, 1.6); planta(MV, 0.45, 4.15, 1.1, A.vasoConcreto);
  armario(MV, 1.7, 4.34, Math.PI, 1.6, 0.72, 0.4, A.nogueira, 4, 0.1, "h"); pernas(grupo(MV, 1.7, 4.34), 1.56, 0.36, 0.1, A.preto, 0.012);
  quadro(MV, 1.7, 1.65, 4.53, Math.PI, 1.2, 0.75, new T.MeshStandardMaterial({ map: TA.arte1, roughness: 0.9 }));
  // jantar
  const mesa = grupo(MV, 4.15, 3.45); cl(mesa, 0.55, 0.55, 0.035, A.madeira, 0, 0.75, 0, 40); cl(mesa, 0.05, 0.07, 0.72, A.preto, 0, 0.37, 0, 12); cl(mesa, 0.28, 0.3, 0.025, A.preto, 0, 0.013, 0, 24);
  AP.mesaJantar = mesa; [0, 1, 2].forEach((i) => { const f = new T.Mesh(new T.SphereGeometry(0.035, 10, 8), am([0xe6b85c, 0xc55a3d, 0x9bbf5a][i])); f.position.set(0.07 + i * 0.05, 0.86, -0.06 + (i % 2) * 0.05); mesa.add(f); });
  [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; cadeira(MV, 4.15 + Math.sin(a) * 0.68, 3.45 + Math.cos(a) * 0.68, a + Math.PI); });
  luminaria(MV, 4.15, 3.45, 1.55, 0.26); cl(MV, 0.004, 0.004, 1.0, A.preto, 4.15, 2.2, 3.45, 4);
  // cozinha
  const K = { base: A.grafite, alto: A.madeira };
  armario(MV, 7.12, 0.36, 0, 3.6, 0.82, 0.58, K.base, 6, 0.1, "h"); bx(MV, 3.66, 0.03, 0.64, A.quartzo, 7.12, 0.935, 0.38);
  armario(MV, 8.64, 1.33, -Math.PI / 2, 1.3, 0.82, 0.58, K.base, 2, 0.1, "h"); bx(MV, 1.32, 0.03, 0.64, A.quartzo, 8.62, 0.935, 1.33).rotation.y = Math.PI / 2;
  bx(MV, 0.55, 0.012, 0.42, A.preto, 7.4, 0.945, 0.36); bx(MV, 0.5, 0.003, 0.37, A.inox, 7.4, 0.952, 0.36);
  cl(MV, 0.014, 0.014, 0.35, A.inox, 7.4, 1.12, 0.12, 10); const bica = new T.Mesh(new T.TorusGeometry(0.1, 0.012, 8, 16, Math.PI), A.inox); bica.position.set(7.4, 1.29, 0.22); bica.rotation.y = Math.PI / 2; MV.add(bica);
  const ct = grupo(MV, 8.62, 1.35, -Math.PI / 2); bx(ct, 0.56, 0.008, 0.5, A.preto, 0, 0.954, 0);
  [[-0.14, -0.12], [0.14, -0.12], [-0.14, 0.12], [0.14, 0.12]].forEach(([a, b]) => { const r = new T.Mesh(new T.TorusGeometry(0.07, 0.006, 6, 24), A.grafite); r.rotation.x = Math.PI / 2; r.position.set(a, 0.96, b); ct.add(r); });
  const panela = grupo(MV, 8.6, 1.22); cl(panela, 0.11, 0.1, 0.13, A.inox, 0, 1.03, 0, 20); bx(panela, 0.14, 0.015, 0.02, A.preto, -0.17, 1.08, 0);
  bx(MV, 0.6, 0.35, 0.5, A.inox, 8.68, 1.75, 1.35); bx(MV, 0.28, 0.75, 0.25, A.inox, 8.82, 2.3, 1.35);
  armario(MV, 5.9, 0.24, 0, 1.2, 0.7, 0.35, K.alto, 2, 1.5); armario(MV, 8.62, 0.24, 0, 0.62, 0.7, 0.35, K.alto, 1, 1.5);
  const gel = grupo(MV, 8.6, 2.38, -Math.PI / 2); rb(gel, 0.7, 1.85, 0.68, A.inox, 0, 0.925, 0, 0.02); bx(gel, 0.69, 0.006, 0.006, A.preto, 0, 1.25, 0.342); [-1, 1].forEach((s) => bx(gel, 0.02, s > 0 ? 0.45 : 0.3, 0.04, A.preto, 0.3, s > 0 ? 0.85 : 1.48, 0.36));
  bx(MV, 0.5, 0.29, 0.38, A.preto, 8.68, 1.1, 0.85);
  armario(MV, 5.5, 1.7, Math.PI / 2, 2.1, 0.82, 0.58, K.base, 4, 0.1, "h"); bx(MV, 0.92, 0.035, 2.16, A.quartzo, 5.36, 0.935, 1.7);
  [1.1, 1.8].forEach((z) => { const b = grupo(MV, 4.72, z); cl(b, 0.19, 0.19, 0.06, A.tecido2, 0, 0.66, 0, 20); [0, 1, 2, 3].forEach((i) => { const l = cl(b, 0.012, 0.012, 0.66, A.preto, Math.sin(i * 1.57) * 0.15, 0.33, Math.cos(i * 1.57) * 0.15, 6); l.rotation.set(Math.cos(i * 1.57) * 0.12, 0, -Math.sin(i * 1.57) * 0.12); }); });
  cl(MV, 0.16, 0.1, 0.08, A.madeira, 5.35, 0.99, 2.3, 24); { const pp = planta(MV, 5.4, 1.0, 0.45, A.ceramica); pp.scale.setScalar(0.4); pp.position.y = 0.95; }
  // lavanderia
  const maq = grupo(MV, 8.62, 4.2, -Math.PI / 2); rb(maq, 0.6, 0.85, 0.6, A.brancoLaca, 0, 0.425, 0, 0.02); const porta = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.03, 28), A.vidroBox); porta.rotation.x = Math.PI / 2; porta.position.set(0, 0.42, 0.31); maq.add(porta); const aro = new T.Mesh(new T.TorusGeometry(0.18, 0.025, 8, 28), A.inox); aro.position.set(0, 0.42, 0.31); maq.add(aro); bx(maq, 0.55, 0.08, 0.02, A.preto, 0, 0.78, 0.3);
  const tq = grupo(MV, 8.68, 3.35, -Math.PI / 2); bx(tq, 0.55, 0.3, 0.5, A.brancoLaca, 0, 0.75, 0); pernas(tq, 0.5, 0.45, 0.6, A.inox, 0.015); cl(tq, 0.012, 0.012, 0.25, A.inox, 0, 1.02, -0.2, 8);
  bx(MV, 0.32, 0.025, 1.0, A.madeira, 8.8, 1.3, 4.0); [0, 1, 2].forEach((i) => cl(MV, 0.05, 0.05, 0.22, A.livro[i], 8.8, 1.42, 3.7 + i * 0.25, 12));
  // banho social
  box_(MV, 6.1, 6.94, 2.86, 3.7, [["x", 6.1], ["z", 3.7]]); azulejo(MV, 6.52, 2.88, 0.84, 0.02); azulejo(MV, 6.92, 3.28, 0.02, 0.84);
  gabinete(MV, 5.5, 3.3, Math.PI / 2, 0.6); azulejo(MV, 5.27, 3.3, 0.02, 0.8, 1.2);
  vaso(MV, 6.72, 4.15, -Math.PI / 2);
  // circulação e entrada
  quadro(MV, 1.6, 1.55, 5.53, Math.PI, 0.6, 0.9, new T.MeshStandardMaterial({ map: TA.arte2, roughness: 0.9 })); quadro(MV, 2.4, 1.55, 5.53, Math.PI, 0.6, 0.9, new T.MeshStandardMaterial({ map: TA.arte1, roughness: 0.9 }));
  bx(MV, 0.6, 0.012, 0.9, A.tapete2, 0.45, 0.046, 5.1);
  // suíte
  cama(MV, 1.1, 7.3, Math.PI / 2, 1.58, 1.98);
  criado(MV, 0.3, 6.18, Math.PI / 2); criado(MV, 0.3, 8.42, Math.PI / 2);
  bx(MV, 2.4, 0.012, 2.6, A.tapete, 1.6, 0.046, 7.3);
  quadro(MV, 0.08, 1.75, 7.3, Math.PI / 2, 1.1, 0.55, new T.MeshStandardMaterial({ map: TA.arte2, roughness: 0.9 }));
  armario(MV, 3.94, 7.25, -Math.PI / 2, 0.8, 0.8, 0.45, A.madeira, 2, 0.12, "h"); pernas(grupo(MV, 3.94, 7.25), 0.42, 0.76, 0.12, A.preto, 0.012);
  const tv2 = grupo(MV, 4.12, 7.25, -Math.PI / 2, 1.55); bx(tv2, 0.96, 0.56, 0.03, A.preto, 0, 0, 0);
  cl(MV, 0.07, 0.05, 0.22, A.ceramica, 3.9, 1.03, 7.0, 14); planta(MV, 3.85, 8.6, 1.2);
  AP.poltronas.push(sofa(MV, 3.05, 8.35, Math.PI + 0.5, 0.8, A.tecidoClaro));
  cortina(MV, 0.9, 3.3, 9, -1);
  // banho suíte
  box_(MV, 5.06, 5.74, 6.78, 7.54, [["x", 5.06], ["z", 6.78]]); azulejo(MV, 5.4, 7.52, 0.68, 0.02); azulejo(MV, 5.72, 7.16, 0.02, 0.76);
  gabinete(MV, 5.5, 6.2, -Math.PI / 2, 0.8); azulejo(MV, 5.73, 6.2, 0.02, 0.9, 1.2);
  vaso(MV, 4.6, 7.3, Math.PI);
  // closet
  const cls = grupo(MV, 5.5, 8.3, -Math.PI / 2);
  [-0.62, 0.62].forEach((x) => bx(cls, 0.025, 2.3, 0.55, A.madeira, x, 1.15, 0)); bx(cls, 1.26, 0.025, 0.55, A.madeira, 0, 2.3, 0); bx(cls, 1.26, 0.025, 0.55, A.madeira, 0, 0.35, 0); bx(cls, 1.26, 0.025, 0.55, A.madeira, 0, 1.95, 0);
  cl(cls, 0.012, 0.012, 1.22, A.inox, 0, 1.88, 0, 8).rotation.z = Math.PI / 2;
  for (let i = 0; i < 11; i++) { const r2 = rng(i + 3)(); const c = rb(cls, 0.03, 0.75 + r2 * 0.35, 0.44, am([0x2f4b5c, 0xe9e2d6, 0xc55a3d, 0x3a3d42, 0x8aa0b0, 0xd9a77a][i % 6], { r: 0.95 }), -0.52 + i * 0.1, 1.85 - (0.75 + r2 * 0.35) / 2, 0, 0.012); c.rotation.y = (r2 - 0.5) * 0.2; }
  for (let i = 0; i < 5; i++) [0.12, -0.12].forEach((dz) => bx(cls, 0.09, 0.07, 0.24, A.livro[(i + 1) % 5], -0.5 + i * 0.25, 0.4, dz));
  [0, 1, 2].forEach((i) => bx(cls, 0.32, 0.2, 0.4, [A.edredom, A.tecido, A.almofada2][i], -0.4 + i * 0.4, 2.42, 0));
  // quarto 2
  cama(MV, 8.48, 7.9, Math.PI, 0.88, 1.88, A.edredom2, A.tecidoClaro);
  armario(MV, 8.0, 5.98, 0, 1.85, 2.3, 0.6, A.brancoLaca, 3, 0.02);
  const mesaQ = grupo(MV, 6.16, 7.9, Math.PI / 2); rb(mesaQ, 1.2, 0.03, 0.6, A.madeira, 0, 0.74, 0, 0.01); [-1, 1].forEach((s) => bx(mesaQ, 0.03, 0.72, 0.56, A.brancoLaca, s * 0.57, 0.36, 0));
  bx(mesaQ, 0.5, 0.3, 0.02, A.preto, 0.15, 1.03, -0.2); cl(mesaQ, 0.05, 0.07, 0.15, A.preto, 0.15, 0.82, -0.2, 12); bx(mesaQ, 0.3, 0.012, 0.21, A.lencol, -0.2, 0.765, 0.1); [0, 1].forEach((i) => bx(mesaQ, 0.22, 0.03, 0.3, A.livro[i + 2], -0.4, 0.77 + i * 0.03, -0.1));
  cadeira(MV, 6.8, 7.9, -Math.PI / 2, A.almofada2, A.brancoLaca);
  [1.35, 1.75].forEach((y) => { bx(MV, 0.26, 0.022, 1.0, A.madeira, 5.99, y, 7.9); for (let i = 0; i < 6; i++) bx(MV, 0.18, 0.2 + (i % 3) * 0.03, 0.035, A.livro[i % 5], 5.97, y + 0.11 + (i % 3) * 0.015, 7.55 + i * 0.05); });
  const tap = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 0.012, 40), A.tapete2); tap.position.set(7.2, 0.046, 7.5); tap.receiveShadow = true; MV.add(tap);
  const bola = sombra(new T.Mesh(new T.SphereGeometry(0.11, 20, 14), am(0xe2453a, { r: 0.5 }))); bola.position.set(7.4, 0.15, 8.4); MV.add(bola);
  cortina(MV, 6.6, 8.4, 9, -1);
  // varanda gourmet
  armario(MV, 4.86, -1.1, -Math.PI / 2, 1.5, 0.82, 0.55, A.grafite, 3, 0.1, "h"); bx(MV, 0.6, 0.03, 1.52, A.pedra, 4.86, 0.935, -1.1);
  bx(MV, 0.55, 1.1, 0.7, A.pedra, 4.87, 1.5, -1.45); bx(MV, 0.04, 0.55, 0.55, A.preto, 4.6, 1.35, -1.45); bx(MV, 0.5, 0.6, 0.6, A.grafite, 4.87, 2.35, -1.45);
  const mv2 = grupo(MV, 2.5, -0.95); AP.mesaVaranda = mv2; cl(mv2, 0.42, 0.42, 0.03, A.madeira, 0, 0.74, 0, 36); cl(mv2, 0.04, 0.05, 0.72, A.preto, 0, 0.36, 0, 10); cl(mv2, 0.22, 0.24, 0.02, A.preto, 0, 0.01, 0, 20);
  cl(mv2, 0.04, 0.035, 0.18, vidroAp(0x9bc7a8, 0.6), -0.1, 0.84, 0.05, 12); [0, 1].forEach((i) => cl(mv2, 0.035, 0.03, 0.1, vidroAp(0xffffff, 0.35), 0.1 + i * 0.1, 0.81, -0.05, 12));
  [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * Math.PI * 2; cadeira(MV, 2.5 + Math.sin(a) * 0.62, -0.95 + Math.cos(a) * 0.62, a + Math.PI, A.tecido2, A.preto); });
  planta(MV, 0.35, -1.55, 1.7); planta(MV, 0.35, -0.35, 0.9, A.vasoConcreto); planta(MV, 3.9, -1.6, 1.0);

  // ---------- Pessoas em tamanho real ----------
  function pessoa(cfg) {
    const S = cfg.altura / 1.75, g = new T.Group(), corpo = new T.Group(); g.add(corpo); g.scale.setScalar(S);
    const olho = mat(0x141414, { r: 0.3 }), pele = mat(cfg.pele, { r: 0.55 }), roupa = mat(cfg.camisa, { r: 0.9 }), calca = mat(cfg.calca, { r: 0.9 }), sapato = mat(cfg.sapato ?? 0x2a2522, { r: 0.5 }), cabelo = mat(cfg.cabelo, { r: 0.75 });
    const add = (p, geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const ms = new T.Mesh(geo, m); ms.position.set(x, y, z); ms.scale.set(sx, sy, sz); ms.castShadow = true; p.add(ms); return ms; };
    const fem = cfg.fem;
    const perfil = [[0.001, 0], [0.15, 0], [fem ? 0.165 : 0.15, 0.07], [fem ? 0.125 : 0.14, 0.2], [fem ? 0.16 : 0.165, 0.34], [0.175, 0.45], [0.15, 0.51], [0.06, 0.54], [0.001, 0.54]].map(([r, y]) => new T.Vector2(r, y));
    const torso = add(corpo, new T.LatheGeometry(perfil, 22), roupa, 0, 0.9, 0, 1, 1, 0.62);
    add(corpo, new T.SphereGeometry(1, 18, 12), cfg.vestido ? roupa : calca, 0, 0.93, 0, fem ? 0.17 : 0.16, 0.11, 0.11);
    if (cfg.vestido) add(corpo, new T.CylinderGeometry(0.16, 0.25, 0.48, 24, 1, true), roupa, 0, 0.69, 0, 1, 1, 0.75);
    add(corpo, new T.CylinderGeometry(0.045, 0.05, 0.1, 12), pele, 0, 1.48, 0);
    const cab = new T.Group(); cab.position.y = 1.52; corpo.add(cab);
    add(cab, new T.SphereGeometry(0.1, 24, 18), pele, 0, 0.1, 0.005, 0.9, 1.12, 1.0);
    add(cab, new T.SphereGeometry(0.106, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), cabelo, 0, 0.115, -0.008, 0.95, 1.12, 1.05).rotation.x = -0.35;
    if (cfg.cabeloLongo) add(cab, new T.CylinderGeometry(0.095, 0.075, 0.28, 16), cabelo, 0, -0.02, -0.045, 1, 1, 0.6);
    if (cfg.crespo) add(cab, new T.SphereGeometry(0.135, 20, 14), cabelo, 0, 0.15, -0.03, 1, 0.92, 0.95);
    [-1, 1].forEach((s) => { add(cab, new T.SphereGeometry(0.012, 8, 6), olho, s * 0.034, 0.115, 0.088); add(cab, new T.SphereGeometry(0.018, 8, 6), pele, s * 0.092, 0.1, 0, 0.45, 1, 0.75); });
    add(cab, new T.SphereGeometry(0.016, 8, 6), pele, 0, 0.09, 0.1, 1, 1, 1.2);
    if (cfg.crianca) cab.scale.setScalar(1.18);
    const braco = (s) => {
      const om = new T.Group(); om.position.set(s * 0.19, 1.41, 0); corpo.add(om);
      add(om, new T.CylinderGeometry(0.048, 0.042, 0.29, 12).translate(0, -0.145, 0), cfg.mangaLonga ? roupa : roupa, 0, 0, 0);
      const co = new T.Group(); co.position.y = -0.29; om.add(co);
      add(co, new T.CylinderGeometry(0.038, 0.03, 0.25, 12).translate(0, -0.125, 0), cfg.mangaLonga ? roupa : pele, 0, 0, 0);
      add(co, new T.SphereGeometry(0.042, 12, 8), pele, 0, -0.29, 0.005, 0.75, 1.15, 0.45);
      om.rotation.z = s * 0.06; return { om, co };
    };
    const perna = (s) => {
      const q = new T.Group(); q.position.set(s * 0.085, 0.93, 0); corpo.add(q);
      add(q, new T.CylinderGeometry(0.074, 0.058, 0.44, 14).translate(0, -0.22, 0), cfg.vestido ? pele : calca, 0, 0, 0);
      const j = new T.Group(); j.position.y = -0.44; q.add(j);
      add(j, new T.CylinderGeometry(0.054, 0.042, 0.42, 12).translate(0, -0.21, 0), cfg.shorts || cfg.vestido ? pele : calca, 0, 0, 0);
      add(j, new T.BoxGeometry(0.09, 0.07, 0.25), sapato, 0, -0.44, 0.05);
      return { q, j };
    };
    const bE = braco(1), bD = braco(-1), pE = perna(1), pD = perna(-1);
    const p = { g, corpo, torso, cab, bE, bD, pE, pD, cfg, fase: rnd() * 6 };
    const pose = cfg.pose;
    if (pose === "sentado" || pose === "mesa") {
      corpo.position.y = cfg.assento / S - 0.86; corpo.rotation.x = pose === "sentado" ? -0.1 : 0.12;
      [pE, pD].forEach((l, i) => { l.q.rotation.x = -Math.PI / 2 + (pose === "sentado" ? 0.1 : -0.12); l.j.rotation.x = Math.PI / 2 - (pose === "sentado" ? 0.3 : 0.1); l.q.rotation.y = (i ? -1 : 1) * 0.06; });
      if (pose === "sentado") { bE.om.rotation.x = -0.35; bE.co.rotation.x = -0.9; bD.om.rotation.set(-0.25, 0, -0.35); bD.co.rotation.x = -1.2; }
      else { [bE, bD].forEach((b, i) => { b.om.rotation.set(-0.75, 0, (i ? -1 : 1) * 0.15); b.co.rotation.x = -0.9; }); cab.rotation.x = 0.35; }
    } else if (pose === "cozinhar") { bD.om.rotation.x = -0.55; bD.co.rotation.x = -1.2; bE.om.rotation.x = -0.4; bE.co.rotation.x = -1.3; cab.rotation.x = 0.3; }
    else { bE.om.rotation.x = -0.1; bD.om.rotation.x = 0.05; }
    return p;
  }
  function cachorro(p, x, z, rot) {
    const g = grupo(p, x, z, rot), pelo = mat(0xc89a5a, { r: 0.9 }), escuro = mat(0x2a1d14, { r: 0.5 });
    const add = (geo, m, px, py, pz, sx = 1, sy = 1, sz = 1) => { const ms = new T.Mesh(geo, m); ms.position.set(px, py, pz); ms.scale.set(sx, sy, sz); ms.castShadow = true; g.add(ms); return ms; };
    const esf = new T.SphereGeometry(1, 18, 12);
    const corpo = add(esf, pelo, 0, 0.13, 0, 0.16, 0.12, 0.33);
    const cabeca = new T.Group(); cabeca.position.set(0, 0.2, 0.32); g.add(cabeca);
    const c = new T.Mesh(esf, pelo); c.scale.set(0.095, 0.09, 0.1); c.castShadow = true; cabeca.add(c);
    const fu = new T.Mesh(esf, pelo); fu.scale.set(0.055, 0.045, 0.075); fu.position.set(0, -0.03, 0.09); cabeca.add(fu);
    const na = new T.Mesh(esf, escuro); na.scale.setScalar(0.018); na.position.set(0, -0.015, 0.16); cabeca.add(na);
    [-1, 1].forEach((s) => { const o = new T.Mesh(esf, pelo); o.scale.set(0.035, 0.075, 0.02); o.position.set(s * 0.08, -0.02, -0.01); o.rotation.z = s * 0.3; cabeca.add(o); const ol = new T.Mesh(esf, escuro); ol.scale.setScalar(0.011); ol.position.set(s * 0.035, 0.025, 0.088); cabeca.add(ol); });
    [-1, 1].forEach((s) => { add(new T.CylinderGeometry(0.03, 0.028, 0.22, 10), pelo, s * 0.07, 0.035, 0.36).rotation.x = Math.PI / 2; add(esf, pelo, s * 0.12, 0.08, -0.17, 0.06, 0.07, 0.12); });
    const rabo = new T.Group(); rabo.position.set(0, 0.14, -0.32); g.add(rabo); const rr = new T.Mesh(new T.CylinderGeometry(0.02, 0.012, 0.24, 8).translate(0, -0.12, 0), pelo); rr.rotation.x = -2.2; rabo.add(rr);
    return { g, corpo, cabeca, rabo, fase: 0 };
  }
  const PG = new T.Group(); G.add(PG);
  [
    { nome: "Adulto", altura: 1.78, pele: 0xb07a55, cabelo: 0x241a14, camisa: 0x2f4b5c, calca: 0xc2b49a, pose: "sentado", assento: 0.45, x: 3.0, z: 1.95, rot: -Math.PI / 2 },
    { nome: "Adulta", altura: 1.65, pele: 0xe0b08b, cabelo: 0x5a3a22, camisa: 0xc55a3d, calca: 0x2b2f38, fem: true, cabeloLongo: true, pose: "cozinhar", x: 7.98, z: 1.3, rot: Math.PI / 2 },
    { nome: "Criança", altura: 1.25, pele: 0x8d5a3b, cabelo: 0x1a1210, camisa: 0xe6b85c, calca: 0x3a6fb0, shorts: true, crianca: true, pose: "mesa", assento: 0.5, x: 6.78, z: 7.9, rot: -Math.PI / 2 },
    { nome: "Adulta", altura: 1.70, pele: 0x6a4128, cabelo: 0x140e0b, camisa: 0x4f7d5c, calca: 0x4f7d5c, fem: true, vestido: true, crespo: true, pose: "pe", x: 1.25, z: -1.45, rot: Math.PI + 0.3 },
  ].forEach((c) => {
    const p = pessoa(c); p.g.position.set(c.x, 0.04, c.z); p.g.rotation.y = c.rot; PG.add(p.g);
    p.lbl = label(apto, `${c.nome} · ${fmtM(c.altura)} m`, new T.Vector3(), "cyan", () => ui.pessoas && ui.apMode === "planta");
    AP.pessoas.push(p);
  });
  AP.dog = cachorro(PG, 1.25, 3.55, 1.1);
  // cotas (dimensões)
  G.add(AP.cotaG);
  function limparCotas() { AP.cotaG.clear(); AP.cotas.forEach((l) => removerLabel(apto, l)); AP.cotas = []; }
  function cota(a, b, txt) {
    const mt = new T.LineBasicMaterial({ color: 0xe6b85c }), y = 0.08, d = new T.Vector3().subVectors(b, a).normalize(), n = new T.Vector3(-d.z, 0, d.x).multiplyScalar(0.1);
    const pts = [a, b, a.clone().add(n), a.clone().sub(n), b.clone().add(n), b.clone().sub(n)].map((v) => new T.Vector3(v.x, y, v.z));
    AP.cotaG.add(new T.LineSegments(new T.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]]), mt));
    AP.cotas.push(label(apto, txt, new T.Vector3((a.x + b.x) / 2, y + 0.05, (a.z + b.z) / 2).add(OFF), "gold", () => ui.apMode === "planta" && ui.cotas));
  }
  function atualizarCotas() {
    limparCotas(); if (!ui.cotas || ui.apMode !== "planta") return;
    const r = AP.rooms.find((x) => x.n === ui.room);
    if (r) { cota(new T.Vector3(r.x + 0.1, 0, r.z + r.d - 0.3), new T.Vector3(r.x + r.w - 0.1, 0, r.z + r.d - 0.3), `${fmtM(r.w)} m`); cota(new T.Vector3(r.x + r.w - 0.3, 0, r.z + 0.1), new T.Vector3(r.x + r.w - 0.3, 0, r.z + r.d - 0.1), `${fmtM(r.d)} m`); }
    else { cota(new T.Vector3(0, 0, 9.6), new T.Vector3(9, 0, 9.6), "9,00 m"); cota(new T.Vector3(9.6, 0, -1.9), new T.Vector3(9.6, 0, 9), "10,90 m"); }
  }
  function aplicarLuz() {
    const n = ui.noite;
    AP.sol.intensity = n ? 0 : 1.4; AP.hemi.intensity = n ? 0.07 : 0.35; apto.exposicao = n ? 0.95 : 0.8; AP.luzes.forEach((l) => (l.intensity = n ? 1.25 : 0));
    A.lampada.emissiveIntensity = n ? 2.2 : 0.05; A.cupula.emissiveIntensity = n ? 0.9 : 0;
    AP.ceu.material.map = n ? CEU.noite : CEU.dia; AP.ceu.material.needsUpdate = true;
    apto.scene.environment = n ? null : envTex;
  }
  function irParaComodo(nome) {
    const r = AP.rooms.find((x) => x.n === nome) || AP.rooms[1]; ui.apRoom = r.n;
    const pos = new T.Vector3(r.v[0][0], OLHO, r.v[0][1]).add(OFF), olhar = new T.Vector3(r.v[1][0], OLHO - 0.25, r.v[1][1]).add(OFF);
    apto.camAnim = { pos, alvo: pos.clone().add(olhar.sub(pos).normalize().multiplyScalar(0.02)) };
  }
  function andarPara(pt) {
    const dir = new T.Vector3().subVectors(apto.controls.target, apto.camera.position); dir.y = 0; if (dir.lengthSq() < 1e-8) dir.set(0, 0, -1); dir.normalize();
    const pos = new T.Vector3(pt.x, OLHO, pt.z), loc = pt.clone().sub(OFF);
    const r = AP.rooms.find((x) => loc.x >= x.x && loc.x <= x.x + x.w && loc.z >= x.z && loc.z <= x.z + x.d); if (r) ui.apRoom = r.n;
    apto.camAnim = { pos, alvo: pos.clone().addScaledVector(dir, 0.02) };
  }
  function aplicarModoApto(moverCamera = true) {
    carregarApto();
    if (ui.apMode === "foto") { ativar("pano"); carregarPano(); pano.camAnim = { pos: new T.Vector3(0, 0, 0.1), alvo: new T.Vector3(0, 0, 0) }; return; }
    ativar("apto");
    const andar = ui.apMode === "andar", c = apto.controls;
    CORTE.constant = andar ? 1000 : CORTE_H;
    AP.tampas.forEach((t) => (t.visible = !andar)); AP.teto.visible = andar; AP.ceu.visible = andar; AP.grade.visible = !andar;
    apto.camera.fov = andar ? 64 : 40; apto.camera.near = andar ? 0.03 : 0.1; apto.camera.updateProjectionMatrix();
    Object.assign(c, { enableZoom: !andar, enablePan: false, rotateSpeed: andar ? -0.3 : 1, minPolarAngle: andar ? 0.35 : 0, maxPolarAngle: andar ? 2.7 : 1.3, minDistance: andar ? 0 : 4, maxDistance: andar ? 1000 : 30, autoRotate: false });
    if (moverCamera) { if (andar) irParaComodo(ui.apRoom || "Sala de estar e jantar"); else apto.camAnim = { pos: new T.Vector3(7.5, 12.5, 12.5), alvo: new T.Vector3(0, 0, 0.3) }; }
    aplicarLuz(); atualizarCotas();
  }
  const cabecaPos = new T.Vector3();
  apto.tick = (dt) => {
    MV.visible = ui.moveis; PG.visible = ui.pessoas;
    animarPessoasApto(dt);
    const t = relogio;
    AP.pessoas.forEach((p) => {
      const f = t + p.fase;
      p.torso.scale.y = 1 + Math.sin(f * 1.6) * 0.006;
      const pose = p.cfg.pose;
      if (pose === "cozinhar") { p.bD.om.rotation.x = -0.55 + Math.sin(f * 4) * 0.08; p.bD.om.rotation.z = -0.1 + Math.cos(f * 4) * 0.08; p.cab.rotation.y = Math.sin(f * 0.4) * 0.25; }
      else if (pose === "mesa") { p.bD.co.rotation.z = Math.sin(f * 5) * 0.05; p.cab.rotation.y = Math.sin(f * 0.5) * 0.15; }
      else if (pose === "sentado") { p.cab.rotation.y = Math.sin(f * 0.25) * 0.2; }
      else { p.cab.rotation.y = Math.sin(f * 0.3) * 0.5; p.corpo.rotation.z = Math.sin(f * 0.5) * 0.015; }
      if (ui.pessoas && ui.apMode === "planta") { p.cab.getWorldPosition(cabecaPos); p.lbl.pos.set(cabecaPos.x, cabecaPos.y + 0.45, cabecaPos.z); }
    });
    AP.dog.rabo.rotation.y = Math.sin(t * 9) * 0.6; AP.dog.cabeca.rotation.y = Math.sin(t * 0.6) * 0.3; AP.dog.corpo.scale.y = 0.12 * (1 + Math.sin(t * 3) * 0.03);
  };
  function selecionarComodo(nome) {
    if (ui.apMode === "andar") { irParaComodo(nome); return; }
    ui.room = ui.room === nome ? null : nome;
    AP.rooms.forEach((r) => { const on = r.n === ui.room; r.mesh.material.emissive.setHex(on ? 0xe6b85c : 0); r.mesh.material.emissiveIntensity = on ? 0.18 : 1; r.lbl?.el.classList.toggle("sel", on); if (on) { const c = new T.Vector3(r.x + r.w / 2, 0, r.z + r.d / 2).add(OFF), k = Math.max(r.w, r.d) * 1.15 + 2.2; apto.camAnim = { pos: c.clone().add(new T.Vector3(k * 0.45, k * 1.05, k * 0.9)), alvo: c }; } });
    if (!ui.room) apto.camAnim = { pos: new T.Vector3(7.5, 12.5, 12.5), alvo: new T.Vector3(0, 0, 0.3) };
    atualizarCotas();
  }
  // toque no chão: andar até lá (modo andar) ou medir o cômodo (modo planta)
  const raio = new T.Raycaster(); let toque = null;
  canvas.addEventListener("pointerdown", (e) => (toque = [e.clientX, e.clientY]));
  canvas.addEventListener("pointerup", (e) => {
    if (!toque || ativa !== apto) return; const mov = Math.hypot(e.clientX - toque[0], e.clientY - toque[1]); toque = null; if (mov > 6) return;
    const rc = canvas.getBoundingClientRect(); raio.setFromCamera(new T.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1), apto.camera);
    const hit = raio.intersectObjects(AP.rooms.map((r) => r.mesh))[0]; if (!hit) return;
    const room = AP.rooms.find((r) => r.mesh === hit.object);
    if (ui.apMode === "andar") andarPara(hit.point); else if (ui.room !== room.n) selecionarComodo(room.n); else return;
    if (ui.tab === "apto") manterScroll();
  });

  // ---------- Cena 3: bairro (Aurora) ----------
  const bairro = novaCena("bairro", [26, 46, 58], [0, 0, 4], { min: 20, max: 140, polar: 1.25, fov: 42 });
  const P = 12, ESC_M = 60;
  const BA = { rota: null, ponto: null, pinos: [], prog: 1, path: null, dur: 2.4 };
  const POIS = [
    { n: "Escola Pequeno Saber", bx: 1, bz: -1, c: 0x5cc9ea, cor: "var(--cyan)" }, { n: "Supermercado Bom Preço", bx: -1, bz: 0, c: 0x4dc48c, cor: "var(--green)" },
    { n: "Farmácia Saúde", bx: 0, bz: -1, c: 0xf06262, cor: "var(--red)" }, { n: "Padaria Pão Dourado", bx: -1, bz: 1, c: 0xe6b85c, cor: "var(--gold)" },
    { n: "Academia Movimento", bx: 1, bz: 1, c: 0xa78bfa, cor: "#A78BFA" }, { n: "Parque Linear", bx: -2, bz: -2, c: 0x4dc48c, cor: "var(--green)", parque: true },
    { n: "UBS Vila Aurora", bx: 2, bz: 1, c: 0xf06262, cor: "var(--red)" }, { n: "Estação de metrô Central", bx: 0, bz: 3, c: 0x5cc9ea, cor: "var(--cyan)" }, { n: "Shopping Avenida", bx: -3, bz: 2, c: 0xe2805c, cor: "var(--terra-2)" },
  ];
  const poiPos = (p) => new T.Vector3(p.bx * P + (p.bx >= 0 ? -3.2 : 3.2), 0, p.bz * P + (p.bz >= 0 ? -3.2 : 3.2));
  (function construirBairro() {
    const { scene } = bairro; scene.fog = new T.Fog(0x15171b, 90, 220); luzes(scene, false);
    const r2 = rng(7);
    scene.add(box(9 * P + 24, 0.1, 9 * P + 24, mat(0x1b1d21, { r: 1 }), 0, -0.06, 0, false));
    const ruas = new T.GridHelper(9 * P, 9, 0x3a3f49, 0x3a3f49); ruas.position.y = 0.01; scene.add(ruas);
    const cal = mat(0x2b2f36), parqueM = mat(0x24402c), arv = mat(0x2f5a3b);
    const jan = tex(64, 128, (c, w, h) => { c.fillStyle = "#4a505a"; c.fillRect(0, 0, w, h); for (let y = 6; y < h; y += 14) for (let x = 5; x < w; x += 14) { c.fillStyle = r2() < 0.25 ? "#e8c487" : "#2a3038"; c.fillRect(x, y, 8, 8); } });
    const predM = [mat(0xffffff, { map: jan, r: 0.8 }), mat(0xd8dde4, { map: jan, r: 0.8 }), mat(0xb8bec8, { map: jan, r: 0.8 })];
    const parqueSet = new Set(POIS.filter((p) => p.parque).map((p) => `${p.bx},${p.bz}`));
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
      const cx = i * P, cz = j * P;
      if (parqueSet.has(`${i},${j}`) || (r2() < 0.06 && Math.abs(i) + Math.abs(j) > 2)) { scene.add(box(9.6, 0.12, 9.6, parqueM, cx, 0.06, cz, false)); for (let k = 0; k < 9; k++) { const t = new T.Mesh(new T.IcosahedronGeometry(0.7 + r2() * 0.4, 1), arv); t.position.set(cx - 3.6 + r2() * 7.2, 0.9, cz - 3.6 + r2() * 7.2); scene.add(t); } continue; }
      scene.add(box(9.6, 0.15, 9.6, cal, cx, 0.075, cz, false));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { if (i === 0 && j === 0 && a === 1 && b === 1) return; if (r2() < 0.15) return; const dist = Math.hypot(i, j), h = Math.max(0.8, (r2() * 7 + 1) * (dist < 2.5 ? 1.25 : dist < 4 ? 1 : 0.7)); scene.add(box(3.2 + r2() * 0.9, h, 3.2 + r2() * 0.9, predM[Math.floor(r2() * 3)], cx + a * 2.3, 0.15 + h / 2, cz + b * 2.3, false)); });
    }
    scene.add(box(3.4, 12, 3.4, M.terra, 2.3, 8.15, 2.3, false)); scene.add(box(4.2, 2.2, 4.2, M.pod, 2.3, 1.15, 2.3, false));
    const halo = new T.Mesh(new T.RingGeometry(3.4, 3.8, 48), new T.MeshBasicMaterial({ color: 0xe6b85c, side: T.DoubleSide, transparent: true, opacity: 0.7 })); halo.rotation.x = -Math.PI / 2; halo.position.set(2.3, 0.2, 2.3); scene.add(halo); BA.halo = halo;
    label(bairro, "Edifício Aurora", new T.Vector3(2.3, 15.2, 2.3), "terra");
    POIS.forEach((p) => { const pos = poiPos(p); scene.add(box(0.12, 3, 0.12, mat(p.c, { e: p.c, ei: 0.3 }), pos.x, 1.5, pos.z, false)); const bola = new T.Mesh(new T.SphereGeometry(0.55, 16, 12), mat(p.c, { e: p.c, ei: 0.6 })); bola.position.set(pos.x, 3.2, pos.z); scene.add(bola); label(bairro, esc(p.n), new T.Vector3(pos.x, 4.1, pos.z), "poi"); });
  })();
  const INICIO = new T.Vector3(6, 0, 6);
  const esquina = (bx, bz) => new T.Vector3(bx * P + (bx > 0 ? -6 : 6), 0, bz * P + (bz > 0 ? -6 : 6));
  function caminho(bx, bz, final) {
    const fim = esquina(bx, bz), meioX = Math.round(((INICIO.x + fim.x) / 2 - 6) / P) * P + 6;
    const pts = [new T.Vector3(2.3, 0, 4.6), INICIO.clone(), new T.Vector3(meioX, 0, INICIO.z), new T.Vector3(meioX, 0, fim.z), fim.clone()]; if (final) pts.push(final.clone());
    const limpo = pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 0.01); let dist = 0; for (let i = 1; i < limpo.length; i++) dist += limpo[i].distanceTo(limpo[i - 1]);
    return { pts: limpo, km: (dist * ESC_M) / 1000 };
  }
  function desenharRota(pts, cor = 0x5cc9ea) {
    const s = bairro.scene; if (BA.rota) { s.remove(BA.rota); BA.rota.geometry.dispose(); } if (BA.ponto) s.remove(BA.ponto);
    const path = new T.CurvePath(); for (let i = 1; i < pts.length; i++) path.add(new T.LineCurve3(new T.Vector3(pts[i - 1].x, 0.45, pts[i - 1].z), new T.Vector3(pts[i].x, 0.45, pts[i].z)));
    BA.rota = new T.Mesh(new T.TubeGeometry(path, 260, 0.42, 6, false), new T.MeshBasicMaterial({ color: cor })); BA.ponto = new T.Mesh(new T.SphereGeometry(0.9, 16, 12), new T.MeshBasicMaterial({ color: 0xffffff }));
    s.add(BA.rota, BA.ponto); BA.path = path; BA.prog = 0; const mid = path.getPointAt(0.5); bairro.alvoAnim = new T.Vector3(mid.x * 0.6, 0, mid.z * 0.6 + 4);
  }
  bairro.tick = (dt) => { BA.halo.material.opacity = 0.45 + Math.sin(relogio * 3) * 0.25; if (!BA.rota) return; if (BA.prog < 1) BA.prog = Math.min(1, BA.prog + dt / BA.dur); const e = 1 - Math.pow(1 - BA.prog, 2); BA.rota.geometry.setDrawRange(0, Math.floor((BA.rota.geometry.index.count * e) / 3) * 3); const p = BA.path.getPointAt(Math.max(0.0001, e)); BA.ponto.position.set(p.x, 0.9, p.z); };
  function destinoDeEndereco(end, longe) { let bx = 2, bz = 2, k = 0; while (k < 80) { const v = hashStr(end.toLowerCase() + k++); bx = (v % 9) - 4; bz = (Math.floor(v / 9) % 9) - 4; const m = Math.abs(bx) + Math.abs(bz), mx = Math.max(Math.abs(bx), Math.abs(bz)); if (longe ? m >= 5 : m >= 1 && mx <= 3) break; } return { bx, bz }; }
  const tempos = (km, pico) => [
    { m: "Carro", min: Math.round((km / (pico ? 17 : 30)) * 60 + 3), ic: '<path d="M4 16v-4l2-5h12l2 5v4z"/><circle cx="8" cy="16.5" r="1.6"/><circle cx="16" cy="16.5" r="1.6"/>' },
    { m: "Ônibus/metrô", min: Math.round((km / 16) * 60 + 8), ic: '<rect x="5" y="3.5" width="14" height="14" rx="2"/><path d="M5 11h14M8 20l1-2.5M16 20l-1-2.5"/>' },
    { m: "Bicicleta", min: Math.round((km / 14) * 60), ic: '<circle cx="6" cy="16" r="3.2"/><circle cx="18" cy="16" r="3.2"/><path d="M6 16l4-7h5l3 7M10 9l3 7"/>' },
    { m: "A pé", min: Math.round((km / 4.8) * 60), ic: '<circle cx="12" cy="4.5" r="1.8"/><path d="M12 8v6l-3 6M12 14l3 6M9 11h6"/>' },
  ];
  const fmtMin = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m} min`);

  // ---------- Realismo: céu real, texturas de foto, móveis e figuras em 3D ----------
  const RC = { glb: {}, apto: false };
  const recurso = (n) => "assets/" + n;
  const gltfL = T.GLTFLoader ? new T.GLTFLoader() : null, hdrL = T.RGBELoader ? new T.RGBELoader() : null, texL = new T.TextureLoader();
  const glb = (n) => RC.glb[n] || (RC.glb[n] = new Promise((ok, erro) => { try { if (!gltfL) throw new Error("sem loader"); gltfL.load(recurso(n.replace(/\.glb$/, ".json")), ok, undefined, erro); } catch (e) { erro(e); } }));
  const hdr = (n) => new Promise((ok, erro) => { try { texL.load(recurso(n.replace(/\.hdr$/, ".jpg")), (t) => { t.encoding = T.sRGBEncoding; ok(t); }, undefined, erro); } catch (e) { erro(e); } });
  function foto(n, rep = [1, 1], cor = true) { const t = texL.load(recurso(n)); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); if (cor) t.encoding = T.sRGBEncoding; t.anisotropy = maxAniso; return t; }
  const ignorar = () => {};

  // texturas fotográficas
  const madeira = { map: foto("madeira_cor.jpg", [1, 2]), bumpMap: foto("madeira_relevo.jpg", [1, 2], false), roughnessMap: foto("madeira_rug.jpg", [1, 2], false) };
  AP.rooms.forEach((r) => { if (r.p !== "mad") return; Object.assign(r.mesh.material, madeira, { bumpScale: 0.0025, roughness: 0.9 }); r.mesh.material.needsUpdate = true; });
  Object.assign(M.tijolo, { map: foto("tijolo_cor.jpg", [2, 2]), bumpMap: foto("tijolo_relevo.jpg", [2, 2], false), bumpScale: 0.012, roughness: 0.92 }); M.tijolo.needsUpdate = true;
  Object.assign(M.grama, { map: foto("grama.jpg", [70, 70]), roughness: 1 }); M.grama.color.setHex(0x8f9a80); M.gramaLote.color.setHex(0xa0aa8e); M.grama.needsUpdate = true;
  Object.assign(M.gramaLote, { map: foto("grama.jpg", [1.2, 1.6]) }); M.gramaLote.needsUpdate = true;
  const aguaN = foto("agua_normal.jpg", [5, 9], false), aguaN2 = foto("agua_normal.jpg", [2, 1], false);
  Object.assign(M.lago, { normalMap: aguaN, normalScale: new T.Vector2(0.35, 0.35), roughness: 0.08, envMapIntensity: 0.75 }); M.lago.color.setHex(0x14384a); M.lago.needsUpdate = true;
  Object.assign(M.agua, { normalMap: aguaN2, normalScale: new T.Vector2(0.25, 0.25) }); M.agua.needsUpdate = true;

  // chão real para os prédios (aparece junto com o céu)
  RC.chao = new T.Mesh(new T.PlaneGeometry(900, 900), new T.MeshLambertMaterial({ map: foto("grama.jpg", [120, 120]), color: 0x8f9a80 }));
  RC.chao.rotation.x = -Math.PI / 2; RC.chao.position.y = -0.24; RC.chao.receiveShadow = true; RC.chao.visible = false; obra.scene.add(RC.chao);

  // céu de verdade (foto 360° em HDR): ilumina e reflete nos vidros
  hdr("ceu.hdr").then((t) => {
    t.mapping = T.EquirectangularReflectionMapping;
    RC.ceuEnv = new T.PMREMGenerator(renderer).fromEquirectangular(t).texture;
    obra.scene.environment = RC.ceuEnv; obra.scene.background = t; obra.scene.backgroundBlurriness = 0.18; obra.exposicao = 0.95; sol.intensity = 1.35;
    obra.scene.traverse((o) => { if (o.isMesh && o.material && o.material.envMapIntensity !== undefined && !o.material.isMeshPhysicalMaterial) o.material.envMapIntensity = 0.55; });
    obra.scene.fog = new T.Fog(0xc8d4de, 140, 520);
    gridChao.visible = false; RC.chao.visible = true;
    Object.values(PREDIOS).forEach((B) => (B.discos || []).forEach((d) => (d.visible = false)));
  }).catch(ignorar);

  // utilitários para os modelos
  function prepararGLB(cena, clip) {
    const luzesGLB = [];
    cena.traverse((o) => {
      if (o.isLight) luzesGLB.push(o);
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      if (clip) { o.material = o.material.clone(); o.material.clippingPlanes = [CORTE]; o.material.clipShadows = true; }
    });
    luzesGLB.forEach((l) => l.removeFromParent());
    return cena;
  }
  function normalizar(obj, alvo) {
    const b = new T.Box3().setFromObject(obj), sz = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3());
    const k = alvo.altura ? alvo.altura / sz.y : alvo.largura ? alvo.largura / sz.x : 1;
    obj.position.set(-c.x, -b.min.y, -c.z);
    const w = new T.Group(); w.add(obj); w.scale.setScalar(k); if (alvo.rot) w.rotation.y = alvo.rot; if (alvo.y) w.position.y = alvo.y;
    return w;
  }
  // No celular, objetos pequenos (louça, livros, folhas) deixam de projetar sombra: menos chamadas de desenho por quadro.
  const _s = new T.Vector3();
  function aliviar(raiz) {
    if (!LEVE) return; raiz.updateMatrixWorld(true);
    raiz.traverse((x) => { if (!x.isMesh || !x.castShadow || x.isSkinnedMesh || !x.geometry) return; const g = x.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); x.getWorldScale(_s); if (g.boundingSphere.radius * Math.max(_s.x, _s.y, _s.z) < 0.35) x.castShadow = false; });
  }
  function substituir(proc, nome, alvo) {
    glb(nome).then((g) => {
      const w = normalizar(prepararGLB(g.scene.clone(true), alvo.clip !== false), alvo);
      proc.children.slice().forEach((c) => (c.visible = false)); proc.add(w); aliviar(w);
    }).catch(ignorar);
  }
  function adicionar(pai, nome, alvo, x, y, z) {
    glb(nome).then((g) => { const w = normalizar(prepararGLB(g.scene.clone(true), alvo.clip !== false), alvo); w.position.set(x, y, z); pai.add(w); aliviar(w); }).catch(ignorar);
  }

  // apartamento: carrega os móveis reais na primeira visita
  function carregarApto() {
    if (RC.apto) return; RC.apto = true;
    if (AP.sofaSala) substituir(AP.sofaSala, "sofa.glb", { largura: 2.2 });
    AP.poltronas.forEach((p) => substituir(p, "poltrona.glb", { largura: 0.86 }));
    AP.plantas.forEach((p) => substituir(p.g, "planta.glb", { altura: p.alt * 0.95, rot: p.g.position.x * 1.7 }));
    adicionar(AP.mesaJantar, "flores.glb", { altura: 0.3 }, -0.05, 0.768, 0.02);
    adicionar(MV, "flores.glb", { altura: 0.34 }, 1.2, 0.82, 4.34);
    adicionar(AP.mesaVaranda, "flores.glb", { altura: 0.28 }, 0.05, 0.755, -0.05);
  }

  // figuras humanas em escala (manequins de arquitetura com animação real)
  const MQ = {};
  function criarManequim(o) {
    const m = T.SkeletonUtils.clone((o.leve && MQ.leve) || MQ.g.scene), w = new T.Group(); w.add(m); m.rotation.y = Math.PI; w.scale.setScalar(o.escala);
    const mc = mat(o.corpo, { r: 0.5 }), mj = mat(o.juntas, { r: 0.35, m: 0.25 });
    m.traverse((x) => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; x.frustumCulled = false; x.material = /joint/i.test(x.name) ? mj : mc; } });
    const ossos = {}; m.traverse((x) => { if (x.isBone) ossos[x.name.replace("mixamorig", "")] = x; });
    const mixer = new T.AnimationMixer(m), clip = MQ.clips[o.clip] || MQ.clips.idle;
    if (clip) { const a = mixer.clipAction(clip); a.timeScale = o.velocidade || 1; a.play(); a.time = Math.random() * clip.duration; mixer.update(0); }
    const hs = 1 / MQ.escCabeca, cab = ossos.Head;
    if (o.capacete && cab) {
      const g = new T.Group(), cm = mat(o.capacete, { r: 0.3 }); g.scale.setScalar(hs); g.position.y = 0.11 * hs;
      const casco = new T.Mesh(new T.SphereGeometry(0.122, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), cm); casco.scale.set(1, 0.9, 1.15); casco.castShadow = true; g.add(casco);
      const aba = new T.Mesh(new T.CylinderGeometry(0.14, 0.145, 0.012, 26), cm); aba.scale.z = 1.2; aba.position.z = 0.025; g.add(aba);
      cab.add(g);
    }
    if (o.colete && ossos.Spine2) {
      const g = new T.Group(), vm = mat(o.colete, { r: 0.6, e: o.colete, ei: 0.12 }); g.scale.setScalar(hs * MQ.escCabeca / MQ.escTronco); g.position.y = -0.02 / MQ.escTronco;
      const v = new T.Mesh(new T.CylinderGeometry(0.155, 0.15, 0.3, 20, 1, true), vm); v.scale.z = 0.72; v.castShadow = true; g.add(v);
      const faixa = new T.Mesh(new T.CylinderGeometry(0.157, 0.157, 0.03, 20, 1, true), mat(0xdadada, { r: 0.2, m: 0.7 })); faixa.scale.z = 0.73; faixa.position.y = -0.04; g.add(faixa);
      ossos.Spine2.add(g);
    }
    return { w, m, mixer, ossos };
  }
  const somar = (b, ax, v) => { if (b) b.rotation[ax] += v; };
  function posar(q, pose, t) {
    const o = q.ossos, s = Math.sin;
    const pernasSentado = () => { somar(o.LeftUpLeg, "x", 1.45); somar(o.RightUpLeg, "x", 1.45); somar(o.LeftLeg, "x", -1.4); somar(o.RightLeg, "x", -1.4); };
    switch (pose) {
      case "sentado": pernasSentado(); somar(o.Spine, "x", 0.1); somar(o.RightArm, "x", 0.35); somar(o.LeftArm, "x", 0.35); somar(o.RightForeArm, "z", 0.85); somar(o.LeftForeArm, "z", -0.85); somar(o.Head, "y", s(t * 0.25) * 0.25); break;
      case "mesa": pernasSentado(); somar(o.Spine, "x", -0.18); somar(o.RightArm, "x", 0.8); somar(o.LeftArm, "x", 0.8); somar(o.RightForeArm, "z", 0.75 + s(t * 5) * 0.05); somar(o.LeftForeArm, "z", -0.75); somar(o.Head, "x", -0.3); break;
      case "cozinhar": somar(o.RightArm, "x", 0.75 + s(t * 4) * 0.08); somar(o.RightForeArm, "z", 1.1 + s(t * 4 + 1) * 0.12); somar(o.LeftArm, "x", 0.5); somar(o.LeftForeArm, "z", -1.15); somar(o.Head, "x", -0.35); somar(o.Spine, "x", -0.08); break;
      case "pe": somar(o.Head, "y", s(t * 0.3) * 0.5); break;
      case "martelar": somar(o.Spine, "x", -0.3); somar(o.RightArm, "x", 1.1 + Math.max(0, s(t * 9)) * 0.6); somar(o.RightForeArm, "z", 0.7); somar(o.LeftArm, "x", 0.6); somar(o.LeftForeArm, "z", -0.6); somar(o.Head, "x", -0.3); break;
      case "soldar": somar(o.LeftUpLeg, "x", 2.0); somar(o.RightUpLeg, "x", 1.6); somar(o.LeftLeg, "x", -2.3); somar(o.RightLeg, "x", -1.8); somar(o.Spine, "x", -0.45); somar(o.RightArm, "x", 0.9); somar(o.LeftArm, "x", 0.9); somar(o.RightForeArm, "z", 0.6); somar(o.LeftForeArm, "z", -0.6); somar(o.Head, "x", -0.35); break;
      case "prancheta": somar(o.RightArm, "x", 0.55); somar(o.LeftArm, "x", 0.55); somar(o.RightForeArm, "z", 1.25); somar(o.LeftForeArm, "z", -1.25); somar(o.Head, "x", -0.2); somar(o.Head, "y", s(t * 0.7) * 0.4); break;
      case "sinalizar": somar(o.RightArm, "z", 2.3 + s(t * 3) * 0.35); somar(o.Head, "x", 0.2); break;
      case "carregar": case "empurrar": somar(o.RightArm, "x", 0.9); somar(o.LeftArm, "x", 0.9); somar(o.RightForeArm, "z", 0.6); somar(o.LeftForeArm, "z", -0.6); break;
    }
  }
  function vestirPessoasApto() {
    const tons = [[0xdcd6cc, 0x8d867c], [0xe6e0d6, 0x9a9188], [0xd2d8dd, 0x7c858d], [0xe0d9cf, 0x8f877d]];
    AP.pessoas.forEach((p, i) => {
      const c = p.cfg, S = c.altura / 1.75, kw = c.altura / MQ.alt;
      const q = criarManequim({ leve: LEVE, escala: kw / S, corpo: tons[i % 4][0], juntas: tons[i % 4][1], clip: "idle" });
      if (c.pose === "sentado" || c.pose === "mesa") q.w.position.y = (c.assento + 0.04 - MQ.quadril * kw - 0.04) / S;
      p.corpo.visible = false; p.g.add(q.w); p.mq = q;
      p.lbl.el.textContent = `Figura em escala · ${fmtM(c.altura)} m`;
    });
  }
  function vestirOperarios() {
    const esc = 0.64 / MQ.alt;
    W.lista.forEach((w) => {
      const f = FN[w.funcao], anda = ["andar", "carregar", "empurrar"].includes(w.papel), chefe = w.funcao === "eng" || w.funcao === "mestre";
      const q = criarManequim({ leve: true, escala: esc, corpo: chefe ? 0xd7dade : 0x34445a, juntas: 0x22272e, clip: anda ? "walk" : "idle", velocidade: anda ? 0.75 : 1, capacete: new T.Color(f.hat).getHex(), colete: chefe ? null : ["fach", "seg", "sin"].includes(w.funcao) ? 0xc6e230 : 0xff7a1a });
      if (w.papel === "soldar") q.w.position.y = -MQ.quadril * 0.42 * esc;
      w.corpo.visible = false; w.g.add(q.w); w.mq = q;
      if (w.faisca) { w.g.add(w.faisca); w.faisca.position.set(0, 0.16, 0.24); }
    });
  }
  // pessoa: 15 mil triângulos (figuras do apê). pessoa_leve: 4 mil (operários no canteiro e celular).
  Promise.all([glb("pessoa.glb"), glb("pessoa_leve.glb").catch(() => null)]).then(([g, gl]) => {
    MQ.g = g; MQ.leve = gl && gl.scene; MQ.clips = Object.fromEntries(g.animations.map((a) => [a.name, a]));
    const m = T.SkeletonUtils.clone(g.scene); m.updateMatrixWorld(true);
    const v = new T.Vector3(), ponta = m.getObjectByName("mixamorigHeadTop_End"), cab = m.getObjectByName("mixamorigHead");
    MQ.alt = ponta ? ponta.getWorldPosition(v).y : cab.getWorldPosition(v).y + 0.14;
    MQ.quadril = m.getObjectByName("mixamorigHips").getWorldPosition(v).y;
    MQ.escCabeca = cab.getWorldScale(new T.Vector3()).x; MQ.escTronco = m.getObjectByName("mixamorigSpine2").getWorldScale(new T.Vector3()).x;
    vestirPessoasApto(); vestirOperarios();
  }).catch(ignorar);
  function animarManequins(dt) {
    W.lista.forEach((w) => { if (!w.mq || !w.g.visible) return; w.mq.mixer.update(dt); posar(w.mq, w.papel, relogio + w.fase); });
  }
  function animarPessoasApto(dt) {
    AP.pessoas.forEach((p) => { if (!p.mq) return; p.mq.mixer.update(dt); posar(p.mq, p.cfg.pose, relogio + p.fase); });
  }

  // cones de sinalização nos canteiros
  glb("cone.glb").then((g) => {
    const base = new T.Group(); g.scene.updateMatrixWorld(true);
    g.scene.traverse((o) => { if (o.isMesh && /cone/i.test(o.name)) { const c = o.clone(); c.matrix.copy(o.matrixWorld); c.matrix.decompose(c.position, c.quaternion, c.scale); base.add(c); } });
    if (!base.children.length) return;
    const cones = normalizar(prepararGLB(base, false), { altura: 0.24 });
    Object.values(PREDIOS).forEach((B) => {
      const pts = B.condo ? [[-2.2, 23.2, 0], [9.5, 11.3, 0.6]] : [[3.0, 7.6, 0.2]];
      pts.forEach(([x, z, r]) => { const c = cones.clone(); c.position.set(x, 0, z); c.rotation.y = r; B.root.add(c); });
    });
  }).catch(ignorar);

  // foto 360° (conceito: imagens do decorado enviadas pela construtora)
  const pano = novaCena("pano", [0, 0, 0.1], [0, 0, 0], { fov: 88, polar: 2.9 });
  Object.assign(pano.controls, { enableZoom: false, enablePan: false, rotateSpeed: -0.28, minPolarAngle: 0.25, minDistance: 0.05, maxDistance: 0.2 });
  pano.scene.background = new T.Color(0x111214); pano.exposicao = 1;
  pano.tick = () => { if (!pano.camAnim && pano.controls.autoRotate === undefined) pano.controls.autoRotate = false; };
  function carregarPano() {
    if (RC.panoP) return RC.panoP;
    RC.panoP = hdr("apto360.hdr").then((t) => { t.mapping = T.EquirectangularReflectionMapping; pano.scene.background = t; RC.panoOK = true; if (ui.tab === "apto") hud(); }).catch(() => { RC.panoErro = true; if (ui.tab === "apto") hud(); });
    return RC.panoP;
  }

  // ---------- Laço ----------
  function ativar(nome) {
    if (ativa?.nome === nome) return;
    Object.values(cenas).forEach((c) => (c.controls.enabled = false));
    ativa = cenas[nome]; ativa.controls.enabled = true;
    if (nome === "apto" && !RC.aptoAliviado) { RC.aptoAliviado = true; aliviar(apto.scene); }
    labelsBox.innerHTML = ""; ativa.labels.forEach((l) => labelsBox.appendChild(l.el)); tamanho();
  }
  function tamanho() { const w = vp.clientWidth, h = vp.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); Object.values(cenas).forEach((c) => { c.camera.aspect = w / h; c.camera.updateProjectionMatrix(); }); }
  new ResizeObserver(tamanho).observe(vp);
  const v3 = new T.Vector3(); let ultimo = performance.now();
  function laco(agora) {
    if (LEVE && agora - ultimo < 30) { requestAnimationFrame(laco); return; } // 30 quadros por segundo no celular
    const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora; relogio += dt;
    if (ativa) {
      ativa.tick && ativa.tick(dt);
      if (ativa.camAnim) { const k = Math.min(1, dt * 2.6); ativa.camera.position.lerp(ativa.camAnim.pos, k); ativa.controls.target.lerp(ativa.camAnim.alvo, k); if (ativa.camera.position.distanceTo(ativa.camAnim.pos) < 0.05 && ativa.controls.target.distanceTo(ativa.camAnim.alvo) < 0.05) ativa.camAnim = null; }
      else if (ativa.alvoAnim) { ativa.controls.target.lerp(ativa.alvoAnim, Math.min(1, dt * 3)); if (ativa.controls.target.distanceTo(ativa.alvoAnim) < 0.02) ativa.alvoAnim = null; }
      ativa.controls.update(); renderer.toneMappingExposure = ativa.exposicao ?? 1; renderer.render(ativa.scene, ativa.camera);
      const w = vp.clientWidth, h = vp.clientHeight;
      ativa.labels.forEach((l) => { v3.copy(l.pos).project(ativa.camera); const vis = l.show() && v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1; l.el.style.display = vis ? "" : "none"; if (vis) l.el.style.transform = `translate(${((v3.x + 1) / 2) * w}px, ${((1 - v3.y) / 2) * h}px) translate(-50%, ${l.el.classList.contains("room") ? "-50%" : "-100%"})`; });
    }
    requestAnimationFrame(laco);
  }
  $("#loading").remove();
  obra.controls.autoRotate = true; obra.controls.autoRotateSpeed = 0.5;

  // ---------- Interface ----------
  const ABAS_COMPRADOR = { aurora: [["obra", "Minha obra"], ["apto", "Meu apê"], ["bairro", "Bairro e trajetos"]], reserva: [["obra", "Minha obra"], ["lotes", "Lotes e vistas"], ["lazer", "Condomínio"], ["perto", "Arredores"]] };
  const abasConstrutora = (o) => [["carteira", "Carteira"], ["geral", "Visão geral"], ...(isC(o) ? [["lotes", "Lotes"]] : []), ["orcamento", "Orçamento"], ["equipe", "Equipe"], ["funcionarios", "Funcionários"], ["materiais", "Materiais"], ["projeto", "Projeto"], ["evolucao", "Registrar evolução"]];
  const abasAtuais = () => (ui.persp === "comprador" ? ABAS_COMPRADOR[ui.compra] : abasConstrutora(obraAtiva()));
  const CENA_DA_ABA = { obra: "obra", apto: "apto", bairro: "bairro", lotes: "obra", lazer: "obra", perto: "obra", carteira: "obra", geral: "obra", orcamento: "obra", equipe: "obra", funcionarios: "obra", materiais: "obra", projeto: "obra", evolucao: "obra" };
  const ST_PESSOA = { presente: ["Presente", "ok"], falta: ["Falta hoje", "bad"], ferias: ["Férias", "mute"], afastado: ["Afastado", "warn"] };
  const ST_EQ = { uso: ["Em uso", "ok"], disponivel: ["Disponível", "info"], manutencao: ["Manutenção", "bad"] };
  const ST_LOTE = { disponivel: ["Disponível", "ok"], reservado: ["Reservado", "warn"], vendido: ["Vendido", "mute"] };
  const iniciais = (n) => n.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  const toggleBonecos = () => `<label class="toggle"><input type="checkbox" id="tgBonecos" ${ui.bonecos ? "checked" : ""}> Mostrar a equipe trabalhando na obra</label>`;
  const nn = (n) => String(n).padStart(2, "0");

  function renderTopo() {
    $("#tabs").innerHTML = abasAtuais().map(([k, n]) => `<button data-tab="${k}" ${ui.tab === k ? 'aria-current="page"' : ""}>${n}${k === "obra" && ui.novo && ui.compra === "aurora" ? '<i class="dot"></i>' : ""}</button>`).join("");
    document.querySelectorAll("[data-persp]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.persp === ui.persp));
    $("#emp").innerHTML = ui.persp === "comprador"
      ? `<label class="k" for="selCompra">Meu imóvel</label><select id="selCompra"><option value="aurora" ${ui.compra === "aurora" ? "selected" : ""}>Edifício Aurora · apê 1204</option><option value="reserva" ${ui.compra === "reserva" ? "selected" : ""}>Reserva das Águas · lote 24</option></select>`
      : `<label class="k" for="selObra">Obra ativa</label><select id="selObra">${D.obras.map((o) => `<option value="${o.id}" ${o.id === ui.obraId ? "selected" : ""}>${esc(o.nome)}</option>`).join("")}</select>`;
    $(".stage").classList.toggle("wide", ui.persp === "construtora");
    requestAnimationFrame(tamanho);
  }
  function hud() {
    const h = $("#hud"), o = obraAtiva(), s = vista(), t = totaisDe(o), nome = esc(o.curto).toUpperCase();
    if (ui.vista) { const l = D.lotes.find((x) => x.id === ui.vista); h.innerHTML = `<span>VISTA DO LOTE ${nn(l.id)} · ALTURA DOS OLHOS</span><b>${esc(l.vista)}</b><span>arraste para olhar em volta</span>`; }
    else if (ui.tab === "carteira") h.innerHTML = `<span>CARTEIRA · SILVA &amp; FILHOS</span><b>${D.obras.length} obras</b><span>${D.obras.reduce((a, x) => a + funcDe(x).length, 0)} pessoas · ${mi(D.obras.reduce((a, x) => a + x.total, 0))}</span>`;
    else if (ui.tab === "orcamento") h.innerHTML = `<span>${nome} · REALIZADO</span><b>${mi(t.r)}</b><span>de ${mi(t.o)} · ${Math.round((t.r / t.o) * 100)}%</span>`;
    else if (ui.tab === "equipe" || ui.tab === "funcionarios") h.innerHTML = `<span>${nome} · EM CAMPO HOJE</span><b>${presentesDe(o)} pessoas</b><span>${funcDe(o).length} contratadas</span>`;
    else if (ui.tab === "materiais") h.innerHTML = `<span>${nome} · CANTEIRO</span><b>${D.equip.filter((e) => e.obra === o.id).length} equipamentos</b><span>${[...D.insumos[o.id], ...D.epi[o.id]].filter((i) => stEstoque(i) !== "ok").length} itens para repor</span>`;
    else if (ui.tab === "lotes") { const disp = D.lotes.filter((l) => l.status === "disponivel"); h.innerHTML = `<span>RESERVA DAS ÁGUAS · LOTES</span><b>${disp.length} disponíveis</b><span>a partir de ${mil(Math.min(...disp.map((l) => l.preco)))}</span>`; }
    else if (ui.tab === "lazer") { const prontos = DEPS.filter((d) => s[d.por] >= d.lim).length; h.innerHTML = `<span>RESERVA DAS ÁGUAS · LAZER</span><b>${prontos} de ${DEPS.length} prontos</b><span>clube ${s.clube}% concluído</span>`; }
    else if (ui.tab === "perto") h.innerHTML = `<span>ESTRADA DO LAGO, KM 4</span><b>Arredores</b><span>distâncias reais · mapa fora de escala</span>`;
    else if (CENA_DA_ABA[ui.tab] === "obra") h.innerHTML = `<span>${ui.persp === "construtora" ? nome + " · " : ""}${ui.viewIdx == null ? "HOJE" : mesRel(s.mes).toUpperCase()} · AVANÇO</span><b>${avanco(s)}%</b><span>${resumoObra(o, s)}</span>`;
    else if (ui.tab === "apto" && ui.apMode === "foto") h.innerHTML = `<span>FOTO 360° · IMAGEM ILUSTRATIVA</span><b>${RC.panoOK ? "Decorado" : RC.panoErro ? "Indisponível" : "Carregando…"}</b><span>arraste para olhar em volta</span>`;
    else if (ui.tab === "apto") h.innerHTML = ui.apMode === "andar" ? `<span>DENTRO DO APÊ · ${ui.noite ? "NOITE" : "DIA"}</span><b>${esc(ui.apRoom || "")}</b><span>olhos a 1,60 m · pé-direito 2,70 m</span>` : `<span>UNIDADE 1204 · 12º ANDAR</span><b>${num(areaPriv(), 1)} m²</b><span>2 quartos · 1 suíte · varanda gourmet</span>`;
    else h.innerHTML = `<span>MAPA ESTILIZADO · PROTÓTIPO</span><b>Vila Aurora</b><span>Rua das Acácias, 410</span>`;
    $("#hint").textContent = ui.tab === "apto" ? (ui.apMode === "foto" ? "Arraste para olhar em volta" : ui.apMode === "andar" ? "Arraste para olhar em volta · toque no chão para andar" : "Arraste para girar · toque num cômodo para ver as medidas") : ui.vista ? "Arraste para olhar em volta · role para aproximar" : ui.tab === "carteira" ? "Toque numa obra na lista para abrir · arraste para girar" : "Arraste para girar · role para aproximar";
    if (LEVE) $("#hint").textContent = $("#hint").textContent.replace("role para aproximar", "pinça para aproximar").replace(/^Arraste para girar/, "Arraste de lado para girar");
  }
  const timeline = (o) => `<div class="sec"><h2>Atualizações da obra</h2><p style="font-size:12.5px">Toque numa atualização para ver a obra naquela data.</p>
    <div class="timeline">${o.updates.map((u, i) => ({ u, i })).reverse().map(({ u, i }) => { const on = ui.viewIdx == null ? i === o.updates.length - 1 : ui.viewIdx === i; return `<button class="tl ${on ? "on" : ""} ${u.novo ? "novo" : ""}" data-ver="${i}"><span class="rail"><i></i></span><span class="body"><em>${mesRel(u.mes).toUpperCase()}</em><b>${esc(u.t)}</b><span>${esc(u.d)}</span></span></button>`; }).join("")}</div></div>`;
  const botoesCrescer = () => `<div class="row"><button class="btn terra" data-crescer><svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>Ver a obra crescer</button>${ui.viewIdx != null ? `<button class="btn" data-hoje>Voltar para hoje</button>` : ""}</div>`;
  const sairVista = () => (ui.vista ? `<button class="btn" data-sairvista>Sair da vista</button>` : "");

  // ----- Comprador -----
  function painelObra() {
    const o = obraAtiva();
    if (isC(o)) return painelObraCondo(o);
    const s = vista(), av = avanco(s), fl = o.cfg.floors, lajesFaltam = MEU_ANDAR + 1 - atualDe(o).E;
    const meuTxt = lajesFaltam <= 0 ? "A laje do seu andar já foi concretada. O próximo marco é a alvenaria chegar até ele." : `Faltam ${lajesFaltam} laje${lajesFaltam > 1 ? "s" : ""} até o seu andar. No ritmo atual, a laje do 12º andar fica pronta em ${mesRel(lajesFaltam)}.`;
    const stg = [["Fundação", "concluída", "#8a8780"], ["Estrutura", `${s.E}/${fl} lajes`, "#8a8780"], ["Alvenaria", `${s.A}/${fl} andares`, "#b0603c"], ["Fachada", `${s.F}/${fl} andares`, "#C55A3D"], ["Acabamentos", s.F >= fl ? "em andamento" : "após a fachada", "#626874"]];
    return `
      <div class="sec"><div class="eyebrow">Unidade 1204 · Edifício Aurora</div><h1>Sua obra ${ui.viewIdx == null ? "hoje" : "em " + mesRel(s.mes)}</h1></div>
      <div class="sec"><div class="big-stat"><div class="v">${av}<small>%</small></div><div class="t"><b>Previsão de entrega</b>${entregaDe(o)}</div></div><div class="bar"><i style="width:${av}%"></i></div></div>
      <div class="stages">${stg.map(([n, v, c]) => `<div class="stg"><i style="background:${c}"></i><span>${n}</span><span>${v}</span></div>`).join("")}</div>
      <div class="callout"><b>Seu andar</b><p>${meuTxt}</p></div>
      ${botoesCrescer()}
      <label class="toggle"><input type="checkbox" id="tgApe" ${ui.meuApe ? "checked" : ""}> Destacar o meu apartamento no prédio</label>
      ${toggleBonecos()}<div class="divider"></div>${timeline(o)}`;
  }
  function painelObraCondo(o) {
    const s = vista(), av = avanco(s), l = D.lotes.find((x) => x.id === MEU_LOTE), e = estagio(l, s.k), eHoje = estagio(l, atualDe(o).k);
    const faltam = Math.max(0, (5 - eHoje) * 1.5);
    const infra = [["Ruas e redes", s.ruas, "#5c6470"], ["Muro e portaria", s.muro, "#d8d3ca"], ["Clube e lazer", s.clube, "#5CC9EA"], ["Casas do condomínio", Math.round(casasPct(s.k)), "#C55A3D"]];
    return `
      <div class="sec"><div class="eyebrow">Lote ${nn(l.id)} · ${num(l.area)} m² · vista para o ${l.vista.toLowerCase()}</div><h1>Sua casa ${ui.viewIdx == null ? "hoje" : "em " + mesRel(s.mes)}</h1></div>
      <div class="sec"><span class="k">Fases da sua casa</span><div class="steps">${ESTAGIOS.slice(1).map((n, i) => `<div class="step ${i + 1 < e || e === 5 ? "done" : i + 1 === e ? "run" : ""}"><i>${i + 1 < e || e === 5 ? "✓" : ""}</i>${n}</div>`).join("")}</div></div>
      <div class="callout"><b>${e === 0 ? "Obra ainda não começou" : `Fase atual: ${ESTAGIOS[e].toLowerCase()}`}</b><p>${eHoje >= 5 ? "Sua casa está pronta para a vistoria de entrega." : `Previsão de entrega da sua casa: ${mesRel(faltam)}. O condomínio inteiro fica pronto em ${entregaDe(o)}.`}</p></div>
      <div class="row">${botoesCrescer().replace('<div class="row">', "").replace(/<\/div>$/, "")}<button class="btn" data-vista="${l.id}">Ver a vista do meu lote</button>${sairVista()}</div>
      <div class="sec"><div class="big-stat"><div class="v">${av}<small>%</small></div><div class="t"><b>Condomínio concluído</b>entrega ${entregaDe(o)}</div></div><div class="bar"><i style="width:${av}%"></i></div></div>
      <div class="stages">${infra.map(([n, v, c]) => `<div class="stg"><i style="background:${c}"></i><span>${n}</span><span>${v}%</span></div>`).join("")}</div>
      ${toggleBonecos()}<div class="divider"></div>${timeline(o)}`;
  }
  function painelLotes() {
    const o = obraAtiva(), lista = D.lotes, f = ui.filtroLote, sel = lista.find((l) => l.id === ui.loteSel), s = atualDe(o);
    const filt = lista.filter((l) => f === "todos" || l.status === f);
    const disp = lista.filter((l) => l.status === "disponivel"), vgv = disp.reduce((a, l) => a + l.preco, 0);
    const card = sel ? `<div class="obra-card sel" style="cursor:default">
        <div class="top-line"><div><span class="k">Lote ${nn(sel.id)} · ${sel.esquina ? "esquina · " : ""}vista ${sel.vista.toLowerCase()}</span><h3>${num(sel.area)} m²</h3></div><span class="tag ${ST_LOTE[sel.status][1]}">${ST_LOTE[sel.status][0]}</span></div>
        <div class="mini-grid"><div><span class="k">Frente</span><b>13,8 m</b></div><div><span class="k">Fundo</span><b>${num(sel.d * 3, 1)} m</b></div><div><span class="k">Preço/m²</span><b>${BRL.format(sel.pm2)}</b></div><div><span class="k">${sel.status === "vendido" ? "Casa" : "Preço"}</span><b>${sel.status === "vendido" ? ESTAGIOS[estagio(sel, s.k)] : mil(sel.preco)}</b></div></div>
        <div class="row"><button class="btn terra" data-vista="${sel.id}">Ver a vista deste lote</button>${sel.status === "disponivel" ? `<button class="btn" data-interesse="${sel.id}">${ui.persp === "construtora" ? "Reservar para cliente" : "Tenho interesse"}</button>` : ""}${sairVista()}</div></div>` : "";
    return `
      <div class="sec"><div class="eyebrow">Reserva das Águas · ${lista.length} lotes</div><h1>Lotes e vistas</h1><p>Toque num lote para ver o terreno, o preço e a vista dele. Verde está à venda, amarelo está reservado.</p></div>
      <div class="kpi3"><div><span class="k">Disponíveis</span><b>${disp.length}</b><small style="color:var(--dim)">de ${lista.length} lotes</small></div><div><span class="k">A partir de</span><b>${mil(Math.min(...disp.map((l) => l.preco)))}</b><small style="color:var(--dim)">${num(Math.min(...disp.map((l) => l.area)))} m²</small></div><div><span class="k">VGV à venda</span><b>${mi(vgv / 1e6)}</b><small style="color:var(--dim)">lotes livres</small></div></div>
      ${card}
      <div class="seg">${[["todos", "Todos"], ["disponivel", "Disponíveis"], ["reservado", "Reservados"], ["vendido", "Vendidos"]].map(([k, n]) => `<button data-filtrolote="${k}" aria-pressed="${f === k}">${n} <span class="mono" style="color:var(--faint)">${k === "todos" ? lista.length : lista.filter((l) => l.status === k).length}</span></button>`).join("")}</div>
      <div class="people">${filt.map((l) => `<button class="person" data-lote="${l.id}" style="${ui.loteSel === l.id ? "background:var(--panel-2)" : ""}"><span class="avatar" style="background:${l.status === "disponivel" ? "#4DC48C" : l.status === "reservado" ? "#E6B85C" : "#5a606b"};color:#15171b">${nn(l.id)}</span><span style="min-width:0"><b>${num(l.area)} m² · vista ${esc(l.vista.toLowerCase())}</b><small>${l.esquina ? "Esquina · " : ""}${l.status === "vendido" ? `Casa: ${ESTAGIOS[estagio(l, s.k)].toLowerCase()}` : BRL.format(l.pm2) + "/m²"}</small></span><span class="side"><span class="tag ${ST_LOTE[l.status][1]}">${l.status === "disponivel" ? mil(l.preco) : ST_LOTE[l.status][0]}</span></span></button>`).join("")}</div>
      <p class="note">Preços de demonstração. Lotes com vista para o lago custam 25% a mais por m², e os de frente para a mata, 15% a mais.</p>`;
  }
  function painelLazer() {
    const s = vista();
    return `
      <div class="sec"><div class="eyebrow">Reserva das Águas · área comum</div><h1>O condomínio</h1><p>Tudo que é de uso comum dos moradores. Toque num item para vê-lo no mapa.</p></div>
      <div class="stages">${[["Portaria 24h e muro", s.muro], ["Ruas asfaltadas e redes", s.ruas], ["Clube e lazer", s.clube]].map(([n, v]) => `<div class="stg"><i style="background:${v >= 100 ? "var(--green)" : "var(--terra-2)"}"></i><span>${n}</span><span>${v}%</span></div>`).join("")}</div>
      <div class="people">${DEPS.map((d) => { const pronto = s[d.por] >= d.lim, falta = d.lim - s[d.por]; return `<button class="person" data-dep="${d.id}" style="${ui.depSel === d.id ? "background:var(--panel-2)" : ""}"><span class="avatar" style="background:${pronto ? "#4DC48C" : "#2A2F39"};color:${pronto ? "#15171b" : "var(--dim)"}">${pronto ? "✓" : "…"}</span><span style="min-width:0"><b>${esc(d.n)}</b><small>${esc(d.d)}</small></span><span class="side"><span class="tag ${pronto ? "ok" : "warn"}">${pronto ? "Pronto" : falta <= 15 ? "Próximo" : "Em obra"}</span></span></button>`; }).join("")}</div>
      <p class="note">O que ainda não foi construído aparece no 3D como contorno azul, no lugar exato onde vai ficar.</p>`;
  }
  function painelPerto() {
    return `
      <div class="sec"><div class="eyebrow">Estrada do Lago, km 4 · Recanto Azul</div><h1>Arredores</h1><p>O que fica perto do condomínio, com distância e tempo de carro a partir da portaria.</p></div>
      <div class="pois">${ARREDORES.map((p) => `<button class="poi" data-perto="${esc(p.n)}"><i style="background:${p.cor}"></i><span>${esc(p.n)}</span><span>${num(p.km, 1)} km · ${p.min} min de carro</span></button>`).join("")}</div>
      <div class="facts"><div><span class="k">Lago</span><b>Vizinho ao muro leste</b></div><div><span class="k">Mata nativa</span><b>Reserva ao norte</b></div><div><span class="k">Acesso</span><b>Estrada asfaltada</b></div><div><span class="k">Até o centro</span><b>13 min de carro</b></div></div>
      <p class="note">Protótipo: os pontos ficam na direção certa, mas o mapa está fora de escala para caber na tela. A versão real usa um serviço de mapas com trânsito de verdade.</p>`;
  }
  const areaPriv = () => AP.rooms.filter((r) => !r.ext).reduce((t, r) => t + r.area, 0);
  function painelApto() {
    const andar = ui.apMode === "andar", lista = AP.rooms.filter((r) => andar || !r.mini);
    const modos = `<div class="seg">${[["planta", "Planta 3D"], ["andar", "Andar pelo apê"], ["foto", "Foto 360°"]].map(([k, n]) => `<button data-apmode="${k}" aria-pressed="${ui.apMode === k}">${n}</button>`).join("")}</div>`;
    if (ui.apMode === "foto") return `
      <div class="sec"><div class="eyebrow">Unidade 1204 · decorado</div><h1>Foto 360° do apê</h1><p>É assim que fica o tour com imagens 360° do decorado: qualidade de foto, sem precisar modelar nada em 3D. Arraste para olhar em volta.</p></div>
      ${modos}
      <div class="callout"><b>Como funciona no produto</b><p>A construtora envia as fotos ou renders 360° que já usa no marketing, um por cômodo. O Prumo liga cada imagem ao cômodo da planta: o comprador toca na sala e entra na foto.</p></div>
      <div class="list"><div class="li"><span>Origem</span><span>fotos ou renders 360°</span></div><div class="li"><span>Custo extra para a construtora</span><span>nenhum: já existem</span></div><div class="li"><span>Onde aparece</span><span>celular e computador</span></div></div>
      <p class="note">Imagem ilustrativa: apartamento real fotografado em 360° (Poly Haven, licença CC0). Não é a unidade 1204. Nesta demo a foto está em resolução reduzida para carregar rápido; renders de decorado costumam ter 6K a 8K.</p>`;
    const ref = [["Sofá de 3 lugares", "2,20 × 0,92 m"], ["Cama queen", "1,58 × 1,98 m"], ["Mesa redonda (4 lugares)", "Ø 1,10 m"], ["Geladeira", "0,70 × 1,85 m"], ["Porta interna", "0,80 × 2,10 m"], ["Adultos", "1,65 a 1,78 m"], ["Criança", "1,25 m"]];
    return `
      <div class="sec"><div class="eyebrow">Unidade 1204 · 12º andar · Edifício Aurora</div><h1>Meu apartamento</h1><p>${andar ? "Você está dentro do apê, na altura dos olhos. Arraste para olhar em volta e toque no chão para andar até lá." : "Planta em 3D com móveis e pessoas em tamanho real. Toque num cômodo para ver as medidas."}</p></div>
      ${modos}
      <div class="seg">${[["dia", "Dia"], ["noite", "Noite"]].map(([k, n]) => `<button data-luz="${k}" aria-pressed="${(k === "noite") === ui.noite}">${n}</button>`).join("")}</div>
      <div class="sec"><h2>${andar ? "Ir para" : "Cômodos"}</h2><div class="rooms">${lista.map((r) => { const on = andar ? ui.apRoom === r.n : ui.room === r.n; return `<button class="room ${on ? "sel" : ""}" data-room="${esc(r.n)}"><span>${esc(r.n)}</span><span>${num(r.area, 1)} m² · ${fmtM(r.w)} × ${fmtM(r.d)}</span></button>`; }).join("")}</div></div>
      <label class="toggle"><input type="checkbox" id="tgMoveis" ${ui.moveis ? "checked" : ""}> Móveis em tamanho real</label>
      <label class="toggle"><input type="checkbox" id="tgPessoas" ${ui.pessoas ? "checked" : ""}> Pessoas em escala real</label>
      ${andar ? "" : `<label class="toggle"><input type="checkbox" id="tgCotas" ${ui.cotas ? "checked" : ""}> Mostrar medidas</label>`}
      <div class="facts"><div><span class="k">Área privativa</span><b>${num(areaPriv(), 1)} m²</b></div><div><span class="k">Varanda gourmet</span><b>${num(AP.rooms[0].area, 1)} m²</b></div><div><span class="k">Pé-direito</span><b>2,70 m</b></div><div><span class="k">Quartos</span><b>2 (1 suíte + closet)</b></div><div><span class="k">Vaga</span><b>1 coberta</b></div><div><span class="k">Sol</span><b>Manhã (leste)</b></div></div>
      <div class="sec"><h2>Escala de referência</h2><div class="list">${ref.map(([a, b]) => `<div class="li"><span>${a}</span><span class="mono" style="font-size:11.5px;color:var(--dim)">${b}</span></div>`).join("")}</div></div>
      <p class="note">Paredes, portas, janelas, medidas e pé-direito vêm do projeto que a construtora envia. Móveis e figuras são referências em tamanho real, só para dar noção de espaço.</p>
      <p class="note">Modelos 3D: Khronos Group (CC BY 4.0) e exemplos do three.js. Céu e foto 360°: Poly Haven (CC0).</p>`;
  }
  function painelBairro() {
    const dist = POIS.map((p) => { const c = caminho(p.bx, p.bz, poiPos(p)); return { p, km: c.km, a: Math.round((c.km / 4.8) * 60) }; }).sort((a, b) => a.km - b.km);
    return `
      <div class="sec"><div class="eyebrow">Rua das Acácias, 410 · Vila Aurora</div><h1>Bairro e trajetos</h1><p>Coloque onde você trabalha e onde seu filho estuda. O Prumo mostra o caminho e quanto tempo leva.</p></div>
      <form class="sec" id="fTrajeto">
        <div class="field"><label for="tTrab">Trabalho</label><input id="tTrab" placeholder="Ex.: Av. Brasil, 1500" value="${esc(ui.trips.find((t) => t.id === "trab")?.end || "")}"></div>
        <div class="field"><label for="tEsc">Escola do filho</label><input id="tEsc" placeholder="Ex.: Colégio São José" value="${esc(ui.trips.find((t) => t.id === "esc")?.end || "")}"></div>
        <label class="toggle"><input type="checkbox" id="tgPico" ${ui.pico ? "checked" : ""}> Horário de pico (7h–9h)</label>
        <button class="btn terra" type="submit">Calcular trajetos</button></form>
      ${ui.trips.map((t) => { const tm = tempos(t.km, ui.pico), best = Math.min(...tm.map((x) => x.min)); return `<div class="trip ${ui.tripSel === t.id ? "sel" : ""}" data-trip="${t.id}" style="cursor:pointer"><div class="trip-head"><b>${t.id === "trab" ? "Trabalho" : "Escola"} · ${esc(t.end)}</b><span>${num(t.km, 1)} km</span></div><div class="modes">${tm.map((x) => `<div class="mode ${x.min === best ? "best" : ""}"><svg viewBox="0 0 24 24">${x.ic}</svg><b>${fmtMin(x.min)}</b><span>${x.m}</span></div>`).join("")}</div></div>`; }).join("")}
      <div class="sec"><h2>Perto de você</h2><div class="pois">${dist.map(({ p, km, a }) => `<button class="poi" data-poi="${esc(p.n)}"><i style="background:${p.cor}"></i><span>${esc(p.n)}</span><span>${a} min a pé · ${num(km, 1)} km</span></button>`).join("")}</div></div>
      <p class="note">Protótipo: o mapa é uma cidade estilizada e os endereços digitados são posicionados de forma simulada. A versão real usa um serviço de mapas com ruas, trânsito e transporte público de verdade.</p>`;
  }

  // ----- Construtora -----
  function painelCarteira() {
    const tot = D.obras.reduce((a, o) => { const t = totaisDe(o); a.o += t.o; a.p += t.p; a.un += o.unidades; a.v += o.vendidas; a.pes += funcDe(o).length; a.pres += presentesDe(o); return a; }, { o: 0, p: 0, un: 0, v: 0, pes: 0, pres: 0 });
    const alertas = [];
    D.obras.forEach((o) => {
      orcDe(o).forEach((e) => { if (e.p > e.o * 1.05) alertas.push(["bad", `<b>${esc(o.curto)}</b> · ${e.n} ${Math.round((e.p / e.o - 1) * 100)}% acima do orçado`]); });
      [...D.insumos[o.id], ...D.epi[o.id]].filter((i) => stEstoque(i) === "bad").forEach((i) => alertas.push(["bad", `<b>${esc(o.curto)}</b> · ${esc(i.n)} em nível crítico`]));
      const venc = funcDe(o).filter((p) => alertasPessoa(p).length).length; if (venc) alertas.push(["warn", `<b>${esc(o.curto)}</b> · ${venc} funcionário(s) com ASO ou NR vencendo`]);
    });
    D.equip.filter((e) => e.status === "manutencao").forEach((e) => alertas.push(["warn", `<b>Frota</b> · ${esc(e.n)} em manutenção`]));
    return `
      <div class="sec"><div class="eyebrow">Construtora · Silva &amp; Filhos</div><h1>Carteira de obras</h1><p>Prédios e condomínio ao mesmo tempo. Toque numa obra para abrir os detalhes dela.</p></div>
      <div class="kpi3">
        <div><span class="k">Unidades e lotes</span><b>${tot.un}</b><small style="color:var(--dim)">${tot.v} vendidos · ${Math.round((tot.v / tot.un) * 100)}%</small></div>
        <div><span class="k">Equipe</span><b>${tot.pes}</b><small class="up">${tot.pres} em campo hoje</small></div>
        <div><span class="k">Orçamento total</span><b>${mi(tot.o)}</b><small class="${tot.p > tot.o ? "down" : "up"}">projeção ${mi(tot.p)}</small></div>
      </div>
      <div class="sec">${D.obras.map((o) => { const s = atualDe(o), t = totaisDe(o), av = avancoDe(o, s), desv = t.p / t.o - 1, cc = isC(o) ? contaCasas(s.k) : null; return `<button class="obra-card ${o.id === ui.obraId ? "sel" : ""}" data-abrir="${o.id}">
        <div class="top-line"><div style="min-width:0"><span class="k">${isC(o) ? "Condomínio de casas · " : "Edifício · "}${esc(o.end)}</span><h3>${esc(o.nome)}</h3></div><span class="pct">${av}%</span></div>
        <div class="bar"><i style="width:${av}%"></i></div>
        <div class="mini-grid"><div><span class="k">${isC(o) ? "Casas" : "Lajes"}</span><b>${isC(o) ? `${cc.prontas}✓ ${cc.obra} obra` : `${s.E}/${o.cfg.floors}`}</b></div><div><span class="k">Equipe</span><b>${presentesDe(o)}/${funcDe(o).length}</b></div><div><span class="k">Custo</span><b class="${desv > 0.03 ? "down" : ""}">${desv > 0 ? "+" : ""}${num(desv * 100, 1)}%</b></div><div><span class="k">Entrega</span><b>${entregaDe(o)}</b></div></div>
      </button>`; }).join("")}</div>
      <div class="sec"><h2>Pontos de atenção</h2><div class="alerts">${alertas.slice(0, 9).map(([c, t]) => `<div class="alert ${c === "warn" ? "warn" : ""}"><span>${t}</span></div>`).join("") || "<p>Nada pendente.</p>"}</div></div>`;
  }
  function gantt(o) {
    const lin = orcDe(o).filter((e) => e.n !== "Canteiro e administração"), ini = o.inicio, fim = o.entrega, W0 = 100, W1 = 336, x = (m) => W0 + ((m - ini) / (fim - ini)) * (W1 - W0);
    const hgt = 20 + lin.length * 26 + 18; let s = `<svg viewBox="0 0 340 ${hgt}" role="img" aria-label="Cronograma por etapa">`;
    [ini, Math.round(ini / 2), 0, fim].filter((v, i, a) => a.indexOf(v) === i).forEach((m) => { s += `<line x1="${x(m)}" y1="14" x2="${x(m)}" y2="${hgt - 16}" style="stroke:var(--line)"/><text x="${x(m)}" y="${hgt - 4}" text-anchor="middle" style="fill:var(--faint);font:9.5px var(--mono)">${mesCurto(m)}</text>`; });
    lin.forEach((e, k) => { const y = 20 + k * 26, wd = Math.max(2, x(e.fim) - x(e.ini)); s += `<text x="0" y="${y + 11}" style="fill:var(--ink);font:500 11.5px var(--body)">${e.n}</text><rect x="${x(e.ini)}" y="${y + 2}" width="${wd}" height="12" rx="2" style="fill:var(--panel-2);stroke:var(--line)"/><rect x="${x(e.ini)}" y="${y + 2}" width="${(wd * e.pct) / 100}" height="12" rx="2" style="fill:${e.pct >= 100 ? "var(--green)" : "var(--terra)"}"/><text x="${Math.min(x(e.fim) + 4, 316)}" y="${y + 12}" style="fill:var(--dim);font:9.5px var(--mono)">${e.pct}%</text>`; });
    s += `<line x1="${x(0)}" y1="10" x2="${x(0)}" y2="${hgt - 16}" style="stroke:var(--gold);stroke-width:1.5;stroke-dasharray:3 3"/><text x="${x(0)}" y="9" text-anchor="middle" style="fill:var(--gold);font:600 9.5px var(--mono)">HOJE</text>`;
    return s + "</svg>";
  }
  function painelGeral() {
    const o = obraAtiva(), s = atualDe(o), t = totaisDe(o), fis = avancoDe(o, s), fin = Math.round((t.r / t.o) * 100);
    const alerta = orcDe(o).find((e) => e.p > e.o * 1.05);
    const fr = (f) => funcDe(o).filter((p) => p.status === "presente" && f.includes(p.funcao)).length;
    const cc = isC(o) ? contaCasas(s.k) : null;
    const facts = isC(o)
      ? `<div><span class="k">Área total</span><b>${num(o.area)} m²</b></div><div><span class="k">Lotes</span><b>${o.unidades} · ${D.lotes.filter((l) => l.status === "vendido").length} vendidos</b></div><div><span class="k">Casas</span><b>${cc.obra} em obra · ${cc.prontas} pronta</b></div><div><span class="k">Início</span><b>${mesRel(o.inicio)}</b></div><div><span class="k">Responsável técnico</span><b style="font-size:12.5px">${esc(o.resp)}</b></div><div><span class="k">Equipe hoje</span><b>${presentesDe(o)} de ${funcDe(o).length}</b></div>`
      : `<div><span class="k">Área construída</span><b>${num(o.area)} m²</b></div><div><span class="k">Pavimentos</span><b>${o.cfg.floors} · ${o.unidades} unidades</b></div><div><span class="k">Vendidas</span><b>${o.vendidas} (${Math.round((o.vendidas / o.unidades) * 100)}%)</b></div><div><span class="k">Início</span><b>${mesRel(o.inicio)}</b></div><div><span class="k">Responsável técnico</span><b style="font-size:12.5px">${esc(o.resp)}</b></div><div><span class="k">Equipe hoje</span><b>${presentesDe(o)} de ${funcDe(o).length}</b></div>`;
    const frentes = isC(o)
      ? `<div class="stg"><i style="background:#5CC9EA"></i><span>Clube · estrutura (${s.clube}%)</span><span>${fr(["arm", "carp"])} pessoas</span></div><div class="stg"><i style="background:#b0603c"></i><span>Casas em alvenaria</span><span>${fr(["ped"])} pessoas</span></div><div class="stg"><i style="background:#E07A2E"></i><span>Casas em pintura</span><span>${fr(["fach"])} pessoas</span></div><div class="stg"><i style="background:#2F6FD6"></i><span>Redes e instalações</span><span>${fr(["ele", "enc"])} pessoas</span></div>`
      : `${s.E < o.cfg.floors ? `<div class="stg"><i style="background:#8a8780"></i><span>Estrutura · laje ${s.E + 1}</span><span>${fr(["arm", "carp"])} pessoas</span></div>` : ""}<div class="stg"><i style="background:#b0603c"></i><span>${s.A < o.cfg.floors ? `Alvenaria · ${s.A}º andar` : "Reboco interno"}</span><span>${fr(["ped"])} pessoas</span></div>${s.F < o.cfg.floors ? `<div class="stg"><i style="background:#C55A3D"></i><span>Fachada · ${s.F}º andar</span><span>${fr(["fach"])} pessoas</span></div>` : ""}<div class="stg"><i style="background:#2F6FD6"></i><span>Instalações internas</span><span>${fr(["ele", "enc"])} pessoas</span></div>`;
    return `
      <div class="sec"><div class="eyebrow">${isC(o) ? "Condomínio de casas · " : ""}${esc(o.end)}</div><h1>${esc(o.nome)}</h1>
        <div class="chips"><span class="chip ok">Dentro do prazo</span><span class="chip ok">${o.semAcidente} dias sem acidentes</span>${alerta ? `<span class="chip warn">${alerta.n} acima do orçado</span>` : ""}</div></div>
      <div class="kpi3"><div><span class="k">Avanço físico</span><b>${fis}%</b><small style="color:var(--dim)">${isC(o) ? `${cc.obra} casas em obra` : `${s.E}/${o.cfg.floors} lajes`}</small></div><div><span class="k">Avanço financeiro</span><b>${fin}%</b><small class="${fin <= fis ? "up" : "down"}">${fin <= fis ? "abaixo do físico" : "acima do físico"}</small></div><div><span class="k">Entrega</span><b>${entregaDe(o)}</b><small style="color:var(--dim)">em ${o.entrega} meses</small></div></div>
      <div class="facts">${facts}</div>
      <div class="sec"><h2>Cronograma por etapa</h2><div class="chart">${gantt(o)}</div></div>
      <div class="sec"><h2>Frentes de trabalho hoje</h2><div class="stages">${frentes}</div></div>
      ${toggleBonecos()}`;
  }
  function curvaS(o) {
    const t = totaisDe(o), ini = o.inicio, fim = o.entrega, n = fim - ini;
    const plan = (m) => { const u = (m - ini) / n, f = (v) => 1 / (1 + Math.exp(-(v - 0.5) * 9)); return t.o * ((f(u) - f(0)) / (f(1) - f(0))); };
    const fator = t.r / Math.max(0.01, plan(0)), W0 = 34, W1 = 334, H0 = 12, H1 = 148, ymax = Math.ceil(Math.max(t.p, t.o) / 5) * 5, passoG = ymax > 30 ? 10 : 5;
    const x = (m) => W0 + ((m - ini) / n) * (W1 - W0), y = (v) => H1 - (v / ymax) * (H1 - H0);
    let s = `<svg viewBox="0 0 340 170" role="img" aria-label="Curva S do custo acumulado">`;
    for (let v = 0; v <= ymax; v += passoG) s += `<line x1="${W0}" y1="${y(v)}" x2="${W1}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${W0 - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:var(--faint);font:9.5px var(--mono)">${v}</text>`;
    [ini, 0, fim].forEach((m) => (s += `<text x="${x(m)}" y="164" text-anchor="middle" style="fill:var(--faint);font:9.5px var(--mono)">${mesCurto(m)}</text>`));
    const pp = [], rr = [], pj = []; for (let m = ini; m <= fim; m++) pp.push(`${x(m).toFixed(1)},${y(plan(m)).toFixed(1)}`);
    for (let m = ini; m <= 0; m++) rr.push(`${x(m).toFixed(1)},${y(plan(m) * (m === 0 ? fator : 0.9 + 0.1 * fator)).toFixed(1)}`);
    for (let m = 0; m <= fim; m++) pj.push(`${x(m).toFixed(1)},${y(t.r + (plan(m) - plan(0)) * ((t.p - t.r) / Math.max(0.01, t.o - plan(0)))).toFixed(1)}`);
    s += `<polygon points="${x(ini)},${y(0)} ${rr.join(" ")} ${x(0)},${y(0)}" style="fill:var(--terra);fill-opacity:.14"/><polyline points="${pp.join(" ")}" style="fill:none;stroke:var(--dim);stroke-width:1.5"/><polyline points="${pj.join(" ")}" style="fill:none;stroke:var(--gold);stroke-width:1.5;stroke-dasharray:4 3"/><polyline points="${rr.join(" ")}" style="fill:none;stroke:var(--terra-2);stroke-width:2.2"/>`;
    s += `<circle cx="${x(0)}" cy="${y(t.r)}" r="3.5" style="fill:var(--terra-2)"/><text x="${x(0) - 6}" y="${y(t.r) - 7}" text-anchor="end" style="fill:var(--ink);font:600 10px var(--mono)">${num(t.r, 1)}</text><text x="${W1}" y="${y(t.p) - 6}" text-anchor="end" style="fill:var(--gold);font:600 10px var(--mono)">${num(t.p, 1)}</text><text x="${W0}" y="9" style="fill:var(--faint);font:9.5px var(--mono)">R$ MILHÕES ACUMULADOS</text>`;
    return s + "</svg>";
  }
  function painelOrcamento() {
    const o = obraAtiva(), t = totaisDe(o), dif = t.p / t.o - 1, etapas = orcDe(o), pior = etapas.reduce((a, e) => (e.p / e.o > a.p / a.o ? e : a), etapas[0]);
    return `
      <div class="sec"><div class="eyebrow">${esc(o.nome)} · custos</div><h1>Orçamento da obra</h1><p>Quanto foi orçado, quanto já saiu e onde a obra vai terminar no ritmo atual.</p></div>
      <div class="kpi3"><div><span class="k">Orçado</span><b>${mi(t.o)}</b><small style="color:var(--dim)">${BRL.format((t.o * 1e6) / o.area)}/m²</small></div><div><span class="k">Realizado</span><b>${mi(t.r)}</b><small style="color:var(--dim)">${Math.round((t.r / t.o) * 100)}% do total</small></div><div><span class="k">Projeção</span><b>${mi(t.p)}</b><small class="${dif > 0 ? "down" : "up"}">${dif > 0 ? "+" : ""}${num(dif * 100, 1)}%</small></div></div>
      <div class="sec"><h2>Curva S · custo acumulado</h2><div class="chart">${curvaS(o)}</div><div class="legend-inline"><span><i style="background:var(--dim)"></i>Planejado</span><span><i style="background:var(--terra-2)"></i>Realizado</span><span><i style="background:var(--gold)"></i>Projeção</span></div></div>
      <div class="sec"><h2>Por etapa</h2><div>${etapas.map((e) => { const e2 = Math.max(e.o, e.p) * 1.05, al = e.p > e.o * 1.05; return `<div class="etp ${al ? "alerta" : ""}"><div class="etp-head"><b style="font-weight:500">${e.n}</b><span>${mi(e.r)} de ${mi(e.o)}</span></div><div class="etp-bar"><i style="width:${(e.r / e2) * 100}%;${e.pct >= 100 ? "background:var(--green)" : ""}"></i><b style="left:${(e.o / e2) * 100}%"></b><em style="left:${Math.min((e.p / e2) * 100, 99)}%"></em></div><div class="etp-head"><span>${e.pct}% executado</span><span>projeção ${mi(e.p)}${al ? ` · +${Math.round((e.p / e.o - 1) * 100)}%` : ""}</span></div></div>`; }).join("")}</div>
        <p class="note">Barra = realizado · traço branco = orçado · tracejado dourado = projeção no ritmo atual.</p></div>
      ${pior.p > pior.o * 1.05 ? `<div class="callout" style="border-color:var(--red);background:rgba(240,98,98,.06)"><b style="color:var(--red)">Atenção: ${pior.n}</b><p>Projeção ${Math.round((pior.p / pior.o - 1) * 100)}% acima do orçado, cerca de ${mi(pior.p - pior.o)} a mais. Rever fornecedor e perdas antes da próxima compra.</p></div>` : ""}`;
  }
  function painelEquipe() {
    const o = obraAtiva(), lista = funcDe(o), grupos = FUNCOES.map((f) => ({ f: fnInfo(o, f.id), pes: lista.filter((p) => p.funcao === f.id) })).filter((g) => g.pes.length);
    return `
      <div class="sec"><div class="eyebrow">${esc(o.nome)} · pessoas</div><h1>Equipe por função</h1><p>Toque numa função para ver essas pessoas trabalhando no modelo 3D.</p></div>
      <div class="kpi3"><div><span class="k">Contratados</span><b>${lista.length}</b><small style="color:var(--dim)">${grupos.length} funções</small></div><div><span class="k">Presentes hoje</span><b>${presentesDe(o)}</b><small class="up">${Math.round((presentesDe(o) / lista.length) * 100)}% presença</small></div><div><span class="k">Folha mensal</span><b>${mi(folhaDe(o) / 1e6)}</b><small style="color:var(--dim)">com encargos</small></div></div>
      ${toggleBonecos()}
      <div class="funcoes">${grupos.map(({ f, pes }) => `<button class="fn ${ui.funcaoSel === f.id ? "sel" : ""}" data-funcao="${f.id}"><i class="hat" style="background:${f.hat}"></i><span><b>${f.n}</b><p>${f.d}</p><span class="where">${esc(ondeTrabalha(o, f.id))}</span></span><span class="cnt">${pes.length}<small>${pes.filter((p) => p.status === "presente").length} hoje</small></span></button>`).join("")}</div>
      <div class="sec"><h2>Cor do capacete</h2><div class="hats"><span><i style="background:#F2F2EE"></i>Engenharia e mestre</span><span><i style="background:#3FA86A"></i>Segurança do trabalho</span><span><i style="background:#F2C230"></i>Equipe de produção</span><span><i style="background:#2F6FD6"></i>Instalações</span><span><i style="background:#E07A2E"></i>${isC(o) ? "Pintura" : "Fachada"}</span><span><i style="background:#E2453A"></i>Sinaleiro</span></div></div>`;
  }
  function painelFuncionarios() {
    const o = obraAtiva(), lista = funcDe(o);
    if (ui.ficha) { const p = lista.find((x) => x.id === ui.ficha); if (p) return fichaFuncionario(o, p); ui.ficha = null; }
    const q = ui.busca.trim().toLowerCase();
    const passa = (p, k) => (k === "todos" ? true : k === "alerta" ? alertasPessoa(p).length > 0 : p.status === k);
    const filtrados = lista.filter((p) => passa(p, ui.filtroSt) && (!q || p.nome.toLowerCase().includes(q) || fnInfo(o, p.funcao).n.toLowerCase().includes(q) || p.mat.toLowerCase().includes(q)));
    return `
      <div class="sec"><div class="eyebrow">${esc(o.nome)} · fichas</div><h1>Funcionários</h1><p>Toque numa pessoa para abrir a ficha completa.</p></div>
      <input class="search" id="busca" placeholder="Buscar por nome, função ou matrícula" value="${esc(ui.busca)}" autocomplete="off" aria-label="Buscar funcionário">
      <div class="seg">${[["todos", "Todos"], ["presente", "Presentes"], ["falta", "Faltas"], ["ferias", "Férias"], ["alerta", "Com pendência"]].map(([k, n]) => `<button data-filtro="${k}" aria-pressed="${ui.filtroSt === k}">${n} <span class="mono" style="color:var(--faint)">${lista.filter((p) => passa(p, k)).length}</span></button>`).join("")}</div>
      <div class="people">${filtrados.map((p) => { const f = fnInfo(o, p.funcao), al = alertasPessoa(p), st = ST_PESSOA[p.status]; return `<button class="person" data-ficha="${p.id}"><span class="avatar" style="background:${f.hat}">${iniciais(p.nome)}</span><span style="min-width:0"><b>${esc(p.nome)}</b><small>${f.n} · ${p.mat}</small></span><span class="side"><span class="tag ${st[1]}">${st[0]}</span>${al.length ? `<span class="tag bad">${esc(al[0])}</span>` : ""}</span></button>`; }).join("") || "<p>Ninguém encontrado com esse filtro.</p>"}</div>`;
  }
  function fichaFuncionario(o, p) {
    const f = fnInfo(o, p.funcao), st = ST_PESSOA[p.status], no3D = W.lista.some((w) => w.empId === p.id && w.ativo), dias = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    const estado = (m) => (m < 0 ? "Vencido" : m < 2 ? "Vence logo" : "Em dia");
    return `
      <button class="btn ghost" data-voltar style="align-self:flex-start;padding:6px 0">← Todos os funcionários</button>
      <div class="ficha-head"><span class="avatar" style="background:${f.hat}">${iniciais(p.nome)}</span><div><div class="eyebrow">${f.n}</div><h1>${esc(p.nome)}</h1></div></div>
      <div class="chips"><span class="tag ${st[1]}">${st[0]}</span>${alertasPessoa(p).map((a) => `<span class="tag bad">${esc(a)}</span>`).join("")}</div>
      ${no3D ? `<button class="btn terra" data-ver3d="${p.id}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/></svg>Ver no canteiro em 3D</button>` : ""}
      <div class="facts">
        <div><span class="k">Matrícula</span><b>${p.mat}</b></div><div><span class="k">Admissão</span><b>${mesRel(p.admissao)}</b></div>
        <div><span class="k">Frente de trabalho</span><b style="font-size:12.5px">${esc(ondeTrabalha(o, p.funcao))}</b></div><div><span class="k">Obra</span><b style="font-size:12.5px">${esc(o.curto)}</b></div>
        <div><span class="k">Salário</span><b>${BRL.format(p.salario)}</b></div><div><span class="k">Custo com encargos</span><b>${BRL.format(p.salario * ENCARGOS)}</b></div>
        <div><span class="k">Horas no mês</span><b>${p.horas} h</b></div><div><span class="k">Horas extras</span><b>${p.extras} h</b></div>
      </div>
      <div class="sec"><h2>Presença da semana</h2><div class="week">${p.presenca.map((v, i) => `<div class="${v === 1 ? "on" : v === -2 ? "off" : ""}">${dias[i]}<br>${v === 1 ? "✓" : v === -2 ? "falta" : "—"}</div>`).join("")}</div></div>
      <div class="sec"><h2>O que faz</h2><p>${f.d}</p></div>
      <div class="sec"><h2>Treinamentos e saúde</h2><div class="list">
        <div class="li"><span>ASO · exame ocupacional<small>Validade ${mesRel(p.aso)}</small></span><span class="tag ${treinoSt(p.aso)}">${estado(p.aso)}</span></div>
        ${p.trein.map((t) => `<div class="li"><span>${esc(t.t)}<small>Validade ${mesRel(t.m)}</small></span><span class="tag ${treinoSt(t.m)}">${estado(t.m)}</span></div>`).join("")}
      </div></div>
      <div class="sec"><h2>EPIs entregues</h2><div class="list">${p.epis.map((e) => `<div class="li"><span>${esc(e.e)}<small>CA ${e.ca}</small></span><span class="mono" style="font-size:11.5px;color:var(--dim)">${dataRel(e.dias)}</span></div>`).join("")}</div></div>`;
  }
  function painelMateriais() {
    const o = obraAtiva(), ins = D.insumos[o.id], epi = D.epi[o.id], fer = D.ferr[o.id];
    const nIns = ins.filter((i) => stEstoque(i) !== "ok").length, nEpi = epi.filter((i) => stEstoque(i) !== "ok").length, nMan = D.equip.filter((e) => (ui.frota || e.obra === o.id) && e.status === "manutencao").length;
    let corpo = "";
    if (ui.matAba === "equip") {
      const lista = D.equip.filter((e) => ui.frota || e.obra === o.id), custo = lista.filter((e) => e.posse !== "Terceiro").reduce((s, e) => s + e.custo, 0);
      corpo = `
        <label class="toggle"><input type="checkbox" id="tgFrota" ${ui.frota ? "checked" : ""}> Ver a frota inteira da empresa</label>
        <p style="font-size:12.5px">${lista.length} equipamentos · custo mensal ${BRL.format(custo)}. Toque num equipamento para localizá-lo no canteiro.</p>
        <div>${lista.map((e) => { const st = ST_EQ[e.status], ob = e.obra === "patio" ? "Pátio da empresa" : obraPorId(e.obra).curto; const acao = ui.transf === e.id ? `<span class="qty"><select class="mini-sel" id="destino" aria-label="Obra de destino">${[...D.obras.map((x) => [x.id, x.curto]), ["patio", "Pátio"]].filter(([id]) => id !== e.obra).map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join("")}</select><button data-confirmar="${e.id}">Mover</button><button data-cancelar>✕</button></span>` : e.tipo === "grua" ? "<span>Fixa na obra</span>" : e.posse === "Terceiro" ? "<span>Serviço contratado</span>" : `<span class="qty"><button data-transferir="${e.id}">Transferir</button></span>`; return `<div class="mat-row click ${ui.equipSel === e.id ? "sel" : ""}" data-equip="${e.id}">
          <div class="mat-head"><span><b>${esc(e.n)}</b><small>${esc(ob)} · ${e.posse}${e.custo ? ` · ${BRL.format(e.custo)}/mês` : ""}</small></span><span class="mat-tags"><span class="tag ${st[1]}">${st[0]}</span></span></div>
          <div class="mat-foot"><span>${e.hor != null ? `Horímetro ${num(e.hor)} h · ` : ""}${esc(e.man)}</span>${acao}</div></div>`; }).join("")}</div>`;
    } else if (ui.matAba === "insumos" || ui.matAba === "epi") {
      const lista = ui.matAba === "insumos" ? ins : epi, movs = D.mov.filter((m) => m.obra === o.id);
      corpo = `<div>${lista.map((i) => { const st = stEstoque(i), e2 = Math.max(i.est, i.min) * 1.25, dd = ui.matAba === "insumos" ? diasEstoque(i) : null, un = i.un || "un"; return `<div class="mat-row">
        <div class="mat-head"><span><b>${esc(i.n)}</b><small>${ui.matAba === "epi" ? `CA ${i.ca} · ` : ""}mínimo ${num(i.min, 1)} ${un}</small></span><span class="mat-tags"><span class="tag ${st}">${st === "ok" ? "Em dia" : st === "warn" ? "Repor" : "Crítico"}</span></span></div>
        <div class="stock"><i class="${st === "ok" ? "" : st}" style="width:${Math.min(100, (i.est / e2) * 100)}%"></i><b style="left:${(i.min / e2) * 100}%"></b></div>
        <div class="mat-foot"><span>${num(i.est, 1)} ${un} em estoque${dd != null && i.sem ? ` · dura ${dd > 60 ? "60+" : dd} dias` : ""}</span><span class="qty"><button data-mov="${ui.matAba}|${i.id}|-1" aria-label="Saída de ${i.lote}">− ${i.lote}</button><button data-mov="${ui.matAba}|${i.id}|1" aria-label="Entrada de ${i.lote}">+ ${i.lote}</button></span></div></div>`; }).join("")}</div>
        ${ui.matAba === "epi" ? `<p class="note">Fichas de EPI assinadas: ${funcDe(o).length - 3} de ${funcDe(o).length}. Cada entrega fica registrada na ficha do funcionário.</p>` : ""}
        ${movs.length ? `<div class="sec"><h2>Últimas movimentações</h2><div class="list">${movs.slice(0, 5).map((m) => `<div class="li"><span>${esc(m.n)}<small>${m.quando}</small></span><span class="mono ${m.q > 0 ? "up" : "down"}" style="font-size:12px">${m.q > 0 ? "+" : ""}${num(m.q, 1)}</span></div>`).join("")}</div></div>` : ""}`;
    } else {
      corpo = `<div>${fer.map((f) => `<div class="mat-row"><div class="mat-head"><span><b>${esc(f.n)}</b><small>Responsável: almoxarifado</small></span><span class="mat-tags">${f.man ? `<span class="tag bad">${f.man} em manutenção</span>` : `<span class="tag ok">OK</span>`}</span></div>
        <div class="stock"><i style="width:${(f.uso / f.tot) * 100}%;background:var(--cyan)"></i></div><div class="mat-foot"><span>${f.uso} em uso · ${Math.max(0, f.tot - f.uso - f.man)} no almoxarifado · ${f.tot} no total</span></div></div>`).join("")}</div>`;
    }
    return `
      <div class="sec"><div class="eyebrow">${esc(o.nome)} · materiais</div><h1>Controle de material</h1><p>Do caminhão ao capacete: o que está na obra, o que está acabando e o que precisa de manutenção.</p></div>
      <div class="seg">${[["equip", "Equipamentos", nMan], ["insumos", "Insumos", nIns], ["ferr", "Ferramentas", 0], ["epi", "EPI", nEpi]].map(([k, n, a]) => `<button data-mataba="${k}" aria-pressed="${ui.matAba === k}">${n}${a ? `<em>${a}</em>` : ""}</button>`).join("")}</div>
      ${corpo}`;
  }
  function painelProjeto() {
    const o = obraAtiva(), u = ui.upload, etapas = ["Lendo o arquivo do projeto", isC(o) ? "Separando quadras, ruas e áreas comuns" : "Separando os pavimentos", `Identificando ${isC(o) ? "os" : "as"} ${o.unidades} ${isC(o) ? "lotes" : "unidades"}`, "Gerando o modelo 3D para os compradores"];
    return `
      <div class="sec"><div class="eyebrow">${esc(o.nome)}</div><h1>Projeto do empreendimento</h1><p>Envie o projeto executivo uma vez. O Prumo transforma o arquivo no modelo 3D que cada comprador acompanha.</p></div>
      <label class="drop" id="drop" for="fileIn"><svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg><b>Arraste o arquivo ou clique para escolher</b><span>IFC, RVT, SKP, DWG ou GLB${isC(o) ? " · inclua o loteamento" : ""}</span></label>
      <input type="file" id="fileIn" accept=".ifc,.rvt,.skp,.dwg,.glb,.gltf" hidden>
      ${u ? `<div class="sec"><span class="k">${esc(u.nome)} · ${u.tam}</span><div class="steps">${etapas.map((e, i) => `<div class="step ${i < u.passo ? "done" : i === u.passo ? "run" : ""}"><i>${i < u.passo ? "✓" : ""}</i>${e}</div>`).join("")}</div></div>` : ""}
      <div class="facts"><div><span class="k">Arquivo atual</span><b style="font-size:12.5px;word-break:break-all">${esc(o.arquivo || o.id + "_executivo_rev03.ifc")}</b></div><div><span class="k">${isC(o) ? "Tipo" : "Pavimentos"}</span><b>${isC(o) ? "Condomínio horizontal" : o.cfg.floors}</b></div><div><span class="k">${isC(o) ? "Lotes" : "Unidades"}</span><b>${o.unidades}</b></div><div><span class="k">Vendidos</span><b>${o.vendidas} · com acesso</b></div></div>
      <p class="note">Na demonstração o arquivo não é processado de verdade: as etapas são simuladas e o modelo exibido é o da obra selecionada.</p>`;
  }
  function painelEvolucao() {
    const o = obraAtiva(), s = ui.rascunho || (ui.rascunho = { ...atualDe(o) });
    if (isC(o)) {
      const sl = (k, n, desc, max = 100, step = 5, suf = "%") => `<div class="slider"><div class="slider-head"><b>${n}</b><span id="v${k}">${s[k]}${suf}</span></div><input type="range" min="0" max="${max}" step="${step}" value="${s[k]}" data-slider="${k}" aria-label="${n}"><span style="font-size:11.5px;color:var(--faint)">${desc}</span></div>`;
      return `
        <div class="sec"><div class="eyebrow">${esc(o.nome)} · registro mensal</div><h1>Registrar evolução</h1><p>Atualize a infraestrutura e o andamento das casas. O condomínio ao lado muda na hora.</p></div>
        ${sl("ruas", "Ruas e redes", "Asfalto, água, esgoto e drenagem")}${sl("muro", "Muro e portaria", "A portaria fica pronta a partir de 60%")}${sl("clube", "Clube e lazer", "Cada área de lazer aparece quando chega a sua vez")}${sl("k", "Casas · meses de obra", "Cada casa vendida avança uma fase por mês", 10, 1, " meses")}
        <div class="field"><label for="uTit">Título do comunicado</label><input id="uTit" placeholder="Ex.: Piscinas prontas"></div>
        <div class="field"><label for="uTxt">Mensagem para os compradores</label><textarea id="uTxt" placeholder="Conte o que avançou neste mês"></textarea></div>
        <div class="row"><button class="btn terra" data-publicar>Publicar para ${o.vendidas} compradores</button><button class="btn ghost" data-descartar>Descartar</button></div>`;
    }
    const fl = o.cfg.floors, sl = (k, n, desc) => `<div class="slider"><div class="slider-head"><b>${n}</b><span id="v${k}">${s[k]} de ${fl}</span></div><input type="range" min="0" max="${fl}" value="${s[k]}" data-slider="${k}" aria-label="${n}"><span style="font-size:11.5px;color:var(--faint)">${desc}</span></div>`;
    return `
      <div class="sec"><div class="eyebrow">${esc(o.nome)} · registro mensal</div><h1>Registrar evolução</h1><p>Atualize o que avançou. O modelo ao lado muda na hora, e é exatamente isso que os compradores vão ver.</p></div>
      ${sl("E", "Estrutura · lajes concretadas", "Laje e pilares de cada pavimento")}${sl("A", "Alvenaria · andares com paredes", "Não pode passar da estrutura")}${sl("F", "Fachada · andares com revestimento", "Não pode passar da alvenaria")}
      <div class="field"><label for="uTit">Título do comunicado</label><input id="uTit" placeholder="Ex.: Nova laje concretada"></div>
      <div class="field"><label for="uTxt">Mensagem para os compradores</label><textarea id="uTxt" placeholder="Conte o que avançou neste mês"></textarea></div>
      <div class="row"><button class="btn terra" data-publicar>Publicar para ${o.vendidas} compradores</button><button class="btn ghost" data-descartar>Descartar</button></div>`;
  }
  const PAINEIS = { obra: painelObra, apto: painelApto, bairro: painelBairro, lotes: painelLotes, lazer: painelLazer, perto: painelPerto, carteira: painelCarteira, geral: painelGeral, orcamento: painelOrcamento, equipe: painelEquipe, funcionarios: painelFuncionarios, materiais: painelMateriais, projeto: painelProjeto, evolucao: painelEvolucao };
  function renderPainel() { $("#panel").innerHTML = PAINEIS[ui.tab](); hud(); }
  function manterScroll() { const p = $("#panel"), sc = p.scrollTop, wy = window.scrollY; renderPainel(); p.scrollTop = sc; try { window.scrollTo(0, wy); } catch {} }

  function trocarObra(id) {
    if (id === ui.obraId) return;
    Object.assign(ui, { obraId: id, viewIdx: null, rascunho: null, funcaoSel: null, empSel: null, ficha: null, equipSel: null, transf: null, upload: null, loteSel: null, depSel: null, poiSel: null, vista: null });
    aplicarEstado(atualDe(obraAtiva()), false);
  }
  function irAba(tab) {
    const antes = ui.tab; ui.tab = tab;
    if (tab === "obra" && ui.novo) ui.novo = false;
    if (tab !== "equipe") ui.funcaoSel = null;
    if (tab !== "funcionarios") { ui.empSel = null; ui.ficha = null; }
    if (tab !== "materiais") { ui.equipSel = null; ui.transf = null; }
    if (tab !== "lotes") ui.loteSel = null;
    if (tab !== "lazer") ui.depSel = null;
    if (tab !== "perto") ui.poiSel = null;
    ativar(CENA_DA_ABA[tab]);
    if (tab === "apto" && antes !== "apto") aplicarModoApto(true);
    layoutCarteira(tab === "carteira");
    if (tab === "evolucao") aplicarEstado(ui.rascunho || atualDe(obraAtiva()));
    else if (CENA_DA_ABA[tab] === "obra") aplicarEstado(vista());
    const mudouModo = antes == null || tab === "carteira" || antes === "carteira" || tab === "obra" || tab === "perto" || antes === "perto" || ui.vista;
    if (CENA_DA_ABA[tab] === "obra" && mudouModo) cameraPara(obraAtiva(), tab === "carteira");
    const B = PREDIOS[ui.obraId];
    if (B.condo) { B.arred.forEach((a) => (a.lin.visible = tab === "perto" && (!ui.poiSel || ui.poiSel === a.p.n))); atualizarLotes(obraAtiva(), vista()); }
    renderTopo(); renderPainel();
  }
  let crescendo = null;
  function crescer() {
    clearTimeout(crescendo); const o = obraAtiva(); let i = 0;
    ui.viewIdx = 0; aplicarEstado(isC(o) ? { terra: 0, ruas: 0, muro: 0, clube: 0, k: 0 } : { E: 0, A: 0, F: 0, fund: false }, false); obra.controls.autoRotate = true;
    if (ui.vista) cameraPara(o);
    const passo = () => { ui.viewIdx = i; aplicarEstado(o.updates[i]); renderPainel(); i++; crescendo = setTimeout(i < o.updates.length ? passo : () => { ui.viewIdx = null; renderPainel(); }, 1700); };
    crescendo = setTimeout(passo, 500);
  }
  function simularUpload(file) {
    const o = obraAtiva(), tam = file ? (file.size > 1e6 ? `${(file.size / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1e3))} KB`) : "—";
    ui.upload = { nome: file?.name || "projeto", tam, passo: 0 }; renderPainel();
    const t = setInterval(() => { if (!ui.upload) return clearInterval(t); ui.upload.passo++; if (ui.upload.passo >= 4) { clearInterval(t); o.arquivo = ui.upload.nome; toast("Projeto processado. O modelo 3D já está disponível para os compradores."); } if (ui.tab === "projeto") renderPainel(); }, 900);
  }
  function focarEm(pos, y = 2, dist = null) {
    obra.controls.autoRotate = false; ui.vista = null; obra.controls.minDistance = obra.minPadrao;
    if (dist) { const alvo = new T.Vector3(pos.x, y, pos.z); obra.camAnim = { pos: alvo.clone().add(new T.Vector3(dist * 0.55, dist * 0.75, dist * 0.8)), alvo }; }
    else { obra.camAnim = null; obra.alvoAnim = new T.Vector3(pos.x, Math.max(y, pos.y), pos.z); }
  }

  // ---------- Eventos ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-persp],[data-tab],[data-crescer],[data-hoje],[data-ver],[data-room],[data-poi],[data-trip],[data-publicar],[data-descartar],[data-funcao],[data-abrir],[data-ficha],[data-voltar],[data-ver3d],[data-filtro],[data-mataba],[data-transferir],[data-confirmar],[data-cancelar],[data-mov],[data-equip],[data-lote],[data-filtrolote],[data-vista],[data-sairvista],[data-interesse],[data-dep],[data-perto],[data-apmode],[data-luz],#resetDemo");
    if (!b) return;
    const d = b.dataset;
    if (b.id === "resetDemo") { clearTimeout(crescendo); D = seed(); Object.assign(ui, { viewIdx: null, novo: false, trips: [], tripSel: null, upload: null, rascunho: null, funcaoSel: null, empSel: null, ficha: null, equipSel: null, transf: null, loteSel: null, vista: null }); PREDIOS.reserva.lotes.forEach((x, i) => (x.l = D.lotes[i])); posicionarEquipamentos(); D.obras.forEach((o) => aplicarEstado(atualDe(o), false, o)); irAba(ui.tab); toast("Demonstração restaurada."); return; }
    if (d.persp) { ui.persp = d.persp; if (d.persp === "comprador") trocarObra(ui.compra); return irAba(abasAtuais()[0][0]); }
    if (d.tab) return irAba(d.tab);
    if (d.abrir) { trocarObra(d.abrir); return irAba("geral"); }
    if ("crescer" in d) return crescer();
    if ("hoje" in d) { clearTimeout(crescendo); ui.viewIdx = null; aplicarEstado(vista()); return renderPainel(); }
    if (d.ver) { clearTimeout(crescendo); const o = obraAtiva(), i = Number(d.ver); ui.viewIdx = i === o.updates.length - 1 ? null : i; aplicarEstado(vista()); return renderPainel(); }
    if (d.room) { selecionarComodo(d.room); hud(); return manterScroll(); }
    if (d.apmode) { if (ui.apMode === d.apmode) return; ui.apMode = d.apmode; if (d.apmode === "andar" && ui.room) ui.apRoom = ui.room; aplicarModoApto(true); return renderPainel(); }
    if (d.luz) { ui.noite = d.luz === "noite"; aplicarLuz(); return manterScroll(); }
    if (d.lote) {
      const l = D.lotes.find((x) => x.id === Number(d.lote)); ui.loteSel = ui.loteSel === l.id ? null : l.id;
      if (ui.loteSel) focarEm(new T.Vector3(l.x, 0, l.zc), 0, 16); else cameraPara(obraAtiva());
      atualizarLotes(obraAtiva(), vista()); renderPainel(); $("#panel").scrollTop = 0; return;
    }
    if (d.filtrolote) { ui.filtroLote = d.filtrolote; return manterScroll(); }
    if (d.vista) { const l = D.lotes.find((x) => x.id === Number(d.vista)); verVista(l); hud(); toast(`Vista do lote ${nn(l.id)}: ${l.vista.toLowerCase()}. Arraste para olhar em volta.`); return manterScroll(); }
    if ("sairvista" in d) { cameraPara(obraAtiva()); return manterScroll(); }
    if (d.interesse) { const l = D.lotes.find((x) => x.id === Number(d.interesse)); if (ui.persp === "construtora") { l.status = "reservado"; atualizarLotes(obraAtiva(), vista()); toast(`Lote ${nn(l.id)} reservado por 48 horas.`); } else toast(`Recebemos seu interesse no lote ${nn(l.id)}. Um corretor entra em contato (demonstração).`); return manterScroll(); }
    if (d.dep) { const dp = DEPS.find((x) => x.id === d.dep); ui.depSel = dp.id; focarEm(new T.Vector3(dp.x, 0, dp.z), 0.3, 11); return manterScroll(); }
    if (d.perto) { ui.poiSel = d.perto; const a = PREDIOS.reserva.arred.find((x) => x.p.n === d.perto); PREDIOS.reserva.arred.forEach((x) => (x.lin.visible = x === a)); focarEm(new T.Vector3(a.p.x * 0.5, 0, a.p.z * 0.5 + 10), 0, 40 + Math.hypot(a.p.x, a.p.z) * 0.45); toast(`${a.p.n}: ${num(a.p.km, 1)} km, cerca de ${a.p.min} min de carro.`); return; }
    if (d.funcao) {
      ui.funcaoSel = ui.funcaoSel === d.funcao ? null : d.funcao; ui.bonecos = true;
      const ws = W.lista.filter((w) => w.funcao === ui.funcaoSel && w.ativo);
      if (ui.funcaoSel && ws.length) { const c = ws.reduce((v, w) => v.add(w.g.position), new T.Vector3()).divideScalar(ws.length); isC(obraAtiva()) ? focarEm(c, 0.3, 9) : focarEm(c.multiplyScalar(0.5)); }
      else if (ui.funcaoSel) toast(`${fnInfo(obraAtiva(), ui.funcaoSel).n}: ${ondeTrabalha(obraAtiva(), ui.funcaoSel)}. Não aparecem no modelo externo.`);
      else cameraPara(obraAtiva());
      return manterScroll();
    }
    if (d.ficha) { ui.ficha = d.ficha; ui.empSel = d.ficha; renderPainel(); $("#panel").scrollTop = 0; return; }
    if ("voltar" in d) { ui.ficha = null; ui.empSel = null; return renderPainel(); }
    if (d.ver3d) { ui.empSel = d.ver3d; ui.bonecos = true; const w = W.lista.find((x) => x.empId === d.ver3d); if (w) isC(obraAtiva()) ? focarEm(w.g.position.clone(), 0.3, 7) : focarEm(w.g.position.clone(), w.g.position.y + 0.5); toast("Destacado em dourado no canteiro."); return; }
    if (d.filtro) { ui.filtroSt = d.filtro; return renderPainel(); }
    if (d.mataba) { ui.matAba = d.mataba; ui.equipSel = null; ui.transf = null; return renderPainel(); }
    if (d.transferir) { ui.transf = d.transferir; return manterScroll(); }
    if ("cancelar" in d) { ui.transf = null; return manterScroll(); }
    if (d.confirmar) {
      const eq = D.equip.find((x) => x.id === d.confirmar), dest = $("#destino").value;
      eq.obra = dest; eq.status = dest === "patio" ? "disponivel" : eq.status === "manutencao" ? "manutencao" : "uso"; ui.transf = null; ui.equipSel = null;
      posicionarEquipamentos(); toast(`${eq.n} transferido para ${dest === "patio" ? "o pátio da empresa" : obraPorId(dest).curto}.`); return manterScroll();
    }
    if (d.mov) {
      const [tipo, id, sg] = d.mov.split("|"), o = obraAtiva(), it = (tipo === "insumos" ? D.insumos[o.id] : D.epi[o.id]).find((x) => x.id === id), q = Number(sg) * it.lote;
      if (it.est + q < 0) { toast("O estoque não pode ficar negativo."); return; }
      it.est = +(it.est + q).toFixed(2);
      const ag = new Date(); D.mov.unshift({ obra: o.id, n: it.n, q, quando: `${q > 0 ? "Entrada" : "Saída"} · hoje ${String(ag.getHours()).padStart(2, "0")}:${String(ag.getMinutes()).padStart(2, "0")}` });
      return manterScroll();
    }
    if (d.equip) {
      if (e.target.closest(".qty")) return;
      ui.equipSel = ui.equipSel === d.equip ? null : d.equip;
      const eq = D.equip.find((x) => x.id === d.equip), m = EQ3D[d.equip];
      if (ui.equipSel) {
        if (eq.obra !== ui.obraId) toast(eq.obra === "patio" ? `${eq.n} está no pátio da empresa.` : `${eq.n} está na obra ${obraPorId(eq.obra).curto}.`);
        else if (eq.tipo === "grua") { const c = PREDIOS[ui.obraId].crane; if (c) focarEm(c.grua.position.clone(), 6); }
        else if (m) { const p = new T.Vector3(); m.g.getWorldPosition(p); isC(obraAtiva()) ? focarEm(p, 0.5, 10) : focarEm(p, 1); }
      }
      return manterScroll();
    }
    if (d.poi) { const p = POIS.find((x) => x.n === d.poi), c = caminho(p.bx, p.bz, poiPos(p)); ui.tripSel = null; desenharRota(c.pts, p.c); toast(`${p.n}: ${Math.round((c.km / 4.8) * 60)} min a pé (${num(c.km, 1)} km).`); return renderPainel(); }
    if (d.trip) { const t = ui.trips.find((x) => x.id === d.trip); ui.tripSel = t.id; desenharRota(t.pts, t.id === "trab" ? 0xe6b85c : 0x5cc9ea); return renderPainel(); }
    if ("publicar" in d) {
      const o = obraAtiva(), s = ui.rascunho, ant = atualDe(o), campos = isC(o) ? ["ruas", "muro", "clube", "k"] : ["E", "A", "F"];
      if (campos.every((c) => s[c] === ant[c])) { toast("Nada mudou desde a última atualização. Mova algum controle antes de publicar."); return; }
      const t = $("#uTit").value.trim() || (isC(o) ? (s.clube > ant.clube ? `Clube em ${s.clube}%` : s.k > ant.k ? "Casas avançaram mais uma fase" : "Infraestrutura avançou") : s.E > ant.E ? `${s.E}ª laje concretada` : s.F > ant.F ? `Fachada até o ${s.F}º andar` : "Nova etapa concluída");
      const txt = $("#uTxt").value.trim() || (isC(o) ? `Ruas em ${s.ruas}%, muro em ${s.muro}%, clube em ${s.clube}%. ${contaCasas(s.k).obra} casas em obra e ${contaCasas(s.k).prontas} prontas.` : `Estrutura em ${s.E} de ${o.cfg.floors} lajes, alvenaria em ${s.A} andares e fachada em ${s.F} andares.`);
      o.updates.forEach((u) => (u.novo = false)); o.updates.push({ ...s, mes: 0, fund: true, t, d: txt, novo: true });
      ui.rascunho = null; ui.viewIdx = null; if (o.id === "aurora") ui.novo = true;
      posicionarEquipamentos(); toast(`Publicado. ${o.vendidas} compradores de ${o.curto} receberam a atualização.`); return irAba("evolucao");
    }
    if ("descartar" in d) { ui.rascunho = null; return irAba("evolucao"); }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "busca") { ui.busca = e.target.value; const pos = e.target.selectionStart; renderPainel(); const i = $("#busca"); i.focus(); i.setSelectionRange(pos, pos); return; }
    const k = e.target.dataset.slider; if (!k) return;
    const o = obraAtiva(), s = ui.rascunho; s[k] = Number(e.target.value);
    if (isC(o)) { $("#v" + k).textContent = k === "k" ? `${s.k} meses` : `${s[k]}%`; }
    else {
      if (k === "E" || k === "A") { s.A = Math.min(s.A, s.E); s.F = Math.min(s.F, s.A); } if (k === "F") s.F = Math.min(s.F, s.A);
      ["E", "A", "F"].forEach((x) => { const inp = document.querySelector(`[data-slider="${x}"]`); if (inp) inp.value = s[x]; $("#v" + x).textContent = `${s[x]} de ${o.cfg.floors}`; });
    }
    aplicarEstado(s);
    $("#hud").innerHTML = `<span>RASCUNHO · AVANÇO</span><b>${avanco({ ...s, fund: true })}%</b><span>${resumoObra(o, s)}</span>`;
  });
  document.addEventListener("change", (e) => {
    const id = e.target.id;
    if (id === "selObra") { const eraCarteira = ui.tab === "carteira"; trocarObra(e.target.value); const abas = abasConstrutora(obraAtiva()).map((a) => a[0]); cameraPara(obraAtiva()); return irAba(eraCarteira || !abas.includes(ui.tab) ? "geral" : ui.tab); }
    if (id === "selCompra") { ui.compra = e.target.value; trocarObra(ui.compra); return irAba("obra"); }
    if (id === "tgApe") ui.meuApe = e.target.checked;
    if (id === "tgMoveis") ui.moveis = e.target.checked;
    if (id === "tgPessoas") ui.pessoas = e.target.checked;
    if (id === "tgCotas") { ui.cotas = e.target.checked; atualizarCotas(); }
    if (id === "tgBonecos") ui.bonecos = e.target.checked;
    if (id === "tgFrota") { ui.frota = e.target.checked; return manterScroll(); }
    if (id === "tgPico") { ui.pico = e.target.checked; if (ui.trips.length) renderPainel(); }
    if (id === "fileIn" && e.target.files[0]) simularUpload(e.target.files[0]);
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "fTrajeto") return; e.preventDefault();
    const itens = [["trab", $("#tTrab").value.trim(), true], ["esc", $("#tEsc").value.trim(), false]].filter((x) => x[1]);
    if (!itens.length) { toast("Digite pelo menos um endereço."); return; }
    ui.trips = itens.map(([id, end, longe]) => { const { bx, bz } = destinoDeEndereco(end, longe); const alvo = new T.Vector3(bx * P + (bx >= 0 ? -2.5 : 2.5), 0, bz * P + (bz >= 0 ? -2.5 : 2.5)); const c = caminho(bx, bz, alvo); return { id, end, km: c.km, pts: c.pts, alvo }; });
    BA.pinos.forEach((p) => { removerLabel(bairro, p.lbl); bairro.scene.remove(p.mesh); });
    BA.pinos = ui.trips.map((t) => { const cor = t.id === "trab" ? 0xe6b85c : 0x5cc9ea; const mesh = new T.Mesh(new T.ConeGeometry(0.9, 2.6, 16), mat(cor, { e: cor, ei: 0.6 })); mesh.rotation.x = Math.PI; mesh.position.set(t.alvo.x, 1.6, t.alvo.z); bairro.scene.add(mesh); return { mesh, lbl: label(bairro, `${t.id === "trab" ? "Trabalho" : "Escola"} · ${esc(t.end)}`, new T.Vector3(t.alvo.x, 3.4, t.alvo.z), t.id === "trab" ? "gold" : "cyan") }; });
    ui.tripSel = ui.trips[0].id; desenharRota(ui.trips[0].pts, ui.trips[0].id === "trab" ? 0xe6b85c : 0x5cc9ea); renderPainel();
  });
  document.addEventListener("dragover", (e) => { const d = e.target.closest?.("#drop"); if (d) { e.preventDefault(); d.classList.add("over"); } });
  document.addEventListener("dragleave", (e) => { e.target.closest?.("#drop")?.classList.remove("over"); });
  document.addEventListener("drop", (e) => { const d = e.target.closest?.("#drop"); if (!d) return; e.preventDefault(); d.classList.remove("over"); if (e.dataTransfer.files[0]) simularUpload(e.dataTransfer.files[0]); });

  // ---------- Início ----------
  if (location.hostname === "x") window.__dbg = { cenas, AP, W, fin() { Object.values(cenas).forEach((c) => { if (c.camAnim) { c.camera.position.copy(c.camAnim.pos); c.controls.target.copy(c.camAnim.alvo); c.camAnim = null; } if (c.alvoAnim) { c.controls.target.copy(c.alvoAnim); c.alvoAnim = null; } c.controls.update(); }); } };
  // Link "voltar ao site" só quando a demo está dentro da página de vendas (pasta demo/).
  if (!/\/demo\/(index\.html)?$/.test(location.pathname)) $("#voltarSite")?.remove();
  // #condominio abre direto o Reserva das Águas (botão "Ver o condomínio na demo").
  if (location.hash === "#condominio") { ui.compra = "reserva"; trocarObra("reserva"); }
  irAba("obra");
  requestAnimationFrame(laco);
})();
