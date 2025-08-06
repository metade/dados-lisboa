// Inicialização de mapas MapLibre + PMTiles (vanilla) com basemap opcional em PMTiles.
export function initPMTilesMap({ container, pmtilesURL, sourceLayer, center, zoom=12, paint, basemapPMTilesURL=null }) {
  // PMTiles protocol
  const protocol = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);

  // Resolver URL absoluta(s)
  const absThematic = new URL(pmtilesURL, window.location.origin);
  const thematicURL = "pmtiles://" + absThematic.pathname + absThematic.search;

  let style = {
    version: 8,
    sources: {},
    layers: []
  };

  // Tentar basemap em PMTiles se fornecido; caso falhe, recair em raster OSM
  let useRasterFallback = true;
  if (basemapPMTilesURL) {
    const absBase = new URL(basemapPMTilesURL, window.location.origin);
    const baseURL = "pmtiles://" + absBase.pathname + absBase.search;
    style.sources["basemap"] = { type: "vector", url: baseURL };
    // Uma camada genérica (pode ser adaptada pela chave do style usado)
    style.layers.push({ id: "basemap-fill", type: "fill", source: "basemap", "source-layer": "land", paint: { "fill-color": "#f5f5f5" } });
    useRasterFallback = false;
  }

  if (useRasterFallback) {
    style.sources["osm-raster"] = { type: "raster", tiles: [ "https://tile.openstreetmap.org/{z}/{x}/{y}.png" ], tileSize: 256, attribution: "© OpenStreetMap contributors" };
    style.layers.push({ id: "osm", type: "raster", source: "osm-raster" });
  }

  style.sources["thematic"] = { type: "vector", url: thematicURL };
  style.layers.push({ id: "fill", type: "fill", source: "thematic", "source-layer": sourceLayer, paint });

  const map = new maplibregl.Map({ container, style, center, zoom });
  map.addControl(new maplibregl.NavigationControl(), 'top-left');

  // Se falhar a carga do basemap PMTiles, troca para raster OSM
  map.on('error', (e) => {
    const msg = (e && e.error && (e.error.message || e.error.toString())) || "";
    if (!useRasterFallback && msg && msg.includes("basemap")) {
      // Substituir por raster
      map.remove();
      const fallbackStyle = {
        version: 8,
        sources: {
          "osm-raster": { type: "raster", tiles: [ "https://tile.openstreetmap.org/{z}/{x}/{y}.png" ], tileSize: 256, attribution: "© OpenStreetMap contributors" },
          "thematic": { type: "vector", url: thematicURL }
        },
        layers: [
          { id: "osm", type: "raster", source: "osm-raster" },
          { id: "fill", type: "fill", source: "thematic", "source-layer": sourceLayer, paint }
        ]
      };
      const map2 = new maplibregl.Map({ container, style: fallbackStyle, center, zoom });
      map2.addControl(new maplibregl.NavigationControl(), 'top-left');
      // Tooltip simples
      const popup2 = new maplibregl.Popup({ closeButton:false, closeOnClick:false });
      map2.on('mousemove','fill', (ev) => {
        const f = ev.features && ev.features[0];
        if (!f) return;
        popup2.setLngLat(ev.lngLat).setHTML(`<div style="font:12px/1.4 system-ui"><strong>Distância:</strong> ${f.properties?.dist_m ?? '—'} m</div>`).addTo(map2);
      });
      map2.on('mouseleave','fill', () => popup2.remove());
    }
  });

  // Tooltip simples
  const popup = new maplibregl.Popup({ closeButton:false, closeOnClick:false });
  map.on('mousemove','fill', (e) => {
    const f = e.features && e.features[0];
    if (!f) return;
    popup.setLngLat(e.lngLat)
         .setHTML(`<div style="font:12px/1.4 system-ui"><strong>Distância:</strong> ${f.properties?.dist_m ?? '—'} m</div>`)
         .addTo(map);
  });
  map.on('mouseleave','fill', () => popup.remove());

  return map;
}
