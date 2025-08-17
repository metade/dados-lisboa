# JavaScript Modules Documentation

This directory contains reusable JavaScript modules for the dados-lisboa project.

## freguesia-filter.js

A reusable module for creating freguesias (parishes) filters in map visualizations.

### Features

- **Dynamic filter generation**: Automatically extracts freguesias from map data
- **Multi-format support**: Handles arrays, JSON strings, and simple strings for freguesia data
- **URL state management**: Syncs filter state with URL parameters
- **Auto-zoom functionality**: Automatically zooms to selected freguesias
- **Bootstrap integration**: Works seamlessly with Bootstrap form components
- **Event callbacks**: Provides hooks for custom functionality
- **Error handling**: Graceful error handling with user-friendly messages

### Basic Usage

```javascript
import { createFreguesiasFilter } from "/assets/js/freguesia-filter.js";

// Initialize after map is ready
const filter = await createFreguesiasFilter({
    map: mapInstance,
    containerSelector: "#freguesias-filter",
    selectAllSelector: "#select-all-freguesias"
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `map` | MapLibre Map | **required** | The map instance |
| `containerSelector` | string | `#freguesias-filter` | CSS selector for the filter container |
| `selectAllSelector` | string | `#select-all-freguesias` | CSS selector for the "select all" checkbox |
| `sourceId` | string | `playgrounds` | Map source ID containing the data |
| `sourceLayer` | string | `h3` | Source layer name within the PMTiles |
| `layerId` | string | `h3-hexagons` | Map layer ID to filter |
| `freguesiasProperty` | string | `freguesias` | Property name containing freguesia data |
| `urlParam` | string | `freguesias` | URL parameter name for state sync |
| `onFilterChange` | function | `() => {}` | Callback when filter is applied |
| `onSelectionChange` | function | `() => {}` | Callback when selection changes |
| `enableZoom` | boolean | `true` | Enable auto-zoom to selected freguesias |
| `skipInitialZoom` | boolean | `false` | Skip zoom on first filter application |
| `enableUrlSync` | boolean | `true` | Enable URL state synchronization |

### Required HTML Structure

The module expects specific HTML elements to be present:

```html
<!-- Container for individual freguesia checkboxes -->
<div id="freguesias-filter" class="overflow-auto" style="max-height: 200px">
    <!-- Checkboxes will be dynamically generated here -->
</div>

<!-- Select all checkbox (optional but recommended) -->
<input class="form-check-input" type="checkbox" id="select-all-freguesias" checked />
<label class="form-check-label fw-semibold" for="select-all-freguesias">
    Selecionar Todas
</label>
```

### Advanced Usage

```javascript
import { FreguesiasFilter } from "/assets/js/freguesia-filter.js";

const filter = new FreguesiasFilter({
    map: mapInstance,
    containerSelector: "#my-filter",
    selectAllSelector: "#my-select-all",
    sourceId: "my-data-source",
    sourceLayer: "districts",
    layerId: "district-polygons",
    freguesiasProperty: "district_name",
    urlParam: "districts",
    onFilterChange: (selectedFreguesias) => {
        console.log("Filter applied:", selectedFreguesias);
        // Custom logic when filter changes
        updateMapLayers(selectedFreguesias);
    },
    onSelectionChange: (selectedFreguesias) => {
        console.log("Selection changed:", selectedFreguesias);
        // Custom logic when selection changes
        updateUI(selectedFreguesias);
    },
    enableZoom: true,
    skipInitialZoom: false, // Set to true if you handle initial zoom elsewhere
    enableUrlSync: true
});

// Initialize manually
await filter.initialize();

// Get current selection
const selected = filter.getSelectedFreguesias();

// Set selection programmatically
filter.setSelectedFreguesias(["Alvalade", "Campo de Ourique"]);

// Get all available freguesias
const all = filter.getAllFreguesias();

// Clean up when done
filter.destroy();
```

### Data Format Support

The module automatically handles different freguesia data formats:

**Array format:**
```json
{
  "freguesias": ["Alvalade", "Campo de Ourique"]
}
```

**JSON string format:**
```json
{
  "freguesias": "[\"Alvalade\", \"Campo de Ourique\"]"
}
```

**Simple string format:**
```json
{
  "freguesias": "Alvalade"
}
```

### API Reference

#### FreguesiasFilter Class

##### Methods

- `constructor(options)` - Create a new filter instance
- `initialize()` - Initialize the filter (async)
- `getSelectedFreguesias()` - Get array of selected freguesia names
- `getAllFreguesias()` - Get array of all available freguesia names
- `setSelectedFreguesias(freguesias)` - Set selected freguesias programmatically
- `destroy()` - Clean up event listeners and DOM

##### Events

The module provides callback options for custom functionality:

- `onFilterChange(selectedFreguesias)` - Called when map filter is applied
- `onSelectionChange(selectedFreguesias)` - Called when selection changes

#### Helper Functions

- `createFreguesiasFilter(options)` - Create and initialize filter in one call

### Integration with Other Visualizations

To use this module in other map visualizations:

1. **Include the module** in your HTML:
   ```html
   <script type="module">
   import { createFreguesiasFilter } from "/assets/js/freguesia-filter.js";
   </script>
   ```

2. **Add the required HTML structure** for the filter UI

3. **Initialize after your map is ready**:
   ```javascript
   window.addEventListener("mapReady", async (event) => {
       const map = event.detail;
       
       // Add your layers first
       // ...
       
       // Then initialize the filter
       const filter = await createFreguesiasFilter({
           map,
           sourceId: "your-source-id",
           sourceLayer: "your-layer",
           layerId: "your-filter-layer",
           // ... other options
       });
   });
   ```

### Error Handling

The module includes comprehensive error handling:

- **Missing map instance**: Throws error during initialization
- **Missing DOM elements**: Shows helpful error messages
- **No freguesia data**: Shows user-friendly warning
- **Data parsing errors**: Gracefully handles malformed data
- **Map interaction errors**: Logs warnings without breaking functionality

### Browser Compatibility

This module uses modern JavaScript features:
- ES6 modules
- Async/await
- Arrow functions
- Template literals
- Destructuring

Ensure your target browsers support these features or use appropriate polyfills.