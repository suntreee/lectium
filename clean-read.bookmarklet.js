(function () {
  var existing = document.getElementById("lectium-root");
  if (existing) {
    existing.remove();
    document.documentElement.classList.remove("lectium-locked");
    return;
  }

  var BLOCK_SELECTOR = [
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "canvas",
    "form",
    "input",
    "select",
    "textarea",
    "nav",
    "aside",
    "footer",
    "header",
    "[role='navigation']",
    "[role='banner']",
    "[role='complementary']",
    "[aria-hidden='true']",
    "[data-testid*='ad']",
    "[data-testid*='Ad']",
    "[data-testid*='newsletter']",
    "[data-testid*='Newsletter']",
    "[data-testid*='recirculation']",
    "[class*='advert']",
    "[class*='newsletter']",
    "[class*='paywall']",
    "[class*='related']",
    "[class*='share']",
    "[class*='sidebar']",
    ".ad",
    ".ads",
    ".advertisement",
    ".banner",
    ".cookie",
    ".modal",
    ".newsletter",
    ".overlay",
    ".paywall",
    ".promo",
    ".related",
    ".share",
    ".sidebar",
    ".social",
    ".subscribe"
  ].join(",");

  var PARAGRAPH_NOISE = [
    /^advertisement$/i,
    /^skip advertisement$/i,
    /^skip to content$/i,
    /^related content$/i,
    /^more on/i,
    /^read more/i,
    /^see more on/i,
    /^subscribe/i,
    /^sign up/i,
    /^order reprints/i,
    /^today's paper/i,
    /^a version of this article appears in print/i,
    /^thanks for reading/i,
    /subscribe to .* to read/i
  ];

  function textOf(node) {
    return (node && node.innerText ? node.innerText.replace(/\s+/g, " ").trim() : "");
  }

  function textLength(node) {
    return textOf(node).length;
  }

  function scoreNode(node) {
    var paragraphs = Array.prototype.slice.call(node.querySelectorAll("p"));
    var paragraphText = paragraphs.reduce(function (sum, p) {
      var length = textLength(p);
      return sum + (length > 45 ? length : 0);
    }, 0);
    var media = node.querySelectorAll("img,figure,table,pre,blockquote").length;
    var links = node.querySelectorAll("a").length;
    var text = Math.max(textLength(node), 1);
    var linkText = Array.prototype.slice.call(node.querySelectorAll("a")).reduce(function (sum, a) {
      return sum + textLength(a);
    }, 0);
    return paragraphText + media * 60 - links * 8 - (linkText / text) * 900;
  }

  function findArticle() {
    var selectors = [
      "article",
      "main article",
      "main",
      "[role='main']",
      ".article",
      ".entry-content",
      ".post-content"
    ].join(",");
    var preferred = Array.prototype.slice.call(document.querySelectorAll(selectors)).filter(function (node) {
      return textLength(node) > 300 && node.querySelectorAll("p").length > 2;
    });
    var candidates = preferred.length
      ? preferred
      : Array.prototype.slice.call(document.body.querySelectorAll("article, main, section, div")).filter(function (node) {
          return textLength(node) > 500 && node.querySelectorAll("p").length > 2;
        });
    candidates.sort(function (a, b) {
      return scoreNode(b) - scoreNode(a);
    });
    return candidates[0] || document.body;
  }

  function absolutize(node) {
    Array.prototype.slice.call(node.querySelectorAll("[src]")).forEach(function (el) {
      try {
        el.src = new URL(el.getAttribute("src"), location.href).href;
      } catch (error) {}
    });
    Array.prototype.slice.call(node.querySelectorAll("[href]")).forEach(function (el) {
      var href = el.getAttribute("href");
      if (!href || href.indexOf("javascript:") === 0) {
        el.removeAttribute("href");
        return;
      }
      try {
        el.href = new URL(href, location.href).href;
      } catch (error) {}
    });
  }

  function removeInlineHandlers(node) {
    Array.prototype.slice.call(node.querySelectorAll("*")).forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      });
    });
  }

  function isNoisyText(text) {
    return PARAGRAPH_NOISE.some(function (pattern) {
      return pattern.test(text);
    });
  }

  function removeNoisyBlocks(node) {
    Array.prototype.slice.call(node.querySelectorAll(BLOCK_SELECTOR)).forEach(function (el) {
      el.remove();
    });

    Array.prototype.slice.call(node.querySelectorAll("p,li,blockquote,figcaption,h2,h3")).forEach(function (el) {
      var text = textOf(el);
      if (!text && el.querySelectorAll("img,video,audio").length === 0) {
        el.remove();
        return;
      }
      if (isNoisyText(text)) {
        var parent = el.parentElement;
        el.remove();
        if (parent && parent.children.length <= 1 && textLength(parent) < 80) parent.remove();
      }
    });

    Array.prototype.slice.call(node.querySelectorAll("section,div")).forEach(function (el) {
      var text = textOf(el);
      var linkCount = el.querySelectorAll("a").length;
      var pCount = el.querySelectorAll("p").length;
      if (text && text.length < 220 && linkCount > 2 && pCount < 3) el.remove();
      if (/^(related content|more from|recommended|advertisement)$/i.test(text)) el.remove();
    });
  }

  function clean(node) {
    removeNoisyBlocks(node);
    removeInlineHandlers(node);
    absolutize(node);
  }

  function getTitle() {
    var headline = document.querySelector("h1");
    return textLength(headline) > 0 ? headline.innerText.trim() : document.title.replace(/\s+[|-]\s+.*$/, "").trim();
  }

  var article = findArticle().cloneNode(true);
  clean(article);

  var style = document.createElement("style");
  style.id = "lectium-style";
  style.textContent =
    ".lectium-locked{overflow:hidden!important}" +
    "#lectium-root{position:fixed;inset:0;z-index:2147483647;background:#f7f4ec;color:#1f2933;font-family:ui-serif,Georgia,Cambria,'Times New Roman',serif;overflow:auto}" +
    "#lectium-root.lectium-dark{background:#111827;color:#e5e7eb}" +
    "#lectium-root *{box-sizing:border-box}" +
    "#lectium-root .lectium-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(247,244,236,.94);border-bottom:1px solid rgba(31,41,51,.14);backdrop-filter:blur(12px);font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}" +
    "#lectium-root.lectium-dark .lectium-bar{background:rgba(17,24,39,.94);border-color:rgba(229,231,235,.16)}" +
    "#lectium-root .lectium-spacer{flex:1}" +
    "#lectium-root .lectium-brand{font-size:13px;font-weight:700;letter-spacing:0;color:inherit}" +
    "#lectium-root .lectium-src{font-size:12px;opacity:.65;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#lectium-root .lectium-btn{appearance:none;border:1px solid rgba(31,41,51,.2);background:transparent;color:inherit;border-radius:6px;width:34px;height:32px;display:inline-grid;place-items:center;font:600 15px ui-sans-serif,system-ui;cursor:pointer}" +
    "#lectium-root.lectium-dark .lectium-btn{border-color:rgba(229,231,235,.24)}" +
    "#lectium-root .lectium-btn:hover{background:rgba(31,41,51,.08)}" +
    "#lectium-root.lectium-dark .lectium-btn:hover{background:rgba(229,231,235,.1)}" +
    "#lectium-root .lectium-page{width:min(760px,100%);margin:0 auto;padding:34px 22px 80px}" +
    "#lectium-root .lectium-title{font-size:clamp(30px,5vw,48px);line-height:1.08;margin:0 0 10px;font-weight:800;letter-spacing:0}" +
    "#lectium-root .lectium-meta{font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-size:13px;color:inherit;opacity:.58;margin:0 0 28px}" +
    "#lectium-root .lectium-content{font-size:var(--lectium-font,19px);line-height:1.76}" +
    "#lectium-root .lectium-content :where(p,ul,ol,blockquote,pre,table,figure){margin:0 0 1.15em}" +
    "#lectium-root .lectium-content :where(h1,h2,h3){font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.2;margin:1.8em 0 .65em;letter-spacing:0}" +
    "#lectium-root .lectium-content h2{font-size:1.45em}" +
    "#lectium-root .lectium-content h3{font-size:1.2em}" +
    "#lectium-root .lectium-content img,#lectium-root .lectium-content video{max-width:100%;height:auto;border-radius:6px}" +
    "#lectium-root .lectium-content a{color:#0f766e}" +
    "#lectium-root.lectium-dark .lectium-content a{color:#5eead4}" +
    "#lectium-root .lectium-content blockquote{border-left:4px solid currentColor;padding-left:1em;opacity:.78}" +
    "#lectium-root .lectium-content pre{overflow:auto;padding:14px;border-radius:6px;background:rgba(31,41,51,.08);font-size:.86em}" +
    "#lectium-root.lectium-dark .lectium-content pre{background:rgba(229,231,235,.1)}" +
    "#lectium-root .lectium-content code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}" +
    "#lectium-root .lectium-content table{border-collapse:collapse;display:block;overflow:auto}" +
    "#lectium-root .lectium-content th,#lectium-root .lectium-content td{border:1px solid rgba(31,41,51,.18);padding:6px 8px}" +
    "#lectium-root.lectium-dark .lectium-content th,#lectium-root.lectium-dark .lectium-content td{border-color:rgba(229,231,235,.2)}" +
    "@media print{#lectium-root{position:static;background:white;color:black}.lectium-bar{display:none!important}.lectium-page{width:auto;padding:0}.lectium-content{font-size:12pt}}";

  var root = document.createElement("div");
  root.id = "lectium-root";
  root.innerHTML =
    "<div class='lectium-bar'>" +
    "<div class='lectium-brand'>Lectium</div>" +
    "<div class='lectium-src'></div>" +
    "<div class='lectium-spacer'></div>" +
    "<button class='lectium-btn lectium-smaller' title='Smaller'>A-</button>" +
    "<button class='lectium-btn lectium-larger' title='Larger'>A+</button>" +
    "<button class='lectium-btn lectium-theme' title='Theme'>◐</button>" +
    "<button class='lectium-btn lectium-print' title='Print'>⎙</button>" +
    "<button class='lectium-btn lectium-close' title='Close'>×</button>" +
    "</div>" +
    "<main class='lectium-page'>" +
    "<h1 class='lectium-title'></h1>" +
    "<div class='lectium-meta'></div>" +
    "<article class='lectium-content'></article>" +
    "</main>";

  var source = location.hostname.replace(/^www\./, "");
  root.querySelector(".lectium-src").textContent = source;
  root.querySelector(".lectium-title").textContent = getTitle() || "Untitled";
  root.querySelector(".lectium-meta").textContent = source + " · " + location.href;
  root.querySelector(".lectium-content").appendChild(article);

  function close() {
    root.remove();
    style.remove();
    document.documentElement.classList.remove("lectium-locked");
  }

  var fontSize = 19;
  var content = root.querySelector(".lectium-content");
  root.querySelector(".lectium-close").addEventListener("click", close);
  root.querySelector(".lectium-theme").addEventListener("click", function () {
    root.classList.toggle("lectium-dark");
  });
  root.querySelector(".lectium-print").addEventListener("click", function () {
    window.print();
  });
  root.querySelector(".lectium-larger").addEventListener("click", function () {
    fontSize = Math.min(26, fontSize + 1);
    content.style.setProperty("--lectium-font", fontSize + "px");
  });
  root.querySelector(".lectium-smaller").addEventListener("click", function () {
    fontSize = Math.max(15, fontSize - 1);
    content.style.setProperty("--lectium-font", fontSize + "px");
  });

  document.documentElement.classList.add("lectium-locked");
  document.head.appendChild(style);
  document.body.appendChild(root);
})();
