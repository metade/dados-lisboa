/**
 * Popup Utilities Module
 *
 * This module provides reusable utilities for creating and managing
 * MapLibre GL JS popups in map visualizations.
 */

/**
 * Create a standardized popup HTML structure
 * @param {Object} options - Popup configuration
 * @param {string} options.title - Popup title
 * @param {Array} options.fields - Array of field objects with {label, value, format}
 * @param {string} options.cssClass - Optional CSS class for popup styling
 * @returns {string} HTML string for popup content
 */
export function createPopupHTML({
  title,
  fields = [],
  cssClass = "map-popup",
}) {
  const fieldsHTML = fields
    .filter((field) => field.value !== null && field.value !== undefined)
    .map((field) => {
      let displayValue = field.value;

      // Apply formatting if specified
      if (field.format) {
        displayValue = field.format(field.value);
      }

      return `<p class="mb-0"><strong>${field.label}:</strong> ${displayValue}</p>`;
    })
    .join("");

  return `
        <div class="${cssClass}">
            <h6>${title}</h6>
            ${fieldsHTML}
        </div>
    `;
}

/**
 * Standard formatters for common data types
 */
export const formatters = {
  /**
   * Format distance in meters with appropriate units
   * @param {number} meters - Distance in meters
   * @returns {string} Formatted distance string
   */
  distance: (meters) => {
    if (meters == null) return "N/A";
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  },

  /**
   * Format count with singular/plural handling
   * @param {number} count - Count value
   * @param {string} singular - Singular form
   * @param {string} plural - Plural form
   * @returns {string} Formatted count string
   */
  count: (count, singular = "item", plural = "items") => {
    if (count == null) return "0 " + plural;
    return `${count} ${count === 1 ? singular : plural}`;
  },

  /**
   * Format boolean as yes/no (Portuguese)
   * @param {boolean} value - Boolean value
   * @returns {string} "Sim" or "Não"
   */
  yesNo: (value) => {
    if (value == null) return "N/A";
    return value ? "Sim" : "Não";
  },

  /**
   * Format array as comma-separated list
   * @param {Array} array - Array to format
   * @param {string} separator - Separator string (default: ', ')
   * @returns {string} Formatted list
   */
  list: (array, separator = ", ") => {
    if (!Array.isArray(array)) return "N/A";
    return array.length > 0 ? array.join(separator) : "Nenhum";
  },

  /**
   * Format number with locale-specific formatting
   * @param {number} number - Number to format
   * @param {Object} options - Intl.NumberFormat options
   * @returns {string} Formatted number
   */
  number: (number, options = {}) => {
    if (number == null) return "N/A";
    return new Intl.NumberFormat("pt-PT", options).format(number);
  },

  /**
   * Capitalize first letter of each word
   * @param {string} text - Text to capitalize
   * @returns {string} Capitalized text
   */
  capitalize: (text) => {
    if (!text) return "N/A";
    return text.replace(/\b\w/g, (l) => l.toUpperCase());
  },
};

/**
 * Create a generic popup from feature properties
 * @param {Object} properties - Feature properties
 * @param {Object} coordinates - Feature coordinates [lng, lat]
 * @param {Object} config - Popup configuration
 * @param {string} config.title - Popup title
 * @param {Array} config.fieldMapping - Array of field mapping objects
 * @param {string} config.cssClass - CSS class for styling
 * @returns {maplibregl.Popup} Configured popup
 */
export function createGenericPopup(properties, coordinates, config) {
  const fields = config.fieldMapping.map((mapping) => ({
    label: mapping.label,
    value: properties[mapping.property],
    format: mapping.formatter || ((val) => val),
  }));

  const html = createPopupHTML({
    title: config.title,
    fields,
    cssClass: config.cssClass || "generic-popup",
  });

  return new maplibregl.Popup().setLngLat(coordinates).setHTML(html);
}

/**
 * Add popup interaction to a map layer
 * @param {maplibregl.Map} map - Map instance
 * @param {string} layerId - Layer ID to add popup to
 * @param {Function} popupFactory - Function that creates popup from feature
 * @param {Object} options - Additional options
 */
export function addPopupToLayer(map, layerId, popupFactory, options = {}) {
  const cursor = options.cursor || "pointer";

  // Change cursor on hover
  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = cursor;
  });

  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
  });

  // Add click handler
  map.on("click", layerId, (e) => {
    const feature = e.features[0];
    if (!feature) return;

    const coordinates = e.lngLat;
    const popup = popupFactory(feature.properties, coordinates, e);

    if (popup) {
      popup.addTo(map);
    }
  });
}

/**
 * Popup manager class for handling multiple popups
 */
export class PopupManager {
  constructor(map) {
    this.map = map;
    this.currentPopup = null;
    this.popupFactories = new Map();
  }

  /**
   * Register a popup factory for a layer
   * @param {string} layerId - Layer ID
   * @param {Function} factory - Popup factory function
   * @param {Object} options - Options for the popup
   */
  registerLayer(layerId, factory, options = {}) {
    this.popupFactories.set(layerId, { factory, options });
    addPopupToLayer(
      this.map,
      layerId,
      (properties, coordinates, event) => {
        this.closeCurrentPopup();
        const popup = factory(properties, coordinates, event);
        this.currentPopup = popup;
        return popup;
      },
      options,
    );
  }

  /**
   * Close the current popup if one exists
   */
  closeCurrentPopup() {
    if (this.currentPopup) {
      this.currentPopup.remove();
      this.currentPopup = null;
    }
  }

  /**
   * Get the currently active popup
   * @returns {maplibregl.Popup|null} Current popup or null
   */
  getCurrentPopup() {
    return this.currentPopup;
  }

  /**
   * Clean up all popup interactions
   */
  destroy() {
    this.closeCurrentPopup();

    // Remove event listeners for all registered layers
    for (const [layerId, config] of this.popupFactories) {
      this.map.off("mouseenter", layerId);
      this.map.off("mouseleave", layerId);
      this.map.off("click", layerId);
    }

    this.popupFactories.clear();
  }
}

/**
 * Default popup styles (CSS)
 * Import this or include in your stylesheet
 */
export const defaultPopupCSS = `
.map-popup h6 {
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
}

.map-popup p {
    margin-bottom: 0.25rem;
    color: #666;
    font-size: 0.9rem;
}

.playground-popup h6 {
    color: #2c5530;
}

.h3-popup h6 {
    color: #1e4a73;
}

.maplibregl-popup-content {
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.maplibregl-popup-tip {
    border-top-color: #fff;
}
`;
