// lancé par le test « local » de NeoDex : vérification interne, écoute FIP quelques secondes (le flux doit avancer), change de station au clavier, coupe
module.exports = async ({ pj, sleep }) => {
  const key = k => pj(`document.dispatchEvent(new KeyboardEvent('keydown', {key: '${k}', bubbles: true})), 0`);
  const state = () => pj(`document.getElementById('raCanvas').__state()`);
  const sc = await pj(`document.querySelector('[data-selfcheck]')?.dataset.selfcheck`); if (sc !== 'ok') throw new Error('vérification interne : ' + sc);
  await pj(`document.getElementById('raPlay').click(), 0`);
  let s; for (let i = 0; i < 30; i++) { await sleep(500); s = await state(); if (s.t > 1 || s.err) break; }
  if (!(s.t > 1)) throw new Error('le son ne part pas : ' + JSON.stringify(s));
  let now = ''; for (let i = 0; i < 20 && !now; i++) { await sleep(500); now = (await state()).now; }  // FIP donne le morceau en cours
  if (!now) throw new Error('pas de titre en cours pour FIP');
  const cards = await pj(`[...document.querySelectorAll('#raList .raCard')].map(c => { const r = c.getBoundingClientRect(); return [...c.children].every(x => { const q = x.getBoundingClientRect(); return q.right <= r.right + 1 && q.left >= r.left - 1; }); })`);
  if (!cards.length || cards.includes(false)) throw new Error('cartes des stations : un texte dépasse');
  const first = s.st; await key('ArrowDown'); await sleep(300); const s2 = await state();
  if (s2.st === first) throw new Error('la station ne change pas');
  await key(' '); await sleep(300); if ((await state()).playing) throw new Error('ne se coupe pas');
  await key('ArrowUp'); await key(' '); for (let i = 0; i < 20 && !(await state()).now; i++) await sleep(500);  // de nouveau FIP, pour la capture
  return first + ' (« ' + now + ' ») a joué ' + s.t.toFixed(1) + ' s, puis ' + s2.st;
};
