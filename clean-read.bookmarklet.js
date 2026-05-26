(function () {
  var existing = document.getElementById("clean-read-root");
  if (existing) {
    existing.remove();
    document.documentElement.style.overflow = "";
    return;
  }

  var noise = [
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "canvas",
    "form",
    "button",
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
    ".ad",
    ".ads",
    ".advert",
    ".advertisement",
    ".banner",
    ".cookie",
    ".modal",
    ".newsletter",
    ".overlay",
    ".paywall",
    ".promo",
    ".recommend",
    ".related",
    ".share",
    ".sidebar",
    ".social",
    ".subscribe"
  ].join(",");

  function textLength(node) {
    return (node && node.innerText ? node.innerText.replace(/\s+/g, " ").trim() : "").length;
  }

  function scoreNode(node) {
    var paragraphs = Array.prototype.slice.call(node.querySelectorAll("p"));
    var paragraphText = paragraphs.reduce(function (sum, p) {
      var length = textLength(p);
      return sum + (length > 40 ? length : 0);
    }, 0);
    var media = node.querySelectorAll("img,figure,table,pre,blockquote").length;
    var links = node.querySelectorAll("a").length;
    var text = Math.max(textLength(node), 1);
    var linkText = Array.prototype.slice.call(node.querySelectorAll("a")).reduce(function (sum, a) {
      return sum + textLength(a);
    }, 0);
    var linkPenalty = linkText / text;
    return paragraphText + media * 80 - links * 6 - linkPenalty * 700;
  }

  function findArticle() {
    var preferred = Array.prototype.slice.call(
      document.querySelectorAll("article, main, [role='main'], .article, .post, .entry-content, .post-content, .content")
    ).filter(function (node) {
      return textLength(node) > 300;
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

  function clean(node) {
    Array.prototype.slice.call(node.querySelectorAll(noise)).forEach(function (el) {
      el.remove();
    });
    Array.prototype.slice.call(node.querySelectorAll("*")).forEach(function (el) {
      el.removeAttribute("style");
      el.removeAttribute("class");
      el.removeAttribute("id");
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      });
    });
    Array.prototype.slice.call(node.querySelectorAll("p,li,blockquote,figcaption")).forEach(function (el) {
      if (textLength(el) === 0 && el.querySelectorAll("img,video,audio,iframe").length === 0) {
        el.remove();
      }
    });
    absolutize(node);
  }

  function getTitle() {
    var headline = document.querySelector("h1");
    return textLength(headline) > 0 ? headline.innerText.trim() : document.title.replace(/\s+[|-]\s+.*$/, "").trim();
  }

  var article = findArticle().cloneNode(true);
  clean(article);

  var root = document.createElement("div");
  root.id = "clean-read-root";
  var shadow = root.attachShadow({ mode: "open" });
  var title = getTitle();
  var source = location.hostname.replace(/^www\./, "");

  shadow.innerHTML =
    "<style>" +
    ":host{all:initial}.wrap{position:fixed;inset:0;z-index:2147483647;background:#f7f4ec;color:#1f2933;font-family:ui-serif,Georgia,Cambria,Times New Roman,serif;overflow:auto}.dark{background:#111827;color:#e5e7eb}.bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(247,244,236,.94);border-bottom:1px solid rgba(31,41,51,.14);backdrop-filter:blur(12px);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}.dark .bar{background:rgba(17,24,39,.94);border-color:rgba(229,231,235,.16)}.spacer{flex:1}.brand{font-size:13px;font-weight:700;letter-spacing:0;color:inherit}.src{font-size:12px;opacity:.65;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.btn{appearance:none;border:1px solid rgba(31,41,51,.2);background:transparent;color:inherit;border-radius:6px;width:34px;height:32px;display:inline-grid;place-items:center;font:600 15px ui-sans-serif,system-ui;cursor:pointer}.dark .btn{border-color:rgba(229,231,235,.24)}.btn:hover{background:rgba(31,41,51,.08)}.dark .btn:hover{background:rgba(229,231,235,.1)}.page{box-sizing:border-box;width:min(760px,100%);margin:0 auto;padding:34px 22px 80px}.title{font-size:clamp(30px,5vw,48px);line-height:1.08;margin:0 0 10px;font-weight:800;letter-spacing:0}.meta{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:13px;color:inherit;opacity:.58;margin:0 0 28px}.content{font-size:var(--cr-font,19px);line-height:1.76}.content :where(p,ul,ol,blockquote,pre,table,figure){margin:0 0 1.15em}.content :where(h1,h2,h3){font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.2;margin:1.8em 0 .65em;letter-spacing:0}.content h2{font-size:1.45em}.content h3{font-size:1.2em}.content img,.content video{max-width:100%;height:auto;border-radius:6px}.content a{color:#0f766e}.dark .content a{color:#5eead4}.content blockquote{border-left:4px solid currentColor;padding-left:1em;opacity:.78}.content pre{overflow:auto;padding:14px;border-radius:6px;background:rgba(31,41,51,.08);font-size:.86em}.dark .content pre{background:rgba(229,231,235,.1)}.content code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.content table{border-collapse:collapse;display:block;overflow:auto}.content th,.content td{border:1px solid rgba(31,41,51,.18);padding:6px 8px}.dark .content th,.dark .content td{border-color:rgba(229,231,235,.2)}@media print{.wrap{position:static;background:white;color:black}.bar{display:none}.page{width:auto;padding:0}.content{font-size:12pt}}" +
    "</style>" +
    "<div class='wrap'><div class='bar'><div class='brand'>Lectium</div><div class='src'>" +
    source +
    "</div><div class='spacer'></div><button class='btn smaller' title='Smaller'>A-</button><button class='btn larger' title='Larger'>A+</button><button class='btn theme' title='Theme'>◐</button><button class='btn print' title='Print'>⎙</button><button class='btn close' title='Close'>×</button></div><main class='page'><h1 class='title'></h1><div class='meta'></div><article class='content'></article></main></div>";

  shadow.querySelector(".title").textContent = title || "Untitled";
  shadow.querySelector(".meta").textContent = source + " · " + location.href;
  shadow.querySelector(".content").appendChild(article);

  var wrap = shadow.querySelector(".wrap");
  var content = shadow.querySelector(".content");
  var fontSize = 19;
  shadow.querySelector(".close").addEventListener("click", function () {
    root.remove();
    document.documentElement.style.overflow = "";
  });
  shadow.querySelector(".theme").addEventListener("click", function () {
    wrap.classList.toggle("dark");
  });
  shadow.querySelector(".print").addEventListener("click", function () {
    window.print();
  });
  shadow.querySelector(".larger").addEventListener("click", function () {
    fontSize = Math.min(26, fontSize + 1);
    content.style.setProperty("--cr-font", fontSize + "px");
  });
  shadow.querySelector(".smaller").addEventListener("click", function () {
    fontSize = Math.max(15, fontSize - 1);
    content.style.setProperty("--cr-font", fontSize + "px");
  });

  document.documentElement.style.overflow = "hidden";
  document.body.appendChild(root);
})();
