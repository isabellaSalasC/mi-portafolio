/* ═══════════════════════════════════════════════════════════════════
   main.js — Lógica del portafolio y Sistema de Notificaciones por Email
   ═══════════════════════════════════════════════════════════════════

   ARQUITECTURA DEL SISTEMA DE NOTIFICACIONES:
   ┌─────────────────────────────────────────────────────────────┐
   │  Usuario llena el formulario                                 │
   │        ↓                                                     │
   │  JavaScript captura el evento "submit"                       │
   │        ↓                                                     │
   │  Validación del lado del cliente                             │
   │        ↓                                                     │
   │  emailjs.sendForm() → llamada a la API de EmailJS            │
   │        ↓                                                     │
   │  Servidor de EmailJS envía el email (usando Gmail/Outlook)   │
   │        ↓                                                     │
   │  El dueño del portafolio recibe la notificación en su email  │
   └─────────────────────────────────────────────────────────────┘

   CONFIGURACIÓN NECESARIA (ver README.md para el paso a paso):
   1. Crea una cuenta gratuita en https://www.emailjs.com
   2. Conecta un servicio de email (Gmail, Outlook, etc.)
   3. Crea un template de email
   4. Reemplaza las 3 constantes de abajo con tus credenciales
   ═══════════════════════════════════════════════════════════════ */


/* ─── ★ CONFIGURACIÓN DE EMAILJS ───────────────────────────────────
   Las credenciales viven en js/config.js (que está en .gitignore).

   FLUJO DE SEGURIDAD:
   • Local:       creas js/config.js manualmente desde config.example.js
   • Producción:  GitHub Actions genera js/config.js desde los Secrets
                  del repositorio antes de desplegar → nunca se commitea

   ⚠️  IMPORTANTE: aunque config.js no está en el repo, los valores
   SÍ son visibles en el JS que GitHub Pages sirve al navegador.
   Por eso también debes configurar el Allowlist de dominios en EmailJS
   (Account → Security → Allowed Origins → tu dominio de GitHub Pages).
   Las dos capas juntas dan la protección máxima para un sitio estático.
   ─────────────────────────────────────────────────────────────── */
// EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID y EMAILJS_TEMPLATE_ID
// son declaradas en js/config.js (cargado antes que este script en index.html)


/* ─── INICIALIZACIÓN ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Inicializa EmailJS con tu clave pública.
  // Esto autentica las llamadas a la API sin exponer una clave privada.
  emailjs.init(EMAILJS_PUBLIC_KEY);

  initTypingEffect();
  initScrollReveal();
  initActiveNav();
  initMobileMenu();
  initContactForm();

});


/* ─── EFECTO DE TIPEO EN EL HERO ────────────────────────────────── */
function initTypingEffect() {
  const element  = document.getElementById('typed-text');
  const words    = ['Frontend', 'Backend', 'Fullstack', 'Móvil'];
  let   wordIdx  = 0;
  let   charIdx  = 0;
  let   deleting = false;

  function type() {
    const current = words[wordIdx];

    if (deleting) {
      element.textContent = current.substring(0, charIdx--);
    } else {
      element.textContent = current.substring(0, charIdx++);
    }

    if (!deleting && charIdx === current.length + 1) {
      deleting = true;
      setTimeout(type, 1800); // pausa antes de borrar
      return;
    }

    if (deleting && charIdx === 0) {
      deleting = false;
      wordIdx = (wordIdx + 1) % words.length;
    }

    setTimeout(type, deleting ? 60 : 100);
  }

  type();
}


/* ─── REVEAL ON SCROLL (Intersection Observer) ──────────────────── */
function initScrollReveal() {
  // Agrega clase .reveal a las secciones para animar su entrada
  document.querySelectorAll('section').forEach(section => {
    section.classList.add('reveal');
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}


/* ─── NAVBAR ACTIVO AL HACER SCROLL ─────────────────────────────── */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    sections.forEach(section => {
      const top    = section.offsetTop - 100;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  });
}


/* ─── MENÚ MÓVIL ─────────────────────────────────────────────────── */
function initMobileMenu() {
  const btn  = document.getElementById('menu-btn');
  const menu = document.getElementById('mobile-menu');

  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  // Cierra el menú al hacer clic en un enlace
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });
}


