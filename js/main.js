const intro = document.querySelector("#intro");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const introTimers = [];

function endIntro() {
  if (!intro || intro.dataset.done === "1") return;
  intro.dataset.done = "1";
  intro.classList.add("is-leaving");
  document.body.classList.remove("is-intro");
  window.setTimeout(() => intro.remove(), 700);
}

if (intro) {
  document.body.classList.add("is-intro");
  const stopIntro = () => {
    introTimers.forEach((timer) => window.clearTimeout(timer));
    endIntro();
  };
  intro.querySelector(".intro-skip").addEventListener("click", stopIntro);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") stopIntro();
  });

  if (reduce) {
    endIntro();
  } else {
    introTimers.push(
      window.setTimeout(() => intro.classList.add("is-opening"), 380),
      window.setTimeout(() => {
        intro.classList.add("is-open");
        intro.classList.remove("is-opening");
      }, 980),
      window.setTimeout(() => intro.classList.add("is-blink"), 1680),
      window.setTimeout(() => intro.classList.remove("is-blink"), 1840),
      window.setTimeout(() => intro.classList.add("is-blink"), 2320),
      window.setTimeout(() => intro.classList.remove("is-blink"), 2460),
      window.setTimeout(endIntro, 3280)
    );
  }
}

const menuBtn = document.querySelector("#menu-btn");
const navLinks = document.querySelector("#nav-links");
const modal = document.querySelector("#modal");

document.querySelector("#year").textContent = String(new Date().getFullYear());

menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.querySelector(".sr-only").textContent = open ? "Cerrar menú" : "Abrir menú";
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) navLinks.classList.remove("is-open");
});

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

modal.querySelector("#panel-demo").addEventListener("submit", (event) => {
  event.preventDefault();
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

document.querySelectorAll("[data-billing]").forEach((button) => {
  button.addEventListener("click", () => {
    const annual = button.dataset.billing === "year";
    document.querySelectorAll("[data-billing]").forEach((item) => {
      item.classList.toggle("is-on", item === button);
    });
    document.querySelectorAll(".price").forEach((price) => {
      price.querySelector("b").textContent = annual ? price.dataset.year : price.dataset.month;
    });
    document.querySelectorAll(".cycle").forEach((label) => {
      label.textContent = annual ? "Anual" : "Mensual";
    });
  });
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
    card.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.25 }
);

document.querySelectorAll(".reveal, .stat").forEach((item) => observer.observe(item));
