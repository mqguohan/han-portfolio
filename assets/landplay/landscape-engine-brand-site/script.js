/* ==========================================================================
   LANDPLAY — interactions
   All content lives in index.html; this file only drives motion.
   Every effect is skipped when the user prefers reduced motion.
   ========================================================================== */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var mobileLayout = window.matchMedia("(max-width: 900px)");
  var presentationMode = new URLSearchParams(window.location.search).get("presentation") === "1";
  var presentationReturnStarted = false;

  window.addEventListener("keydown", function (event) {
    if (!presentationMode || event.key.toLowerCase() !== "p") return;
    var target = event.target;
    var isTyping = target && (
      (target.matches && target.matches("input, textarea, select")) ||
      (target.closest && target.closest("[contenteditable]"))
    );
    if (isTyping || event.repeat || presentationReturnStarted) return;

    event.preventDefault();
    presentationReturnStarted = true;
    var returnUrl = "/landplay_presentation/?slide=8&state=1#08";
    try {
      returnUrl = sessionStorage.getItem("landplay:presentationReturnUrl") || returnUrl;
    } catch (_) {
      // The same-origin fallback remains available if storage is restricted.
    }
    window.location.assign(returnUrl);
  }, true);

  /* ------------------------------------------------------------------
     1. Reveal on scroll — fades section text in once, then disconnects
     ------------------------------------------------------------------ */
  var revealed = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reducedMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    revealed.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ------------------------------------------------------------------
     2. Game entry — the CTA is not wired to the game yet, so intercept
        the click, keep the page where it is, and show a brief status.
        Placed above the reduced-motion return so it always works.
     ------------------------------------------------------------------ */
  var gameLink = document.querySelector("[data-game-entry]");
  var gameStatus = document.querySelector("[data-game-status]");
  if (gameLink && gameStatus) {
    var statusTimer = null;
    gameLink.addEventListener("click", function (event) {
      event.preventDefault();               // no jump to top, no navigation
      gameStatus.classList.add("is-visible");
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(function () {
        gameStatus.classList.remove("is-visible");
      }, 2000);
    });
  }

  /* ------------------------------------------------------------------
     3. Field deck link — the full deck is not deployed alongside this
        site yet, so the link is a visual placeholder. Intercept it so
        the page never jumps; swap href for the real path when it exists.
     ------------------------------------------------------------------ */
  var deckLink = document.querySelector("[data-deck-link]");
  if (deckLink) {
    deckLink.addEventListener("click", function (event) {
      event.preventDefault();
    });
  }

  if (reducedMotion) return; // nothing below runs for reduced-motion users

  /* ------------------------------------------------------------------
     4. Cursor-driven image drift + hero boundary movement
        Sections tagged [data-cursor-shift] get --shift-x (images drift
        apart); sections tagged [data-boundary] also get --split.
        Desktop pointers only.
     ------------------------------------------------------------------ */
  if (finePointer) {
    var driftSections = document.querySelectorAll("[data-cursor-shift]");
    driftSections.forEach(function (section) {
      var hasBoundary = section.hasAttribute("data-boundary");
      var targetShift = 0, currentShift = 0;
      var targetSplit = 50, currentSplit = 50;
      var rafId = null;

      function tick() {
        // slow ease toward the target — movement stays subtle
        currentShift += (targetShift - currentShift) * 0.06;
        currentSplit += (targetSplit - currentSplit) * 0.06;
        section.style.setProperty("--shift-x", currentShift.toFixed(2) + "px");
        if (hasBoundary) {
          section.style.setProperty("--split", currentSplit.toFixed(2) + "%");
        }
        if (Math.abs(targetShift - currentShift) > 0.05 ||
            Math.abs(targetSplit - currentSplit) > 0.05) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = null;
        }
      }

      section.addEventListener("mousemove", function (event) {
        if (mobileLayout.matches) return;
        var rect = section.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5; // -0.5 … 0.5
        targetShift = x * 26;            // max ±13px object-position drift
        targetSplit = 50 + x * 7;        // boundary wanders 46.5% … 53.5%
        if (rafId === null) rafId = requestAnimationFrame(tick);
      });

      section.addEventListener("mouseleave", function () {
        targetShift = 0;
        targetSplit = 50;
        if (rafId === null) rafId = requestAnimationFrame(tick);
      });
    });
  }

  /* ------------------------------------------------------------------
     5. Scroll parallax — small vertical drift on tagged images.
        The 1.08 scale in CSS provides the overflow head-room.
     ------------------------------------------------------------------ */
  var parallaxImages = Array.prototype.slice.call(
    document.querySelectorAll("[data-parallax]")
  );
  var systemTrack = document.querySelector("[data-track]");
  var scrollScheduled = false;

  function applyScrollEffects() {
    scrollScheduled = false;
    var viewportH = window.innerHeight;

    parallaxImages.forEach(function (img) {
      var rect = img.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportH) return; // off-screen
      var factor = parseFloat(img.getAttribute("data-parallax")) || 0.05;
      var center = rect.top + rect.height / 2 - viewportH / 2;
      img.style.transform =
        "scale(1.08) translateY(" + (-center * factor).toFixed(1) + "px)";
    });

    // §6 sequence line tracks across the screen while the section scrolls
    if (systemTrack && !mobileLayout.matches) {
      var section = systemTrack.closest(".system");
      var rect2 = section.getBoundingClientRect();
      if (rect2.bottom > 0 && rect2.top < viewportH) {
        // progress 0 → 1 as the section passes through the viewport
        var progress = 1 - (rect2.top + rect2.height) / (viewportH + rect2.height);
        var travel = (0.5 - progress) * window.innerWidth * 0.22;
        systemTrack.style.transform = "translateX(" + travel.toFixed(1) + "px)";
      }
    }
  }

  window.addEventListener("scroll", function () {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(applyScrollEffects);
    }
  }, { passive: true });
  window.addEventListener("resize", applyScrollEffects);
  applyScrollEffects();

  /* ------------------------------------------------------------------
     6. State archive — on stacked (touch/mobile) layout, the strip
        nearest the viewport centre is emphasised while scrolling.
        On desktop, plain CSS :hover handles it.
     ------------------------------------------------------------------ */
  var states = document.querySelectorAll("[data-state]");
  if ("IntersectionObserver" in window && states.length) {
    var stateObserver = new IntersectionObserver(
      function (entries) {
        if (!mobileLayout.matches) return;
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-active", entry.isIntersecting);
        });
      },
      { rootMargin: "-35% 0px -35% 0px" }
    );
    states.forEach(function (el) { stateObserver.observe(el); });
  }
})();
