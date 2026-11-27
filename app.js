'use strict';
/* Mundo do Theo — jogos educativos (4 anos). Tudo offline, sem anúncios, sem coleta de dados. */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- preferências (ficam só no tablet) ---------- */
function load(k, d) { try { const v = localStorage.getItem('theo_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem('theo_' + k, JSON.stringify(v)); } catch (e) {} }
const state = { stars: load('stars', 0), voice: load('voice', true), sound: load('sound', true), limite: load('limite', 0) };

/* ---------- voz ---------- */
// No app Android (APK) a fala usa o TTS nativo do tablet; no navegador, a Web Speech API.
const CAP = window.Capacitor;
const NATIVO = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
const TTS = NATIVO ? ((CAP.Plugins && CAP.Plugins.TextToSpeech) || (CAP.registerPlugin && CAP.registerPlugin('TextToSpeech'))) : null;
let vozPt = null;
function escolherVoz() {
  const vs = speechSynthesis.getVoices();
  vozPt = vs.find(v => /pt[-_]BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null;
}
if (!TTS && 'speechSynthesis' in window) { escolherVoz(); speechSynthesis.onvoiceschanged = escolherVoz; }
function falar(txt) {
  if (!state.voice) return;
  if (TTS) { TTS.stop().catch(() => {}).then(() => TTS.speak({ text: txt, lang: 'pt-BR', rate: 0.9, pitch: 1.15 })).catch(() => {}); return; }
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt);
  u.lang = 'pt-BR'; if (vozPt) u.voice = vozPt;
  u.rate = 0.9; u.pitch = 1.15;
  speechSynthesis.speak(u);
}

/* ---------- sons sintetizados (sem arquivos) ---------- */
let ctx = null;
function audio() { if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; }
function tom(freq, dur = .15, quando = 0, tipo = 'sine', vol = .2) {
  if (!state.sound) return; const c = audio(); if (!c) return;
  const t = c.currentTime + quando, o = c.createOscillator(), g = c.createGain();
  o.type = tipo; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
}
const som = {
  acerto() { [523, 659, 784, 1047].forEach((f, i) => tom(f, .2, i * .09, 'triangle')); },
  erro() { tom(330, .18, 0, 'sine', .12); tom(262, .25, .15, 'sine', .12); },
  pop() { tom(500 + Math.random() * 500, .09, 0, 'square', .07); },
  clique() { tom(880, .06, 0, 'sine', .1); },
  vitoria() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tom(f, .25, i * .13, 'triangle', .18)); }
};

const PARABENS = ['Muito bem, Theo!', 'Isso aí!', 'Você é demais!', 'Uhuu! Acertou!', 'Mandou bem!', 'Que inteligente!'];
const QUASE = ['Quase! Tenta de novo.', 'Opa! Tenta outra vez.', 'Hmm... tenta de novo!'];

/* ---------- personagem original: Dino Teco ---------- */
const DINO = `<svg class="dino" viewBox="0 0 200 165" aria-hidden="true">
  <path d="M52 112 Q14 118 6 84 Q30 100 58 92 Z" fill="#5cd68c"/>
  <path d="M62 74 l10 -16 l10 14 l10 -18 l10 16 l10 -16 l8 18" fill="#ffa94d"/>
  <ellipse cx="95" cy="108" rx="50" ry="38" fill="#5cd68c"/>
  <ellipse cx="98" cy="118" rx="30" ry="22" fill="#c3f5d5"/>
  <rect x="70" y="128" width="17" height="28" rx="8" fill="#47c27a"/>
  <rect x="106" y="128" width="17" height="28" rx="8" fill="#47c27a"/>
  <ellipse cx="128" cy="86" rx="20" ry="26" fill="#5cd68c"/>
  <circle cx="146" cy="58" r="34" fill="#5cd68c"/>
  <circle cx="156" cy="50" r="10" fill="#fff"/><circle cx="158" cy="51" r="6" fill="#2b2b2b"/><circle cx="160" cy="48" r="2" fill="#fff"/>
  <circle cx="166" cy="70" r="6" fill="#ffb3c1"/>
  <path d="M150 76 Q164 86 176 72" stroke="#2b8a6e" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M140 102 q12 6 18 -4" stroke="#47c27a" stroke-width="8" fill="none" stroke-linecap="round"/>
</svg>`;

/* ---------- dados ---------- */
const CORES = [
  { n: 'vermelho', c: '#fa3c3c' }, { n: 'azul', c: '#3b82f6' }, { n: 'amarelo', c: '#ffd43b' },
  { n: 'verde', c: '#40c057' }, { n: 'laranja', c: '#ff922b' }, { n: 'roxo', c: '#9c36b5' }, { n: 'rosa', c: '#f783ac' }
];
const ANIMAIS = [
  { e: '🐶', n: 'o cachorro', s: 'au au au' }, { e: '🐱', n: 'o gato', s: 'miau' },
  { e: '🐄', n: 'a vaca', s: 'muuuu' }, { e: '🦆', n: 'o pato', s: 'quá quá quá' },
  { e: '🐔', n: 'a galinha', s: 'có có có' }, { e: '🐷', n: 'o porco', s: 'óinc óinc' },
  { e: '🐑', n: 'a ovelha', s: 'mééé' }, { e: '🐸', n: 'o sapo', s: 'croac croac' },
  { e: '🦁', n: 'o leão', s: 'roooar' }, { e: '🦖', n: 'o dinossauro', s: 'ROOOOAAAR' },
  { e: '🐴', n: 'o cavalo', s: 'iiirrí' }, { e: '🐤', n: 'o passarinho', s: 'piu piu' },
  { e: '🐘', n: 'o elefante' }, { e: '🦒', n: 'a girafa' }, { e: '🐰', n: 'o coelho' },
  { e: '🐢', n: 'a tartaruga' }, { e: '🦋', n: 'a borboleta' }, { e: '🦕', n: 'o dinossauro pescoçudo' }
];
const PALAVRAS = [
  { l: 'T', f: 'tê', p: 'THEO', e: '👦' }, { l: 'A', f: 'á', p: 'ABELHA', e: '🐝' },
  { l: 'B', f: 'bê', p: 'BOLA', e: '⚽' }, { l: 'C', f: 'cê', p: 'CACHORRO', e: '🐶' },
  { l: 'D', f: 'dê', p: 'DINOSSAURO', e: '🦖' }, { l: 'E', f: 'é', p: 'ELEFANTE', e: '🐘' },
  { l: 'G', f: 'gê', p: 'GATO', e: '🐱' }, { l: 'M', f: 'eme', p: 'MACACO', e: '🐵' },
  { l: 'O', f: 'ó', p: 'OVO', e: '🥚' }, { l: 'P', f: 'pê', p: 'PATO', e: '🦆' },
  { l: 'S', f: 'esse', p: 'SAPO', e: '🐸' }, { l: 'U', f: 'u', p: 'UVA', e: '🍇' }, { l: 'V', f: 'vê', p: 'VACA', e: '🐄' }
];

/* ---------- infraestrutura de telas ---------- */
let limpezas = [], travado = false, jogoAtual = null, emDescanso = false, inicioSessao = Date.now();
function aoSair(fn) { limpezas.push(fn); }
function depois(fn, ms) { const t = setTimeout(fn, ms); aoSair(() => clearTimeout(t)); }
function tela(html, cls = '') {
  limpezas.forEach(f => f()); limpezas = [];
  if (TTS) TTS.stop().catch(() => {}); else if ('speechSynthesis' in window) speechSynthesis.cancel();
  $$('.confete').forEach(c => c.remove());
  app.innerHTML = `<div class="tela ${cls}">${html}</div>`;
  return app.firstElementChild;
}
const topo = t => `<div class="topo"><button class="btn-casa" aria-label="Início">🏠</button><div class="titulo">${t}</div><div class="estrelas">⭐ ${state.stars}</div></div>`;
function ligarCasa(el) { const b = $('.btn-casa', el); if (b) b.onclick = () => { som.clique(); home(); }; }

function confete(qtd = 30) {
  const cores = ['#ff6b6b', '#ffd43b', '#4cc9a0', '#4dabf7', '#f783ac', '#9775fa', '#ff922b'];
  for (let i = 0; i < qtd; i++) {
    const c = document.createElement('div');
    c.className = 'confete';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = rnd(cores);
    c.style.setProperty('--d', (1.2 + Math.random() * 1.4) + 's');
    c.style.setProperty('--x', (Math.random() * 200 - 100) + 'px');
    c.style.animationDelay = Math.random() * .3 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3200);
  }
}

