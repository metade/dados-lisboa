# Dados Lisboa — Parques Infantis (Starter)

Starter **em Português**, com **Jekyll** em `/site`, pipeline **apenas PMTiles** para a área **parques-infantis**, e **JS/CSS reutilizáveis** (vanilla).

## Desenvolvimento (dois processos)
```bash
bundle install

# Terminal 1 — site
bundle exec jekyll serve --source site --livereload --incremental

# Terminal 2 — pipeline de dados (watch)
bundle exec rake data:watch
```

## Construir dados (uma vez)
```bash
bundle exec rake data:all
```

## Requisitos
- **tippecanoe** (>= 2.17) para gerar `.pmtiles` diretamente.
  - macOS: `brew install tippecanoe`
  - Ubuntu: `sudo apt-get install -y tippecanoe`
- (Opcional) **pmtiles** CLI para inspeção (`brew install pmtiles` ou binário release).

## Estrutura
```
.
├─ site/                                # Jekyll (apresentação)
│  ├─ _layouts/{default,map_pmtiles}.html
│  ├─ parques-infantis/
│  │  ├─ index.md                       # conteúdo + iframe
│  │  └─ mapa.html                      # página de mapa em ecrã inteiro
│  ├─ assets/
│  │  ├─ css/{site.css,util.css}
│  │  └─ js/{core.js,map.js,parques.js}
│  └─ assets/data/processed/            # ficheiros gerados (.pmtiles)
├─ areas/parques-infantis/
│  ├─ Rakefile
│  ├─ seed/parques.geojson              # dados de exemplo
│  └─ scripts/{fetch.rb,build_pmtiles.rb}
├─ lib/dados/{geojson.rb,haversine.rb,paths.rb}
├─ test/{test_helper.rb,haversine_test.rb}
├─ Rakefile                             # orquestrador + watch + testes
└─ .github/workflows/build.yml          # CI: tippecanoe → rake → test → build → deploy
```


## Basemap PMTiles (opcional)
Por omissão, o mapa usa **OSM raster**. Para usar um **basemap PMTiles**:
1. Obtenha um ficheiro `.pmtiles` de basemap (Protomaps, etc.).
2. Coloque-o em `site/assets/data/processed/basemap.pmtiles` **ou** execute:
   ```bash
   BASEMAP_URL="https://exemplo/basemap.pmtiles" bundle exec rake basemap:download
   ```
3. Verifique:
   ```bash
   bundle exec rake verify:basemap
   ```
4. A página `/parques-infantis/mapa/` tentará usar este basemap; se falhar, recai automaticamente para raster OSM.

## Verificações
- `bundle exec rake verify:parques` confirma que `parques_infantis.pmtiles` começa com `PMTiles`.
- `bundle exec rake verify:basemap` valida o basemap (se existir).


## Basemap toggle
O ficheiro `site/_config.yml` define o modo de basemap:
```yml
basemap:
  mode: carto_raster  # pmtiles | carto_raster | carto_vector
  pmtiles_path: /assets/data/processed/basemap.pmtiles
  carto:
    raster_subdomains: ["a","b","c","d"]
    raster_path: /light_all/{z}/{x}/{y}@2x.png
    vector_style_url: https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
    attr: "© OpenStreetMap contributors © CARTO"
```
- **carto_vector**: usa o estilo GL Positron como base e adiciona o PMTiles temático ao `load`.
- **carto_raster**: usa os tiles raster do CARTO (light_all) como base.
- **pmtiles**: usa um basemap `.pmtiles` local (se existir), caso contrário verá apenas o tema.
