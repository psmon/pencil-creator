/* ============================================
   i18n.js — EN / KO Language Pack
   Default: English
   ============================================ */

const LANG = {
  en: {
    'hero.title': 'We Choose Peace',
    'hero.sub': 'Small winds gather to change the world<br>Your heart is where peace begins',
    'hero.btnPray': 'Pray Together',
    'hero.btnMessage': 'Leave a Message',

    'msg.title': 'Peace Is Not Far Away',
    'msg.card1Title': 'Effort to Understand Each Other',
    'msg.card1Desc': 'Listening to another\'s story.<br>That is the first step toward peace.',
    'msg.card2Title': 'A Warm Gaze That Accepts Differences',
    'msg.card2Desc': 'We are all different,<br>but that difference makes the world beautiful.',
    'msg.card3Title': 'That Is What Peace Is',
    'msg.card3Desc': 'Not a grand declaration,<br>but warmth in everyday life — that is peace.',

    'map.title': 'Messages of Peace from Around the World',
    'map.sub': 'We are all connected as one',

    'footer.title': 'Peace is not something grand',
    'footer.sub': 'It begins in your heart, today',
    'footer.copy': '&copy; 2026 Peace Project &mdash; "Peace is what we choose"',

    'opt.title': 'Animation Options',
    'opt.speed': 'Speed',
    'opt.feather': 'Feather Count',
    'opt.ripple': 'Ripple Intensity',
    'opt.togBreathing': 'Zen Breathing',
    'opt.togRipple': 'Water Ripple',
    'opt.togFeather': 'Floating Feather',
    'opt.togAurora': 'Aurora Gradient',
    'opt.togCascade': 'Zen Fade Cascade',
  },

  ko: {
    'hero.title': '우리는 평화를 선택합니다',
    'hero.sub': '작은 바람이 모여 세상을 바꿉니다<br>당신의 마음이 평화의 시작입니다',
    'hero.btnPray': '함께 기원하기',
    'hero.btnMessage': '나의 메시지 남기기',

    'msg.title': '평화는 멀리 있지 않습니다',
    'msg.card1Title': '서로를 이해하려는 노력',
    'msg.card1Desc': '다른 사람의 이야기에 귀 기울이는 것.<br>그것이 평화의 첫 번째 걸음입니다.',
    'msg.card2Title': '다름을 인정하는 따뜻한 시선',
    'msg.card2Desc': '우리는 모두 다르지만,<br>그 다름이 세상을 아름답게 만듭니다.',
    'msg.card3Title': '그것이 바로 평화입니다',
    'msg.card3Desc': '거창한 선언이 아닌<br>일상의 따뜻한 마음에서 평화가 시작됩니다.',

    'map.title': '전 세계에서 보내온 평화의 메시지',
    'map.sub': '우리는 하나로 연결되어 있습니다',

    'footer.title': '평화는 거창한 것이 아닙니다',
    'footer.sub': '오늘, 당신의 마음에서 시작됩니다',
    'footer.copy': '&copy; 2026 Peace Project &mdash; "평화는 우리가 선택하는 것입니다"',

    'opt.title': '애니메이션 옵션',
    'opt.speed': '속도',
    'opt.feather': '깃털 수',
    'opt.ripple': '파문 강도',
    'opt.togBreathing': '젠 호흡',
    'opt.togRipple': '수면 파문',
    'opt.togFeather': '깃털 부유',
    'opt.togAurora': '오로라 그라디언트',
    'opt.togCascade': '젠 페이드 캐스케이드',
  }
};

let currentLang = 'en';

function setLang(lang) {
  currentLang = lang;
  const pack = LANG[lang];
  if (!pack) return;

  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!pack[key]) return;

    if (el.getAttribute('data-i18n-html') === 'true') {
      el.innerHTML = pack[key];
    } else {
      el.textContent = pack[key];
    }
  });

  // Update toggle button label
  const label = document.querySelector('.lang-toggle .lang-label');
  if (label) label.textContent = lang.toUpperCase();

  // Update page title
  document.title = lang === 'ko'
    ? '평화를 기원합니다 — We Choose Peace'
    : 'We Choose Peace — 평화를 기원합니다';
}

function toggleLang() {
  setLang(currentLang === 'en' ? 'ko' : 'en');
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.addEventListener('click', toggleLang);

  // Default to English
  setLang('en');
});
