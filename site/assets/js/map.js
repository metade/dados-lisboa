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
  const protocol = new pmtiles.Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  function addThematic(map) {
    const abs = new URL(thematicPMTilesURL, window.location.origin);
    const thematicURL = "pmtiles://" + abs.pathname + abs.search;
    if (!map.getSource("thematic")) {
      map.addSource("thematic", { type: "vector", url: thematicURL });
    }
    if (!map.getLayer("fill")) {
      map.addLayer({
        id: "fill",
        type: "fill",
        source: "thematic",
        "source-layer": sourceLayer,
        paint,
      });
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
    map.on("load", () => addThematic(map));
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
    map.on("load", () => addThematic(map));
    return map;
  }

  // Mode C: PMTiles basemap (default)
  const style = { version: 8, sources: {}, layers: [] };
  if (basemap?.pmtilesPath) {
    const absBase = new URL(basemap.pmtilesPath, window.location.origin);
    const baseURL = "pmtiles://" + absBase.pathname + absBase.search;
    style.sources["basemap"] = { type: "vector", url: baseURL };
    // Camada generica; ajuste "source-layer" conforme o seu basemap
    style.layers.push({
      id: "basemap-fill",
      type: "fill",
      source: "basemap",
      "source-layer": "land",
      paint: { "fill-color": "#f5f5f5" },
    });
  }
  const map = new maplibregl.Map({ container, style, center, zoom });
  map.addControl(new maplibregl.NavigationControl(), "top-left");
  map.on("load", () => addThematic(map));
  return map;
}

export const initPMTilesMap = initMap; // compat
