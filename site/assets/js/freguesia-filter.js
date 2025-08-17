/**
 * Reusable Freguesia Filter Module
 *
 * This module provides functionality to create and manage freguesia (parish) filters
 * for map visualizations. It handles UI generation, filter application, URL state
 * management, and map interactions.
 */

export class FreguesiasFilter {
  constructor(options = {}) {
    this.map = options.map;
    this.containerSelector = options.containerSelector || "#freguesias-filter";
    this.selectAllSelector =
      options.selectAllSelector || "#select-all-freguesias";
    this.sourceId = options.sourceId || "playgrounds";
    this.sourceLayer = options.sourceLayer || "h3";
    this.layerId = options.layerId || "h3-hexagons";
    this.freguesiasProperty = options.freguesiasProperty || "freguesias";
    this.urlParam = options.urlParam || "freguesias";
    this.onFilterChange = options.onFilterChange || (() => {});
    this.onSelectionChange = options.onSelectionChange || (() => {});
    this.enableZoom = options.enableZoom !== false;
    this.enableUrlSync = options.enableUrlSync !== false;
    this.skipInitialZoom = options.skipInitialZoom || false;

    this.allFreguesias = [];
    this.initialized = false;
    this.isFirstZoom = true;

    this.boundOnFreguesiasChange = this.onFreguesiasChange.bind(this);
    this.boundOnSelectAllChange = this.onSelectAllChange.bind(this);
  }

  /**
   * Initialize the freguesia filter
   */
  async initialize() {
    if (!this.map) {
      throw new Error("Map instance is required");
    }

    try {
      await this.populateFilter();
      this.setupEventListeners();
      this.initialized = true;
    } catch (error) {
      this.showError(
        "Erro ao inicializar filtro de freguesias: " + error.message,
      );
    }
  }

  /**
   * Populate the filter with freguesias from map data
   */
  async populateFilter() {
    try {
      // Query features to get unique freguesias
      const features = this.map.querySourceFeatures(this.sourceId, {
        sourceLayer: this.sourceLayer,
      });

      // Extract freguesias from features
      const freguesiasSet = new Set();
      features.forEach((feature) => {
        const value = feature.properties[this.freguesiasProperty];
        if (value) {
          this.extractFreguesiasFromValue(value, freguesiasSet);
        }
      });

      this.allFreguesias = Array.from(freguesiasSet).sort();
      if (this.allFreguesias.length === 0) {
        this.showWarning(
          "Nenhuma freguesia encontrada nos dados. Verifique os logs do console para mais detalhes.",
        );
        return;
      }

      this.renderFilterUI();
      this.updateSelectAllCheckbox();

      // Apply initial filter based on URL parameters
      const selectedBeforeFilter = this.getSelectedFreguesias();

      // Check if layer already has a filter applied (from URL parameters)
      const currentFilter = this.map.getFilter(this.layerId);
      if (currentFilter && selectedBeforeFilter.length > 0) {
        // Don't apply filter again, just call callbacks
        this.onFilterChange(selectedBeforeFilter);
      } else {
        this.applyFilter();
      }
    } catch (error) {
      this.showError("Erro ao carregar freguesias: " + error.message);
    }
  }

