// Radio : des radios web françaises en direct, dans un vieux poste en pixel art. Favoris, volume, minuterie d'arrêt.
// Le son vient directement des serveurs des radios (déclarés dans plugin.json). Il tourne dans le bac à sable de NeoDex.
const HTML = `<div class="appWrap wide">
  <div class="agHead"><span class="label">Radio</span><span class="hint">Espace : écouter ou couper · haut et bas : station · F : favori · + et − : volume</span></div>
  <div class="gMain"><div class="gameBox"><canvas id="raCanvas" width="240" height="120" role="img" aria-label="Poste de radio"></canvas></div>
    <div class="gSide">
      <div class="sysCard"><b>ÉCOUTE</b>
        <div class="row"><button class="btn main" id="raPlay">ÉCOUTER</button><button class="btn" id="raFav">★ FAVORI</button></div>
        <div class="row"><span class="hint">Volume</span><input type="range" id="raVol" min="0" max="100" value="70"></div>
        <div class="row"><span class="hint">Arrêt</span><select class="gSel" id="raSleep"></select></div>
      </div>
      <div class="row"><select class="gSel" id="raGenre"></select></div>
    </div></div>
  <div class="raList" id="raList"></div>
</div>`;
const CSS = `.gMain{display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap}
.gameBox{display:grid;place-items:center;padding:10px;background:#05010b;flex:0 0 auto}
.gameBox canvas{height:min(46vh,380px);width:auto;aspect-ratio:240/120;image-rendering:pixelated;cursor:var(--cp,pointer)}
.gSide{display:flex;flex-direction:column;gap:14px;flex:1;min-width:260px;max-width:420px}
.gSide .sysCard{display:flex;flex-direction:column;gap:10px}
.raList{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:18px}
.appWrap .raList .btn.raCard{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:7px;width:100%;min-width:0;min-height:62px;padding:8px 12px 12px;overflow:hidden;text-align:left}
.appWrap .raList .btn.raCard:active{padding:12px 12px 8px}
.raCard>span{max-width:100%;overflow:hidden}
.appWrap .raList .btn.raCard .pxV{white-space:normal;line-height:16px}
.appWrap .raList .btn.main .hint{color:#3a2408}`;
// nom, adresse du flux, genre, numéro de la station chez Radio France (pour le titre en cours)
const RA_ST = [
  ['France Inter', 'https://icecast.radiofrance.fr/franceinter-midfi.mp3', 'Info et culture', 1], ['franceinfo', 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3', 'Info et culture', 2],
  ['France Culture', 'https://icecast.radiofrance.fr/franceculture-midfi.mp3', 'Info et culture', 5], ['RFI Monde', 'https://rfimonde64k.ice.infomaniak.ch/rfimonde-64.mp3', 'Info et culture'],
  ['FIP', 'https://icecast.radiofrance.fr/fip-midfi.mp3', 'Musique', 7], ['Radio Nova', 'https://novazz.ice.infomaniak.ch/novazz-128.mp3', 'Musique'], ['Oui FM', 'https://ouifm.ice.infomaniak.ch/ouifm-high.mp3', 'Rock'],
  ['Mouv’', 'https://icecast.radiofrance.fr/mouv-midfi.mp3', 'Rap et hip-hop', 6], ['Skyrock', 'https://icecast.skyrock.net/s/natio_mp3_128k', 'Rap et hip-hop'], ['Radio Meuh', 'https://radiomeuh.ice.infomaniak.ch/radiomeuh-128.mp3', 'Musique'],
  ['FIP Jazz', 'https://icecast.radiofrance.fr/fipjazz-midfi.mp3', 'Jazz', 65], ['TSF Jazz', 'https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3', 'Jazz'], ['France Musique La Jazz', 'https://icecast.radiofrance.fr/francemusiquelajazz-midfi.mp3', 'Jazz', 405],
  ['FIP Rock', 'https://icecast.radiofrance.fr/fiprock-midfi.mp3', 'Rock', 64], ['FIP Metal', 'https://icecast.radiofrance.fr/fipmetal-midfi.mp3', 'Rock', 77], ['FIP Pop', 'https://icecast.radiofrance.fr/fippop-midfi.mp3', 'Musique'],
  ['FIP Electro', 'https://icecast.radiofrance.fr/fipelectro-midfi.mp3', 'Électro', 74], ['FIP Groove', 'https://icecast.radiofrance.fr/fipgroove-midfi.mp3', 'Musique', 66], ['FIP Hip-Hop', 'https://icecast.radiofrance.fr/fiphiphop-midfi.mp3', 'Rap et hip-hop'],
  ['FIP Reggae', 'https://icecast.radiofrance.fr/fipreggae-midfi.mp3', 'Musique', 71], ['FIP Monde', 'https://icecast.radiofrance.fr/fipworld-midfi.mp3', 'Musique', 69], ['FIP Nouveautés', 'https://icecast.radiofrance.fr/fipnouveautes-midfi.mp3', 'Musique', 70],
  ['France Musique', 'https://icecast.radiofrance.fr/francemusique-midfi.mp3', 'Classique', 4], ['Radio Classique', 'https://radioclassique.ice.infomaniak.ch/radioclassique-high.mp3', 'Classique'],
  ['France Musique Baroque', 'https://icecast.radiofrance.fr/francemusiquebaroque-midfi.mp3', 'Classique', 408], ['France Musique Opéra', 'https://icecast.radiofrance.fr/francemusiqueopera-midfi.mp3', 'Classique', 409],
];
/* ---------- l'habillage pixel art, dessiné à la main : police bitmap (accents compris), cadres, boutons, icônes ----------
   Tout est en pixels pleins, agrandis par 2 sans lissage : aucun dégradé, aucune ombre floue. */
const PXK = (() => {
  // chaque lettre : ses lignes, de haut en bas, à partir de la ligne 2 de la case (0-1 : accents des majuscules, 9-10 : jambages)
  const S = {
    A: '.###. #...# #...# ##### #...# #...# #...#', B: '####. #...# #...# ####. #...# #...# ####.', C: '.###. #...# #.... #.... #.... #...# .###.',
    D: '####. #...# #...# #...# #...# #...# ####.', E: '##### #.... #.... ####. #.... #.... #####', F: '##### #.... #.... ####. #.... #.... #....',
    G: '.###. #...# #.... #.### #...# #...# .####', H: '#...# #...# #...# ##### #...# #...# #...#', I: '### .#. .#. .#. .#. .#. ###',
    J: '..### ...#. ...#. ...#. #..#. #..#. .##..', K: '#...# #..#. #.#.. ##... #.#.. #..#. #...#', L: '#.... #.... #.... #.... #.... #.... #####',
    M: '#...# ##.## #.#.# #.#.# #...# #...# #...#', N: '#...# ##..# #.#.# #..## #...# #...# #...#', O: '.###. #...# #...# #...# #...# #...# .###.',
    P: '####. #...# #...# ####. #.... #.... #....', Q: '.###. #...# #...# #...# #.#.# #..#. .##.#', R: '####. #...# #...# ####. #.#.. #..#. #...#',
    S: '.#### #.... #.... .###. ....# ....# ####.', T: '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..', U: '#...# #...# #...# #...# #...# #...# .###.',
    V: '#...# #...# #...# #...# #...# .#.#. ..#..', W: '#...# #...# #...# #.#.# #.#.# ##.## #...#', X: '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
    Y: '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..', Z: '##### ....# ...#. ..#.. .#... #.... #####',
    a: '..... ..... .###. ....# .#### #...# .####', b: '#.... #.... ####. #...# #...# #...# ####.', c: '..... ..... .###. #.... #.... #.... .###.',
    d: '....# ....# .#### #...# #...# #...# .####', e: '..... ..... .###. #...# ##### #.... .###.', f: '..## .#.. #### .#.. .#.. .#.. .#..',
    g: '..... ..... .#### #...# #...# #...# .#### ....# .###.', h: '#.... #.... ####. #...# #...# #...# #...#', i: '.#. ... ##. .#. .#. .#. ###',
    'ı': '... ... ##. .#. .#. .#. ###', j: '...# .... ..## ...# ...# ...# ...# #..# .##.', k: '#... #... #..# #.#. ##.. #.#. #..#',
    l: '##. .#. .#. .#. .#. .#. ###', m: '..... ..... ##.#. #.#.# #.#.# #.#.# #...#', n: '..... ..... ####. #...# #...# #...# #...#',
    o: '..... ..... .###. #...# #...# #...# .###.', p: '..... ..... ####. #...# #...# #...# ####. #.... #....', q: '..... ..... .#### #...# #...# #...# .#### ....# ....#',
    r: '.... .... #.## ##.. #... #... #...', s: '..... ..... .#### #.... .###. ....# ####.', t: '.#.. .#.. #### .#.. .#.. .#.. ..##',
    u: '..... ..... #...# #...# #...# #..## .##.#', v: '..... ..... #...# #...# #...# .#.#. ..#..', w: '..... ..... #...# #...# #.#.# #.#.# .#.#.',
    x: '..... ..... #...# .#.#. ..#.. .#.#. #...#', y: '..... ..... #...# #...# #...# #...# .#### ....# .###.', z: '..... ..... ##### ...#. ..#.. .#... #####',
    0: '.###. #...# #..## #.#.# ##..# #...# .###.', 1: '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.', 2: '.###. #...# ....# ...#. ..#.. .#... #####',
    3: '####. ....# ....# .###. ....# ....# ####.', 4: '...#. ..##. .#.#. #..#. ##### ...#. ...#.', 5: '##### #.... ####. ....# ....# #...# .###.',
    6: '.###. #.... #.... ####. #...# #...# .###.', 7: '##### ....# ...#. ..#.. .#... .#... .#...', 8: '.###. #...# #...# .###. #...# #...# .###.',
    9: '.###. #...# #...# .#### ....# ....# .###.',
    '.': '. . . . . . #', ',': '.. .. .. .. .. .# .# #.', ':': '. . # . . . #', ';': '.. .. .# .. .. .# .# #.', '!': '# # # # # . #',
    '?': '.###. #...# ....# ...#. ..#.. ..... ..#..', "'": '# # . . . . .', '"': '#.# #.# ... ... ... ... ...', '-': '... ... ... ### ... ... ...',
    '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....', '/': '....# ...#. ...#. ..#.. .#... .#... #....', '(': '.# #. #. #. #. #. .#', ')': '#. .# .# .# .# .# #.',
    '%': '##..# ##.#. ...#. ..#.. .#... .#.## #..##', '·': '. . . # . . .', '×': '..... ..... #...# .#.#. ..#.. .#.#. #...#',
    '<': '...# ..#. .#.. #... .#.. ..#. ...#', '>': '#... .#.. ..#. ...# ..#. .#.. #...', '=': '.... .... #### .... #### .... ....',
    '_': '..... ..... ..... ..... ..... ..... #####', '#': '.#.#. .#.#. ##### .#.#. ##### .#.#. .#.#.', '&': '.##.. #..#. #.#.. .#... #.#.# #..#. .##.#',
    '…': '..... ..... ..... ..... ..... ..... #.#.#', '«': '..... ..#.# .#.#. #.#.. .#.#. ..#.# .....', '»': '..... #.#.. .#.#. ..#.# .#.#. #.#.. .....',
    '◀': '...# ..## .### #### .### ..## ...#', '▶': '#... ##.. ###. #### ###. ##.. #...', '→': '..... ..#.. ...#. ##### ...#. ..#.. .....',
    '←': '..... ..#.. .#... ##### .#... ..#.. .....', '↑': '..#.. .###. #.#.# ..#.. ..#.. ..#.. ..#..', '↓': '..#.. ..#.. ..#.. ..#.. #.#.# .###. ..#..',
    '*': '..... #.#.# .###. ##### .###. #.#.# .....', '[': '## #. #. #. #. #. ##', ']': '## .# .# .# .# .# ##', '|': '# # # # # # #',
    '@': '.###. #...# #.### #.#.# #.### #.... .###.', '€': '..### .#... ####. .#... ####. .#... ..###', '$': '..#.. .#### #.#.. .###. ..#.# ####. ..#..',
    '°': '.#. #.# .#. ... ... ... ...', '~': '..... ..... .#..# #.##. ..... ..... .....', '♪': '..##. ..#.# ..#.. ..#.. .##.. ###.. .#...',
  };
  const ACC = { a: ['..#', '.#.'], g: ['#..', '.#.'], c: ['.#.', '#.#'], d: ['...', '#.#'], t: ['.#.#', '#.#.'], z: ['.#.', '##.'] };  // aigu, grave, circonflexe, tréma, tilde, cédille
  const COMP = { é: 'ea', è: 'eg', ê: 'ec', ë: 'ed', á: 'aa', à: 'ag', â: 'ac', ä: 'ad', í: 'ıa', ì: 'ıg', î: 'ıc', ï: 'ıd', ó: 'oa', ò: 'og', ô: 'oc', ö: 'od',
    ú: 'ua', ù: 'ug', û: 'uc', ü: 'ud', ÿ: 'yd', ñ: 'nt', ç: 'cz', É: 'Ea', È: 'Eg', Ê: 'Ec', Ë: 'Ed', Á: 'Aa', À: 'Ag', Â: 'Ac', Ä: 'Ad', Í: 'Ia', Î: 'Ic', Ï: 'Id',
    Ó: 'Oa', Ô: 'Oc', Ö: 'Od', Ú: 'Ua', Ù: 'Ug', Û: 'Uc', Ü: 'Ud', Ñ: 'Nt', Ç: 'Cz' };
  const SUB = { 'œ': 'oe', 'Œ': 'OE', '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', ' ': ' ', ' ': ' ', '•': '·', '✓': 'v', 'ᐸ': '<', 'ᐳ': '>', '＜': '<', '＞': '>', '｜': '|', '／': '/', '！': '!', '？': '?', '（': '(', '）': ')', '：': ':', '　': ' ' };  // ᐸ ᐳ : les < > des titres YouTube
  const H = 11, glyphs = new Map(); let raster;
  function glyph(ch) {
    let g = glyphs.get(ch); if (g) return g;
    const px = [], add = (rows, ox, oy) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') px.push([ox + x, oy + y]); });
    const c = COMP[ch], src = S[c ? c[0] : ch]; let w = 3;
    if (src) {
      const rows = src.split(' '); w = Math.max(...rows.map(r => r.length)); add(rows, 0, 2);
      if (c) { const a = ACC[c[1]]; add(a, Math.floor((w - a[0].length) / 2), c[1] === 'z' ? 9 : /[A-Z]/.test(c[0]) ? 0 : 1); }
    } else if (ch !== ' ') {  // japonais, emoji… : la lettre du système, réduite à des pixels nets (sans lissage) sur la même hauteur que la police
      const q = (raster ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })), RW = 16;
      q.canvas.width = RW; q.canvas.height = H; q.font = '11px "MS Gothic", "Yu Gothic UI", Meiryo, "Segoe UI Symbol", sans-serif'; q.fillStyle = '#000'; q.fillText(ch, 0, 10);
      const d = q.getImageData(0, 0, RW, H).data; let mx = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < RW; x++) if (d[(y * RW + x) * 4 + 3] > 110) { px.push([x, y]); mx = Math.max(mx, x + 1); }
      w = mx || 3;
      if (!px.length) { w = 5; add(['#####', '#...#', '#...#', '#...#', '#...#', '#...#', '#####'], 0, 2); }  // vraiment inconnue : une petite case
    }
    g = { w, px }; glyphs.set(ch, g); return g;
  }
  function layout(text) {
    let x = 0; const items = [];
    for (const ch of String(text)) for (const c of SUB[ch] ?? ch) { const g = glyph(c); items.push([g, x]); x += g.w + 1; }
    return { w: Math.max(0, x - 1), items };
  }
  function draw(g, text, x, y, color, s = 1) {  // (x, y) : coin haut gauche de la case
    const L = layout(text); g.fillStyle = color;
    for (const [gl, ox] of L.items) for (const [px, py] of gl.px) g.fillRect(x + (ox + px) * s, y + py * s, s, s);
    return L.w * s;
  }
  const bmp = new Map();
  function sprite(text, color, s = 1) {  // le texte tout prêt, gardé pour les images suivantes du jeu
    const k = text + '|' + color + '|' + s; let c = bmp.get(k); if (c) return c;
    c = document.createElement('canvas'); c.width = Math.max(1, layout(text).w * s); c.height = H * s; draw(c.getContext('2d'), text, 0, 0, color, s);
    if (bmp.size > 400) bmp.delete(bmp.keys().next().value);
    bmp.set(k, c); return c;
  }
  // comme fillText : (x, y) sur la ligne de base, aligné à gauche, au centre ou à droite
  function fill(g, text, x, y, color, s = 1, align = 'left') {
    const c = sprite(String(text), color, s), dx = align === 'center' ? -c.width / 2 : align === 'right' ? -c.width : 0;
    g.drawImage(c, Math.round(x + dx), Math.round(y - 9 * s));
  }
  const scale = size => Math.max(1, Math.round((size || 8) / 8));
  function art(rows, pal, s = 1) {  // un dessin en lignes de caractères, chaque caractère une couleur de la palette (« . » : transparent)
    const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)) * s; c.height = rows.length * s;
    const g = c.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = pal[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x * s, y * s, s, s); } } });
    return c;
  }
  return { H, layout, draw, sprite, fill, scale, art };
})();

