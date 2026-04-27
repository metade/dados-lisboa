# dados-lisboa

Data visualisation app for Lisbon parish data, deployed to GitHub Pages at https://dados-lisboa.metade.org.

## Architecture

- **`site/`** — Jekyll site (presentation layer)
- **`areas/<name>/`** — one directory per data area, each with its own `Rakefile` and scripts
- **`lib/dados_lisboa/`** — shared Ruby library (geo utilities, rake task helpers)
- **`data/`** — source data files
- **`tmp/`** — intermediate build artifacts (gitignored)

### Data areas

- `parques-infantis` — children's playgrounds (active, includes Google Sheets integration)
- `multibancos` — ATMs
- `pre-escolar` — pre-school facilities
- `census_2021` — census data
- `alojamentos_locais` — local accommodation (Airbnb WIP)

### Pipeline

Each area fetches remote data and builds **PMTiles** files (via `tippecanoe`) into `site/assets/data/processed/`. The Jekyll site serves them via MapLibre GL.

## Development

### macOS prerequisites (one-time)

```bash
brew install cmake geos tippecanoe
```

Then install gems — `rgeo` must be installed *after* GEOS so it compiles with the C API:

```bash
gem uninstall rgeo --force -x  # if already installed without GEOS
bundle install
```

### Running locally (two terminals)

```bash
# Terminal 1 — build data
bundle exec rake data:all

# Terminal 2 — serve site with live reload
bundle exec jekyll serve --source site --livereload
```

Site runs at http://localhost:4000.

### Watch mode (rebuilds data on file changes)

```bash
bundle exec rake data:watch
```

## Key commands

```bash
bundle exec rake data:all          # build all PMTiles
bundle exec rake test              # run minitest suite
bundle exec rake verify:parques    # check parques_infantis.pmtiles header
bundle exec rake verify:basemap    # check basemap.pmtiles header (if present)
```

## Basemap

Configured in `site/_config.yml` under `basemap.mode`:

- `carto_vector` (default) — CARTO Positron GL style
- `carto_raster` — CARTO raster tiles
- `pmtiles` — local `site/assets/data/processed/basemap.pmtiles`

## CI / Deploy

`.github/workflows/build-and-deploy.yml` — builds on push to `main`, deploys to GitHub Pages. Ubuntu runner installs `tippecanoe`, `gdal-bin`, `libproj-dev`, `libgeos-dev` via apt.