  /**
   * Extract freguesias from a property value (handles arrays, JSON strings, etc.)
   */
  extractFreguesiasFromValue(value, freguesiasSet) {
    if (Array.isArray(value)) {
      value.forEach((f) => freguesiasSet.add(f));
    } else if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          parsed.forEach((f) => freguesiasSet.add(f));
        } else {
          freguesiasSet.add(value);
        }
      } catch (e) {
        freguesiasSet.add(value);
      }
    } else {
      freguesiasSet.add(value.toString());
    }
  }

  /**
   * Render the filter UI
   */
  renderFilterUI() {
    const container = document.querySelector(this.containerSelector);
    if (!container) {
      throw new Error(`Container element not found: ${this.containerSelector}`);
    }

    container.innerHTML = "";

    // Get URL parameters to determine default checked state
    const urlFreguesias = this.enableUrlSync
      ? this.getSelectedFreguesiasFromURL()
      : [];
    const defaultChecked = urlFreguesias.length === 0;

    this.allFreguesias.forEach((freguesia) => {
      const div = document.createElement("div");
      div.className = "form-check mb-2";

      const checkbox = document.createElement("input");
      checkbox.className = "form-check-input";
      checkbox.type = "checkbox";
      checkbox.id = `freguesia-${freguesia.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}`;
      checkbox.value = freguesia;
      checkbox.checked = defaultChecked || urlFreguesias.includes(freguesia);
      checkbox.addEventListener("change", this.boundOnFreguesiasChange);

      const label = document.createElement("label");
      label.className = "form-check-label small";
      label.htmlFor = checkbox.id;
      label.textContent = freguesia;

      div.appendChild(checkbox);
      div.appendChild(label);
      container.appendChild(div);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const selectAllCheckbox = document.querySelector(this.selectAllSelector);
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", this.boundOnSelectAllChange);
    }
  }

  /**
   * Handle individual freguesia checkbox changes
   */
  onFreguesiasChange() {
    this.updateSelectAllCheckbox();

    // Add a small delay to ensure DOM is updated
    setTimeout(() => {
      this.applyFilter();
      if (this.enableUrlSync) {
        this.updateURLWithFreguesias();
      }
      this.onSelectionChange(this.getSelectedFreguesias());
    }, 10);
  }

  /**
   * Handle select all checkbox changes
   */
  onSelectAllChange() {
    const selectAllCheckbox = document.querySelector(this.selectAllSelector);
    const checkboxes = document.querySelectorAll(
      `${this.containerSelector} input[type="checkbox"]`,
    );

    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });

    selectAllCheckbox.indeterminate = false;

    // Add a small delay to ensure DOM is updated
    setTimeout(() => {
      this.applyFilter();
      if (this.enableUrlSync) {
        this.updateURLWithFreguesias();
      }
      this.onSelectionChange(this.getSelectedFreguesias());
    }, 10);
  }

  /**
   * Update the select all checkbox state based on individual checkboxes
   */
  updateSelectAllCheckbox() {
    const checkboxes = document.querySelectorAll(
      `${this.containerSelector} input[type="checkbox"]`,
    );
    const selectAllCheckbox = document.querySelector(this.selectAllSelector);

    if (!selectAllCheckbox) return;

    const checkedCount = Array.from(checkboxes).filter(
      (cb) => cb.checked,
    ).length;
    const totalCount = checkboxes.length;

    if (checkedCount === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === totalCount) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }

  /**
   * Apply the freguesia filter to the map
   */
  applyFilter() {
    const selectedFreguesias = this.getSelectedFreguesias();
    const totalFreguesias = this.allFreguesias.length;

    // Check if layer exists and is ready
    const layer = this.map.getLayer(this.layerId);

    if (!layer) {
      setTimeout(() => this.applyFilter(), 100);
      return;
    }

    // Check if source is loaded
    const source = this.map.getSource(this.sourceId);
    if (source && !this.map.isSourceLoaded(this.sourceId)) {
      setTimeout(() => this.applyFilter(), 100);
      return;
    }

    // Check if we're applying the same filter that's already there
    const currentFilter = this.map.getFilter(this.layerId);
    const isCurrentlyShowingAll = !currentFilter || currentFilter === null;
    const shouldShowAll =
      selectedFreguesias.length === totalFreguesias && totalFreguesias > 0;

    if (isCurrentlyShowingAll && shouldShowAll) {
      this.onFilterChange(selectedFreguesias);
      if (this.enableZoom) {
        this.zoomToSelectedFreguesias();
      }
      return;
    }

    if (selectedFreguesias.length === 0) {
      // Hide all when no freguesias selected
      this.map.setFilter(this.layerId, ["==", ["literal", true], false]);
    } else if (
      selectedFreguesias.length === totalFreguesias &&
      totalFreguesias > 0
    ) {
      // Show all when all freguesias selected
      this.map.setFilter(this.layerId, null);
    } else {
      // Show selected freguesias
      const filter = [
        "any",
        ...selectedFreguesias.map((freguesia) => [
          "in",
          freguesia,
          ["get", this.freguesiasProperty],
        ]),
      ];
      this.map.setFilter(this.layerId, filter);
    }

    // Call the custom filter change callback
    this.onFilterChange(selectedFreguesias);

    if (this.enableZoom) {
      // Skip the first zoom if skipInitialZoom is true, but allow subsequent zooms
      if (this.isFirstZoom && this.skipInitialZoom) {
        this.isFirstZoom = false;
      } else {
        this.zoomToSelectedFreguesias();
        this.isFirstZoom = false;
      }
    }
  }

  /**
   * Zoom to selected freguesias
   */
  zoomToSelectedFreguesias() {
    const selectedFreguesias = this.getSelectedFreguesias();

    // Don't zoom if all freguesias are selected (show full map)
    if (
      selectedFreguesias.length === 0 ||
      selectedFreguesias.length === this.allFreguesias.length
    ) {
      return;
    }

    try {
      // Get all features
      const allFeatures = this.map.querySourceFeatures(this.sourceId, {
        sourceLayer: this.sourceLayer,
      });

      // Filter features client-side to find matching ones
      const matchingFeatures = allFeatures.filter((feature) => {
        const freguesias = feature.properties[this.freguesiasProperty];
        if (!freguesias) return false;

        if (Array.isArray(freguesias)) {
          return freguesias.some((f) => selectedFreguesias.includes(f));
        } else if (typeof freguesias === "string") {
          try {
            const parsed = JSON.parse(freguesias);
            if (Array.isArray(parsed)) {
              return parsed.some((f) => selectedFreguesias.includes(f));
            } else {
              return selectedFreguesias.includes(freguesias);
            }
          } catch (e) {
            return selectedFreguesias.includes(freguesias);
          }
        }
        return false;
      });

      if (matchingFeatures.length === 0) {
        console.log("No matching features found for zoom");
        return;
      }

      const bounds = new maplibregl.LngLatBounds();
      matchingFeatures.forEach((feature) => {
        if (feature.geometry.type === "Polygon") {
          feature.geometry.coordinates[0].forEach((coord) => {
            bounds.extend(coord);
          });
        } else if (feature.geometry.type === "MultiPolygon") {
          feature.geometry.coordinates.forEach((polygon) => {
            polygon[0].forEach((coord) => {
              bounds.extend(coord);
            });
          });
        }
      });

      this.map.fitBounds(bounds, {
        padding: 50,
        duration: 1000,
        essential: false,
      });
    } catch (error) {
      // Silently handle zoom errors
    }
  }

  /**
   * Get currently selected freguesias
   */
  getSelectedFreguesias() {
    const checkboxes = document.querySelectorAll(
      `${this.containerSelector} input[type="checkbox"]:checked`,
    );
    return Array.from(checkboxes).map((cb) => cb.value);
  }

  /**
   * Get all available freguesias
   */
  getAllFreguesias() {
    return [...this.allFreguesias];
  }

  /**
   * Set selected freguesias programmatically
   */
  setSelectedFreguesias(freguesias) {
    const checkboxes = document.querySelectorAll(
      `${this.containerSelector} input[type="checkbox"]`,
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = freguesias.includes(checkbox.value);
    });
    this.updateSelectAllCheckbox();
    this.applyFilter();
    if (this.enableUrlSync) {
      this.updateURLWithFreguesias();
    }
  }

  /**
   * Get selected freguesias from URL parameters
   */
  getSelectedFreguesiasFromURL() {
    if (!this.enableUrlSync) return [];

    const urlParams = new URLSearchParams(window.location.search);
    const freguesias = urlParams.get(this.urlParam);
    return freguesias ? freguesias.split(",") : [];
  }

  /**
   * Update URL with selected freguesias
   */
  updateURLWithFreguesias() {
    if (!this.enableUrlSync) return;

    const selectedFreguesias = this.getSelectedFreguesias();
    const url = new URL(window.location);

    if (
      selectedFreguesias.length > 0 &&
      selectedFreguesias.length < this.allFreguesias.length
    ) {
      url.searchParams.set(this.urlParam, selectedFreguesias.join(","));
    } else {
      url.searchParams.delete(this.urlParam);
    }

    window.history.replaceState({}, "", url);
  }

  /**
   * Show error message in the container
   */
  showError(message) {
    const container = document.querySelector(this.containerSelector);
    if (container) {
      container.innerHTML = `<div class="alert alert-danger small" role="alert">${message}</div>`;
    }
  }

  /**
   * Show warning message in the container
   */
  showWarning(message) {
    const container = document.querySelector(this.containerSelector);
    if (container) {
      container.innerHTML = `<div class="alert alert-warning small" role="alert">${message}</div>`;
    }
  }

  /**
   * Destroy the filter and clean up event listeners
   */
  destroy() {
    // Remove event listeners
    const selectAllCheckbox = document.querySelector(this.selectAllSelector);
    if (selectAllCheckbox) {
      selectAllCheckbox.removeEventListener(
        "change",
        this.boundOnSelectAllChange,
      );
    }

    const checkboxes = document.querySelectorAll(
      `${this.containerSelector} input[type="checkbox"]`,
    );
    checkboxes.forEach((checkbox) => {
      checkbox.removeEventListener("change", this.boundOnFreguesiasChange);
    });

    // Clear container
    const container = document.querySelector(this.containerSelector);
    if (container) {
      container.innerHTML = "";
    }

    this.initialized = false;
  }
}

/**
 * Helper function to create and initialize a freguesia filter
 */
export async function createFreguesiasFilter(options) {
  const filter = new FreguesiasFilter(options);
  await filter.initialize();
  return filter;
}