/* ═══════════════════════════════════════════════════════════════════
   ★ SISTEMA DE NOTIFICACIONES — FORMULARIO DE CONTACTO
   ═══════════════════════════════════════════════════════════════════

   Este es el corazón del laboratorio.
   Paso a paso:
   1. El usuario completa el formulario y presiona "Enviar".
   2. Se validan los campos (cliente-side).
   3. Se llama a emailjs.sendForm() con el ID del servicio y template.
   4. EmailJS recibe los datos, aplica el template, y envía el email.
   5. El dueño del portafolio recibe la notificación en su bandeja.
   ═══════════════════════════════════════════════════════════════ */
function initContactForm() {
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('submit-btn');
  const btnText    = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');
  const alertOk    = document.getElementById('alert-success');
  const alertErr   = document.getElementById('alert-error');

  form.addEventListener('submit', async (event) => {
    // Previene el comportamiento nativo del formulario (recargar la página)
    event.preventDefault();

    // PASO 1: Validar campos antes de enviar
    if (!validateForm(form)) return;

    // PASO 2: Mostrar estado de carga en el botón
    setLoading(true, submitBtn, btnText, btnSpinner);
    hideAlerts(alertOk, alertErr);

    try {
      /* PASO 3: Llamar a la API de EmailJS
         - EMAILJS_SERVICE_ID  → qué proveedor de email usar (Gmail, Outlook…)
         - EMAILJS_TEMPLATE_ID → qué plantilla de email usar
         - form                → el formulario HTML cuyos campos se mapean al template

         EmailJS lee los atributos "name" de cada campo del formulario:
           name="from_name"  → {{from_name}} en el template
           name="from_email" → {{from_email}} en el template
           name="message"    → {{message}} en el template
      */
      await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);

      // PASO 4: Notificación enviada exitosamente
      console.log('✅ Notificación enviada correctamente');
      alertOk.classList.add('visible');
      form.reset(); // Limpia el formulario

    } catch (error) {
      // PASO 5: Algo falló (credenciales incorrectas, sin internet, etc.)
      console.error('Error al enviar notificación:', error);
      alertErr.classList.add('visible');
      alertErr.textContent = `Error (${error.status}): ${error.text || 'Revisa tus credenciales de EmailJS.'}`;

    } finally {
      // Siempre restaurar el botón, sin importar si hubo éxito o error
      setLoading(false, submitBtn, btnText, btnSpinner);

      // Ocultar alertas después de 6 segundos
      setTimeout(() => hideAlerts(alertOk, alertErr), 6000);
    }
  });
}


/* ─── VALIDACIÓN DEL FORMULARIO ─────────────────────────────────── */
function validateForm(form) {
  let isValid = true;

  form.querySelectorAll('[required]').forEach(field => {
    const errorEl = field.nextElementSibling;
    const empty   = field.value.trim() === '';
    const badEmail = field.type === 'email' && !isValidEmail(field.value);

    const hasError = empty || badEmail;

    field.classList.toggle('error', hasError);
    if (errorEl && errorEl.classList.contains('field-error')) {
      errorEl.classList.toggle('visible', hasError);
    }

    if (hasError) isValid = false;
  });

  return isValid;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* ─── HELPERS DE UI ──────────────────────────────────────────────── */
function setLoading(loading, btn, text, spinner) {
  btn.disabled = loading;
  text.textContent = loading ? 'Enviando...' : 'Enviar mensaje';
  spinner.classList.toggle('visible', loading);
}

function hideAlerts(...alerts) {
  alerts.forEach(el => el.classList.remove('visible'));
}
