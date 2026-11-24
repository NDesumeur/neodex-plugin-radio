// lancé par le test « local » de NeoDex : vérification interne, écoute FIP quelques secondes (le flux doit avancer), change de station au clavier, coupe
module.exports = async ({ pj, js, sleep }) => {
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
  // les radios du monde : « jazz » dans Radio-Browser, la première trouvée joue (le flux avance) et rejoint « Radios du monde »
  await pj(`(() => { const q = document.getElementById('raQ'); q.value = 'jazz'; document.getElementById('raGo').click(); return 0; })()`);
  let hits = 0; for (let i = 0; i < 30 && !hits; i++) { await sleep(500); hits = await pj(`document.querySelectorAll('#raHits .btn').length`); }
  if (!hits) throw new Error('radios du monde : rien trouvé · ' + await pj(`document.getElementById('raHits').textContent`));
  let w = null;
  for (let k = 0; k < Math.min(hits, 4) && !(w && w.t > 1); k++) {  // une radio du bout du monde peut ne pas répondre : on essaie la suivante
    await pj(`document.querySelectorAll('#raHits .btn')[${k}].click(), 0`);
    for (let i = 0; i < 24; i++) { await sleep(500); w = await state(); if (w.t > 1 || w.err) break; }
  }
  if (!(w.t > 1) || w.world < 1) throw new Error('radio du monde : ' + JSON.stringify(w));
  const wl = await pj(`[...document.querySelectorAll('#raList .raCard')].some(c => c.classList.contains('main') && c.textContent.includes(${JSON.stringify(w.st)}))`);
  if (!wl) throw new Error('la radio du monde n\'est pas dans la liste');
  const world = w.st;
  await pj(`[...document.querySelectorAll('#raList .raCard')].find(c => c.textContent.trim().startsWith(${JSON.stringify(first)})).click(), 0`);  // de nouveau FIP, pour la capture
  for (let i = 0; i < 20 && !(await state()).now; i++) await sleep(500);
  // onglet caché (on va sur l'accueil) : NeoDex sait que la radio joue, et le son continue
  await js(`(showTab(null), 0)`); await sleep(1500);
  const bg = await js(`!!pluginHooks.get('neodex.radio')?.playing?.()`), st3 = await state();
  if (!bg || !st3.playing) throw new Error('onglet caché : la radio ne dit plus jouer · ' + JSON.stringify({bg, st3}));
  // onglet fermé (NeoDex 3.4.3) : la radio s'arrête, son cadre est retiré
  await js(`(closeTab(tabs.find(t => t.url === 'plugin:neodex.radio')), 0)`); await sleep(2200);
  if (await js(`[...pluginFrames.values()].some(e => e.id === 'neodex.radio' && !e.widget)`)) throw new Error('onglet fermé : la radio tourne encore');
  await js(`(newTab('plugin:neodex.radio'), 0)`); await sleep(1500);
  return first + ' (« ' + now + ' ») a joué ' + s.t.toFixed(1) + ' s, puis ' + s2.st + ' · monde : ' + world + ' a joué ' + w.t.toFixed(1) + ' s';
};