/* Jogo em rodadas: monta uma pergunta por vez e termina com a vitória. */
function rodadas(total, montar) {
  let n = 0;
  const prox = () => { n++; if (n > total) { vitoria(); return; } travado = false; montar(n, prox); };
  prox();
}
function montarEscolha(o) {
  const el = tela(topo(o.titulo) +
    `<div class="pergunta">${o.pergunta}<button class="btn-ouvir" aria-label="Ouvir de novo">🔊</button></div>` +
    (o.palco || '') +
    `<div class="opcoes">${o.ops.map((op, i) => `<button class="opcao" data-i="${i}">${o.render(op)}</button>`).join('')}</div>`);
  ligarCasa(el);
  const ouvir = () => falar(o.fala);
  $('.btn-ouvir', el).onclick = ouvir;
  depois(ouvir, 350);
  $$('.opcao', el).forEach(b => b.onclick = () => {
    if (travado) return;
    if (o.certo(o.ops[b.dataset.i])) {
      travado = true; b.classList.add('certo'); som.acerto(); confete(18);
      falar(o.falaCerto || rnd(PARABENS));
      depois(o.prox, 2300);
    } else {
      som.erro(); b.classList.add('balanca'); setTimeout(() => b.classList.remove('balanca'), 500);
      falar(rnd(QUASE));
    }
  });
  return el;
}

