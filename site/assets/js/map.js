// Inicialização de mapas MapLibre + PMTiles com "basemap toggle"
export function initMap({
  container,
  thematicPMTilesURL,
  sourceLayer,
  center,
  zoom = 12,
  paint,
  basemap,
}) {
  // Register PMTiles protocol only if not already registered
  if (!maplibregl.getProtocol || !maplibregl.getProtocol("pmtiles")) {
    console.log("Registering PMTiles protocol");
    const protocol = new pmtiles.Protocol();

    // Firefox-specific error handling wrapper with retry mechanism
    const originalTile = protocol.tile.bind(protocol);
    protocol.tile = (params, callback) => {
      const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

      const wrappedCallback = (err, data, cacheControl, modified) => {
        if (err) {
          console.error("PMTiles error:", err, "for URL:", params.url);

          // Firefox-specific retry for "Decoding failed" errors
          if (
            isFirefox &&
            err.message &&
            err.message.includes("Decoding failed")
          ) {
            console.warn(
              "Firefox decoding failed, attempting retry with different approach",
            );

            // Try a direct fetch as fallback
            const url = params.url.replace("pmtiles://", "");
            fetch(url, {
              headers: {
                Range: `bytes=${params.z || 0}-`,
                Accept: "application/octet-stream, */*",
              },
            })
              .then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.arrayBuffer();
              })
              .then((buffer) => {
                console.log("Firefox fallback fetch successful");
                callback(null, new Uint8Array(buffer), null, null);
              })
              .catch((fallbackErr) => {
                console.error("Firefox fallback also failed:", fallbackErr);
                callback(err); // Return original error
              });
            return;
          }
        }
        callback(err, data, cacheControl, modified);
      };

      try {
        return originalTile(params, wrappedCallback);
      } catch (error) {
        console.error("PMTiles protocol error:", error);
        wrappedCallback(error);
      }
    };

    maplibregl.addProtocol("pmtiles", protocol.tile);
  }

  function addThematicLayer(map) {
    // Only add thematic layer if all required parameters are provided
    if (!thematicPMTilesURL || !sourceLayer || !paint) {
      return;
    }

    const abs = new URL(thematicPMTilesURL, window.location.origin);
    const thematicURL = "pmtiles://" + abs.pathname + abs.search;

    if (!map.getSource("thematic")) {
      try {
        map.addSource("thematic", {
          type: "vector",
          url: thematicURL,
          // Add Firefox-specific source options
          ...(navigator.userAgent.toLowerCase().includes("firefox") && {
            maxzoom: 14, // Limit max zoom for Firefox compatibility
            buffer: 64, // Smaller buffer for Firefox
          }),
        });

        // Wait a bit for Firefox to process the source
        if (navigator.userAgent.toLowerCase().includes("firefox")) {
          setTimeout(() => {
            console.log("Firefox: Source added, proceeding with layer");
          }, 100);
        }
      } catch (error) {
        console.error("Error adding thematic source:", error);
        return;
      }
    }

    if (!map.getLayer("fill")) {
      try {
        map.addLayer({
          id: "fill",
          type: "fill",
          source: "thematic",
          "source-layer": sourceLayer,
          paint,
        });
      } catch (error) {
        console.error("Error adding thematic layer:", error);
      }
    }
  }

  // Mode A: CARTO Vector (GL style)
  if (basemap?.mode === "carto_vector") {
    const map = new maplibregl.Map({
      container,
      style: basemap.carto.vectorStyleURL,
      center,
      zoom,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-left");
    map.on("load", () => addThematicLayer(map));
    return map;
  }

  // Mode B: CARTO Raster
  if (basemap?.mode === "carto_raster") {
    const subs = basemap.carto.rasterSubdomains || ["a", "b", "c", "d"];
    const tiles = subs.map(
      (s) => `https://${s}.basemaps.cartocdn.com${basemap.carto.rasterPath}`,
    );
    const style = {
      version: 8,
      sources: {
        "carto-light": {
          type: "raster",
          tiles,
          tileSize: 256,
          attribution: basemap.carto.attribution,
        },
      },
      layers: [{ id: "carto-light", type: "raster", source: "carto-light" }],
    };
    const map = new maplibregl.Map({ container, style, center, zoom });
    map.addControl(new maplibregl.NavigationControl(), "top-left");
    map.on("load", () => addThematicLayer(map));
    return map;
  }

  // Mode C: PMTiles basemap (default)
  const style = { version: 8, sources: {}, layers: [] };
  if (basemap?.pmtilesPath) {
    const absBase = new URL(basemap.pmtilesPath, window.location.origin);
    const baseURL = "pmtiles://" + absBase.pathname + absBase.search;
    style.sources["basemap"] = { type: "vector", url: baseURL };
    // Generic layer; adjust "source-layer" according to your basemap
    style.layers.push({
      id: "basemap-fill",
      type: "fill",
      source: "basemap",
      "source-layer": "land", // Make sure this matches your basemap structure
      paint: { "fill-color": "#f5f5f5" },
    });
  }
  const map = new maplibregl.Map({ container, style, center, zoom });
  map.addControl(new maplibregl.NavigationControl(), "top-left");
  map.on("load", () => addThematicLayer(map));
  return map;
}

// Helper function for pages that want to add thematic layers after map initialization
export function addThematicToMap(
  map,
  { pmtilesURL, sourceLayer, paint, layerId = "fill" },
) {
  if (!pmtilesURL || !sourceLayer || !paint) {
    console.error("Missing required parameters for thematic layer");
    return;
  }

  const abs = new URL(pmtilesURL, window.location.origin);
  const thematicURL = "pmtiles://" + abs.pathname + abs.search;

  if (!map.getSource("thematic")) {
    map.addSource("thematic", { type: "vector", url: thematicURL });
  }

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "fill",
      source: "thematic",
      "source-layer": sourceLayer,
      paint,
    });
  }
}
