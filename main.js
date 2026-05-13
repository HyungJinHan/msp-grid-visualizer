import {
  formatDetailsHTML,
  getWktKey,
  parseRowProps,
} from "./utils/dataUtils.js";
import {
  calculatePolygonArea,
  parseWKTToLatLngs,
  updateLabelScales,
} from "./utils/mapUtils.js";

window.onerror = function (msg, url, line) {
  var s = document.getElementById("status");
  if (s) {
    s.textContent = "에러: " + msg + " (L:" + line + ")";
    s.className = "status err";
  }
};

// 1. 베이스 맵 정의
var darkMap = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  { attribution: "&copy; CARTO" },
);
var lightMap = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { attribution: "&copy; OSM" },
);
var satelliteMap = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { attribution: "&copy; Esri" },
);
var googleMap = L.tileLayer(
  "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
  { attribution: "&copy; Google" },
);

// 2. 지도 초기화
var map = L.map("map", {
  center: [34.5, 127],
  zoom: 7,
  layers: [darkMap],
});

// 3. 레이어 컨트롤
var baseMaps = {
  "어두운 지도": darkMap,
  "일반 지도": lightMap,
  "위성 지도": satelliteMap,
  "구글 위성 지도": googleMap,
};
L.control.layers(baseMaps, null, { position: "topleft" }).addTo(map);

// 4. 동적 스타일 처리
var currentTheme = "dark";
var statusEl = document.getElementById("status");
var detailsEl = document.getElementById("details");
var largeLayer = L.featureGroup().addTo(map);
var smallLayer = L.featureGroup().addTo(map);

map.on("baselayerchange", function (e) {
  if (e.name === "일반 지도" || e.name === "구글 위성 지도") {
    currentTheme = "light";
    document.documentElement.style.setProperty("--small-grid-color", "orange");
    if (e.name === "일반 지도") {
      document.documentElement.style.setProperty(
        "--large-grid-color",
        "rgba(0, 0, 0, 0.5)",
      );
    }
  } else {
    currentTheme = "dark";
    document.documentElement.style.setProperty("--small-grid-color", "#00d2ff");
    document.documentElement.style.setProperty(
      "--large-grid-color",
      "rgba(255, 255, 255, 0.7)",
    );
  }

  var color = getComputedStyle(document.documentElement)
    .getPropertyValue("--small-grid-color")
    .trim();
  var colorL = getComputedStyle(document.documentElement)
    .getPropertyValue("--large-grid-color")
    .trim();

  // 기존 레이어 스타일 업데이트
  smallLayer.setStyle({
    color: color,
    fillColor: color,
  });
  largeLayer.setStyle({
    color: colorL,
  });
});

map.on("zoomend", () => updateLabelScales(map));
updateLabelScales(map);

export function processCSV(results) {
  try {
    largeLayer.clearLayers();
    smallLayer.clearLayers();

    var data = results.data;
    var wktKey = getWktKey(data);

    var cL = 0,
      cS = 0;
    data.forEach(function (row) {
      var latlngs = parseWKTToLatLngs(row[wktKey]);
      if (!latlngs) return;

      var props = parseRowProps(row);
      var isL = (props["격자분류명"] || "").indexOf("250000") !== -1;
      var gridName = props["격자명"] || "";

      if (isL) {
        var colorL = "white";
        var poly = L.polygon(latlngs, {
          color: colorL,
          weight: 2,
          opacity: 0.3,
          fillOpacity: 0,
          interactive: false,
        }).addTo(largeLayer);
        poly.bindTooltip(gridName, {
          permanent: true,
          direction: "center",
          className: "large-grid-label",
        });
        cL++;
      } else {
        var color = "#00d2ff";
        var poly = L.polygon(latlngs, {
          color: color,
          weight: 1,
          opacity: 0.6,
          fillColor: color,
          fillOpacity: 0.15,
        }).addTo(smallLayer);

        var nameParts = gridName.split("-");
        if (nameParts.length >= 3) {
          var shortName = nameParts[nameParts.length - 1];
          poly.bindTooltip(shortName, {
            permanent: true,
            direction: "center",
            className: "small-grid-label",
          });
        }
        poly.on("click", function (e) {
          L.DomEvent.stopPropagation(e);
          var area = calculatePolygonArea(latlngs);
          var html = formatDetailsHTML(props);
          html += `<div class="grid-area">면적: ${area.toFixed(2)} km²</div>`;
          detailsEl.innerHTML = html;
        });
        cS++;
      }
    });

    largeLayer.bringToFront();
    if (cL + cS > 0) {
      var bounds = L.featureGroup([largeLayer, smallLayer]).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds);
      statusEl.textContent = "완료 (대형:" + cL + ", 상세:" + cS + ")";
      statusEl.className = "status ok";
    }
  } catch (e) {
    statusEl.textContent = "에러: " + e.message;
    statusEl.className = "status err";
  }
}

var csvPath = "csv/해양수산부_해양공간관리계획도격자_20240307.csv";
Papa.parse(csvPath, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: processCSV,
  error: function () {
    statusEl.textContent = "자동 로드 실패 (파일 직접 선택)";
    statusEl.className = "status err";
  },
});

document.getElementById("fileInput").onchange = function (e) {
  Papa.parse(e.target.files[0], {
    header: true,
    skipEmptyLines: true,
    complete: processCSV,
  });
};
