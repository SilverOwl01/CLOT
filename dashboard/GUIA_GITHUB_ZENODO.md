# Guía: Subir CLOT a GitHub y luego a Zenodo

## Paso 1 — Crear la carpeta del monorepo en tu computadora

Abre una terminal (PowerShell o cmd) y ejecuta:

```powershell
# Crea la carpeta raíz del monorepo
mkdir C:\Users\enagu\Documents\CLOT
cd C:\Users\enagu\Documents\CLOT

# Copia los proyectos como subcarpetas
# (ajusta las rutas si están en otro lugar)
xcopy /E /I "C:\ruta\a\CLOT_Dashboard" "dashboard"
xcopy /E /I "C:\ruta\a\CLOT_Movile\clot-app" "mobile"
```

> ⚠️ Sustituye las rutas por las reales en tu equipo.

---

## Paso 2 — Colocar los archivos raíz

Copia los siguientes archivos (que ya preparé) a la carpeta `CLOT/`:

| Archivo                 | Destino         | Acción                       |
|-------------------------|-----------------|------------------------------|
| `.gitignore_root`       | `CLOT/.gitignore` | Renombrar y mover a raíz   |
| `README_root.md`        | `CLOT/README.md`  | Renombrar y mover a raíz   |

---

## Paso 3 — Inicializar Git y hacer el primer commit

```powershell
cd C:\Users\enagu\Documents\CLOT

# Inicializar repositorio
git init

# Verificar que .env NO está incluido (debe estar vacío o sin .env)
git status

# Si todo se ve limpio, añadir todos los archivos
git add .

# Verificar una vez más antes de commitear
git status

# Primer commit
git commit -m "feat: primer commit — CLOT Dashboard y App Móvil"
```

> 🔍 **Revisión crítica antes del commit:** en `git status` NO debes ver:
> - `.env`
> - `node_modules/`
> - `android/local.properties`
> - `.firebase/`
> - `*.apk`

---

## Paso 4 — Crear el repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `CLOT` (o el que prefieras)
3. Descripción: `Sistema de monitoreo de anticoagulación oral`
4. Visibilidad: **Public** ✅
5. NO inicialices con README (ya tienes uno)
6. Clic en **Create repository**

---

## Paso 5 — Conectar y subir a GitHub

```powershell
# Conectar tu repositorio local con GitHub
# (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/CLOT.git

# Subir
git branch -M main
git push -u origin main
```

---

## Paso 6 — Crear un Release en GitHub (necesario para Zenodo)

Zenodo genera el DOI a partir de los **Releases** de GitHub.

1. En tu repo de GitHub, ve a **Releases** (panel derecho) → **Create a new release**
2. En **Tag version** escribe: `v1.0.0`
3. Título: `CLOT v1.0.0 — Versión inicial`
4. Descripción: resumen del proyecto (puedes copiar del README)
5. Clic en **Publish release**

---

## Paso 7 — Conectar GitHub con Zenodo

1. Ve a [zenodo.org](https://zenodo.org) e inicia sesión (puedes usar tu cuenta de GitHub)
2. Ve a tu perfil → **GitHub** (en el menú superior)
3. Zenodo listará todos tus repositorios públicos
4. Activa el toggle del repositorio **CLOT** → se pondrá en verde
5. Vuelve a tu repo en GitHub y **crea o publica el release** (si aún no lo hiciste)
6. Zenodo detectará el release automáticamente y generará el **DOI** en minutos

> El DOI tendrá la forma: `10.5281/zenodo.XXXXXXX`

---

## Paso 8 — Agregar el DOI al README (opcional pero recomendado)

Una vez que Zenodo te dé el DOI, edita el `README.md` y agrega el badge:

```markdown
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXX.svg)](https://doi.org/10.5281/zenodo.XXXXXXX)
```

---

## Checklist de seguridad final

Antes de hacer `git push`, verifica:

- [ ] `.env` aparece en `.gitignore` ✅
- [ ] `node_modules/` no está incluido ✅  
- [ ] `android/local.properties` no está incluido ✅
- [ ] `.firebase/` y `.firebaserc` no están incluidos ✅
- [ ] `*.apk` no está incluido ✅
- [ ] `src/config/firebase.js` usa `import.meta.env.*` (sin claves hardcodeadas) ✅
- [ ] `src/utils/firebaseConfig.js` usa `import.meta.env.*` (sin claves hardcodeadas) ✅
- [ ] `.env.example` SÍ está incluido (con valores de ejemplo, no reales) ✅

---

## Nota sobre las Firebase API Keys

Aunque las Web API Keys de Firebase son de acceso público por diseño (el control real de seguridad está en las Firebase Security Rules), es buena práctica **no exponerlas en el código** para evitar uso abusivo. Las medidas que ya aplicamos (variables de entorno + `.gitignore`) son el estándar de la industria.

Si quieres un nivel extra de seguridad, puedes restringir la API Key en la [consola de Google Cloud](https://console.cloud.google.com/apis/credentials) para que solo funcione desde tus dominios autorizados.
