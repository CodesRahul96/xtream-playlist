const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");
const { fetchAndRewritePlaylist } = require("./src/playlist_manager");
const streamManager = require("./src/stream_handler");

const app = express();
const port = config.server.port;

app.use(morgan("tiny"));
app.use(cors());

// Playlist Route
app.get(["/get.php", "/playlist.m3u"], async (req, res) => {
  try {
    const host = req.headers.host;
    const playlistStream = await fetchAndRewritePlaylist(host);

    // Determine Content-Type based on request or default to mpegurl
    res.setHeader("Content-Type", "application/x-mpegurl");
    res.setHeader("Content-Disposition", 'attachment; filename="playlist.m3u"');

    playlistStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating playlist");
  }
});

// Stream Route
app.get("/stream/:id", async (req, res) => {
  const streamId = req.params.id;
  // Remove .ts extension if present for ID processing (though usually handled by upstream request url constuction)
  // The upstream usually expects just the ID number: http://.../username/password/1234
  // But sometimes it accepts .ts. My regex in playlist_manager keeps the .ts.
  // Let's strip it for the manager if needed, but the config.js suggests /User/Pass/ID

  // Actually, looking at playlist_manager, I kept the ID with extension:
  // `http://${reqHost}/stream/${idWithExt}`
  // So `id` here will be `1234.ts`.

  // We should strip the extension when talking to upstream IF upstream requires it.
  // XTREAM codes usually supports /stream_id.ts OR /stream_id

  await streamManager.handleStreamRequest(req, res, streamId);
});

// Status Route
app.get("/status", (req, res) => {
  const activeStreams = [];
  for (const [id, data] of streamManager.activeStreams.entries()) {
    activeStreams.push({
      id,
      clients: data.clients.size,
    });
  }
  res.json({
    totalStreams: activeStreams.length,
    streams: activeStreams,
  });
});

app.listen(port, () => {
  console.log(`IPTV Proxy running on port ${port}`);
  console.log(
    `Playlist URL: http://localhost:${port}/get.php?username=${config.upstream.username}&password=${config.upstream.password}&type=m3u_plus`,
  );
});
