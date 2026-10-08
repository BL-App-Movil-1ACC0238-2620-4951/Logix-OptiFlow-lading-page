const intro = document.querySelector("#intro");
const introVideo = document.querySelector("#intro-video");
const introVideoCanvas = document.querySelector("#intro-video-canvas");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const introTimers = [];
const INTRO_BLINK_MS = 1400;
let introVideoFrame = 0;

function stopIntroVideoRender() {
  if (introVideoFrame) {
    cancelAnimationFrame(introVideoFrame);
    introVideoFrame = 0;
  }
}

function endIntro() {
  if (!intro || intro.dataset.done === "1") return;
  intro.dataset.done = "1";
  stopIntroVideoRender();
  if (introVideo) introVideo.pause();
  intro.classList.add("is-leaving");
  document.body.classList.remove("is-intro");
  startPageMotion();
  window.setTimeout(() => intro.remove(), 700);
}

function clearIntroTimers() {
  introTimers.forEach((timer) => window.clearTimeout(timer));
  introTimers.length = 0;
}

function queueIntroTimer(fn, delay) {
  introTimers.push(window.setTimeout(fn, delay));
}

function showIntroFallbackFrames() {
  if (!intro) return;
  const fallback = intro.querySelector(".intro-frame-fallback");
  const stage = intro.querySelector(".intro-video-stage");
  if (stage) stage.hidden = true;
  if (fallback) fallback.hidden = false;

  queueIntroTimer(() => intro.classList.add("is-half"), 420);
  queueIntroTimer(() => {
    intro.classList.remove("is-half");
    intro.classList.add("is-opening");
  }, 920);
  queueIntroTimer(() => {
    intro.classList.add("is-open");
    intro.classList.remove("is-opening");
  }, 1520);
  queueIntroTimer(() => intro.classList.add("is-blink-sequence"), 2080);
  queueIntroTimer(() => intro.classList.remove("is-blink-sequence"), 2080 + INTRO_BLINK_MS);
  queueIntroTimer(endIntro, 2080 + INTRO_BLINK_MS + 480);
}

function finishIntroVideo() {
  if (!intro || intro.dataset.done === "1" || intro.dataset.finishing === "1") return;
  intro.dataset.finishing = "1";
  stopIntroVideoRender();
  intro.classList.add("is-open", "is-video-ending");
  queueIntroTimer(endIntro, 460);
}

function introPlateMatte(r, g, b) {
  if (b > 215 && g > 145 && r < 185 && b > g + 20 && g > r - 8 && b - r > 60) return 1;
  if (r > 188 && g > 205) return 0;
  if (b > 200 && g > 130 && r < 198 && b > g + 10 && b - r > 42) {
    return Math.min(0.9, Math.max(0, (b - r - 42) / 36));
  }
  return 0;
}

function paintIntroVideoFrame() {
  if (!introVideo || !introVideoCanvas || intro?.dataset.done === "1") return;
  const ctx = introVideoCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || introVideo.readyState < 2) return;

  const width = introVideo.videoWidth;
  const height = introVideo.videoHeight;
  if (!width || !height) return;

  if (introVideoCanvas.width !== width || introVideoCanvas.height !== height) {
    introVideoCanvas.width = width;
    introVideoCanvas.height = height;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(introVideo, 0, 0, width, height);

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;

  for (let i = 0; i < data.length; i += 4) {
    const matte = introPlateMatte(data[i], data[i + 1], data[i + 2]);
    if (matte <= 0) continue;
    data[i + 3] = matte >= 1 ? 0 : Math.round(255 * (1 - matte));
  }

  ctx.putImageData(image, 0, 0);
}

function loopIntroVideoRender() {
  paintIntroVideoFrame();
  if (!introVideo || introVideo.ended || intro?.dataset.done === "1") return;
  introVideoFrame = requestAnimationFrame(loopIntroVideoRender);
}

function startIntroVideoRender() {
  stopIntroVideoRender();
  loopIntroVideoRender();
}

