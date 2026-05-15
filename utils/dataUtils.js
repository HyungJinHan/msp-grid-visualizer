export function getWktKey(data) {
  if (data.length === 0) return "";
  const keys = Object.keys(data[0]);
  for (let k = 0; k < keys.length; k++) {
    const cleanK = keys[k].trim().replace(/^\ufeff/, "");
    if (cleanK === "공간정보") return keys[k];
  }
  return "";
}

export function parseRowProps(row) {
  const props = {};
  for (const key in row) {
    props[key.trim().replace(/^\ufeff/, "")] = (row[key] || "")
      .toString()
      .trim();
  }
  return props;
}

export function formatDetailsHTML(props) {
  let h =
    '<strong>상세 정보</strong><hr style="border:0;border-top:1px solid #444;margin:10px 0;">';
  for (const k in props) {
    if (k !== "공간정보") {
      h += `<div class="row"><span class="lbl">${k}</span><span class="val">${props[k]}</span></div>`;
    }
  }
  return h;
}

export function processCSVData(
  results,
  {
    largeLayer,
    smallLayer,
    mapManager,
    uiManager,
    parseWKTToLatLngs,
    calculatePolygonArea,
  },
) {
  try {
    uiManager.showLoader(true); // 로딩 시작

    largeLayer.clearLayers();
    smallLayer.clearLayers();
    mapManager.gridIndex = {}; // 인덱스 초기화

    var data = results.data;
    var wktKey = getWktKey(data);
    var opacity = document.getElementById("opacityRange").value;

    var cL = 0,
      cS = 0;

    // 배치 처리를 위해 비동기 처리 고려 가능하지만 여기서는 일단 동기
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
          opacity: opacity,
          fillColor: color,
          fillOpacity: opacity * 0.25,
          dataProps: props, // 내보내기를 위해 데이터 저장
        }).addTo(smallLayer);

        // 검색용 인덱스 생성
        mapManager.gridIndex[gridName] = poly;

        var nameParts = gridName.split("-");
        if (nameParts.length >= 3) {
          var shortName = nameParts[nameParts.length - 1];
          poly.bindTooltip(shortName, {
            permanent: true,
            direction: "center",
            className: "small-grid-label",
          });
        }

        // 마우스 오버 효과
        poly.on("mouseover", function () {
          if (mapManager.selectedLayer !== poly) {
            poly.setStyle({ weight: 2, fillOpacity: opacity * 0.5 });
          }
        });
        poly.on("mouseout", function () {
          if (mapManager.selectedLayer !== poly) {
            poly.setStyle({ weight: 1, fillOpacity: opacity * 0.25 });
          }
        });

        poly.on("click", function (e) {
          L.DomEvent.stopPropagation(e);
          mapManager.highlightGrid(poly);
          var area = calculatePolygonArea(latlngs);
          var html = formatDetailsHTML(props);
          html += `<div class="grid-area" style="margin-top:10px; font-weight:bold; color:#00d2ff;">면적: ${area.toFixed(2)} km²</div>`;
          html += `<div class="lbl">영해 내측 해양공간*은 3′(약 5km)✕3′</div>`;
          html += `<div class="lbl">배타적 경제수역 경계 내측 해양공간은 15′(약 25km)✕15′</div>`;
          uiManager.showDetails(html);
        });
        cS++;
      }
    });

    largeLayer.bringToFront();
    if (cL + cS > 0) {
      var bounds = L.featureGroup([largeLayer, smallLayer]).getBounds();
      mapManager.fitBounds(bounds);
      uiManager.updateStatus("완료 (대형:" + cL + ", 상세:" + cS + ")");
    }

    uiManager.showLoader(false); // 로딩 종료
  } catch (e) {
    uiManager.showLoader(false);
    uiManager.updateStatus("에러: " + e.message, true);
  }
}
