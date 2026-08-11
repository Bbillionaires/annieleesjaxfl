/* ==========================================================================
   Cinematic food presentation — behavior layer
   ----------------------------------------------------------------------
   Additive on top of main.js. Every effect here degrades to "do nothing"
   under prefers-reduced-motion, on coarse-pointer devices (cursor light),
   or when IntersectionObserver is unavailable — content and navigation
   never depend on any of it.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  var isSmallScreen = window.matchMedia("(max-width: 760px)").matches;
  var isLowPower = isSmallScreen || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  /* ------------------------------------------------------------------
     Pause-offscreen gating: decorative loops (Ken Burns, steam, glaze
     sweep, gold flakes, sparkles) only run while their section is
     actually on screen. Zero cost once scrolled away.
     ------------------------------------------------------------------ */
  var pauseTargets = document.querySelectorAll("[data-pause-offscreen]");
  if (pauseTargets.length) {
    if ("IntersectionObserver" in window) {
      var pauseIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle("in-view", entry.isIntersecting);
          });
        },
        { threshold: 0.05 }
      );
      pauseTargets.forEach(function (el) { pauseIO.observe(el); });
    } else {
      pauseTargets.forEach(function (el) { el.classList.add("in-view"); });
    }
  }

  /* ------------------------------------------------------------------
     Parallax (background / decorative layers only — headline text stays
     put on purpose, for legibility). Skipped entirely under reduced
     motion, and only computed while the hero is on screen.
     ------------------------------------------------------------------ */
  if (!reduceMotion) {
    var parallaxEls = document.querySelectorAll("[data-parallax]");
    if (parallaxEls.length) {
      var parallaxRaf = null;
      var updateParallax = function () {
        parallaxRaf = null;
        parallaxEls.forEach(function (el) {
          var section = el.closest("section") || el.parentElement;
          var rect = (section || el).getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
          var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
          var py = rect.top * speed * -1;
          el.style.setProperty("--py", py.toFixed(1) + "px");
        });
      };
      document.addEventListener(
        "scroll",
        function () {
          if (parallaxRaf) return;
          parallaxRaf = requestAnimationFrame(updateParallax);
        },
        { passive: true }
      );
      updateParallax();
    }
  }

  /* ------------------------------------------------------------------
     Scroll-controlled food zoom: the hero cake photo and the assembly
     story photo slowly zoom in as they near the center of the viewport.
     Smooth, capped, and disabled under reduced motion.
     ------------------------------------------------------------------ */
  if (!reduceMotion) {
    var zoomEls = document.querySelectorAll("[data-scroll-zoom]");
    if (zoomEls.length) {
      var zoomRaf = null;
      var updateZoom = function () {
        zoomRaf = null;
        var vh = window.innerHeight;
        zoomEls.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > vh) return;
          var center = rect.top + rect.height / 2;
          var dist = Math.abs(center - vh / 2) / (vh / 2);
          var progress = Math.max(0, 1 - Math.min(dist, 1));
          var zoom = 1 + progress * 0.08;
          el.style.setProperty("--zoom", zoom.toFixed(3));
        });
      };
      document.addEventListener(
        "scroll",
        function () {
          if (zoomRaf) return;
          zoomRaf = requestAnimationFrame(updateZoom);
        },
        { passive: true }
      );
      window.addEventListener("resize", updateZoom);
      updateZoom();
    }
  }

  /* ------------------------------------------------------------------
     Cursor-responsive glaze light — desktop / fine-pointer only.
     ------------------------------------------------------------------ */
  if (!isCoarsePointer && !reduceMotion) {
    document.querySelectorAll(".cursor-light").forEach(function (el) {
      el.addEventListener("mouseenter", function () { el.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { el.classList.remove("is-active"); });
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var mx = ((e.clientX - rect.left) / rect.width) * 100;
        var my = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--mx", mx.toFixed(1) + "%");
        el.style.setProperty("--my", my.toFixed(1) + "%");
      });
    });
  }

  /* ------------------------------------------------------------------
     Assembly story: sticky media cross-fades to match whichever step
     is centered in the viewport.
     ------------------------------------------------------------------ */
  var storySteps = document.querySelectorAll(".story__step");
  var storyFrames = document.querySelectorAll(".story__frame");
  if (storySteps.length && storyFrames.length && "IntersectionObserver" in window) {
    var storyIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var key = entry.target.getAttribute("data-frame");
          storySteps.forEach(function (s) {
            s.classList.toggle("is-active", s === entry.target);
          });
          storyFrames.forEach(function (f) {
            f.classList.toggle("is-active", f.getAttribute("data-frame") === key);
          });
        });
      },
      { threshold: 0.55, rootMargin: "-15% 0px -15% 0px" }
    );
    storySteps.forEach(function (s) { storyIO.observe(s); });
  }

  /* ------------------------------------------------------------------
     Confetti burst — a single tasteful "pop" in the hero's negative
     space, brand-colored only, capped duration, capped particle count
     (fewer on low-power devices), fully skipped under reduced motion.
     ------------------------------------------------------------------ */
  function runConfettiBurst(canvas, scale) {
    scale = scale || 1;
    var ctx = canvas.getContext("2d");
    var parent = canvas.parentElement;
    function resize() {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    resize();

    var colors = ["#c79a2e", "#8a6a20", "#e4bf5a", "#007b8a", "#1c1a17"];
    var count = Math.round((isLowPower ? 20 : 42) * scale);
    var particles = [];
    for (var i = 0; i < count; i++) {
      var fromLeft = i % 2 === 0;
      particles.push({
        x: fromLeft ? canvas.width * 0.06 : canvas.width * 0.94,
        y: canvas.height * 0.1,
        vx: (fromLeft ? 1 : -1) * (1.2 + Math.random() * 2.2),
        vy: -(2.6 + Math.random() * 2.8),
        size: 4 + Math.random() * 4,
        color: colors[i % colors.length],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.22
      });
    }

    var gravity = 0.1;
    var drag = 0.986;
    var duration = 4000;
    var start = null;

    function frame(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        var fade = Math.max(0, 1 - elapsed / duration);
        ctx.save();
        ctx.globalAlpha = fade * 0.9;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(frame);
  }

  var confettiCanvas = document.querySelector(".confetti-canvas");
  if (confettiCanvas && !reduceMotion) {
    var confettiFired = false;
    var heroEl = document.querySelector(".hero");
    var maybeFireConfetti = function () {
      if (confettiFired) return;
      var rect = confettiCanvas.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        confettiFired = true;
        setTimeout(function () { runConfettiBurst(confettiCanvas, 1); }, 450);
        document.removeEventListener("scroll", maybeFireConfetti);

        // A smaller "topper" burst repeats every few seconds, but only
        // while the hero is actually on screen — never while scrolled away.
        setInterval(function () {
          if (heroEl && heroEl.classList.contains("in-view")) {
            runConfettiBurst(confettiCanvas, 0.7);
          }
        }, 7000);
      }
    };
    maybeFireConfetti();
    document.addEventListener("scroll", maybeFireConfetti, { passive: true });
  }

  /* ------------------------------------------------------------------
     Fullscreen food viewer — richer than the simple image lightbox in
     main.js: name, description, price, ingredients, prev/next, CTA.
     ------------------------------------------------------------------ */
  var viewerTriggers = document.querySelectorAll("[data-viewer]");
  var viewer = document.querySelector(".viewer");
  if (viewerTriggers.length && viewer) {
    var viewerData = [];
    viewerTriggers.forEach(function (el) {
      viewerData.push({
        img: el.getAttribute("data-viewer-img"),
        name: el.getAttribute("data-viewer-name") || "",
        desc: el.getAttribute("data-viewer-desc") || "",
        price: el.getAttribute("data-viewer-price") || "",
        ingredients: (el.getAttribute("data-viewer-ingredients") || "")
          .split(",")
          .map(function (s) { return s.trim(); })
          .filter(Boolean)
      });
    });

    var vMediaWrap = viewer.querySelector(".viewer__media");
    var vName = viewer.querySelector(".viewer__name");
    var vDesc = viewer.querySelector(".viewer__desc");
    var vPrice = viewer.querySelector(".viewer__price");
    var vIngredients = viewer.querySelector(".viewer__ingredients");
    var vClose = viewer.querySelector(".viewer__close");
    var vPrev = viewer.querySelector(".viewer__nav--prev");
    var vNext = viewer.querySelector(".viewer__nav--next");
    var currentIndex = 0;
    var lastTrigger = null;

    function renderViewer(i) {
      currentIndex = (i + viewerData.length) % viewerData.length;
      var d = viewerData[currentIndex];
      var newImg = document.createElement("img");
      newImg.src = d.img;
      newImg.alt = d.name;
      var oldImg = vMediaWrap.querySelector("img");
      if (oldImg) oldImg.remove();
      vMediaWrap.appendChild(newImg);

      vName.textContent = d.name;
      vDesc.textContent = d.desc;
      vDesc.style.display = d.desc ? "" : "none";
      vPrice.textContent = d.price;
      vPrice.style.display = d.price ? "" : "none";
      vIngredients.innerHTML = "";
      d.ingredients.forEach(function (ing) {
        var span = document.createElement("span");
        span.textContent = ing;
        vIngredients.appendChild(span);
      });
      vIngredients.style.display = d.ingredients.length ? "" : "none";
    }

    function isLightboxOpen() {
      var lb = document.querySelector(".lightbox");
      return !!(lb && lb.classList.contains("is-open"));
    }

    function openViewer(i, trigger) {
      lastTrigger = trigger || null;
      renderViewer(i);
      viewer.classList.add("is-open");
      document.body.style.overflow = "hidden";
      vClose.focus();
    }
    function closeViewer() {
      viewer.classList.remove("is-open");
      if (!isLightboxOpen()) document.body.style.overflow = "";
      if (lastTrigger) lastTrigger.focus();
    }

    viewerTriggers.forEach(function (el, i) {
      el.addEventListener("click", function () { openViewer(i, el); });
    });
    vClose.addEventListener("click", closeViewer);
    vPrev.addEventListener("click", function () { renderViewer(currentIndex - 1); });
    vNext.addEventListener("click", function () { renderViewer(currentIndex + 1); });
    viewer.addEventListener("click", function (e) {
      if (e.target === viewer) closeViewer();
    });
    document.addEventListener("keydown", function (e) {
      if (!viewer.classList.contains("is-open")) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") renderViewer(currentIndex + 1);
      if (e.key === "ArrowLeft") renderViewer(currentIndex - 1);
    });
  }
})();