function startIntroVideo() {
  if (!intro || !introVideo || !introVideoCanvas) {
    showIntroFallbackFrames();
    return;
  }

  intro.classList.add("is-playing");

  const onTimeUpdate = () => {
    const duration = introVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    if (introVideo.currentTime / duration > 0.5) intro.classList.add("is-open");
  };

  const beginPlayback = () => {
    intro.classList.add("is-video-visible");
    introVideo.addEventListener("timeupdate", onTimeUpdate);
    introVideo.addEventListener("ended", finishIntroVideo, { once: true });

    const playPromise = introVideo.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => startIntroVideoRender())
        .catch(() => {
          introVideo.removeEventListener("timeupdate", onTimeUpdate);
          stopIntroVideoRender();
          clearIntroTimers();
          intro.classList.remove("is-playing", "is-video-visible");
          showIntroFallbackFrames();
        });
    } else {
      startIntroVideoRender();
    }

    const durationMs = Number.isFinite(introVideo.duration)
      ? introVideo.duration * 1000
      : 8200;
    queueIntroTimer(() => {
      if (intro.dataset.done !== "1") finishIntroVideo();
    }, durationMs + 900);
  };

  if (introVideo.readyState >= 1) beginPlayback();
  else introVideo.addEventListener("loadedmetadata", beginPlayback, { once: true });
}

if (intro) {
  document.body.classList.add("is-intro");
  const stopIntro = () => {
    clearIntroTimers();
    endIntro();
  };
  intro.querySelector(".intro-skip").addEventListener("click", stopIntro);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") stopIntro();
  });

  if (reduce) {
    endIntro();
  } else {
    startIntroVideo();
  }
}

const menuBtn = document.querySelector("#menu-btn");
const navLinks = document.querySelector("#nav-links");
const modal = document.querySelector("#modal");

document.querySelector("#year").textContent = String(new Date().getFullYear());

function setMenuOpen(open) {
  navLinks.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.querySelector(".sr-only").textContent = open ? "Cerrar menú" : "Abrir menú";
}

menuBtn.addEventListener("click", () => {
  setMenuOpen(!navLinks.classList.contains("is-open"));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a, button")) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
    setMenuOpen(false);
    menuBtn.focus();
  }
});

const sectionLinks = Array.from(navLinks.querySelectorAll('a[href^="#"]'));
const navigationSections = Array.from(document.querySelectorAll("main section"))
  .map((section) => ({
    section,
    // Introductory blocks without an anchor belong to Inicio.
    link: sectionLinks.find((link) => link.getAttribute("href") === "#" + (section.id || "inicio"))
  }));

let selectedNavigationLink = null;
let navigationEndTimer = 0;

function markNavigationLink(activeLink) {
  sectionLinks.forEach((link) => {
    if (link === activeLink) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function finishNavigationScroll() {
  window.clearTimeout(navigationEndTimer);
  selectedNavigationLink = null;
  queueNavigationUpdate();
}

function waitForNavigationEnd() {
  window.clearTimeout(navigationEndTimer);
  // Fallback for browsers without scrollend, including a click on the current section.
  navigationEndTimer = window.setTimeout(finishNavigationScroll, 180);
}

document.addEventListener("click", (event) => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = sectionLinks.find((item) => item.getAttribute("href") === anchor.getAttribute("href"));
  if (!link) return;
  selectedNavigationLink = link;
  markNavigationLink(link);
  waitForNavigationEnd();
});

// Manual input interrupts the selected destination and resumes section tracking.
window.addEventListener("wheel", finishNavigationScroll, { passive: true });
window.addEventListener("touchstart", finishNavigationScroll, { passive: true });
document.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) finishNavigationScroll();
});
window.addEventListener("scrollend", finishNavigationScroll);

function updateActiveSection() {
  if (!navigationSections.length) return;
  if (selectedNavigationLink) {
    markNavigationLink(selectedNavigationLink);
    return;
  }
  const headerBottom = document.querySelector(".nav").getBoundingClientRect().bottom;
  const marker = headerBottom + Math.min(140, Math.max(24, (window.innerHeight - headerBottom) * 0.2));
  let current = navigationSections[0];

  // Follow document order, even when the menu lists prices before benefits.
  navigationSections.forEach((item) => {
    if (item.section.getBoundingClientRect().top <= marker) current = item;
  });

  // The last section may be too short to reach the top of the viewport.
  if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    current = navigationSections[navigationSections.length - 1];
  }

  markNavigationLink(current.link);
}

let navigationFrame = 0;
function queueNavigationUpdate() {
  if (navigationFrame) return;
  navigationFrame = requestAnimationFrame(() => {
    navigationFrame = 0;
    updateActiveSection();
  });
}

window.addEventListener("scroll", () => {
  if (selectedNavigationLink) waitForNavigationEnd();
  queueNavigationUpdate();
}, { passive: true });
window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 861px)").matches) setMenuOpen(false);
  queueNavigationUpdate();
});
window.addEventListener("load", queueNavigationUpdate);
window.addEventListener("pageshow", queueNavigationUpdate);
window.addEventListener("hashchange", queueNavigationUpdate);
updateActiveSection();

