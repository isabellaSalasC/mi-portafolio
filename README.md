# Laboratorio: Sistema de Notificaciones por Email
## Portafolio con formulario de contacto → EmailJS → Notificación al dueño

---

## ¿Qué vas a aprender?

- Cómo funciona un **sistema de notificaciones por email**
- Integración con una **API de terceros** (EmailJS) desde el frontend
- Programación **orientada a eventos** en JavaScript (event listeners)
- Manejo de **estados asíncronos** con `async/await`
- Despliegue de un sitio estático en **GitHub Pages**

---

## Arquitectura del sistema

```
[Usuario] → llena el form → [JavaScript] → llama a [EmailJS API]
                                                       ↓
                               [Servidor de EmailJS] envía el email
                                                       ↓
                              [Dueño del portafolio] recibe notificación
```

> EmailJS actúa como intermediario: recibe los datos del formulario
> y los entrega al servidor de correo (Gmail, Outlook, etc.)
> **sin necesidad de un backend propio**.

---

## Paso 1 — Configurar EmailJS (5 min)

### 1.1 Crear cuenta
1. Ve a [https://www.emailjs.com](https://www.emailjs.com) y regístrate (gratis)
2. El plan gratuito permite **200 emails/mes** — más que suficiente para el lab

### 1.2 Conectar un servicio de email
1. En el dashboard, ve a **Email Services → Add New Service**
2. Elige **Gmail** (recomendado para el lab)
3. Conecta tu cuenta de Google cuando te lo pida
4. Copia el **Service ID** (ejemplo: `service_abc123`)

### 1.3 Crear un template de email
1. Ve a **Email Templates → Create New Template**
2. Configura el template así:

| Campo | Valor |
|-------|-------|
| **To Email** | tu-email@gmail.com (el que recibirá las notificaciones) |
| **From Name** | `{{from_name}}` |
| **Reply To** | `{{from_email}}` |
| **Subject** | `Nuevo mensaje: {{subject}}` |

**Body del email:**
```
Hola, tienes un nuevo mensaje desde tu portafolio.

Nombre:  {{from_name}}
Email:   {{from_email}}
Asunto:  {{subject}}

Mensaje:
{{message}}

---
Enviado desde tu portafolio web.
```

3. Guarda y copia el **Template ID** (ejemplo: `template_xyz789`)

### 1.4 Obtener tu Public Key
1. Ve a **Account → API Keys**
2. Copia tu **Public Key** (ejemplo: `aBcDeFgHiJkLmNoP`)

### 1.5 Configurar el Allowlist de dominios (paso de seguridad obligatorio)

La Public Key vive en el JavaScript del frontend, así que **cualquiera puede verla**
inspeccionando el código. Sin protección, alguien podría copiarla y enviar emails
usando tu cuenta.

**Solución:** restringir qué dominios pueden usar tu key.

1. En el dashboard de EmailJS ve a **Account → Security**
2. En **Allowed Origins**, agrega únicamente tu dominio de GitHub Pages:
   ```
   https://TU_USUARIO.github.io
   ```
3. Guarda. A partir de ese momento, cualquier petición desde otro origen
   será rechazada automáticamente por EmailJS.

> Mientras desarrollas localmente (abriendo el `.html` desde el disco),
> EmailJS no valida origen. Solo agrega el dominio de producción cuando
> hagas el deploy a GitHub Pages.

---

## Paso 2 — Configurar credenciales

### Para desarrollo local

Las credenciales **nunca se escriben directamente en el código**. En su lugar:

1. Copia el archivo de ejemplo:
   ```bash
   cp js/config.example.js js/config.js
   ```
2. Abre `js/config.js` y reemplaza los valores:
   ```javascript
   const EMAILJS_PUBLIC_KEY  = 'aBcDeFgHiJkLmNoP';
   const EMAILJS_SERVICE_ID  = 'service_abc123';
   const EMAILJS_TEMPLATE_ID = 'template_xyz789';
   ```
3. `js/config.js` está en `.gitignore` → **nunca se sube al repositorio**

### Para producción (GitHub Actions hace esto automáticamente)

Los valores se guardan como Secrets en GitHub y el pipeline los inyecta
en `js/config.js` durante el despliegue, sin que aparezcan en el código:

```
Secrets (GitHub) → GitHub Actions → genera config.js → despliega en Pages
```

> **¿Qué protege esto exactamente?**
> - Las credenciales **no aparecen en el historial de git**
> - Si alguien forkea tu repo, **no obtiene las credenciales**
> - Los valores **sí son visibles** en el JS que el navegador descarga
>
> Por eso el Allowlist de dominios (paso 1.5) sigue siendo necesario:
> juntos garantizan que las credenciales no están en el repo Y solo
> funcionan desde tu dominio.

---

## Paso 3 — Personalizar el portafolio

Edita `index.html` y cambia:
- [ ] Tu nombre (busca "Alex García")
- [ ] Tu título profesional (hero section)
- [ ] Tu descripción en "Sobre mí"
- [ ] Tus skills (badges en la sección Sobre mí)
- [ ] Los proyectos (nombres, descripciones, tecnologías)
- [ ] Tu foto (reemplaza la imagen de placeholder con una etiqueta `<img>` propia)

---

## Paso 4 — Probar localmente

1. Abre `index.html` directamente en el navegador
2. Llena el formulario de contacto
3. Haz clic en "Enviar mensaje"
4. Revisa tu bandeja de entrada (puede tardar hasta 1 minuto)
5. Abre la consola del navegador (`F12`) para ver los logs

**Resultado esperado:**
- El botón muestra un spinner mientras envía
- Aparece el mensaje "Mensaje enviado correctamente"
- Recibes un email en la cuenta configurada en el template

---

## Paso 5 — Publicar en GitHub Pages

```bash
# 1. Inicializa un repositorio Git
git init
git add .
git commit -m "feat: portafolio con sistema de notificaciones"

# 2. Crea un repositorio en GitHub (sin README) y conéctalo
git remote add origin https://github.com/TU_USUARIO/mi-portafolio.git
git branch -M main
git push -u origin main
```

### Configurar los Secrets en GitHub

Antes de activar Pages, agrega las credenciales de EmailJS como Secrets:

1. Ve a tu repositorio → **Settings → Secrets and variables → Actions**
2. Crea 3 secrets con **New repository secret**:

| Name | Value |
|------|-------|
| `EMAILJS_PUBLIC_KEY` | tu Public Key |
| `EMAILJS_SERVICE_ID` | tu Service ID |
| `EMAILJS_TEMPLATE_ID` | tu Template ID |

### Activar GitHub Pages con GitHub Actions

1. Ve a **Settings → Pages**
2. En **Source** selecciona: **GitHub Actions**
3. Haz un push cualquier a `main` (o re-corre el workflow manualmente)
4. El pipeline genera `config.js` con los secrets y despliega el sitio
5. Tu sitio estará en `https://TU_USUARIO.github.io/mi-portafolio`

> El workflow vive en `.github/workflows/deploy.yml` y se ejecuta automáticamente
> en cada push a `main`.

---

## Estructura del proyecto

```
mi-portafolio/
├── index.html         ← Página principal (estructura HTML)
├── css/
│   └── style.css      ← Estilos personalizados (animaciones, componentes)
├── js/
│   └── main.js        ← Lógica JavaScript + sistema de notificaciones
└── README.md          ← Esta guía
```

---

## Preguntas de reflexión (para el reporte del lab)

1. ¿Por qué se usa `event.preventDefault()` en el formulario?
2. ¿Qué ventaja tiene usar `async/await` frente a callbacks para el envío del email?
3. ¿Cuál es la diferencia entre el `Service ID` y el `Template ID` en EmailJS?
4. ¿Qué pasa si el usuario envía el formulario sin conexión a internet?
5. ¿Por qué se valida el formulario en el cliente antes de llamar a la API?
6. ¿Es seguro usar la Public Key de EmailJS en el código frontend? ¿Qué riesgo existe y cómo lo mitiga el Allowlist de dominios?
7. ¿Qué alternativa existiría si necesitáramos enviar emails con mayor control (ej. con archivos adjuntos, historial, etc.)?

---

## Extras opcionales

- **Agregar reCAPTCHA** para evitar spam en el formulario
- **Guardar los mensajes en una base de datos** (Supabase, Firebase)
- **Enviar una confirmación al remitente** (segundo template en EmailJS)
- **Analitics** con Google Analytics o Plausible

---

## Tecnologías usadas

| Tecnología | Rol | Por qué |
|------------|-----|---------|
| HTML/CSS/JS | Frontend | Base del portafolio |
| CSS | Estilos | Estándar, sin dependencias, fácil de modificar |
| EmailJS | Notificaciones | API gratuita, sin backend |
| GitHub Pages | Hosting | Gratuito, integrado con Git |
