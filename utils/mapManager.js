export class MapManager {
  constructor() {
    this.darkMap = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "&copy; CARTO" },
    );
    this.lightMap = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "&copy; OSM" },
    );
    this.satelliteMap = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "&copy; Esri" },
    );
    this.googleMap = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
      { attribution: "&copy; Google" },
    );

    this.map = L.map("map", {
      center: [34.5, 127],
      zoom: 7,
      layers: [this.darkMap],
    });

    this.largeLayer = L.featureGroup().addTo(this.map);
    this.smallLayer = L.featureGroup().addTo(this.map);
    this.selectedLayer = null;

    this._setupControls();
  }

  _setupControls() {
    const baseMaps = {
      CARTO: this.darkMap,
      OSM: this.lightMap,
      Esri: this.satelliteMap,
      "Google Satellite": this.googleMap,
    };
    L.control.layers(baseMaps, null, { position: "topleft" }).addTo(this.map);
  }

  highlightGrid(layer) {
    const defaultColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--small-grid-color")
      .trim();

    // 이전 선택 해제
    this.clearSelection();

    // 새로운 선택 강조
    this.selectedLayer = layer;
    if (this.selectedLayer) {
      this.selectedLayer.setStyle({
        weight: 3,
        fillOpacity: 0.6,
        color: defaultColor,
        fillColor: defaultColor,
      });
      this.selectedLayer.bringToFront();
    }
  }

  clearSelection() {
    if (!this.selectedLayer) return;

    const defaultColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--small-grid-color")
      .trim();

    this.selectedLayer.setStyle({
      weight: 1,
      fillOpacity: 0.15,
      color: defaultColor,
      fillColor: defaultColor,
    });
    this.selectedLayer = null;
  }

  getLayers() {
    return { largeLayer: this.largeLayer, smallLayer: this.smallLayer };
  }

  fitBounds(bounds) {
    if (bounds.isValid()) this.map.fitBounds(bounds);
  }
}