function openModal(name) {
  modal.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== name;
  });
  if (typeof modal.showModal === "function" && !modal.open) modal.showModal();
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.open));
});

modal.addEventListener("click", (event) => {
  if (event.target === modal || event.target.closest("[data-close]")) modal.close();
});

const demoForm = modal.querySelector("#panel-demo");
const demoFields = Array.from(demoForm.querySelectorAll("input[required]"));
const touchedDemoFields = new Set();

// Use inline messages while retaining native validation when JavaScript is unavailable.
demoForm.noValidate = true;

function getDemoFieldError(field) {
  const value = field.value.trim();
  if (!value) {
    const requiredMessages = {
      nombre: "Escribe tu nombre; no puede contener solo espacios.",
      optica: "Escribe el nombre de tu óptica; no puede contener solo espacios.",
      whatsapp: "Ingresa tu número de WhatsApp.",
      correo: "Ingresa tu correo de contacto."
    };
    return requiredMessages[field.name];
  }
  if (field.name === "whatsapp") {
    const number = value.replace(/[\s()-]/g, "");
    if (!/^(\+51)?9\d{8}$/.test(number)) {
      return "Usa 9 dígitos que comiencen con 9, con +51 opcional. Ej.: 987 654 321.";
    }
  }
  if (field.name === "correo" && field.validity.typeMismatch) {
    return "Ingresa un correo válido. Ej.: ana@correo.com.";
  }
  return "";
}

function validateDemoField(field) {
  const message = getDemoFieldError(field);
  const error = document.querySelector("#demo-" + field.name + "-error");
  error.textContent = message;
  error.hidden = !message;
  if (message) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
  return !message;
}

demoFields.forEach((field) => {
  field.addEventListener("blur", () => {
    touchedDemoFields.add(field);
    validateDemoField(field);
  });
  field.addEventListener("input", () => {
    if (touchedDemoFields.has(field)) validateDemoField(field);
  });
});

demoForm.addEventListener("reset", () => {
  touchedDemoFields.clear();
  demoFields.forEach((field) => {
    field.removeAttribute("aria-invalid");
    const error = document.querySelector("#demo-" + field.name + "-error");
    error.textContent = "";
    error.hidden = true;
  });
});

demoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const invalidFields = demoFields.filter((field) => {
    touchedDemoFields.add(field);
    return !validateDemoField(field);
  });
  if (invalidFields.length) {
    invalidFields[0].focus();
    return;
  }
  document.querySelector("#done-text").textContent =
    "Listo. Esta pantalla confirma la solicitud, pero la landing todavía no la envía a un servidor. Cuando el canal comercial quede conectado, estos mismos datos llegarán al equipo de OptiFlow.";
  openModal("done");
  event.target.reset();
});

modal.querySelector("#panel-login").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#done-text").textContent =
    "Este acceso todavía no valida contraseñas: la landing no está conectada al sistema. Solicita la demo y te abrimos el entorno de tu óptica.";
  openModal("done");
  event.target.reset();
});

document.querySelectorAll(".stars").forEach((holder) => {
  const count = Number(holder.dataset.stars);
  holder.setAttribute("aria-label", `${count} de 5 estrellas`);
  holder.textContent = "★★★★★".slice(0, count) + "☆☆☆☆☆".slice(0, 5 - count);
});

document.querySelectorAll(".tilt").forEach((card) => {
  if (reduce) return;
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const lift = card.classList.contains("plan-hot") && window.matchMedia("(min-width: 980px)").matches
      ? -16
      : -4;
    card.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(${lift}px)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

document.querySelectorAll(".stat").forEach((stat) => {
  const percent = Number(stat.style.getPropertyValue("--p") || "0");
  const circle = stat.querySelector(".value");
  if (!circle) return;
  const length = 2 * Math.PI * 42;
  circle.style.strokeDasharray = String(length);
  circle.style.strokeDashoffset = reduce
    ? String(length - (length * percent) / 100)
    : String(length);
});

let pageMotionStarted = false;

function motionNodes() {
  return document.querySelectorAll(
    ".visual h1, .hero-card, .center, .stat, .split .card, .banner, .benefit, .plan, .member, .review, .cta"
  );
}

function startPageMotion() {
  if (pageMotionStarted) return;
  pageMotionStarted = true;
  const targets = motionNodes();

  if (reduce) {
    targets.forEach((el) => {
      el.classList.add("is-visible", "is-in");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.classList.contains("stat")) {
          entry.target.classList.add("is-in");
        }
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -10% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

if (!reduce) motionNodes().forEach((el) => el.classList.add("reveal"));
if (!intro) startPageMotion();
