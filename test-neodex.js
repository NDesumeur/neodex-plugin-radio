// lancé par le test « local » de NeoDex : vérification interne, écoute FIP quelques secondes (le flux doit avancer), change de station au clavier, coupe
module.exports = async ({ pj, sleep }) => {
  const key = k => pj(`document.dispatchEvent(new KeyboardEvent('keydown', {key: '${k}', bubbles: true})), 0`);
  const state = () => pj(`document.getElementById('raCanvas').__state()`);
  const sc = await pj(`document.querySelector('[data-selfcheck]')?.dataset.selfcheck`); if (sc !== 'ok') throw new Error('vérification interne : ' + sc);
  await pj(`document.getElementById('raPlay').click(), 0`);
  let s; for (let i = 0; i < 30; i++) { await sleep(500); s = await state(); if (s.t > 1 || s.err) break; }
  if (!(s.t > 1)) throw new Error('le son ne part pas : ' + JSON.stringify(s));
  const first = s.st; await key('ArrowDown'); await sleep(300); const s2 = await state();
  if (s2.st === first) throw new Error('la station ne change pas');
  await key(' '); await sleep(300); if ((await state()).playing) throw new Error('ne se coupe pas');
  return first + ' a joué ' + s.t.toFixed(1) + ' s, puis ' + s2.st;
};
