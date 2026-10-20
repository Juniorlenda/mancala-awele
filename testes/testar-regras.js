// Testes automáticos das regras do Mancala Awelé.
// Rode com:  node testes/testar-regras.js
// O GitHub roda este arquivo sozinho a cada atualização (veja .github/workflows/testes.yml).
//
// O que ele faz:
//   1. confere se o JavaScript do jogo não tem erro de sintaxe;
//   2. testa situações tiradas do livro (semeadura, Krou, colheita, dar de comer, fim);
//   3. joga 100 partidas inteiras (computador contra um jogador simulado) e confere cada lance.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let falhas = 0;
function check(nome, cond, extra) {
  console.log(`${cond ? 'OK    ' : 'FALHOU'} ${nome}${extra ? ' -> ' + extra : ''}`);
  if (!cond) falhas++;
}

// 1. Sintaxe: "new Function" lê o código sem executar; se tiver erro de digitação, ele avisa.
const script = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';
let sintaxeOk = true;
try { new Function(script); } catch (e) { sintaxeOk = false; console.log(e.message); }
check('o JavaScript do jogo não tem erro de sintaxe', sintaxeOk);

// Pega só o "motor" do jogo (regras + computador), entre os marcadores do index.html.
const ini = html.indexOf('/* ===== REGRAS');
const fim = html.indexOf('/* ===== ESTADO');
const motor = new Function('performance', html.slice(ini, fim) +
  '\nreturn { sow, play, legal, rebuild, validMoves, aiChoose, initialPos, rowSum };')({ now: () => Date.now() });
const { sow, play, legal, rebuild, validMoves, aiChoose, initialPos, rowSum } = motor;

// casas do livro (1..12) -> posições no código (0..11)
const B = obj => { const b = Array(12).fill(0); for (const k in obj) b[k - 1] = obj[k]; return b; };
const casas = lista => JSON.stringify(lista.map(i => i + 1));

// 2. Situações do livro
check('início: o Sul pode jogar as casas 1 a 6', casas(legal(initialPos()).moves) === '[1,2,3,4,5,6]');

let r = play(initialPos(), 1);
check('semear a casa 2 leva as sementes para 3, 4, 5 e 6', casas(r.path) === '[3,4,5,6]');

let s = sow(B({ 6: 14 }), 5);
check('Krou de 14 sementes pula a própria casa 6', casas(s.path) === '[7,8,9,10,11,12,1,2,3,4,5,7,8,9]');

r = play({ b: B({ 6: 14, 7: 1, 8: 1, 9: 1, 10: 2, 11: 2, 12: 4 }), s: [0, 0], turn: 0 }, 5);
check('Krou bem-sucedida colhe as casas 9, 8 e 7', r.taken === 9 && casas(r.caps) === '[9,8,7]', `colheu ${r.taken}`);

r = play({ b: B({ 6: 5, 7: 4, 8: 4, 9: 2, 10: 1, 11: 2, 12: 5, 1: 3 }), s: [0, 0], turn: 0 }, 5);
check('colheita em sequência 11, 10, 9 para na casa 8', casas(r.caps) === '[11,10,9]', `colheu ${r.taken}`);

r = play({ b: B({ 12: 3, 1: 1, 2: 2, 3: 1, 5: 9 }), s: [0, 0], turn: 1 }, 11);
check('colheita normal no campo do Sul (3, 2 e 1)', r.taken === 7 && !r.slam, `colheu ${r.taken}`);

r = play({ b: B({ 12: 3, 1: 1, 2: 2, 3: 1 }), s: [0, 0], turn: 1 }, 11);
check('colheita que deixaria o Sul sem nada é anulada', r.slam && r.taken === 0);

let L = legal({ b: B({ 2: 1, 3: 5, 4: 1, 5: 2, 6: 1 }), s: [0, 0], turn: 0 });
check('dar de comer: só valem as casas 3, 5 e 6', casas(L.moves) === '[3,5,6]' && L.mustFeed);

L = legal({ b: B({ 1: 1, 2: 1 }), s: [24, 22], turn: 0 });
check('sem como dar de comer, a partida acaba', L.moves.length === 0 && L.reason === 'fome');

L = legal({ b: B({ 12: 1, 1: 1 }), s: [24, 22], turn: 1 });
check('jogada que deixaria a partida sem continuidade não vale', L.moves.length === 0 && L.reason === 'impasse');

check('lista de lances válida é aceita', validMoves([5, 11, 1, 7]));
check('lista com lance ilegal é recusada', !validMoves([5, 3]));

