# Refactoring Guide: Map Visualization Modules

This document describes the refactoring work done to extract reusable functionality from the parques infantis map visualization into modular, reusable JavaScript components.

## Overview

The original `parques-infantis/mapa.html` file contained all functionality inline. We've extracted key functionality into reusable modules to enable easier development of similar visualizations.

## What Was Refactored

### 1. Freguesias Filter Module (`assets/js/freguesia-filter.js`)

**Original Code:** 336 lines of inline JavaScript functions for freguesias filtering
**New Module:** Reusable `FreguesiasFilter` class with comprehensive API

**Extracted Functions:**
- `populateFreguesiasFilter()`
- `updateSelectAllCheckbox()`
- `onFreguesiasChange()`
- `onSelectAllChange()`
- `applyFreguesiasFilter()`
- `zoomToSelectedFreguesias()`
- `getSelectedFreguesiasFromURL()`
- `updateURLWithFreguesias()`
- `getAllFreguesias()`

**Benefits:**
- ✅ Configurable for different data sources and layers
- ✅ URL state management built-in
- ✅ Error handling and user feedback
- ✅ Event callbacks for custom functionality
- ✅ Easy integration with Bootstrap UI components

### 2. Popup Utilities Module (`assets/js/popup-utils.js`)

**Original Code:** Inline popup creation with hardcoded HTML
**New Module:** Flexible popup system with formatters and managers

**Extracted Functions:**
- `handlePlaygroundClick()` → `createPlaygroundPopup()`
- `handleH3Click()` → `createH3Popup()`

**New Features:**
- Generic popup factory functions
- Data formatters for common types (distance, counts, yes/no, etc.)
- Popup manager for handling multiple popups
- Configurable field mapping

## Migration Guide

### Using the Freguesias Filter

**Before (inline):**
```javascript
// 336 lines of inline functions
function populateFreguesiasFilter() { /* ... */ }
function applyFreguesiasFilter() { /* ... */ }
// ... many more functions
```

**After (modular):**
```javascript
import { createFreguesiasFilter } from "/assets/js/freguesia-filter.js";

const filter = await createFreguesiasFilter({
    map: mapInstance,
    containerSelector: "#freguesias-filter",
    selectAllSelector: "#select-all-freguesias",
    sourceId: "playgrounds",
    sourceLayer: "h3",
    layerId: "h3-hexagons",
    onFilterChange: (selectedFreguesias) => {
        // Custom logic when filter changes
    }
});
```

### Using Popup Utilities

**Before (inline):**
```javascript
new maplibregl.Popup()
    .setLngLat(coordinates)
    .setHTML(`
        <div class="playground-popup">
            <h6>${properties.designacao || "Parque Infantil"}</h6>
            <p><strong>Gestão:</strong> ${gestaoLabel}</p>
            // ... hardcoded HTML
        </div>
    `)
    .addTo(map);
```

**After (modular):**
```javascript
import { createPlaygroundPopup, PopupManager } from "/assets/js/popup-utils.js";

const popupManager = new PopupManager(map);
const popup = createPlaygroundPopup(properties, coordinates);
popup.addTo(map);
```

## File Structure Changes

```
dados-lisboa/site/assets/js/
├── core.js                    # Existing utilities
├── map.js                     # Existing map initialization
├── freguesia-filter.js        # NEW: Reusable freguesias filter
├── popup-utils.js            # NEW: Popup utilities and formatters
├── freguesia-filter-example.html  # NEW: Usage example
└── README.md                 # NEW: Documentation
```

## Configuration Options

### Freguesias Filter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `map` | MapLibre Map | **required** | The map instance |
| `containerSelector` | string | `#freguesias-filter` | CSS selector for filter container |
| `selectAllSelector` | string | `#select-all-freguesias` | CSS selector for select all checkbox |
| `sourceId` | string | `playgrounds` | Map source ID |
| `sourceLayer` | string | `h3` | Source layer name |
| `layerId` | string | `h3-hexagons` | Map layer ID to filter |
| `freguesiasProperty` | string | `freguesias` | Property containing freguesia data |
| `urlParam` | string | `freguesias` | URL parameter for state sync |
| `onFilterChange` | function | `() => {}` | Callback when filter applied |
| `onSelectionChange` | function | `() => {}` | Callback when selection changes |
| `enableZoom` | boolean | `true` | Enable auto-zoom to selection |
| `enableUrlSync` | boolean | `true` | Enable URL state sync |