// les pièces de l'interface, pixel par pixel (K : contour, les autres lettres : la palette du jeu)
const PX_PANEL = ['..KKKKKKKKKKKK..', '.KAAAAAAAAAAAAK.', 'KALAAAAAAAAAALSK', 'KAAKKKKKKKKKKSSK', 'KAAKHHHHHHHHKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK',
  'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKKKKKKKKKKSSK', 'KALSSSSSSSSSSLSK', '.KSSSSSSSSSSSSK.', '..KKKKKKKKKKKK..'];
const PX_CARD = ['.KKKKKKKKKK.', 'KFFFFFFFFFFK', 'KFHHHHHHHHFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFSSSSSSSSFK', 'KFFFFFFFFFFK', '.KKKKKKKKKK.'];
const PX_BTN = ['.KKKKKKKKKK.', 'KWWWWWWWWWWK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KBBBBBBBBBBK', 'KKKKKKKKKKKK', 'KDDDDDDDDDDK', '.KKKKKKKKKK.'];
const PX_BTN_DOWN = ['............', '............', '.KKKKKKKKKK.', 'KBBBBBBBBBBK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KWWWWWWWWWWK', '.KKKKKKKKKK.'];
const PX_TRACK = ['.KKKKKKKKKK.', 'KDDDDDDDDDDK', 'KDDDDDDDDDDK', 'KDDDDDDDDDDK', 'KHHHHHHHHHHK', '.KKKKKKKKKK.'];
const PX_KNOB = ['.KKKKK.', 'KWWWWWK', 'KWAAABK', 'KWAAABK', 'KKKKKKK', 'KWAAABK', 'KWAAABK', 'KBBBBBK', 'KDDDDDK', '.KKKKK.'];
const PX_RAIL = ['KDDDDDDK', 'KDDDDDDK', 'KDDDDDDK', 'KDDHHDDK'];
const PX_ICONS = {
  play: ['kk......', 'kakk....', 'kaaakk..', 'kaaaaakk', 'kaaaaaak', 'kaaaaakk', 'kaaakk..', 'kakk....', 'kk......'],
  full: ['www...www', 'w.......w', 'w.......w', '.........', '....a....', '.........', 'w.......w', 'w.......w', 'www...www'],
  note: ['...aaaaaa', '...aaaaaa', '...a....a', '...a....a', '...a....a', '.aaa..aaa', 'aaaa.aaaa', 'aaaa.aaaa', '.aa...aa.'],
  star: ['....g....', '....g....', '...ggg...', 'ggggwgggg', '.ggwwwgg.', '..ggggg..', '..oo.oo..', '.oo...oo.', '.o.....o.'],
  crown: ['g...g...g', 'gg.ggg.gg', 'ggggggggg', 'grgggggrg', 'ggggggggg', 'ooooooooo'],
  folder: ['oooo.....', 'oggoooooo', 'ggggggggg', 'ggggggggg', 'ggggggggg', 'ggggggggg', 'ooooooooo'],
  vol: ['....w....', '...ww..b.', 'wwwww.b.b', 'wwwww.b.b', 'wwwww.b.b', 'wwwww.b.b', '...ww..b.', '....w....'],
  clock: ['..wwwww..', '.w.....w.', 'w...a...w', 'w...a...w', 'w...aaa.w', 'w.......w', 'w.......w', '.w.....w.', '..wwwww..'],
  cursor: ['....a....', '..aaaaa..', '.a..a..a.', '.a.....a.', 'aaa.w.aaa', '.a.....a.', '.a..a..a.', '..aaaaa..', '....a....'],
  plus: ['...b...', '...b...', '...b...', 'bbbbbbb', '...b...', '...b...', '...b...'],
  down: ['wwwwwww', '.wwwww.', '..www..', '...w...'],
};