// 3. Bateria de 100 partidas inteiras
// Regras de fim iguais às do jogo: 25 sementes, sem jogada possível, posição repetida 3 vezes,
// ou final rodando sem colheitas (20 lances com 12 sementes ou menos; 80 lances no meio do jogo).
function fimDaPartida(pos, reps, quiet) {
  if (pos.s[0] >= 25 || pos.s[1] >= 25) return '25';
  const l = legal(pos);
  if (!l.moves.length) return l.reason;
  const naMesa = rowSum(pos.b, 0) + rowSum(pos.b, 1);
  if (Object.values(reps).some(v => v >= 3) || quiet >= (naMesa <= 12 ? 20 : 80)) return 'ciclo';
  return null;
}
// jogador simulado: 70% das vezes faz a jogada que colhe mais; senão, joga qualquer casa
function simulado(pos) {
  const ms = legal(pos).moves;
  const op = ms.map(m => ({ m, t: play(pos, m).taken }));
  const melhor = Math.max(...op.map(o => o.t));
  const pool = melhor > 0 && Math.random() < .7 ? op.filter(o => o.t === melhor) : op;
  return pool[(Math.random() * pool.length) | 0].m;
}

const resumo = { partidas: 0, problemas: 0, lances: 0, fins: {}, vitoriasComputador: 0, vitoriasSimulado: 0, empates: 0, maisLento: 0 };
const t0 = Date.now();
for (let g = 0; g < 100; g++) {
  const computadorE = g % 2;            // alterna quem é o computador (Sul ou Norte)
  let pos = initialPos(), quiet = 0, motivo = null, problema = null;
  const moves = [], reps = { [pos.b.join(',') + '|' + pos.turn]: 1 };
  for (let n = 0; n < 1000 && !problema; n++) {
    motivo = fimDaPartida(pos, reps, quiet);
    if (motivo) break;
    let m;
    if (pos.turn === computadorE) {
      const t = Date.now(); m = aiChoose(pos);
      resumo.maisLento = Math.max(resumo.maisLento, Date.now() - t);
    } else m = simulado(pos);
    if (!legal(pos).moves.includes(m)) { problema = `lance ilegal ${m + 1}`; break; }
    const res = play(pos, m);
    moves.push(m);
    quiet = res.taken ? 0 : quiet + 1;
    pos = res.pos;
    const k = pos.b.join(',') + '|' + pos.turn;
    reps[k] = (reps[k] || 0) + 1;
    const total = pos.b.reduce((a, b) => a + b, 0) + pos.s[0] + pos.s[1];
    if (total !== 48) problema = `sementes somaram ${total}, não 48`;
  }
  if (!motivo && !problema) problema = 'a partida não terminou em 1000 lances';
  if (!problema && !validMoves(moves)) problema = 'a lista de lances não passou na validação';
  if (!problema) {
    const R = rebuild(moves);   // refazer do zero precisa dar exatamente o mesmo tabuleiro
    if (R.pos.b.join() !== pos.b.join() || R.pos.s.join() !== pos.s.join()) problema = 'refazer a partida deu outro resultado';
  }
  resumo.partidas++;
  resumo.lances += moves.length;
  if (problema) { resumo.problemas++; console.log(`FALHOU partida ${g + 1}: ${problema}`); continue; }
  const fimS = motivo === '25' ? pos.s.slice() : [pos.s[0] + rowSum(pos.b, 0), pos.s[1] + rowSum(pos.b, 1)];
  resumo.fins[motivo] = (resumo.fins[motivo] || 0) + 1;
  if (fimS[0] === fimS[1]) resumo.empates++;
  else if ((fimS[0] > fimS[1] ? 0 : 1) === computadorE) resumo.vitoriasComputador++;
  else resumo.vitoriasSimulado++;
}
check(`100 partidas inteiras sem nenhum problema`, resumo.problemas === 0,
  `${resumo.lances} lances em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`   computador venceu ${resumo.vitoriasComputador}, simulado ${resumo.vitoriasSimulado}, empates ${resumo.empates}`);
check('o computador decide cada lance em menos de 0,3 s', resumo.maisLento < 300, `lance mais demorado: ${resumo.maisLento} ms`);
console.log(`   como terminaram: ${JSON.stringify(resumo.fins)}`);

console.log(falhas ? `\n${falhas} TESTE(S) FALHARAM` : '\nTodos os testes passaram.');
process.exit(falhas ? 1 : 0);