### Popup Utilities Features

- **Data formatters:** Distance, counts, yes/no, lists, numbers, text
- **Multiple popup types:** Playground, H3, generic
- **Popup management:** Automatic cleanup, single popup enforcement
- **Flexible configuration:** Custom field mapping and styling

## Benefits of Refactoring

### Code Reusability
- ✅ Same freguesias filter can be used across different visualizations
- ✅ Popup utilities work with any feature properties
- ✅ Consistent behavior across all maps

### Maintainability
- ✅ Single source of truth for filter logic
- ✅ Easier testing and debugging
- ✅ Clear separation of concerns

### Developer Experience
- ✅ Well-documented APIs
- ✅ TypeScript-style JSDoc comments
- ✅ Example code and usage patterns
- ✅ Error handling and user feedback

### Performance
- ✅ Reusable modules are cached by browser
- ✅ Smaller individual page sizes
- ✅ Better code organization

## Creating New Visualizations

### 1. Basic Setup
```javascript
import { createFreguesiasFilter } from "/assets/js/freguesia-filter.js";
import { createGenericPopup } from "/assets/js/popup-utils.js";

// Initialize your map
const map = new maplibregl.Map(/* config */);

// Add your data layers
map.addSource("your-data", { /* config */ });
map.addLayer({ /* your layer config */ });
```

### 2. Add Freguesias Filter
```javascript
const filter = await createFreguesiasFilter({
    map,
    sourceId: "your-data",
    sourceLayer: "your-layer",
    layerId: "your-display-layer",
    freguesiasProperty: "freguesias", // or your property name
    onFilterChange: (selected) => {
        // Custom logic for your visualization
        updateOtherLayers(selected);
    }
});
```

### 3. Add Popups
```javascript
import { createGenericPopup } from "/assets/js/popup-utils.js";

map.on("click", "your-layer", (e) => {
    const popup = createGenericPopup(
        e.features[0].properties,
        e.lngLat,
        {
            title: "Your Feature Title",
            fieldMapping: [
                { label: "Name", property: "name" },
                { label: "Type", property: "type" },
                { label: "Count", property: "count", formatter: formatters.number }
            ],
            cssClass: "your-popup-class"
        }
    );
    popup.addTo(map);
});
```

## Required HTML Structure

### Freguesias Filter
```html
<!-- Select all checkbox -->
<input class="form-check-input" type="checkbox" id="select-all-freguesias" checked />
<label class="form-check-label fw-semibold" for="select-all-freguesias">
    Selecionar Todas
</label>

<!-- Filter container -->
<div id="freguesias-filter" class="overflow-auto" style="max-height: 200px;">
    <!-- Individual checkboxes generated dynamically -->
</div>
```

### CSS Classes
The modules work with Bootstrap classes but you can customize:
```css
.form-check { /* Individual checkbox containers */ }
.form-check-input { /* Checkbox inputs */ }
.form-check-label { /* Checkbox labels */ }
.playground-popup { /* Playground popup styling */ }
.h3-popup { /* H3 popup styling */ }
```

## Error Handling

The modules include comprehensive error handling:
- Missing required parameters throw helpful errors
- Missing DOM elements show user-friendly messages
- Data parsing errors are handled gracefully
- Map interaction errors log warnings without breaking

## Browser Compatibility

The modules use modern JavaScript features:
- ES6 modules (`import`/`export`)
- Async/await
- Template literals
- Destructuring
- Arrow functions

Ensure your target browsers support these or use appropriate polyfills.

## Next Steps

### Potential Future Extractions
1. **Map initialization utilities** - Standardize PMTiles setup
2. **Legend components** - Reusable legend generation
3. **Data loading utilities** - Standardize data fetching and processing
4. **Layer management** - Common layer operations and styling

### Enhancement Opportunities
1. **TypeScript conversion** - Add type safety
2. **Unit tests** - Test coverage for modules
3. **React/Vue components** - Framework-specific wrappers
4. **Theme system** - Consistent styling across visualizations

This refactoring provides a solid foundation for building additional map visualizations while maintaining consistency and reducing development time.