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

    // Canvas 렌더러 사용으로 성능 최적화
    this.canvasRenderer = L.canvas();

    this.map = L.map("map", {
      center: [34.5, 127],
      zoom: 7,
      layers: [this.darkMap],
      renderer: this.canvasRenderer,
    });

    this.largeLayer = L.featureGroup().addTo(this.map);
    this.smallLayer = L.featureGroup().addTo(this.map);
    this.selectedLayer = null;
    this.userMarker = null;
    this.gridIndex = {}; // 검색용 인덱스

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

    this.map.on("locationfound", (e) => {
      if (this.userMarker) {
        this.userMarker.setLatLng(e.latlng).openPopup();
      } else {
        this.userMarker = L.marker(e.latlng)
          .addTo(this.map)
          .bindPopup("현재 위치")
          .openPopup();
      }
    });

    this.map.on("locationerror", () => {
      alert("위치 정보를 가져올 수 없습니다.");
    });
  }

  highlightGrid(layer) {
    const defaultColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--small-grid-color")
      .trim();

    this.clearSelection();

    this.selectedLayer = layer;
    if (this.selectedLayer) {
      this.selectedLayer.setStyle({
        weight: 3,
        fillOpacity: 0.8,
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
    const opacity = document.getElementById("opacityRange").value;

    this.selectedLayer.setStyle({
      weight: 1,
      fillOpacity: opacity * 0.25,
      color: defaultColor,
      fillColor: defaultColor,
    });
    this.selectedLayer = null;
  }

  updateOpacity(value) {
    this.smallLayer.setStyle({
      fillOpacity: value * 0.25,
      opacity: value
    });

    if (this.selectedLayer) {
      this.selectedLayer.setStyle({ fillOpacity: value * 1.0 });
    }
  }

  locateUser() {
    this.map.locate({ setView: true, maxZoom: 13 });
  }

  getLayers() {
    return { largeLayer: this.largeLayer, smallLayer: this.smallLayer };
  }

  fitBounds(bounds) {
    if (bounds.isValid()) this.map.fitBounds(bounds);
  }
}