/* ---------- telas ---------- */
function inicio() {
  const el = tela(`<div class="splash">${DINO}<h1>Mundo do Theo</h1><button class="btn play">▶ Vamos brincar!</button></div>`);
  $('.play', el).onclick = () => {
    audio(); som.clique(); telaCheia();
    home();
    falar('Oi, Theo! Eu sou o Dino Teco. Vamos brincar?');
  };
}

const JOGOS = [
  { id: 'cores', nome: 'Cores', emoji: '🎨', cor: '#ff6b6b', fn: jogoCores },
  { id: 'contar', nome: 'Contar', emoji: '🦕', cor: '#40c057', fn: jogoContar },
  { id: 'memoria', nome: 'Memória', emoji: '🃏', cor: '#7b6cff', fn: jogoMemoria },
  { id: 'detetive', nome: 'Detetive', emoji: '🔍', cor: '#ff922b', fn: jogoSombras },
  { id: 'letras', nome: 'Letras', emoji: '🔤', cor: '#4dabf7', fn: jogoLetras },
  { id: 'animais', nome: 'Animais', emoji: '🐶', cor: '#f783ac', fn: jogoAnimais },
  { id: 'baloes', nome: 'Balões', emoji: '🎈', cor: '#22b8cf', fn: jogoBaloes }
];

function home() {
  jogoAtual = null;
  const el = tela(`
    <div class="topo"><button class="btn-pais" aria-label="Área dos pais">⚙️</button><div class="titulo">Mundo do Theo</div><div class="estrelas">⭐ ${state.stars}</div></div>
    <div class="hero">${DINO}<div class="balao-fala">Oi, Theo! Vamos brincar?</div></div>
    <div class="grade">${JOGOS.map(j => `<button class="card" data-id="${j.id}" style="--c:${j.cor}"><span class="card-emoji">${j.emoji}</span><span class="card-nome">${j.nome}</span></button>`).join('')}</div>`, 'home');
  $$('.card', el).forEach(b => b.onclick = () => { som.clique(); abrir(JOGOS.find(j => j.id === b.dataset.id)); });
  $('.hero', el).onclick = () => falar('Oi, Theo! Eu sou o Dino Teco! Escolhe um jogo!');
  segurar($('.btn-pais', el), areaPais);
}
function abrir(j) { jogoAtual = j; j.fn(); }

