import axios from "axios";
import qs from "qs";
import readline from "readline";
import "dotenv/config";
import crypto from "crypto";
import open from "open";
import readlineSync from "readline-sync";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = "http://localhost";

// Pediremos un Acces Token a Spotify
async function getAccessToken() {
  const tokenUrl = "https://accounts.spotify.com/api/token";
  const data = qs.stringify({ grant_type: "client_credentials" });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      Buffer.from(client_id + ":" + client_secret).toString("base64"),
  };

  try {
    const response = await axios.post(tokenUrl, data, { headers });
    return response.data.access_token;
  } catch (error) {
    console.error("Error obteniendo token:", error.response.data);
  }
}
var accesToken = await getAccessToken();

// Menu
function showMenu() {
  console.log("\n📥 ¿Qué quieres hacer?");
  console.log("1️⃣ Descargar una Playlist de Spotify");
  console.log("2️⃣ Descargar tus canciones guardadas (Liked Songs)");
  console.log("3️⃣ Salir\n");

  rl.question("Selecciona una opción (1/2/3): ", async (option) => {
    
    switch (option) {
      case "1":
        rl.question("🔹 Ingresa el ID de la Playlist: ", async (playlistId) => {
          const accessToken = await getAccessToken();
          await main(playlistId, accessToken);
          rl.close();
        });
        break;
      case "2":
        getUserAccessToken()
        rl.close();
        break;
      case "3":
        console.log("📥 Salir");
        break;
      default:
        console.log("❌ Opción inválida. Inténtalo de nuevo.");
        showMenu();
        return;
    }
  });
}

showMenu();

let codeVerifier = null;

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(codeVerifier) {
  return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
}

// Gets the user's access token
async function getUserAccessToken() {
  codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=user-library-read&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  console.log("\n🔗 Abriendo el navegador para autenticarte en Spotify...");
  console.log(`Si no se abre automáticamente, copia y pega esta URL en tu navegador:\n${authUrl}`);

  await open(authUrl);

  const authCode = readlineSync.question("\n📋 Pega aquí el código de autorización de la URL: ");

  try {
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        client_id,
        grant_type: "authorization_code",
        code: authCode,
        redirect_uri,
        code_verifier: codeVerifier,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log("\n✅ Autenticación exitosa. Token obtenido.");
    getLikedSongs(response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error("\n❌ Error al obtener el token:", error.response?.data || error.message);
    process.exit(1);
  }
}

// Gets the user's Liked Songs with the user's access token
async function getLikedSongs(accessToken) {
  let allTracks = [];
  let limit = 50;
  let offset = 0;
  let hasMore = true;

  console.log("\n🎵 Obteniendo canciones guardadas en Liked Songs...");

  while (hasMore) {
    try {
      const response = await axios.get("https://api.spotify.com/v1/me/tracks", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, offset },
      });

      const tracks = response.data.items;
      allTracks = allTracks.concat(tracks);

      if (tracks.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    } catch (error) {
      console.error("❌ Error obteniendo las Liked Songs:", error.response?.data || error.message);
      return [];
    }
  }

  downloadSongs("Liked Songs", allTracks);

  return allTracks;
}

// Main
async function main(playlistId, access_token) {
  try {
    var tracks = await getPlaylistTracks(playlistId, access_token);
    var playlistInfo = await getPlayListInfo(playlistId, access_token);

    if (playlistInfo === null) {
      console.log("Playlist no encontrada");
      return;
    }

    downloadSongs(playlistInfo.name, tracks);
  } catch (error) {
    console.log(error);
  }
}

// Gets the playlist's tracks
async function getPlaylistTracks(playlistId, accessToken) {
  let allTracks = [];
  let limit = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit, offset },
        }
      );

      const tracks = response.data.items;
      allTracks = allTracks.concat(tracks);

      // Si el número de canciones recibidas es menor al límite, ya no hay más páginas
      if (tracks.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    } catch (error) {
      console.error("Error obteniendo las canciones:", error.response.data);
      return;
    }
  }

  console.log(`Se obtuvieron ${allTracks.length} canciones`);
  return allTracks;
}

// Gets the playlist info
async function getPlayListInfo(playlistId, accessToken) {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 200) {
      {
        return response.data;
      }
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Download the songs
async function downloadSongs(playListName, tracks) {
  var startedAt = Date.now();
  const apiDownloader = "http://localhost:8000/download/?query=";
  const playlistName = playListName;
  const totalItems = tracks.length;
  let completedDownloads = 0;
  let failedDownloads = 0;

  console.log("🎵 Descargando playlist: " + playListName);

  for (const track of tracks) { // 🔄 Bucle secuencial
    const query = `${track.track.name} ${track.track.artists[0].name}`;
    const encodedQuery = encodeURIComponent(query);
    const url = `${apiDownloader}${encodedQuery}&playlist=${playlistName}`;

    console.log("-----------------------------------");
    console.log(`🔄 Iniciando descarga: ${query}`);
    

    try {
      const response = await fetch(url); // ⏳ Espera la descarga antes de continuar

      if (!response.ok) {
        throw new Error(`Error en la descarga (${response.status})`);
        console.log("-----------------------------------");
      }

      completedDownloads++;
      console.log(`✅ Descargada (${completedDownloads}/${totalItems}): ${query}`);
      console.log("-----------------------------------");
    } catch (error) {
      failedDownloads++;
      console.error(`❌ Error en ${query}:`, error.message);
      console.log("-----------------------------------");
    }
  }

  var endedAt = Date.now();

  console.log("🎉 Descargas finalizadas");
  console.log(`✅ Éxitos: ${completedDownloads}`);
  console.log(`❌ Errores: ${failedDownloads}`);

  var totalSeconds = (endedAt - startedAt) / 1000;
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;
  console.log(`⏳ Tiempo total de descarga: ${minutes} minutos ${seconds} segundos`);
}