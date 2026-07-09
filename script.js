/* ══════════════════════════════════════════════════════════════
   HAN GUO — PORTFOLIO SCRIPTS

   1. Intro splash — click "Han" to dismiss; skipped on return visits
   2. Scroll reveal — fades sections in as they enter the viewport
══════════════════════════════════════════════════════════════ */


/* ──────────────────────────────────────────────────────────
   1. INTRO SPLASH

   The intro is skipped (hidden instantly, no fade) if EITHER:
     a) sessionStorage flag 'intro-seen' was set when the user
        first clicked "Han" in this browser session, OR
     b) The URL hash is '#homepage' — set by all project-page
        "Back to Home" links (index.html#homepage).

   On a genuine first visit: normal fade-out plays,
   sessionStorage flag is saved, scroll reveal starts after
   the transition completes.
────────────────────────────────────────────────────────── */

const intro     = document.querySelector('.intro');
const introName = document.querySelector('.intro-name');

if (intro && introName) {

  const alreadySeen = !!sessionStorage.getItem('intro-seen');
  const viaBackLink = location.hash === '#homepage';

  if (alreadySeen || viaBackLink) {
    // ── Skip instantly — no transition ──────────────────
    intro.style.transition = 'none';
    intro.classList.add('intro-hidden');
    document.body.classList.remove('intro-active');
    // Restore transition property after the frame so the
    // element doesn't flicker if it's ever animated later.
    requestAnimationFrame(() => {
      intro.style.transition = '';
      initRevealObserver();
    });

  } else {
    // ── First visit — normal fade-out ───────────────────
    const dismissIntro = () => {
      if (intro.classList.contains('intro-hidden')) return;

      // Remember for the rest of this browser session
      sessionStorage.setItem('intro-seen', '1');

      intro.classList.add('intro-hidden');
      document.body.classList.remove('intro-active');

      // Start reveal observer once the opacity fade completes
      intro.addEventListener('transitionend', (e) => {
        if (e.propertyName !== 'opacity') return;
        initRevealObserver();
      }, { once: true });
    };

    // Click
    introName.addEventListener('click', dismissIntro);

    // Keyboard (Enter / Space) for accessibility
    introName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dismissIntro();
      }
    });
  }
}


/* ──────────────────────────────────────────────────────────
   FALLBACK — project pages (no .intro element)
   Start the reveal observer immediately on non-intro pages.
────────────────────────────────────────────────────────── */
if (!document.querySelector('.intro')) {
  requestAnimationFrame(initRevealObserver);
}


/* ──────────────────────────────────────────────────────────
   2. SCROLL REVEAL
   Watches every .reveal element; adds .is-visible when it
   enters the viewport. Each element animates once only.
────────────────────────────────────────────────────────── */

function initRevealObserver() {
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -32px 0px',
    }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* Use an existing alternate cover while an intended JPG is not present. */
document.querySelectorAll('img[data-fallback-src]').forEach((image) => {
  image.addEventListener('error', () => {
    const fallback = image.dataset.fallbackSrc;
    if (!fallback || image.src.endsWith(fallback)) return;
    image.src = fallback;
  }, { once: true });
});