function vitoria() {
  state.stars++; save('stars', state.stars);
  const j = jogoAtual;
  const el = tela(`<div class="vitoria">${DINO}<h1>Parabéns, Theo!</h1><div class="estrela-grande">⭐</div>
    <p class="sub">Você ganhou uma estrela! Agora tem ${state.stars}.</p>
    <div class="botoes"><button class="btn de-novo">🔁 De novo</button><button class="btn sec casa">🏠 Início</button></div></div>`);
  som.vitoria(); confete(60);
  depois(() => falar('Parabéns, Theo! Você ganhou uma estrela!'), 300);
  $('.de-novo', el).onclick = () => { som.clique(); abrir(j); };
  $('.casa', el).onclick = () => { som.clique(); home(); };
}

/* ---------- jogos ---------- */
function jogoCores() {
  rodadas(5, (n, prox) => {
    const ops = shuffle(CORES).slice(0, n < 3 ? 3 : 4);
    const alvo = rnd(ops);
    montarEscolha({
      titulo: 'Cores', prox, ops,
      pergunta: `Cadê o <b style="color:${alvo.c}">${alvo.n.toUpperCase()}</b>?`,
      fala: `Cadê a cor ${alvo.n}? Toque nela!`,
      render: c => `<span class="cor" style="--c:${c.c}"></span>`,
      certo: c => c === alvo,
      falaCerto: `Isso! ${cap(alvo.n)}!`
    });
  });
}

function jogoContar() {
  rodadas(5, (n, prox) => {
    const max = Math.min(2 + n, 8);
    const q = 1 + Math.floor(Math.random() * max);
    const nums = new Set([q]);
    while (nums.size < 3) nums.add(1 + Math.floor(Math.random() * Math.max(max, 4)));
    const bichos = Array.from({ length: q }, () => rnd(['🦕', '🦖']));
    const el = montarEscolha({
      titulo: 'Contar', prox, ops: shuffle([...nums]),
      pergunta: 'Quantos dinossauros?',
      fala: n === 1 ? 'Quantos dinossauros tem aqui? Toque em cada um para contar!' : 'Quantos dinossauros?',
      palco: `<div class="palco">${bichos.map(b => `<span class="bicho">${b}</span>`).join('')}</div>`,
      render: x => `<span class="num">${x}</span>`,
      certo: x => x === q,
      falaCerto: `Isso! ${q === 1 ? 'Um dinossauro' : q + ' dinossauros'}!`
    });
    let c = 0;
    $$('.bicho', el).forEach(b => b.onclick = () => {
      if (b.classList.contains('contado')) return;
      c++; b.classList.add('contado'); b.dataset.n = c; som.pop(); falar(String(c));
    });
  });
}

function jogoMemoria() {
  const figs = shuffle(['🐶', '🦖', '🦕', '🦴', '🥚', '🌋', '🐕', '🌳']).slice(0, 4);
  const cartas = shuffle([...figs, ...figs]);
  const el = tela(topo('Memória') + `<div class="memoria">${cartas.map((f, i) =>
    `<button class="carta" data-i="${i}"><div class="carta-in"><div class="face verso">🐾</div><div class="face frente">${f}</div></div></button>`).join('')}</div>`);
  ligarCasa(el);
  depois(() => falar('Vire as cartas e ache os pares iguais!'), 300);
  let abertas = [], pares = 0, ocupado = false;
  $$('.carta', el).forEach(c => c.onclick = () => {
    if (ocupado || c.classList.contains('virada')) return;
    som.clique(); c.classList.add('virada'); abertas.push(c);
    if (abertas.length < 2) return;
    const [a, b] = abertas; abertas = [];
    if (cartas[a.dataset.i] === cartas[b.dataset.i]) {
      pares++;
      depois(() => {
        a.classList.add('par'); b.classList.add('par'); som.acerto(); confete(12); falar(rnd(PARABENS));
        if (pares === figs.length) depois(vitoria, 1800);
      }, 450);
    } else {
      ocupado = true;
      depois(() => { a.classList.remove('virada'); b.classList.remove('virada'); ocupado = false; }, 1100);
    }
  });
}

