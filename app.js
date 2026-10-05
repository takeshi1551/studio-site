(function () {
  var S = window.STUDIO;
  if (!S) return;

  var $ = function (id) { return document.getElementById(id); };
  var make = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js");

  // Заголовок, цвет, главное фото
  document.title = S.name;
  document.documentElement.style.setProperty("--accent", S.accent || "#4690ff");
  if (S.hero) $("hero-bg").style.backgroundImage = "url('" + S.hero + "')";
  // Название по словам, чтобы каждое слово появлялось по очереди
  S.name.split(" ").forEach(function (word, i, arr) {
    var w = make("span", "w", word);
    w.style.setProperty("--i", i);
    $("name").appendChild(w);
    if (i < arr.length - 1) $("name").appendChild(document.createTextNode(" "));
  });
  $("tagline").textContent = S.tagline;

  // Три карточки
  (S.facts || []).forEach(function (f) {
    var d = make("div", "fact");
    d.appendChild(make("b", "", f.title));
    d.appendChild(make("span", "", f.text));
    $("facts").appendChild(d);
  });

  // Услуги
  (S.services || []).forEach(function (s) {
    var row = make("div", "svc");
    var left = make("div");
    left.appendChild(make("div", "svc-name", s.name));
    if (s.note) left.appendChild(make("div", "svc-meta", s.note));
    var right = make("div", "svc-side");
    right.appendChild(make("div", "svc-price", s.price));
    if (s.duration) right.appendChild(make("div", "svc-time", s.duration));
    row.appendChild(left);
    row.appendChild(right);
    $("services-list").appendChild(row);
  });

  // Работы
  (S.works || []).forEach(function (w) {
    var fig = make("figure");
    var img = make("img");
    img.src = w.src;
    img.alt = w.caption || "";
    img.loading = "lazy";
    fig.appendChild(img);
    if (w.caption) fig.appendChild(make("figcaption", "", w.caption));
    $("gallery").appendChild(fig);
  });
  if (!(S.works || []).length) $("works").hidden = true;

  // Контакты
  $("address").textContent = S.address || "";
  (S.hours || []).forEach(function (h) {
    $("hours").appendChild(make("dt", "", h.days));
    $("hours").appendChild(make("dd", "", h.time));
  });
  var tel = "tel:" + (S.phone || "");
  $("call").href = tel;
  $("call").textContent = "Зателефонувати " + (S.phoneText || "");
  $("book-call").href = tel;
  $("tg").href = S.telegram || "#";
  $("book-tg").href = S.telegram || "#";
  if (S.mapUrl) $("map").href = S.mapUrl; else $("map").hidden = true;
  if (!S.telegram) { $("tg").hidden = true; $("book-tg").hidden = true; }
  if (S.demo) $("demo-note").hidden = false;

  // Сравнение «до / после»
  if (S.compare && S.compare.before && S.compare.after) {
    $("compare").hidden = false;
    $("ba-before").src = S.compare.before;
    $("ba-after").src = S.compare.after;
    $("ba-cap").textContent = S.compare.caption || "";
    var ba = $("ba");
    var range = $("ba-range");
    var setPos = function (v) { ba.style.setProperty("--pos", v + "%"); };
    var touched = false;
    range.addEventListener("input", function () { touched = true; setPos(range.value); });
    // Один раз показываем, что слайдер двигается
    if (!reduced && "IntersectionObserver" in window) {
      var hint = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        hint.disconnect();
        var t0 = null, dur = 1500;
        (function step(t) {
          if (touched) return;
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var v = 50 + 28 * Math.sin(p * Math.PI * 2) * (1 - p * 0.3);
          range.value = v; setPos(v);
          if (p < 1) requestAnimationFrame(step); else { range.value = 50; setPos(50); }
        })(performance.now());
      }, { threshold: 0.6 });
      hint.observe(ba);
    }
  }

  // Параллакс главного фото и блик на стеклянной кнопке
  var heroBg = $("hero-bg");
  var hero = $("home");
  if (!reduced) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < hero.offsetHeight) heroBg.style.transform = "translate3d(0," + (y * 0.28).toFixed(1) + "px,0)";
        ticking = false;
      });
    }, { passive: true });
  }
  var glass = $("book-open");
  function moveGlow(e) {
    var r = glass.getBoundingClientRect();
    glass.style.setProperty("--mx", (e.clientX - r.left) + "px");
    glass.style.setProperty("--my", (e.clientY - r.top) + "px");
  }
  glass.addEventListener("pointermove", moveGlow);
  glass.addEventListener("pointerdown", moveGlow);
  glass.addEventListener("pointerleave", function () {
    glass.style.removeProperty("--mx"); glass.style.removeProperty("--my");
  });

  // Нижние окна
  var book = $("book");
  var ios = $("ios");
  $("book-open").addEventListener("click", function () { book.showModal(); });
  [book, ios].forEach(function (dlg) {
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || (e.target.hasAttribute && e.target.hasAttribute("data-close"))) dlg.close();
    });
  });

  // Появление разделов при прокрутке
  var reveals = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (r) { r.classList.add("in"); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    reveals.forEach(function (r) { ro.observe(r); });
  }

  // Подсветка текущего раздела в нижней панели
  var tabs = document.querySelectorAll(".tabbar a");
  var map = { home: "home", about: "services", services: "services", compare: "services", works: "services", contacts: "contacts" };
  function setTab(name) {
    tabs.forEach(function (a) {
      a.setAttribute("aria-current", a.getAttribute("data-tab") === name ? "true" : "false");
    });
  }
  if ("IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setTab(map[en.target.id] || "home");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["home", "about", "services", "compare", "works", "contacts"].forEach(function (id) { so.observe($(id)); });
  }

  // Установка на главный экран
  var installBtn = $("install");
  var deferred = null;
  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (!standalone) {
    if (isIOS) installBtn.hidden = false;
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
      installBtn.hidden = false;
    });
    installBtn.addEventListener("click", function () {
      if (deferred) {
        deferred.prompt();
        deferred.userChoice.then(function () { deferred = null; installBtn.hidden = true; });
      } else {
        ios.showModal();
      }
    });
    window.addEventListener("appinstalled", function () { installBtn.hidden = true; });
  }

  // Работа без сети
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
