// Moving pictures on the page: the side-by-side clips play like short GIFs while they are on screen,
// plus the reel's sound button and the phone download bar.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // run a looping clip only while it is on screen, from the start each time it comes into view
  const whileVisible = (el, start, stop) => {
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.15 }).observe(el);
    else start();
  };
  const loop = (el, cycle, reset) => {
    let timer = 0, running = false;
    const later = (f, ms) => { if (running) timer = setTimeout(f, ms); };
    whileVisible(el, () => { if (!running) { running = true; cycle(later); } },
      () => { running = false; clearTimeout(timer); reset(); });
  };

  // ---- 안녕하세요 typed one key at a time, as Hangul composes on a phone keyboard
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const WORD = ['ㅇ', 'ㅏ', 'ㄴ', 'ㄴ', 'ㅕ', 'ㅇ', 'ㅎ', 'ㅏ', 'ㅅ', 'ㅔ', 'ㅇ', 'ㅛ'];
  const frames = [['', '']];          // [finished text, syllable still composing] after each key
  {
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
  }
  const last = frames.length - 1;
  const WHOLE = frames[last].join('');
  const show = (el, [d, c]) => { el.querySelector('.done').textContent = d; el.querySelector('.comp').textContent = c; };
  const KEY = 210;

  // ---- realtime: the left screen gets the word only on 전송, the right one composes along with every key
  {
    const root = document.querySelector('[data-versus]');
    if (root) {
      const send = root.querySelector('[data-mode="send"]'), live = root.querySelector('[data-mode="live"]');
      const sendKey = root.querySelector('[data-send]'), sendScreen = send.querySelector('[data-screen]');
      const frame = (i) => {
        show(send.querySelector('[data-phone]'), frames[i]);
        show(live.querySelector('[data-phone]'), frames[i]);
        show(live.querySelector('[data-screen]'), frames[i]);
      };
      const reset = () => { frame(0); show(sendScreen, ['', '']); sendKey.classList.remove('is-down'); };
      if (reduced) { frame(last); show(sendScreen, [WHOLE, '']); }
      else loop(root, function cycle(later) {
        reset();
        let i = 0;
        const step = () => {
          frame(i);
          if (i++ < last) return later(step, KEY);
          later(() => {
            sendKey.classList.add('is-down');
            show(sendScreen, [WHOLE, '']);
            later(() => { sendKey.classList.remove('is-down'); later(() => { reset(); later(() => cycle(later), 700); }, 2600); }, 260);
          }, 650);
        };
        step();
      }, reset);
    }
  }

  // ---- keyboards: an unfamiliar one the app imposes vs the user's own, typing in a few different looks
  {
    const root = document.querySelector('[data-keyboards]');
    if (root) {
      const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>';
      const LAYOUTS = {
        plain: [[...'ㄱㄴㄷㄹㅁㅂㅅ'], [...'ㅇㅈㅊㅋㅌㅍㅎ'], [...'ㅏㅑㅓㅕㅗㅛㅜ'], ['ㅠ', 'ㅡ', 'ㅣ', '⌫', '↵']],
        mine: [[...'ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ'], [...'ㅁㄴㅇㄹㅎㅗㅓㅏㅣ'], ['⇧', ...'ㅋㅌㅊㅍㅠㅜㅡ', '⌫'], ['!#1', 'mic', ' ', '.', '↵']],
      };
      for (const kb of root.querySelectorAll('[data-kb]')) {
        kb.innerHTML = LAYOUTS[kb.dataset.kb].map((row, r) => `<div class="kb-row${kb.dataset.kb === 'mine' && r === 1 ? ' kb-row--inset' : ''}">${
          row.map((k) => (k === 'mic' ? `<span class="fn">${MIC}</span>` : k === ' ' ? '<span class="space"></span>'
            : `<span${/^[ㄱ-ㅣ]$/.test(k) ? '' : ' class="fn"'}>${k}</span>`)).join('')}</div>`).join('');
      }
      const card = root.querySelector('[data-skin]'), field = card.querySelector('.kb-field');
      const keys = [...card.querySelectorAll('.kb-row span')];
      const tips = [...card.querySelectorAll('.kb-suggest span')];
      const SKINS = ['light', 'dark', 'mint'];
      let skin = 0;
      const frame = (i) => {
        show(field, frames[i]);
        const text = frames[i].join('');
        ['안녕하세요', '안녕', '안녕히'].forEach((t, n) => { tips[n].textContent = text.startsWith('안녕') ? t : ''; });
      };
      const reset = () => { frame(0); keys.forEach((k) => k.classList.remove('is-down')); };
      if (reduced) frame(last);
      else loop(root, function cycle(later) {
        reset();
        let i = 0;
        const step = () => {                          // press a key and show what it typed
          if (i >= last) return later(() => { skin = (skin + 1) % SKINS.length; card.dataset.skin = SKINS[skin]; later(() => cycle(later), 500); }, 1800);
          const key = keys.find((k) => k.textContent === WORD[i]);
          key.classList.add('is-down');
          setTimeout(() => key.classList.remove('is-down'), 140);
          frame(++i);
          later(step, KEY + 40);
        };
        later(step, 400);
      }, reset);
    }
  }

  // ---- calibration: press the button, pick what showed up, done
  {
    const cal = document.querySelector('[data-calibration] .cal');
    if (cal) {
      const STEPS = [900, 300, 1200, 800, 2200];      // start, pressed, question, answer picked, finished
      const reset = () => { cal.dataset.step = '0'; };
      if (reduced) cal.dataset.step = '4';
      else loop(cal, function cycle(later) {
        let n = 0;
        const step = () => { cal.dataset.step = String(n); later(n === STEPS.length - 1 ? () => cycle(later) : step, STEPS[n++]); };
        step();
      }, reset);
    }
  }

  // ---- the intro reel plays muted on its own (still for reduced motion); a tap on the video plays or pauses it,
  // the 소리 button turns the sound on and off
  {
    const video = document.querySelector('.hero-video video');
    const button = document.querySelector('[data-sound]');
    if (video) {
      const box = video.parentElement;
      const mark = () => box.classList.toggle('is-paused', video.paused);
      video.addEventListener('play', mark);
      video.addEventListener('pause', mark);
      if (reduced) { video.removeAttribute('autoplay'); video.pause(); }
      mark();
      const playPause = () => (video.paused ? video.play() : video.pause());
      video.addEventListener('click', playPause);
      video.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); playPause(); } });
      if (button) {
        const label = button.querySelector('[data-sound-label]');
        const toggle = () => {
          video.muted = !video.muted;
          button.setAttribute('aria-pressed', String(!video.muted));
          label.textContent = video.muted ? '소리 꺼짐' : '소리 켜짐';
        };
        button.addEventListener('click', toggle);
      }
    }
  }

  // ---- back to top: shown once the first screen is scrolled away
  {
    const top = document.querySelector('[data-top]');
    if (top) {
      let queued = false;
      const update = () => {
        queued = false;
        const show = scrollY > innerHeight * 0.8;
        top.classList.toggle('is-shown', show);
        top.tabIndex = show ? 0 : -1;
      };
      addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
      update();
      top.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
    }
  }

  // ---- phones: a download bar stays at the bottom while neither the hero nor the closing badge is on screen
  {
    const bar = document.querySelector('[data-sticky]');
    const badges = [document.querySelector('.hero'), document.querySelector('.closing')].filter(Boolean);
    if (bar && badges.length && 'IntersectionObserver' in window) {
      const onScreen = new Set();
      const watch = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
        bar.hidden = onScreen.size > 0;
      });
      badges.forEach((el) => watch.observe(el));
    }
  }
})();