function jogoSombras() {
  const seq = shuffle(ANIMAIS).slice(0, 5);
  rodadas(5, (n, prox) => {
    const alvo = seq[n - 1];
    const ops = shuffle([alvo, ...shuffle(ANIMAIS.filter(a => a.e !== alvo.e)).slice(0, 2)]);
    montarEscolha({
      titulo: 'Detetive', prox, ops,
      pergunta: 'De quem é essa sombra?',
      fala: n === 1 ? 'O Detetive Bolinha precisa da sua ajuda! De quem é essa sombra?' : 'De quem é essa sombra?',
      palco: `<div class="palco-sombra"><span class="detetive">🐶🔍</span><span class="sombra">${alvo.e}</span></div>`,
      render: a => `<span class="emoji-op">${a.e}</span>`,
      certo: a => a === alvo,
      falaCerto: `Isso, detetive! É ${alvo.n}!`
    });
  });
}

function jogoLetras() {
  const seq = [PALAVRAS[0], ...shuffle(PALAVRAS.slice(1)).slice(0, 4)];  // começa sempre com T de Theo
  rodadas(5, (n, prox) => {
    const w = seq[n - 1];
    const nome = w.p === 'THEO' ? 'Theo' : w.p.toLowerCase();
    const ops = shuffle([w, ...shuffle(PALAVRAS.filter(x => x.l !== w.l)).slice(0, 2)]);
    montarEscolha({
      titulo: 'Letras', prox, ops,
      pergunta: `Cadê a letra <b class="destaque">${w.l}</b>?`,
      fala: `${w.f}, de ${nome}! Toque na letra ${w.f}.`,
      palco: `<div class="palco-letra"><span class="emoji-grande">${w.e}</span><span class="palavra"><b>${w.p[0]}</b>${w.p.slice(1)}</span></div>`,
      render: x => `<span class="letra">${x.l}</span>`,
      certo: x => x === w,
      falaCerto: `Isso! ${w.f}, de ${nome}!`
    });
  });
}

function jogoAnimais() {
  const lista = ANIMAIS.filter(a => a.s);
  const el = tela(topo('Animais') + `<div class="pergunta">Que som eles fazem?</div>` +
    `<div class="animais">${lista.map((a, i) => `<button class="animal" data-i="${i}"><span>${a.e}</span><span>${cap(a.n.split(' ').slice(1).join(' '))}</span></button>`).join('')}</div>`);
  ligarCasa(el);
  depois(() => falar('Toque nos bichos para ouvir o som deles!'), 300);
  $$('.animal', el).forEach(b => b.onclick = () => {
    const a = lista[b.dataset.i];
    b.classList.remove('fala'); void b.offsetWidth; b.classList.add('fala');
    som.pop(); falar(`${cap(a.n)} faz: ${a.s}!`);
  });
}

function jogoBaloes() {
  const meta = 10; let estourados = 0;
  const el = tela(topo('Balões') + `<div class="pergunta">Estoure os balões! <span class="contador">0</span></div><div class="ceu"></div>`);
  ligarCasa(el);
  depois(() => falar('Estoure os balões! Vamos contar até dez!'), 300);
  const ceu = $('.ceu', el), cont = $('.contador', el);
  const cria = () => {
    const b = document.createElement('button');
    b.className = 'balao';
    b.style.setProperty('--c', rnd(CORES).c);
    b.style.left = (4 + Math.random() * 80) + '%';
    b.style.setProperty('--d', (5 + Math.random() * 3) + 's');
    b.addEventListener('animationend', () => b.remove());
    b.addEventListener('pointerdown', () => {
      if (estourados >= meta) return;
      const r = b.getBoundingClientRect(), rc = ceu.getBoundingClientRect();
      const p = document.createElement('span');
      p.className = 'puf'; p.textContent = '💥';
      p.style.left = (r.left - rc.left) + 'px'; p.style.top = (r.top - rc.top) + 'px';
      ceu.appendChild(p); setTimeout(() => p.remove(), 450);
      b.remove(); som.pop();
      estourados++; cont.textContent = estourados; falar(String(estourados));
      if (estourados >= meta) { clearInterval(iv); depois(vitoria, 1300); }
    });
    ceu.appendChild(b);
  };
  cria();
  const iv = setInterval(cria, 900);
  aoSair(() => clearInterval(iv));
}

