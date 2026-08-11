(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav__toggle");
  var navLinks = document.querySelector(".nav__links");
  var toTop = document.querySelector(".to-top");

  /* Sticky header state ---------------------------------------------- */
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
    if (toTop) {
      toTop.classList.toggle("is-visible", window.scrollY > 500);
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile nav toggle --------------------------------------------------- */
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.innerHTML = isOpen ? "&#10005;" : "&#9776;";
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.innerHTML = "&#9776;";
      });
    });
  }

  /* Active nav link on scroll ------------------------------------------- */
  var sections = document.querySelectorAll("main section[id]");
  var navAnchors = document.querySelectorAll(".nav__links a[href^='#']");
  function setActiveLink() {
    var current = "";
    sections.forEach(function (sec) {
      var rect = sec.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom > 120) current = sec.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + current);
    });
  }
  document.addEventListener("scroll", setActiveLink, { passive: true });
  setActiveLink();

  /* Back to top ----------------------------------------------------------- */
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Reveal on scroll (progressive enhancement — see style.css) --------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    document.documentElement.classList.add("js-reveal");
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: if something never crosses the threshold (e.g. a very
    // short section, or a screenshot/print tool that never scrolls),
    // force everything visible after a few seconds so content can't get
    // permanently stuck at opacity:0.
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }, 4000);
  }

  /* Menu tabs ------------------------------------------------------------- */
  var menuTabs = document.querySelectorAll(".menu-tab");
  var menuPanels = document.querySelectorAll(".menu-panel");
  menuTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-menu-target");
      menuTabs.forEach(function (t) { t.classList.remove("is-active"); });
      menuPanels.forEach(function (p) { p.classList.remove("is-active"); });
      tab.classList.add("is-active");
      document.getElementById(target).classList.add("is-active");
    });
  });

  /* Lightbox ---------------------------------------------------------- */
  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    var lightboxContent = lightbox.querySelector(".lightbox__content");
    var lightboxCaption = lightbox.querySelector(".lightbox__caption");
    var closeBtn = lightbox.querySelector(".lightbox__close");

    function openLightbox(src, type, caption, poster) {
      var media;
      if (type === "video") {
        media = document.createElement("video");
        media.src = src;
        media.controls = true;
        media.autoplay = true;
        media.muted = true;
        media.playsInline = true;
        if (poster) media.poster = poster;
      } else {
        media = document.createElement("img");
        media.src = src;
        media.alt = caption || "";
      }
      var existing = lightboxContent.querySelector("img, video");
      if (existing) existing.remove();
      lightboxContent.insertBefore(media, lightboxCaption);
      lightboxCaption.textContent = caption || "";
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      var media = lightboxContent.querySelector("img, video");
      if (media && media.tagName === "VIDEO") media.pause();
      if (media) media.remove();
    }

    document.querySelectorAll("[data-lightbox]").forEach(function (el) {
      el.addEventListener("click", function () {
        openLightbox(
          el.getAttribute("data-lightbox"),
          el.getAttribute("data-lightbox-type") || "image",
          el.getAttribute("data-caption"),
          el.getAttribute("data-poster")
        );
      });
    });

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  /* Contact form (static placeholder submit) --------------------------- */
  var form = document.querySelector(".reservation-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type='submit']");
      var original = btn.textContent;
      btn.textContent = "Request Sent";
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
        form.reset();
      }, 2600);
    });
  }
})();
