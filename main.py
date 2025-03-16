from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import yt_dlp
import os
import re

app = FastAPI()
BASE_DOWNLOAD_FOLDER = "downloads"
os.makedirs(BASE_DOWNLOAD_FOLDER, exist_ok=True)

# Ruta de ffmpeg (ajústala según tu instalación)
FFMPEG_PATH = r"C:\ffmpeg-2025-03-06-git-696ea1c223-essentials_build\bin\ffmpeg.exe"

# Configuración de yt-dlp
ydl_opts = {
    'ffmpeg_location': FFMPEG_PATH,
    'format': 'bestaudio/best',
    'outtmpl': os.path.join(BASE_DOWNLOAD_FOLDER, 'temp_audio.%(ext)s'),
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'noplaylist': True,
    'verbose': True,
    'quiet': True
}

def sanitize_filename(name):
    """ Elimina caracteres no válidos en nombres de archivos o carpetas """
    return re.sub(r'[\/:*?"<>|]', '', name)

@app.get("/download/")
async def download_audio(query: str, playlist: str = "default", json_response: bool = True):
    try:
        clean_query = sanitize_filename(query)
        clean_playlist = sanitize_filename(playlist)

        # Crear carpeta de la playlist si no existe
        playlist_folder = os.path.join(BASE_DOWNLOAD_FOLDER, clean_playlist)
        os.makedirs(playlist_folder, exist_ok=True)
        
        if os.path.exists(os.path.join(playlist_folder, f"{clean_query}.mp3")):
            os.remove(os.path.join(playlist_folder, f"{clean_query}.mp3"))

        search_query = f"ytsearch1:{query}"
        
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            search_results = ydl.extract_info(search_query, download=False)
        
        if not search_results or 'entries' not in search_results or not search_results['entries']:
            raise HTTPException(status_code=404, detail="No se encontraron videos.")

        first_video = search_results['entries'][0]
        video_url = first_video.get('url', first_video.get('webpage_url'))
        
        if not video_url:
            raise HTTPException(status_code=404, detail="No se pudo extraer la URL del video.")

        # Configuración de yt-dlp con la carpeta de la playlist
        ydl_opts['outtmpl'] = os.path.join(playlist_folder, 'temp_audio.%(ext)s')

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            
            temp_file = info.get('requested_downloads', [{}])[0].get('filepath', os.path.join(playlist_folder, "temp_audio.mp3"))
            final_file = os.path.join(playlist_folder, f"{clean_query}.mp3")

            if os.path.exists(temp_file):
                os.rename(temp_file, final_file)
            else:
                raise HTTPException(status_code=500, detail="No se encontró el archivo de audio descargado.")

        # Retornar JSON si se especifica
        if json_response:
            return JSONResponse(content={"success": True, "message": "Descarga completada", "file": f"{clean_playlist}/{clean_query}.mp3"})

        return FileResponse(final_file, media_type="audio/mpeg", filename=f"{clean_query}.mp3")

    except Exception as e:
        return JSONResponse(status_code=400, content={"success": False, "error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