/* ---------- área dos pais (segurar 3 s) ---------- */
function segurar(btn, acao) {
  let t = null;
  const fim = () => { clearTimeout(t); btn.classList.remove('segurando'); };
  btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.classList.add('segurando'); t = setTimeout(() => { fim(); acao(); }, 3000); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, fim));
  btn.addEventListener('contextmenu', e => e.preventDefault());
}

function areaPais() {
  const onoff = k => `<button class="tg ${state[k] ? '' : 'off'}" data-k="${k}">${state[k] ? 'Ligado' : 'Desligado'}</button>`;
  const el = tela(`<div class="topo"><button class="btn-casa" aria-label="Início">🏠</button><div class="titulo">Área dos pais</div><div style="width:68px"></div></div>
    <div class="pais">
      <div class="linha"><span>🗣️ Voz</span>${onoff('voice')}</div>
      <div class="linha"><span>🎵 Sons</span>${onoff('sound')}</div>
      <div class="linha"><span>⏱️ Limite de tempo</span><select id="lim">${[0, 15, 20, 30, 45, 60].map(m => `<option value="${m}" ${state.limite == m ? 'selected' : ''}>${m ? m + ' min' : 'Sem limite'}</option>`).join('')}</select></div>
      <div class="linha"><span>⭐ Estrelas: ${state.stars}</span><button class="tg" id="zerar">Zerar</button></div>
      <div class="linha"><span>📺 Tela cheia</span><button class="tg" id="cheia">Ativar</button></div>
      <p class="dica">Para abrir esta área, segure o ⚙️ da tela inicial por 3 segundos. Quando o limite de tempo acaba, o app mostra a tela "Hora de descansar"; segure o 🔒 por 3 segundos para liberar.</p>
    </div>`);
  ligarCasa(el);
  $$('.tg[data-k]', el).forEach(b => b.onclick = () => {
    const k = b.dataset.k; state[k] = !state[k]; save(k, state[k]);
    b.textContent = state[k] ? 'Ligado' : 'Desligado'; b.classList.toggle('off', !state[k]);
    if (k === 'voice' && state.voice) falar('Voz ligada!');
    if (k === 'sound') som.acerto();
  });
  $('#lim', el).onchange = e => { state.limite = +e.target.value; save('limite', state.limite); inicioSessao = Date.now(); };
  $('#zerar', el).onclick = () => { state.stars = 0; save('stars', 0); areaPais(); };
  $('#cheia', el).onclick = telaCheia;
}

function descanso() {
  emDescanso = true;
  const el = tela(`<div class="descanso">${DINO}<div class="zzz">💤</div><h1>Hora de descansar, Theo!</h1>
    <p class="sub">O Dino Teco também vai dormir. Até mais tarde!</p>
    <button class="btn-pais" aria-label="Liberar (pais)">🔒</button></div>`);
  depois(() => falar('Hora de descansar, Theo! O Dino Teco também vai dormir. Até mais tarde!'), 300);
  segurar($('.btn-pais', el), () => { emDescanso = false; inicioSessao = Date.now(); home(); });
}
setInterval(() => {
  if (state.limite > 0 && !emDescanso && Date.now() - inicioSessao > state.limite * 60000) descanso();
}, 15000);

/* ---------- tela cheia, botão voltar, offline ---------- */
function telaCheia() {
  const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  if (!NATIVO && !standalone && !document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}
// O botão "voltar" do Android volta para o início em vez de fechar o app.
history.pushState(null, '', location.href);
addEventListener('popstate', () => { history.pushState(null, '', location.href); if (!emDescanso && !$('.splash')) home(); });
addEventListener('contextmenu', e => e.preventDefault());

if (!NATIVO && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

inicio();
