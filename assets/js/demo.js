// Hero demo: the phone keyboard on the page types on the "connected screen" above it, composing Hangul
// one key at a time (ㅎ → 하 → 한) the way the app sends it. Keys can be tapped, clicked, or typed on a physical keyboard.
(() => {
  const root = document.querySelector('[data-demo]');
  if (!root) return;

  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const VOWEL_PAIR = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ' };
  const FINAL_PAIR = { 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ' };
  const unpair = (map, x) => Object.keys(map).find((k) => map[k] === x);

  // letter keys by row, in both layouts; physical keys map to the same positions
  const KO = ['ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ', 'ㅁㄴㅇㄹㅎㅗㅓㅏㅣ', 'ㅋㅌㅊㅍㅠㅜㅡ'].join('');
  const EN = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].join('');
  const KO_SHIFT = { 'ㅂ': 'ㅃ', 'ㅈ': 'ㅉ', 'ㄷ': 'ㄸ', 'ㄱ': 'ㄲ', 'ㅅ': 'ㅆ', 'ㅐ': 'ㅒ', 'ㅔ': 'ㅖ' };
  const MAX = 36;

  const letters = [...root.querySelectorAll('[data-i]')];
  const fn = (name) => root.querySelector(`[data-fn="${name}"]`);
  const outs = [...root.querySelectorAll('[data-out]')];
  const field = root.querySelector('.p-field-text');

  let done = '', cho = '', jung = '', jong = '';
  let korean = true, shift = false;

  const composing = () => (cho && jung
    ? String.fromCharCode(0xac00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28 + JONG.indexOf(jong))
    : cho || jung);
  const commit = () => { done += composing(); cho = jung = jong = ''; };
  const full = () => [...done].length + (composing() ? 1 : 0) >= MAX;

  function typeJamo(j) {
    if (CHO.includes(j)) {
      if (!cho && !jung) cho = j;
      else if (!jung || !cho) { commit(); cho = j; }
      else if (!jong && JONG.includes(j)) jong = j;
      else if (jong && FINAL_PAIR[jong + j]) jong = FINAL_PAIR[jong + j];
      else { commit(); cho = j; }
    } else if (jong) {                       // the final consonant moves on to start the next syllable
      const pair = unpair(FINAL_PAIR, jong), carry = pair ? pair[1] : jong;
      jong = pair ? pair[0] : '';
      commit(); cho = carry; jung = j;
    } else if (jung) {
      if (VOWEL_PAIR[jung + j]) jung = VOWEL_PAIR[jung + j];
      else { commit(); jung = j; }
    } else jung = j;
  }
  function backspace() {
    if (jong) { const p = unpair(FINAL_PAIR, jong); jong = p ? p[0] : ''; }
    else if (jung) { const p = unpair(VOWEL_PAIR, jung); jung = p ? p[0] : ''; }
    else if (cho) cho = '';
    else done = [...done].slice(0, -1).join('');
  }

  function render() {
    for (const out of outs) {
      out.querySelector('.done').textContent = done;
      out.querySelector('.comp').textContent = composing();
    }
    field.scrollLeft = field.scrollWidth;
    letters.forEach((b, i) => {
      const base = (korean ? KO : EN)[i];
      b.textContent = korean ? (shift && KO_SHIFT[base]) || base : shift ? base.toUpperCase() : base;
    });
    fn('shift').setAttribute('aria-pressed', String(shift));
    fn('lang').textContent = korean ? '한/영' : 'A/한';
  }
  function flash(button) {
    button.classList.add('is-down');
    setTimeout(() => button.classList.remove('is-down'), 130);
  }

  function press(button) {
    const name = button.dataset.fn;
    if (name === 'shift') shift = !shift;
    else if (name === 'lang') { commit(); korean = !korean; shift = false; }
    else if (name === 'bksp') backspace();
    else if (name === 'clear') { done = cho = jung = jong = ''; }
    else if (!full() || (korean && !name && composing())) {
      if (name === 'space') { commit(); done += ' '; }
      else if (name === 'dot') { commit(); done += '.'; }
      else if (korean) typeJamo(button.textContent);
      else { commit(); done += button.textContent; }
      shift = false;
    }
    if (name !== 'clear') flash(button);
    render();
  }

  // ---- the opening run: 한글 bluetooth 키보드, with a 한/영 switch each way
  const SCRIPT = ['ㅎ', 'ㅏ', 'ㄴ', 'ㄱ', 'ㅡ', 'ㄹ', 'space', 'lang', 'b', 'l', 'u', 'e', 't', 'o', 'o', 't', 'h', 'space', 'lang', 'ㅋ', 'ㅣ', 'ㅂ', 'ㅗ', 'ㄷ', 'ㅡ'];
  let timer = 0, step = 0;
  const find = (token) => fn(token) || letters.find((b) => b.textContent === token);
  function run() {
    if (step >= SCRIPT.length) { timer = 0; return; }
    const token = SCRIPT[step++];
    press(find(token));
    timer = setTimeout(run, token === 'lang' || token === 'space' ? 380 : 170);
  }
  function stopRun() { if (timer) { clearTimeout(timer); timer = 0; } step = SCRIPT.length; }

  root.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button || !root.contains(button)) return;
    stopRun();
    press(button);
  });
  root.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const onButton = e.target.closest('button');
    if (onButton && (e.code === 'Space' || e.code === 'Enter')) return;      // let the focused key activate itself
    let button = null;
    if (/^Key[A-Z]$/.test(e.code)) {
      button = letters[EN.indexOf(e.code[3].toLowerCase())];
      if (e.shiftKey !== shift) { shift = e.shiftKey; render(); }
    } else if (e.code === 'Space') button = fn('space');
    else if (e.code === 'Backspace') button = fn('bksp');
    else if (e.code === 'Period') button = fn('dot');
    else if (e.code === 'Lang1' || e.key === 'HangulMode') button = fn('lang');
    if (!button) return;
    e.preventDefault();
    stopRun();
    press(button);
  });

  render();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { done = '한글 bluetooth 키보드'; step = SCRIPT.length; render(); }
  else timer = setTimeout(run, 900);
})();

// Phones: a download bar stays at the bottom while neither the hero nor the closing badge is on screen.
(() => {
  const bar = document.querySelector('[data-sticky]');
  const badges = [document.querySelector('.hero'), document.querySelector('.closing')].filter(Boolean);
  if (!bar || !badges.length || !('IntersectionObserver' in window)) return;
  const onScreen = new Set();
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
    bar.hidden = onScreen.size > 0;
  });
  badges.forEach((el) => watch.observe(el));
})();
