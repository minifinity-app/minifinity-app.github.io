// Side-by-side comparison under ㅎ → 하 → 한: both phones type the same word one key at a time.
// The left screen only gets it when 전송 is pressed; the right screen composes along with every key, the way the app sends it.
(() => {
  const root = document.querySelector('[data-versus]');
  if (!root) return;

  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const WORD = ['ㅇ', 'ㅏ', 'ㄴ', 'ㄴ', 'ㅕ', 'ㅇ', 'ㅎ', 'ㅏ', 'ㅅ', 'ㅔ', 'ㅇ', 'ㅛ'];   // 안녕하세요
  const KEY = 210, BEFORE_SEND = 650, HOLD = 2600, REST = 700;

  // every state of the word as it is typed: [finished text, syllable still composing]
  const frames = [['', '']];
  let done = '', cho = '', jung = '', jong = '';
  const composing = () => (cho && jung
    ? String.fromCharCode(0xac00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28 + JONG.indexOf(jong))
    : cho || jung);
  const commit = () => { done += composing(); cho = jung = jong = ''; };
  for (const j of WORD) {
    if (CHO.includes(j)) {
      if (!cho && !jung) cho = j;
      else if (cho && jung && !jong && JONG.includes(j)) jong = j;
      else { commit(); cho = j; }
    } else if (jong) { const carry = jong; jong = ''; commit(); cho = carry; jung = j; }   // the final consonant starts the next syllable
    else jung = j;
    frames.push([done, composing()]);
  }
  const last = frames.length - 1;

  const panel = (mode) => root.querySelector(`[data-mode="${mode}"]`);
  const show = (el, [d, c]) => { el.querySelector('.done').textContent = d; el.querySelector('.comp').textContent = c; };
  const send = panel('send'), live = panel('live'), sendKey = root.querySelector('[data-send]');
  const sendScreen = send.querySelector('[data-screen]');

  function frame(i) {
    show(send.querySelector('[data-phone]'), frames[i]);
    show(live.querySelector('[data-phone]'), frames[i]);
    show(live.querySelector('[data-screen]'), frames[i]);
  }
  const whole = () => [frames[last][0] + frames[last][1], ''];

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    frame(last); show(sendScreen, whole());
    return;
  }

  let timer = 0, running = false;
  const later = (f, ms) => { timer = setTimeout(f, ms); };
  function cycle() {
    show(sendScreen, ['', '']);
    let i = 0;
    const step = () => {
      frame(i);
      if (i++ < last) return later(step, KEY);
      later(() => {
        sendKey.classList.add('is-down');
        show(sendScreen, whole());
        later(() => {
          sendKey.classList.remove('is-down');
          later(() => { frame(0); show(sendScreen, ['', '']); later(cycle, REST); }, HOLD);
        }, 260);
      }, BEFORE_SEND);
    };
    step();
  }

  // run only while the comparison is on screen, from the start each time it comes into view
  const start = () => { if (!running) { running = true; cycle(); } };
  const stop = () => { running = false; clearTimeout(timer); frame(0); show(sendScreen, ['', '']); sendKey.classList.remove('is-down'); };
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.4 }).observe(root);
  else start();
})();

// The intro reel plays muted on its own; it stays still for people who ask for reduced motion.
(() => {
  const video = document.querySelector('.hero-video video');
  if (video && matchMedia('(prefers-reduced-motion: reduce)').matches) { video.removeAttribute('autoplay'); video.pause(); }
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