/* habille la page du jeu : root = son conteneur, T = sa palette, icons = [motif du texte, icône] pour les boutons et libellés */
function pxSkin(root, { T, icons = [], emblem, title }) {
  root.classList.add('pxk'); const s = 2, url = c => c.toDataURL();
  const btnPal = (M, W, B, D) => ({ K: T.k, W, M, B, D });
  const BN = btnPal(T.btn, T.btnHi, T.btnLo, T.k2), BH = btnPal(T.btnHov, T.btnHovHi, T.btnLo, T.k2);
  const BA = btnPal(T.acc, T.accL, T.accS, T.accD), BAH = btnPal(T.accL, '#ffffff', T.acc, T.accD);
  const img = { panel: PXK.art(PX_PANEL, { K: T.k, A: T.acc, S: T.accS, L: T.rivet, H: T.hl, D: T.fill }, s),
    card: PXK.art(PX_CARD, { K: T.k, F: T.line, H: T.hl, D: T.fill, S: T.k2 }, s), cardOn: PXK.art(PX_CARD, { K: T.k, F: T.acc, H: T.accS, D: T.fillOn, S: T.accD }, s),
    btn: PXK.art(PX_BTN, BN, s), btnH: PXK.art(PX_BTN, BH, s), btnD: PXK.art(PX_BTN_DOWN, BH, s),
    main: PXK.art(PX_BTN, BA, s), mainH: PXK.art(PX_BTN, BAH, s), mainD: PXK.art(PX_BTN_DOWN, BA, s),
    track: PXK.art(PX_TRACK, { K: T.k, D: T.k2, H: T.line }, s), knob: PXK.art(PX_KNOB, { K: T.k, W: T.accL, A: T.acc, B: T.accS, D: T.accD }, s),
    rail: PXK.art(PX_RAIL, { K: T.k, D: T.k2, H: T.line }, s), tile: PXK.art(T.tile, { x: T.bgDot, ':': T.bgDot2, '+': T.spark, '*': T.spark2 }, s) };
  const u = Object.fromEntries(Object.entries(img).map(([k, c]) => [k, url(c)]));
  const nine = (k, sl) => `border-style:solid;border-width:${sl * s}px;border-image:url(${u[k]}) ${sl * s} fill / ${sl * s}px stretch`;
  const IP = { k: T.k, w: T.text, a: T.acc, b: T.acc2, g: T.gold, o: T.orange, r: T.red, n: T.green, N: T.green2, m: T.muted, s: T.accS };
  const iconUrl = new Map(), icon = name => {
    let v = iconUrl.get(name); if (!v) { const c = PXK.art(PX_ICONS[name] || emblem, IP, s); v = { u: url(c), w: c.width, h: c.height }; iconUrl.set(name, v); }
    const b = document.createElement('b'); b.className = 'pxI'; b.setAttribute('aria-hidden', 'true'); b.style.cssText = `width:${v.w}px;height:${v.h}px;background-image:url(${v.u})`; return b;
  };
  const R = '.pxk.pxk';
  const css = document.createElement('style');
  css.textContent = `html,html body{background:${T.bg} url(${u.tile}) 0 0/${img.tile.width}px ${img.tile.height}px repeat!important}
::-webkit-scrollbar{width:16px;height:16px} ::-webkit-scrollbar-track{background:url(${u.rail}) 0 0/16px 8px repeat-y} ::-webkit-scrollbar-thumb{${nine('main', 4)}} ::-webkit-scrollbar-corner{background:none}
${R}{color:${T.text}}
${R} .px{box-shadow:none;background:none}
${R} .agHead{gap:18px;margin:0}
${R} .agHead .label{display:flex;align-items:center;gap:12px}
${R} .btn,${R} .tab{${nine('btn', 4)};height:auto;min-height:0;padding:0 6px 4px;margin:0;color:${T.text};font:12px/1 monospace;display:inline-flex;align-items:center;gap:6px;filter:none;text-shadow:none;letter-spacing:0;cursor:var(--cp,pointer)}
${R} .btn:hover,${R} .tab:hover{border-image-source:url(${u.btnH})}
${R} .btn:active,${R} .tab:active{border-image-source:url(${u.btnD});padding:4px 6px 0}
${R} .btn.main,${R} .tab.on{border-image-source:url(${u.main});color:${T.k}}
${R} .btn.main:hover,${R} .tab.on:hover{border-image-source:url(${u.mainH})}
${R} .btn.main:active,${R} .tab.on:active{border-image-source:url(${u.mainD})}
${R} .btn:focus-visible,${R} .tab:focus-visible{outline:2px dashed ${T.acc2};outline-offset:2px}
${R} .btn .pxV,${R} .tab .pxV{white-space:nowrap}
${R} .sysCard{${nine('card', 4)};padding:4px 6px;gap:8px;background:none}
${R} .sysCard.on{border-image-source:url(${u.cardOn})}
${R} .sysCard.on>b{color:${T.acc}}
${R} .sysCard>b{color:${T.text}}
${R} .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
${R} .gameBox,${R} .thBox{${nine('panel', 5)};box-shadow:none;background:none;padding:2px;gap:8px;grid-template-rows:auto auto}
${R} .gameBox canvas,${R} .thBox canvas{display:block;background:#05010b}
${R} .gameBox:fullscreen,${R} .thBox:fullscreen{border:0;padding:0;background:#000}
${R} .rhFs{position:static;opacity:1;justify-self:end;margin:0 6px 6px 0}
${R} .rhTabs{gap:8px;flex-wrap:wrap}
${R} .hint{color:${T.muted};line-height:24px}
${R} label{color:${T.muted};display:inline-flex;align-items:center;gap:8px}
${R} .rhDel{color:${T.red};top:6px;right:8px}
${R} input[type=range]{-webkit-appearance:none;appearance:none;background:none;height:20px;width:150px}
${R} input[type=range]::-webkit-slider-runnable-track{height:12px;${nine('track', 2)}}
${R} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:20px;border:0;background:url(${u.knob}) 0 0/100% 100%;margin-top:-8px;cursor:var(--cp,pointer)}
${R} .pxSel{justify-content:space-between;gap:10px;max-width:100%;overflow:hidden}
${R} .rhImport .pxSel{flex:1;min-width:0}
.pxMenu{position:fixed;z-index:50;${nine('card', 4)};padding:2px;max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;color:${T.text}}
.pxMenu button{all:unset;padding:3px 8px;cursor:var(--cp,pointer);white-space:nowrap}
.pxMenu button:hover,.pxMenu button:focus-visible,.pxMenu button.on{background:${T.btnHov};color:${T.text}}
.pxMenu button.on{color:${T.acc}}
.pxT{position:relative;white-space:normal;font:12px/1 monospace;letter-spacing:0;text-transform:none}
.pxT i{display:inline-block;vertical-align:middle;background:currentColor;-webkit-mask:var(--m) 0 0/100% 100% no-repeat;mask:var(--m) 0 0/100% 100% no-repeat;image-rendering:pixelated}
.pxI{display:inline-block;vertical-align:middle;background:0 0/100% 100% no-repeat;image-rendering:pixelated;margin-right:6px}
.pxV>.pxI+.pxI{margin-left:-4px}
.pxSr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`;
  document.head.append(css);
  // un mot = une image (en masque : sa couleur suit celle du texte), une règle par mot pour ne pas répéter l'image
  const words = new Map(), sheet = document.head.appendChild(document.createElement('style')).sheet;
  const word = w => {
    let k = words.get(w);
    if (!k) { const c = PXK.sprite(w, '#fff', s); k = 'pw' + words.size; words.set(w, k); sheet.insertRule(`.${k}{--m:url(${c.toDataURL()});width:${c.width}px;height:${c.height}px}`, sheet.cssRules.length); }
    const i = document.createElement('i'); i.className = k; return i;
  };
  function render(vis, text, lead) {
    const parts = [], ic = lead && icons.find(([re]) => re.test(text.trim()));
    if (ic) parts.push(icon(ic[1]));
    for (const m of text.matchAll(/(★+)|(\s+)|([^\s★]+)/g)) {
      if (m[1]) for (const _ of m[1]) parts.push(icon('star'));
      else if (m[2]) parts.push(document.createTextNode(' '));
      else parts.push(word(m[3]));
    }
    vis.replaceChildren(...parts);
  }
  const lead = node => node.parentElement?.matches('button,label,.tab,.btn') && !node.previousSibling;
  function pixText(node) {  // le texte reste dans la page (lecteur d'écran, copier) ; on voit ses lettres en pixels
    const wrap = document.createElement('span'), sr = document.createElement('span'), vis = document.createElement('span');
    wrap.className = 'pxT'; sr.className = 'pxSr'; vis.className = 'pxV'; vis.setAttribute('aria-hidden', 'true');
    const first = lead(node); node.replaceWith(wrap); sr.append(node); wrap.append(sr, vis); render(vis, node.data, first);
  }
  function pxSelect(sel) {  // une liste déroulante en pixels ; la vraie reste cachée et garde sa valeur et ses événements
    sel.dataset.px = '1'; sel.style.display = 'none';
    const b = document.createElement('button'), lab = document.createElement('span'); b.type = 'button'; b.className = 'btn pxSel'; b.append(lab, icon('down')); sel.after(b);
    const sync = () => { const t = sel.selectedOptions[0]?.textContent || '—'; if (lab.dataset.t !== t) { lab.dataset.t = t; lab.textContent = t; } };
    const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    Object.defineProperty(sel, 'value', { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, v); sync(); } });
    new MutationObserver(sync).observe(sel, { childList: true, subtree: true, characterData: true, attributes: true });
    sel.addEventListener('change', sync);
    b.onclick = () => {
      document.querySelector('.pxMenu')?.remove();
      const m = document.createElement('div'), r = b.getBoundingClientRect(); m.className = 'pxMenu'; m.setAttribute('role', 'listbox');
      for (const o of sel.options) {
        const it = document.createElement('button'); it.type = 'button'; it.textContent = o.textContent; it.className = o.selected ? 'on' : ''; it.setAttribute('role', 'option');
        it.onclick = () => { sel.value = o.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); close(); b.focus(); };
        m.append(it);
      }
      root.append(m);
      const below = innerHeight - r.bottom; m.style.minWidth = r.width + 'px'; m.style.left = Math.min(r.left, innerWidth - m.offsetWidth - 4) + 'px';
      m.style.top = (below > m.offsetHeight + 8 || below > r.top ? r.bottom + 2 : r.top - m.offsetHeight - 2) + 'px';
      const close = () => { m.remove(); removeEventListener('pointerdown', out, true); removeEventListener('keydown', key, true); removeEventListener('blur', close); };
      const out = e => { if (!m.contains(e.target) && e.target !== b && !b.contains(e.target)) close(); };
      const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); b.focus(); } };
      addEventListener('pointerdown', out, true); addEventListener('keydown', key, true); addEventListener('blur', close);
      (m.querySelector('.on') || m.firstChild)?.focus();
    };
    sync();
  }
  const SKIP = 'select,option,textarea,script,style,canvas,.pxT,[data-pxskip]';
  let queued = false;
  function pass() {
    queued = false;
    root.querySelectorAll('select.gSel:not([data-px])').forEach(pxSelect);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), todo = [];
    for (let n; (n = w.nextNode());) if (n.data.trim() && n.parentElement && !n.parentElement.closest(SKIP)) todo.push(n);
    todo.forEach(pixText);
  }
  new MutationObserver(ms => {
    for (const m of ms) if (m.type === 'characterData') { const wrap = m.target.parentNode?.closest?.('.pxT'); if (wrap) render(wrap.lastChild, m.target.data, false); }
    if (!queued) { queued = true; queueMicrotask(pass); }
  }).observe(root, { childList: true, subtree: true, characterData: true });
  // le titre : grosses lettres à contour, trois tons, et l'emblème du jeu
  const lab = root.querySelector('.agHead .label');
  if (lab) {
    const L = PXK.layout(title), c = document.createElement('canvas'), g = c.getContext('2d'), on = [];
    c.width = L.w + 3; c.height = PXK.H + 3;
    for (const [gl, ox] of L.items) for (const [x, y] of gl.px) on.push([ox + x + 1, y + 1]);
    g.fillStyle = T.k; for (const [x, y] of on) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [2, 2], [1, 2], [2, 1]]) g.fillRect(x + dx, y + dy, 1, 1);
    for (const [x, y] of on) { g.fillStyle = y <= 5 ? T.accL : y <= 7 ? T.acc : T.accS; g.fillRect(x, y, 1, 1); }
    const big = document.createElement('canvas'), z = 4; big.width = c.width * z; big.height = c.height * z;
    const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, big.width, big.height);
    const t = document.createElement('b'); t.className = 'pxI'; t.style.cssText = `width:${big.width}px;height:${big.height}px;background-image:url(${big.toDataURL()})`;
    const e = PXK.art(emblem, IP, 3), em = document.createElement('b'); em.className = 'pxI'; em.style.cssText = `width:${e.width}px;height:${e.height}px;background-image:url(${e.toDataURL()})`;
    const sr = document.createElement('span'); sr.className = 'pxSr'; sr.textContent = lab.textContent;
    lab.dataset.pxskip = '1'; lab.replaceChildren(em, t, sr);
  }
  pass();
}



