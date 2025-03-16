// 1. Pedir el Acces Token
// 2. Pedir la PlayList
// 3. Descargar la PlayList

import axios from "axios";
import qs from "qs";
import readline from "readline";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

import "dotenv/config";
import fs from "fs/promises";
import { Console } from "console";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

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

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

rl.question("Por favor, ingresa el ID de la playlist: ", (playlistId) => {
  //getPlaylist(playlistId, accesToken);
  main(playlistId, accesToken);
  rl.close();
});

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