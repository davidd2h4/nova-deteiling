(function () {
  "use strict";

  var header = document.getElementById("header");
  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var toggleLabel = toggle ? toggle.querySelector(".sr-only") : null;
  var desktopNav = window.matchMedia("(min-width: 960px)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__list a"));
  var navSections = ["home", "services", "packages", "gallery", "about", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var serviceSelect = document.getElementById("service");
  var menuOpen = false;

  function scrollBehavior() {
    return reduceMotion ? "auto" : "smooth";
  }

  function setMenu(open) {
    if (!nav || !toggle || desktopNav.matches) return;
    menuOpen = open;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (toggleLabel) toggleLabel.textContent = open ? "Close menu" : "Open menu";
    document.body.classList.toggle("nav-open", open);
    if (open) nav.removeAttribute("inert");
    else nav.setAttribute("inert", "");
  }

  function closeMenu() {
    setMenu(false);
  }

  function syncNavMode() {
    if (!nav) return;
    if (desktopNav.matches) {
      nav.classList.remove("is-open");
      nav.removeAttribute("inert");
      document.body.classList.remove("nav-open");
      menuOpen = false;
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      if (toggleLabel) toggleLabel.textContent = "Open menu";
    } else if (!menuOpen) {
      nav.setAttribute("inert", "");
    }
  }

  function focusable(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll("a[href], button:not([disabled]), input, select, textarea")
    ).filter(function (el) {
      return !el.hasAttribute("disabled") && el.offsetParent !== null;
    });
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var next = toggle.getAttribute("aria-expanded") !== "true";
      setMenu(next);
      if (next) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!menuOpen) return;
      if (event.key === "Escape") {
        closeMenu();
        toggle.focus();
        return;
      }
      if (event.key !== "Tab") return;
      var nodes = [toggle].concat(focusable(nav));
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  if (typeof desktopNav.addEventListener === "function") {
    desktopNav.addEventListener("change", syncNavMode);
  } else if (typeof desktopNav.addListener === "function") {
    desktopNav.addListener(syncNavMode);
  }
  syncNavMode();

  function setActive(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", match);
      if (match) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    if (!navSections.length || !header) return;
    var marker = window.scrollY + header.offsetHeight + 24;
    var current = navSections[0].id;
    navSections.forEach(function (section) {
      if (section.offsetTop <= marker) current = section.id;
    });
    setActive(current);
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });
  onScroll();

  Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (link) {
    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");
      if (!href || href === "#") {
        event.preventDefault();
        return;
      }
      var target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();

      if (link.dataset.select && serviceSelect) {
        serviceSelect.value = link.dataset.select;
        clearError(serviceSelect);
      }

      var wasOpen = menuOpen;
      closeMenu();

      var run = function () {
        var top = href === "#home"
          ? 0
          : target.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) + 1;
        window.scrollTo({ top: Math.max(0, top), behavior: scrollBehavior() });
        if (history.pushState) history.pushState(null, "", href);
      };

      if (wasOpen) window.requestAnimationFrame(run);
      else run();
    });
  });

  /* Portfolio: BMW M4 before / after */
  var stage = document.getElementById("compare-stage");

  if (stage) {
    var beforeClip = document.getElementById("compare-before-clip");
    var beforeImg = document.getElementById("compare-before");
    var afterImg = document.getElementById("compare-after");
    var beforeTag = stage.querySelector(".compare__tag--before");
    var afterTag = stage.querySelector(".compare__tag--after");
    var missingNote = document.getElementById("studio-missing");
    var dragging = false;
    var frame = 0;
    var queued = null;

    function paintCompare(value) {
      var v = Math.round(Math.min(100, Math.max(0, value)));
      stage.style.setProperty("--pos", v + "%");
      if (beforeClip) beforeClip.style.clipPath = "inset(0 " + (100 - v) + "% 0 0)";
      stage.setAttribute("aria-valuenow", String(v));
      stage.setAttribute("aria-valuetext", v + " percent before detailing, " + (100 - v) + " percent after");
      if (beforeTag) beforeTag.classList.toggle("is-hidden", v < 16);
      if (afterTag) afterTag.classList.toggle("is-hidden", v > 84);
    }

    function applyCompare(value) {
      queued = value;
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        paintCompare(queued);
      });
    }

    function valueFromEvent(event) {
      var rect = stage.getBoundingClientRect();
      if (!rect.width) return 50;
      return ((event.clientX - rect.left) / rect.width) * 100;
    }

    function noteMissing(src) {
      if (!missingNote) return;
      missingNote.hidden = false;
      missingNote.textContent = "Missing image: " + src;
    }

    function watchImage(img) {
      if (!img) return;
      img.onerror = function () { noteMissing(img.getAttribute("src")); };
    }

    watchImage(beforeImg);
    watchImage(afterImg);
    paintCompare(50);


    stage.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest && event.target.closest("a, button")) return;
      dragging = true;
      try { stage.setPointerCapture(event.pointerId); } catch (error) { /* pointer capture is optional */ }
      applyCompare(valueFromEvent(event));
    });

    stage.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      applyCompare(valueFromEvent(event));
    });

    function endDrag(event) {
      if (!dragging) return;
      dragging = false;
      try {
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      } catch (error) { /* capture may already be gone */ }
    }

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    stage.addEventListener("keydown", function (event) {
      var current = Number(stage.getAttribute("aria-valuenow")) || 0;
      var next = null;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = current - 2;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next = current + 2;
      if (event.key === "PageDown") next = current - 10;
      if (event.key === "PageUp") next = current + 10;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = 100;
      if (next === null) return;
      event.preventDefault();
      applyCompare(next);
    });
  }

  /* Booking form */
  var form = document.getElementById("booking-form");
  var success = document.getElementById("booking-success");
  var successTitle = document.getElementById("success-title");
  var successDetail = document.getElementById("success-detail");
  var formAlert = document.getElementById("form-alert");
  var resetButton = document.getElementById("reset-booking");
  var dateInput = document.getElementById("date");

  function todayISO() {
    var now = new Date();
    var local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function setMinDate() {
    if (dateInput) dateInput.min = todayISO();
  }

  setMinDate();

  function fieldOf(input) {
    return input.closest(".field");
  }

  function clearError(input) {
    var field = fieldOf(input);
    if (!field) return;
    field.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    var error = document.getElementById(input.id + "-error");
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  }

  function setError(input, message) {
    var field = fieldOf(input);
    if (field) field.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    var error = document.getElementById(input.id + "-error");
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function validPhone(value) {
    var digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }

  function formatDate(value) {
    var date = new Date(value + "T00:00:00");
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  if (form) {
    Array.prototype.slice.call(form.elements).forEach(function (el) {
      if (!el.id) return;
      el.addEventListener("input", function () { clearError(el); });
      el.addEventListener("change", function () { clearError(el); });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setMinDate();

      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var email = form.email.value.trim();
      var vehicle = form.vehicle.value.trim();
      var service = form.service.value.trim();
      var date = form.date.value;
      var time = form.time.value;
      var message = form.message.value.trim();
      var errors = [];

      form.name.value = name;
      form.phone.value = phone;
      form.email.value = email;
      form.vehicle.value = vehicle;
      form.message.value = message;

      ["name", "phone", "email", "vehicle", "service", "date", "time", "message"].forEach(function (key) {
        clearError(form[key]);
      });

      if (name.length < 2) {
        setError(form.name, "Please enter your name.");
        errors.push(form.name);
      }
      if (!validPhone(phone)) {
        setError(form.phone, "Enter a valid phone number, including area code.");
        errors.push(form.phone);
      }
      if (!validEmail(email)) {
        setError(form.email, "Enter a valid email address.");
        errors.push(form.email);
      }
      if (vehicle.length < 2) {
        setError(form.vehicle, "Tell us the vehicle.");
        errors.push(form.vehicle);
      }
      if (!service) {
        setError(form.service, "Select a service.");
        errors.push(form.service);
      }
      if (!date) {
        setError(form.date, "Choose a preferred date.");
        errors.push(form.date);
      } else if (date < todayISO()) {
        setError(form.date, "Choose a date from today onward.");
        errors.push(form.date);
      }
      if (!time) {
        setError(form.time, "Choose a preferred time.");
        errors.push(form.time);
      }
      if (message.length > 1000) {
        setError(form.message, "Please keep the message under 1000 characters.");
        errors.push(form.message);
      }

      if (errors.length) {
        if (formAlert) {
          formAlert.hidden = false;
          formAlert.textContent = errors.length === 1
            ? "Please correct the highlighted field."
            : "Please correct the highlighted fields.";
        }
        errors[0].focus();
        return;
      }

      if (formAlert) {
        formAlert.hidden = true;
        formAlert.textContent = "";
      }

      if (successDetail) {
        successDetail.textContent = "Thank you, " + name + ". We have your request for " + service +
          " on your " + vehicle + ", preferred " + formatDate(date) + " at " + time +
          ". A coordinator will confirm availability by phone or email. Nothing is reserved until we reply.";
      }

      form.hidden = true;
      if (success) {
        success.hidden = false;
        if (successTitle) successTitle.focus();
      }
    });
  }

  if (resetButton && form && success) {
    resetButton.addEventListener("click", function () {
      form.reset();
      setMinDate();
      success.hidden = true;
      form.hidden = false;
      if (formAlert) {
        formAlert.hidden = true;
        formAlert.textContent = "";
      }
      form.name.focus();
    });
  }

  /* Scroll reveal */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (!reveals.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

  reveals.forEach(function (el) { observer.observe(el); });
})();
