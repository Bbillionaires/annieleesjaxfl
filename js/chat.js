/* ==========================================================================
   Order-by-chat widget
   ----------------------------------------------------------------------
   What this actually is: a guided, scripted question flow (with optional
   speech-to-text) that ends by handing a formatted order to the visitor's
   own email client, addressed to the restaurant. It is NOT a generative
   AI and does not silently transmit anything on its own — the visitor's
   email app has to actually send the message. There is also no backend
   here, so an owner-approval step can't be reflected back onto this page
   automatically; that would need a real server + database + email API.
   ========================================================================== */
(function () {
  "use strict";

  var RESTAURANT_EMAIL = "annieleesbakery@gmail.com";

  var launcher = document.querySelector(".chat-launcher");
  var panel = document.querySelector(".chat-panel");
  if (!launcher || !panel) return;

  var closeBtn = panel.querySelector(".chat-panel__close");
  var body = panel.querySelector(".chat-panel__body");
  var quickWrap = panel.querySelector(".chat-panel__quick");
  var form = panel.querySelector(".chat-panel__form");
  var input = panel.querySelector(".chat-panel__input");
  var micBtn = panel.querySelector(".chat-mic-btn");
  var sendBtn = panel.querySelector(".chat-send-btn");
  var badge = launcher.querySelector(".chat-launcher__badge");

  var STEPS = [
    { key: "name", q: "Hi! I'm here to help you start an order for Annie Lee's Bakery & Diner. First — what's your name?" },
    { key: "contact", q: function (a) { return "Nice to meet you, " + a.name + "! What's the best email or phone number to reach you at?"; } },
    { key: "order", q: "What would you like to order? A custom cake theme, a diner item, catering for an event — describe it however you like." },
    { key: "date", q: "Do you have a date you need this by? (Or just say \"not sure yet.\")" },
    { key: "notes", q: "Anything else we should know — size, budget, allergies, colors? Or say \"nothing else.\"" }
  ];

  var answers = {};
  var stepIndex = -1;
  var started = false;
  var finished = false;

  quickWrap.hidden = true;

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function addMessage(text, kind, html) {
    var el = document.createElement("div");
    el.className = "chat-msg chat-msg--" + kind;
    if (html) {
      el.appendChild(text);
    } else {
      el.textContent = text;
    }
    body.appendChild(el);
    scrollToBottom();
    return el;
  }

  function addBotMessage(text, cb) {
    var typing = document.createElement("div");
    typing.className = "chat-msg chat-msg--bot";
    typing.innerHTML = '<span class="chat-typing"><span></span><span></span><span></span></span>';
    body.appendChild(typing);
    scrollToBottom();
    setTimeout(function () {
      typing.remove();
      addMessage(text, "bot");
      if (cb) cb();
    }, 480 + Math.random() * 280);
  }

  function currentQuestionText() {
    var step = STEPS[stepIndex];
    if (!step) return "";
    return typeof step.q === "function" ? step.q(answers) : step.q;
  }

  function updateQuickReplies() {
    var step = STEPS[stepIndex];
    var showQuick = step && step.key === "order";
    quickWrap.hidden = !showQuick;
  }

  function askNextStep() {
    stepIndex++;
    updateQuickReplies();
    if (stepIndex >= STEPS.length) {
      showSummary();
      return;
    }
    addBotMessage(currentQuestionText());
  }

  function handleAnswer(raw) {
    var text = raw.trim();
    if (!text) return;
    addMessage(text, "user");
    var step = STEPS[stepIndex];
    if (step) answers[step.key] = text;
    input.value = "";
    askNextStep();
  }

  function fieldLabel(key) {
    return { name: "Name", contact: "Contact", order: "Order", date: "Date", notes: "Notes" }[key] || key;
  }

  function showSummary() {
    finished = true;
    var wrap = document.createElement("div");
    var dl = document.createElement("dl");
    ["name", "contact", "order", "date", "notes"].forEach(function (key) {
      var dt = document.createElement("dt");
      dt.textContent = fieldLabel(key);
      var dd = document.createElement("dd");
      dd.textContent = answers[key] || "—";
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    wrap.appendChild(dl);
    addBotMessage("Here's what I've got — ready to send this to Annie Lee's?", function () {
      addMessage(wrap, "summary", true);
      renderActionButtons();
    });
  }

  function renderActionButtons() {
    var row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.flexWrap = "wrap";
    row.style.marginTop = "2px";

    var sendMailBtn = document.createElement("button");
    sendMailBtn.type = "button";
    sendMailBtn.className = "chat-quick-btn";
    sendMailBtn.style.background = "var(--gold)";
    sendMailBtn.style.color = "var(--black)";
    sendMailBtn.textContent = "Send Order Request";
    sendMailBtn.addEventListener("click", function () {
      sendOrder();
      row.remove();
    });

    var restartBtn = document.createElement("button");
    restartBtn.type = "button";
    restartBtn.className = "chat-quick-btn";
    restartBtn.textContent = "Start Over";
    restartBtn.addEventListener("click", resetChat);

    row.appendChild(sendMailBtn);
    row.appendChild(restartBtn);
    body.appendChild(row);
    scrollToBottom();
    input.setAttribute("disabled", "disabled");
    if (sendBtn) sendBtn.setAttribute("disabled", "disabled");
  }

  function sendOrder() {
    var subject = "New order request from " + (answers.name || "website visitor");
    var lines = [
      "New order request from the Annie Lee's Bakery & Diner website chat:",
      "",
      "Name: " + (answers.name || "—"),
      "Contact: " + (answers.contact || "—"),
      "Order: " + (answers.order || "—"),
      "Needed by: " + (answers.date || "—"),
      "Notes: " + (answers.notes || "—")
    ];
    var body_ = lines.join("\n");
    var mailto =
      "mailto:" + RESTAURANT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body_);
    window.location.href = mailto;

    addBotMessage(
      "Opening your email app now with this order addressed to us — just hit Send there to deliver it. " +
      "Once the team at Annie Lee's reviews it, they'll confirm your order by email or phone. " +
      "(Heads up: we can't show live order status on this page yet — that confirmation comes from us directly.)"
    );
  }

  function resetChat() {
    answers = {};
    stepIndex = -1;
    finished = false;
    body.innerHTML = "";
    input.removeAttribute("disabled");
    if (sendBtn) sendBtn.removeAttribute("disabled");
    addBotMessage(
      "Hi again! Let's start a fresh order for Annie Lee's Bakery & Diner.",
      function () { askNextStep(); }
    );
  }

  function openPanel() {
    panel.classList.add("is-open");
    launcher.classList.add("is-hidden");
    if (badge) badge.remove();
    try { localStorage.setItem("aljd_chat_opened", "1"); } catch (e) {}
    if (!started) {
      started = true;
      askNextStep();
    }
    setTimeout(function () { input.focus(); }, 350);
  }

  function closePanel() {
    panel.classList.remove("is-open");
    launcher.classList.remove("is-hidden");
  }

  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);

  // Shown once the visitor has scrolled a little — at the very top of the
  // page it would sit on top of the hero's own text/CTAs on shorter
  // screens, so it waits just past that before appearing.
  function updateLauncherVisibility() {
    launcher.classList.toggle("is-visible", window.scrollY > 260);
  }
  document.addEventListener("scroll", updateLauncherVisibility, { passive: true });
  updateLauncherVisibility();

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (finished) return;
      handleAnswer(input.value);
    });
  }
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!finished) handleAnswer(input.value);
    }
  });

  quickWrap.querySelectorAll(".chat-quick-btn[data-quick]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (finished || quickWrap.hidden) return;
      handleAnswer(btn.getAttribute("data-quick"));
    });
  });

  /* Voice input --------------------------------------------------------
     Feature-detected: hidden entirely on browsers without SpeechRecognition
     (notably desktop Safari) rather than showing a button that can't work. */
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition && micBtn) {
    var recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    var recording = false;
    var baseValue = "";

    recognition.addEventListener("result", function (e) {
      var transcript = "";
      for (var i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      input.value = (baseValue ? baseValue + " " : "") + transcript;
    });
    recognition.addEventListener("end", function () {
      recording = false;
      micBtn.classList.remove("is-recording");
    });
    recognition.addEventListener("error", function () {
      recording = false;
      micBtn.classList.remove("is-recording");
    });

    micBtn.addEventListener("click", function () {
      if (finished) return;
      if (recording) {
        recognition.stop();
        return;
      }
      baseValue = input.value;
      recording = true;
      micBtn.classList.add("is-recording");
      try {
        recognition.start();
      } catch (err) {
        recording = false;
        micBtn.classList.remove("is-recording");
      }
    });
  } else if (micBtn) {
    micBtn.setAttribute("hidden", "hidden");
  }

  /* First-visit attention badge, shown once per browser until opened. */
  try {
    if (localStorage.getItem("aljd_chat_opened") && badge) badge.remove();
  } catch (e) {}
})();
