# 🎵 Spotify & YouTube Playlist Downloader

Este proyecto permite descargar playlists de Spotify en formato de audio MP3 usando la API de Spotify para obtener las canciones y `yt-dlp` para descargarlas desde YouTube.

---

## 🚀 Requisitos

Antes de ejecutar el proyecto, asegúrate de tener instalados los siguientes componentes:

### **1️⃣ Instalaciones necesarias**
- **Node.js** (versión 18 o superior) - [Descargar aquí](https://nodejs.org/)
- **Python 3** (para `yt-dlp`) - [Descargar aquí](https://www.python.org/)
- **ffmpeg** (para la conversión de audio) - [Descargar aquí](https://ffmpeg.org/)
- **yt-dlp** (para descargar audio de YouTube)
  ```bash
  pip install yt-dlp
  ```

### **2️⃣ Variables de entorno (`.env`)**
Debes crear un archivo `.env` en la raíz del proyecto con las credenciales de Spotify:

```
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
```

Obtén tu Client ID y Client Secret en el [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

---

## 🔧 Instalación

1️⃣ **Clona el repositorio**
```bash
git clone https://github.com/enrikku/spotify-youtube-downloader.git
cd spotify-youtube-downloader
```

2️⃣ **Instala las dependencias**
```bash
npm install
```

3️⃣ **Inicia la API de descarga (`FastAPI`)**
```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

4️⃣ **Ejecuta la aplicación principal (`Node.js`)**
```bash
node main.js
```

---

## 📌 ¿Cómo funciona?

1️⃣ **Obtiene el Access Token de Spotify** para poder consultar playlists o canciones guardadas.
2️⃣ **Solicita el ID de una Playlist de Spotify o elige descargar canciones guardadas (Liked Songs)**.
3️⃣ **Obtiene la información de la Playlist o las canciones guardadas**.
4️⃣ **Busca y descarga cada canción en formato MP3** usando `yt-dlp`.
5️⃣ **Guarda las canciones en la carpeta correspondiente**.

### **Opciones disponibles:**

🔹 **Opción 1: Descargar una Playlist de Spotify**
Cuando ejecutas `node main.js`, el programa te pedirá el ID de la playlist:

```bash
Por favor, ingresa el ID de la playlist: 37i9dQZF1DXcBWIGoYBM5M
```

Luego, el programa empezará a descargar las canciones:

```bash
🎵 Descargando playlist: My Favorite Songs
🔄 Iniciando descarga: Song 1 - Artist 1
✅ Descargada (1/50): Song 1 - Artist 1
...
🎉 Descargas finalizadas
✅ Éxitos: 50
❌ Errores: 0
⏳ Tiempo total de descarga: 3 minutos 25 segundos
```

🔹 **Opción 2: Descargar canciones guardadas en "Liked Songs"**
Si eliges descargar las canciones que has marcado como favoritas en Spotify, el script abrirá una ventana en el navegador para autenticarte en Spotify.

1. El usuario se autenticará en Spotify y otorgará permisos.
2. Una vez iniciadio sesion, se te reigirá a localhost, podrás ver que la URL será, localhost/code=PERSONALTOKEN, solo tienes que copiar el PERSONALTOKEN y pegarlo en la terminal, luego se irán descargando las cancioes
3. El script obtendrá todas las canciones guardadas en "Liked Songs".
4. Las canciones se descargarán y se guardarán en la carpeta `Liked Songs`.

```bash
📥 ¿Qué quieres hacer?
1️⃣ Descargar una Playlist de Spotify
2️⃣ Descargar tus canciones guardadas (Liked Songs)
3️⃣ Salir

Selecciona una opción (1/2/3): 2
🔹 Obteniendo tus canciones guardadas...
🎵 Descargando playlist: Liked Songs
🔄 Iniciando descarga: Song 1 - Artist 1
✅ Descargada (1/120): Song 1 - Artist 1
...
🎉 Descargas finalizadas
✅ Éxitos: 120
❌ Errores: 0
⏳ Tiempo total de descarga: 4 minutos 30 segundos
```

---

## ⚙️ Configuración avanzada

Si deseas cambiar la configuración de la API de descarga o los parámetros de `yt-dlp`, edita estos archivos:

- **`main.py`** → Configura `yt-dlp`, rutas de almacenamiento y calidad de audio.
- **`main.js`** → Maneja la autenticación con Spotify y la descarga de canciones.

---

## ❓ Posibles errores y soluciones

| Error | Posible solución |
|-------|-----------------|
| `INVALID_CLIENT: Invalid client` | Verifica tu `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` en `.env`. |
| `No se encontraron videos.` | Puede ser que YouTube no tenga la canción exacta. Intenta buscar manualmente. |
| `yt-dlp command not found` | Asegúrate de haber instalado `yt-dlp` correctamente con `pip install yt-dlp`. |
| `ffmpeg not found` | Añade `ffmpeg` al `PATH` o define su ruta en `FFMPEG_PATH` en `api.py`. |
| `Error: invalid_grant` | Verifica que el código de autenticación copiado sea correcto y que no haya expirado. |

---

## 🛠 Tecnologías utilizadas

- **Node.js** → Para la autenticación en Spotify y gestión de descargas.
- **FastAPI (Python)** → Para la descarga y conversión de archivos de YouTube.
- **yt-dlp** → Para extraer audio de videos de YouTube.
- **ffmpeg** → Para convertir archivos de audio a MP3.
- **Axios** → Para hacer solicitudes a la API de Spotify.

---