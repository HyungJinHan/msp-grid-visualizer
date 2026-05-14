import { processCSVData } from "./utils/dataUtils.js";
import { MapManager } from "./utils/mapManager.js";
import {
  calculatePolygonArea,
  parseWKTToLatLngs,
  updateLabelScales,
} from "./utils/mapUtils.js";
import { UIManager } from "./utils/uiManager.js";

window.onerror = function (msg, url, line) {
  uiManager.updateStatus("에러: " + msg + " (L:" + line + ")", true);
};

const mapManager = new MapManager();
const uiManager = new UIManager(
  document.getElementById("status"),
  document.getElementById("details"),
);

// 패널 토글 로직
const toggleBtn = document.getElementById("togglePanel");
const controlPanel = document.getElementById("controlPanel");

toggleBtn.onclick = () => {
  controlPanel.classList.toggle("active");
};

// 격자 클릭 시 패널 열기 (모바일 대응)
mapManager.map.on("popupopen", () => {
  if (window.innerWidth <= 600) {
    controlPanel.classList.add("active");
  }
});

// 지도 빈 곳 클릭 시 선택 해제
mapManager.map.on("click", () => {
  mapManager.clearSelection();
  uiManager.showDetails("상세 격자(파란색)를 클릭하면 정보가 나타납니다.");
});

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

  // 선택된 격자가 있다면 하이라이트 재적용
  if (mapManager.selectedLayer) {
    mapManager.highlightGrid(mapManager.selectedLayer);
  }
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

var csvPath = "csv/해양수산부_해양공간관리계획도격자_20240307.csv";

Papa.parse(csvPath, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: handleCSVComplete,
  error: function () {
    uiManager.updateStatus("자동 로드 실패 (파일 직접 선택)", true);
  },
});

document.getElementById("fileInput").onchange = function (e) {
  Papa.parse(e.target.files[0], {
    header: true,
    skipEmptyLines: true,
    complete: handleCSVComplete,
  });
};