export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast } = host;
  const folder = ctx.folder;
  host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => view.querySelector('#' + id) || document.getElementById(id);
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const px = (g, color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const sprite = (g, rows, x, y, pal) => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) px(g, c, x + i, y + j); } });
  const seeded = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pxFont = (g, text, x, y, color, size = 8, align = 'left') => { const s = PXK.scale(size); PXK.fill(g, text, x + s, y + s, '#05010b', s, align); PXK.fill(g, text, x, y, color, s, align); };
  const gameText = (g, w, lines, y0) => {  // lignes centrées en police pixel, sur une bande sombre
    g.fillStyle = 'rgba(11,3,28,.78)'; g.fillRect(0, y0 - 14, w, lines.length * 14 + 14);
    lines.forEach(([text, color, size], i) => PXK.fill(g, text, w / 2, y0 + i * 14, color, PXK.scale(size), 'center'));
  };
  const theme = (acc, accL, accS, accD, acc2, base = ['#0c0a12', '#16121e', '#221c2c', '#2e263a', '#3a3046', '#62566e']) => {
    const [k, k2, fill, fillOn, hl, line] = base;
    return { k, k2, fill, fillOn, hl, line, acc, accL, accS, accD, rivet: '#f0f0f8', btn: hl, btnHi: line, btnLo: k2, btnHov: '#443852', btnHovHi: '#82768e', text: '#f4f0f8', muted: '#c0b8cc',
      acc2, gold: '#ffd84a', orange: '#ff8a3a', red: '#ff4a3a', green: '#7ee07a', green2: '#2f8a3a', bg: '#100c16', bgDot: fill, bgDot2: k2, spark: accD, spark2: acc,
      tile: ['................', '...:............', '................', '..........+.....', '................', '................', '.....:..........', '................', '................', '.............:..', '................', '..+.............', '................', '.........:......', '................', '................'] };
  };
  let ac = null, mute = false;
  const beep = (f, d, type = 'square', slide = 0, vol = .03, at = 0) => { if (mute) return; try { ac ??= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at; o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); } catch {} };
  const on = () => view.classList.contains('on');
  // la manette : croix et stick gauche = flèches, A = Entrée, B = Échap, X = Retour arrière, Y = H, Start = P ; envoyées comme des touches du clavier
  const padKeys = (map = {}) => {
    const KEY = { 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 0: 'Enter', 1: 'Escape', 2: 'Backspace', 3: 'h', 9: 'p', ...map };
    const held = new Map(), send = (k, type) => document.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));
    const loop = () => {
      requestAnimationFrame(loop);
      if (!on() || !navigator.getGamepads) return;
      const p = [...navigator.getGamepads()].find(Boolean); if (!p) return;
      const now = performance.now(), down = new Set();
      for (const [i, k] of Object.entries(KEY)) if (p.buttons[i]?.pressed) down.add(k);
      const [ax = 0, ay = 0] = p.axes;
      if (ax < -.5) down.add('ArrowLeft'); if (ax > .5) down.add('ArrowRight'); if (ay < -.5) down.add('ArrowUp'); if (ay > .5) down.add('ArrowDown');
      for (const k of down) { const t = held.get(k); if (t === undefined) { held.set(k, now + 260); send(k, 'keydown'); } else if (/^Arrow/.test(k) && now > t) { held.set(k, now + 110); send(k, 'keydown'); } }
      for (const k of [...held.keys()]) if (!down.has(k)) { held.delete(k); send(k, 'keyup'); }
    };
    requestAnimationFrame(loop);
  };
  pxSkin(view.querySelector('.appWrap'), { title: 'RADIO', T: theme('#ffb84a', '#fff0c8', '#c0802a', '#2a1a08', '#7ee07a'),
    emblem: ['..........k.', '.........k..', '........k...', '.kkkkkkkkkk.', 'kooooooooook', 'kowkwkoaaaok', 'kokwkwoaaaok', 'kowkwkoaaaok', 'kokwkwoooook', 'kooooooooook', '.kkkkkkkkkk.', '.kk......kk.'],
    icons: [[/^ÉCOUTER|^COUPER/, 'play'], [/^ÉCOUTE$/, 'vol']] });
  const W = 240, H = 120;
  const cfg = { st: 4, vol: 70, favs: [], genre: '', ...(await doc('reglages')) };
  let saveT = null; const keep = () => { clearTimeout(saveT); saveT = setTimeout(() => folder.write('reglages', cfg).catch(() => {}), 500); };
  const audio = new Audio(); audio.preload = 'none'; audio.volume = cfg.vol / 100;
  let playing = false, loading = false, sleepAt = 0, g = null, tick = 0, err = '';
  // le titre en cours : la ligne la plus fine du programme (le morceau et son artiste, sinon l'émission), relu toutes les 30 s pendant l'écoute
  const raNowOf = (j, t = Date.now() / 1000) => {
    for (const l of [...(j?.levels || [])].reverse()) {
      const steps = l.items.map(id => j.steps?.[id]).filter(Boolean), s = steps.find(x => x.start <= t && t < x.end) || j.steps?.[l.items[l.position]];
      if (s?.title) return s.title.trim() + (s.authors ? ' · ' + String(s.authors).trim() : '');
    }
    return '';
  };
  console.assert(raNowOf({levels: [{items: ['a'], position: 0}, {items: ['b', 'c'], position: 1}], steps: {a: {title: 'Émission', start: 0, end: 9e9}, b: {title: 'Vieux', start: 0, end: 1}, c: {title: 'Morceau', authors: 'Artiste', start: 1, end: 9e9}}}) === 'Morceau · Artiste', 'raNowOf');
  let nowTxt = '', nowSt = -1, metaT = 0;
  async function meta() {
    clearTimeout(metaT); const st = cfg.st, id = RA_ST[st][3];
    if (!playing || !id) { nowTxt = ''; nowSt = -1; return; }
    try { const r = await fetch('https://api.radiofrance.fr/livemeta/pull/' + id); const t = r.ok ? raNowOf(await r.json()) : ''; if (st === cfg.st && playing && (t !== nowTxt || nowSt !== st)) { nowTxt = t; nowSt = st; render(); } } catch {}
    metaT = setTimeout(meta, 30000);
  }
  const genres = ['', '★', ...new Set(RA_ST.map(s => s[2]))];
  $('raGenre').replaceChildren(...genres.map(x => { const o = el('option', '', x === '' ? 'Toutes les stations' : x === '★' ? 'Mes favoris' : x); o.value = x; return o; })); $('raGenre').value = cfg.genre;
  $('raSleep').replaceChildren(...[[0, 'jamais'], [15, 'dans 15 min'], [30, 'dans 30 min'], [60, 'dans 1 h'], [90, 'dans 1 h 30']].map(([m, n]) => { const o = el('option', '', n); o.value = m; return o; }));
  const shown = () => RA_ST.map((s, i) => i).filter(i => !cfg.genre || (cfg.genre === '★' ? cfg.favs.includes(i) : RA_ST[i][2] === cfg.genre));
  function play(on = !playing) {
    playing = on; err = '';
    nowTxt = ''; nowSt = -1; setTimeout(meta, 0);
    if (on) { audio.src = RA_ST[cfg.st][1]; loading = true; audio.play().catch(e => { if (playing) { err = 'Station injoignable'; playing = loading = false; render(); } }); }
    else { audio.pause(); audio.removeAttribute('src'); audio.load(); loading = false; }
    render();
  }
  audio.onplaying = () => { loading = false; };
  audio.onerror = () => { if (playing) { err = 'Station injoignable'; playing = loading = false; render(); toast(RA_ST[cfg.st][0] + ' ne répond pas. Essaie une autre station.', true); } };
  const tune = i => { cfg.st = (i + RA_ST.length) % RA_ST.length; keep(); if (playing) play(true); else render(); };
  function render() {
    $('raPlay').textContent = playing ? 'COUPER' : 'ÉCOUTER';
    $('raFav').textContent = (cfg.favs.includes(cfg.st) ? '★ ' : '☆ ') + 'FAVORI';
    $('raList').replaceChildren(...shown().map(i => { const b = el('button', 'btn raCard' + (i === cfg.st ? ' main' : '')); b.append(el('span', '', (cfg.favs.includes(i) ? '★ ' : '') + RA_ST[i][0]), el('span', 'hint', RA_ST[i][2]));
      if (i === nowSt && nowTxt) b.append(el('span', 'hint', '♪ ' + (nowTxt.length > 34 ? nowTxt.slice(0, 33) + '…' : nowTxt))); b.onclick = () => { cfg.st = i; keep(); play(true); }; return b; }));
  }
  // le poste : bois, haut-parleur, cadran avec l'aiguille, écran avec le nom et le volume
  function draw() {
    g.imageSmoothingEnabled = false; tick++;
    if (sleepAt && Date.now() > sleepAt) { sleepAt = 0; $('raSleep').value = '0'; if (playing) play(false); }
    px(g, '#1a120a', 0, 0, W, H);
    px(g, '#0e0804', 14, 10, 212, 104); px(g, '#7a4a26', 16, 12, 208, 98); px(g, '#9a623a', 16, 12, 208, 3); px(g, '#5a341a', 16, 106, 208, 4);
    for (let y = 18; y < 104; y += 6) px(g, '#6e4222', 18, y, 204, 1);
    // haut-parleur : la toile bouge un peu avec le son
    px(g, '#2a1a0e', 24, 20, 84, 82); px(g, '#c8b48a', 26, 22, 80, 78);
    const amp = playing && !loading ? 1 : 0;
    for (let y = 24; y < 98; y += 4) for (let x = 28; x < 104; x += 4) { const d = Math.hypot(x - 66, y - 61), pulse = amp && Math.sin(d / 5 - tick / 3) > .6; px(g, pulse ? '#8a7a5a' : '#a8946a', x, y, 2, 2); }
    // l'écran
    px(g, '#0e0804', 116, 20, 100, 30); px(g, playing ? '#1e3a1a' : '#16221a', 118, 22, 96, 26);
    const s = RA_ST[cfg.st], name = s[0].length > 16 ? s[0].slice(0, 15) + '…' : s[0];
    PXK.fill(g, name, 166, 33, playing ? '#a8f0a0' : '#5a8a5a', 1, 'center');
    const line2 = err || (loading ? 'Connexion…' : playing ? (nowSt === cfg.st && nowTxt ? nowTxt : 'En direct · ' + s[2]) : 'Arrêt'), lw = PXK.layout(line2).w;
    if (lw <= 92) PXK.fill(g, line2, 166, 45, err ? '#ff8a6a' : playing ? '#7ac87a' : '#4a6a4a', 1, 'center');
    else { g.save(); g.beginPath(); g.rect(119, 36, 94, 12); g.clip(); PXK.fill(g, line2, 214 - (tick * .5) % (lw + 96), 45, '#7ac87a', 1); g.restore(); }  // trop long : il défile
    if (playing && !loading && tick % 60 < 30) px(g, '#ff5a3a', 208, 25, 3, 3);
    // le cadran et l'aiguille (la position de la station dans la liste)
    px(g, '#0e0804', 116, 56, 100, 22); px(g, '#e8d8b0', 118, 58, 96, 18);
    for (let i = 0; i <= 24; i++) px(g, '#5a4a2a', 120 + i * 4, i % 4 ? 70 : 66, 1, i % 4 ? 4 : 8);
    { const x = 120 + Math.round(cfg.st / (RA_ST.length - 1) * 92); px(g, '#c8302a', x, 59, 1, 16); px(g, '#ff5a3a', x - 1, 59, 3, 2); }
    // les boutons : volume et accord
    for (const [cx, v] of [[136, cfg.vol / 100], [196, cfg.st / (RA_ST.length - 1)]]) { px(g, '#0e0804', cx - 9, 84, 18, 18); px(g, '#3a2414', cx - 8, 85, 16, 16); px(g, '#5a3a22', cx - 7, 86, 14, 3); const a = -2.4 + v * 4.8; px(g, '#e8d8b0', cx + Math.sin(a) * 5 - 1, 93 - Math.cos(a) * 5 - 1, 2, 2); }
    PXK.fill(g, 'VOL', 136, 112, '#c8a878', 1, 'center'); PXK.fill(g, 'STATION', 196, 112, '#c8a878', 1, 'center');
    if (sleepAt) PXK.fill(g, 'arrêt ' + Math.ceil((sleepAt - Date.now()) / 60000) + ' min', 166, 94, '#e8d8b0', 1, 'center');
    if (tick % 30 === 0) g.canvas.setAttribute('aria-label', 'Radio : ' + s[0] + ', ' + (err || (loading ? 'connexion' : playing ? 'en direct' : 'arrêt')) + ', volume ' + cfg.vol + '.');
  }
  $('raPlay').onclick = () => { play(); $('raPlay').blur(); };
  $('raFav').onclick = () => { const i = cfg.favs.indexOf(cfg.st); if (i < 0) cfg.favs.push(cfg.st); else cfg.favs.splice(i, 1); keep(); render(); };
  $('raVol').value = cfg.vol; $('raVol').oninput = e => { cfg.vol = +e.target.value; audio.volume = cfg.vol / 100; keep(); };
  $('raGenre').onchange = e => { cfg.genre = e.target.value; keep(); render(); };
  $('raSleep').onchange = e => { sleepAt = +e.target.value ? Date.now() + +e.target.value * 60000 : 0; };
  $('raCanvas').onpointerdown = e => { const b = e.currentTarget.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * W, y = (e.clientY - b.top) / b.height * H;
    if (y > 56 && y < 78 && x > 118 && x < 214) tune(Math.round((x - 120) / 92 * (RA_ST.length - 1))); else play(); };
  document.addEventListener('keydown', e => {
    if (!on() || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key, list = shown(), at = list.indexOf(cfg.st);
    if (k === ' ') { e.preventDefault(); play(); }
    else if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); const d = k === 'ArrowDown' ? 1 : -1; tune(list.length ? list[((at < 0 ? 0 : at + d) + list.length) % list.length] : cfg.st + d); }
    else if (k === 'f' || k === 'F') $('raFav').click();
    else if (k === '+' || k === '-') { cfg.vol = Math.max(0, Math.min(100, cfg.vol + (k === '+' ? 10 : -10))); audio.volume = cfg.vol / 100; $('raVol').value = cfg.vol; keep(); }
  });
  {  // vérification : des adresses https toutes différentes, chacune sur un domaine déclaré dans plugin.json ; les genres filtrent bien
    const bad = [], OK = /^https:\/\/(icecast\.radiofrance\.fr|[a-z0-9]+\.ice\.infomaniak\.ch|icecast\.skyrock\.net)\//;
    if (new Set(RA_ST.map(s => s[1])).size !== RA_ST.length) bad.push('doublon');
    for (const s of RA_ST) if (!OK.test(s[1])) bad.push('domaine non déclaré : ' + s[0]);
    const keepG = cfg.genre; cfg.genre = 'Jazz'; if (shown().length !== 3) bad.push('genre Jazz : ' + shown().length); cfg.genre = keepG;
    console.assert(!bad.length, 'radio', bad); view.dataset.selfcheck = bad.join(' | ') || 'ok';
  }
  render();
  let raf = 0; const frame = () => { if (!on()) { raf = 0; return; } raf = requestAnimationFrame(frame); draw(); };
  ctx.onOpen(() => { g ??= $('raCanvas').getContext('2d'); if (!raf) raf = requestAnimationFrame(frame); });
  setInterval(() => { if (sleepAt && Date.now() > sleepAt) { sleepAt = 0; $('raSleep').value = '0'; if (playing) play(false); } }, 30000);  // la minuterie marche aussi onglet caché
  $('raCanvas').__state = () => ({ playing, loading, err, t: audio.currentTime, st: RA_ST[cfg.st][0], now: nowSt === cfg.st ? nowTxt : '' });
}
