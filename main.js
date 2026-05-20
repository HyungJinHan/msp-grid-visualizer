import { processCSVData } from "./utils/dataUtils.js";
import { MapManager } from "./utils/mapManager.js";
import {
  calculatePolygonArea,
  parseWKTToLatLngs,
  updateLabelScales,
} from "./utils/mapUtils.js";
import { UIManager } from "./utils/uiManager.js";

const CSV_FILE = "data";
const EXPORT_NAME = "해양수산부_해양공간관리계획도격자_20240307";

window.onerror = function (msg, url, line) {
  uiManager.updateStatus("에러: " + msg + " (L:" + line + ")", true);
};

const mapManager = new MapManager();
const uiManager = new UIManager(
  document.getElementById("status"),
  document.getElementById("details"),
);

// 1. 패널 토글 로직
const toggleBtn = document.getElementById("togglePanel");
const controlPanel = document.getElementById("controlPanel");
toggleBtn.onclick = () => controlPanel.classList.toggle("active");

// 2. 격자 클릭 시 패널 열기 (모바일 대응)
mapManager.map.on("popupopen", () => {
  if (window.innerWidth <= 600) controlPanel.classList.add("active");
});

// 3. 지도 빈 곳 클릭 시 선택 해제
mapManager.map.on("click", () => {
  mapManager.clearSelection();
  uiManager.showDetails("상세 격자(파란색)를 클릭하면 정보가 나타납니다.");
});

// 4. 검색 기능
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

function handleSearch() {
  const query = searchInput.value.trim();
  const poly = mapManager.gridIndex[query];
  if (poly) {
    mapManager.map.fitBounds(poly.getBounds());
    mapManager.highlightGrid(poly);
    poly.fire("click"); // 정보 표시 트리거
  } else {
    alert("해당 격자를 찾을 수 없습니다.");
  }
}
searchBtn.onclick = handleSearch;
searchInput.onkeypress = (e) => {
  if (e.key === "Enter") handleSearch();
};

// 5. 투명도 조절
const opacityRange = document.getElementById("opacityRange");
opacityRange.oninput = (e) => mapManager.updateOpacity(e.target.value);

// 6. 내 위치 찾기
document.getElementById("locateBtn").onclick = () => mapManager.locateUser();

// 7. 데이터 내보내기 (GeoJSON)
document.getElementById("exportBtn").onclick = () => {
  const { smallLayer } = mapManager.getLayers();
  const layers = smallLayer.getLayers();

  if (layers.length === 0) return alert("내보낼 데이터가 없습니다.");

  const features = layers.map((l) => {
    const geojson = l.toGeoJSON();
    // 저장해둔 속성 정보를 GeoJSON properties에 삽입
    geojson.properties = l.options.dataProps || {};
    return geojson;
  });

  const featureCollection = {
    type: "FeatureCollection",
    features: features,
  };

  const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
    type: "application/geo+json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${EXPORT_NAME}.geojson`;
  a.click();
};

// 테마 변경 대응
mapManager.map.on("baselayerchange", function (e) {
  uiManager.updateTheme(e.name);
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue("--small-grid-color")
    .trim();
  const colorL = getComputedStyle(document.documentElement)
    .getPropertyValue("--large-grid-color")
    .trim();
  const { largeLayer, smallLayer } = mapManager.getLayers();

  smallLayer.setStyle({ color: color, fillColor: color });
  largeLayer.setStyle({ color: colorL });
  if (mapManager.selectedLayer)
    mapManager.highlightGrid(mapManager.selectedLayer);
});

mapManager.map.on("zoomend", () => updateLabelScales(mapManager.map));
updateLabelScales(mapManager.map);

function handleCSVComplete(results) {
  const { largeLayer, smallLayer } = mapManager.getLayers();
  processCSVData(results, {
    largeLayer,
    smallLayer,
    mapManager,
    uiManager,
    parseWKTToLatLngs,
    calculatePolygonArea,
  });
}

// 자동 로드
var csvPath = `csv/${CSV_FILE}.csv`;
uiManager.showLoader(true);
Papa.parse(csvPath, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: handleCSVComplete,
  error: () => {
    uiManager.showLoader(false);
    uiManager.updateStatus("자동 로드 실패 (파일 직접 선택)", true);
  },
});

document.getElementById("fileInput").onchange = function (e) {
  uiManager.showLoader(true);
  Papa.parse(e.target.files[0], {
    header: true,
    skipEmptyLines: true,
    complete: handleCSVComplete,
  });
};
