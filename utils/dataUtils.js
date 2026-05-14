
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
  let h = '<strong>상세 정보</strong><hr style="border:0;border-top:1px solid #444;margin:10px 0;">';
  for (const k in props) {
    if (k !== "공간정보") {
      h += `<div class="row"><span class="lbl">${k}</span><span class="val">${props[k]}</span></div>`;
    }
  }
  return h;
}

export function processCSVData(results, { largeLayer, smallLayer, mapManager, uiManager, parseWKTToLatLngs, calculatePolygonArea }) {
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
          mapManager.highlightGrid(poly); // 격자 강조
          var area = calculatePolygonArea(latlngs);
          var html = formatDetailsHTML(props);
          html += `<div class="grid-area">면적: ${area.toFixed(2)} km²</div>`;
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
  } catch (e) {
    uiManager.updateStatus("에러: " + e.message, true);
  }
}
