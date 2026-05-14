export function parseWKTToLatLngs(wkt) {
  if (!wkt) return null;
  const nums = wkt.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!nums || nums.length < 6) return null;
  const latlngs = [];
  for (let i = 0; i < nums.length; i += 2) {
    const lng = parseFloat(nums[i]);
    const lat = parseFloat(nums[i + 1]);
    if (!isNaN(lng) && !isNaN(lat)) latlngs.push([lat, lng]);
  }
  return latlngs;
}

/**
 * Calculates the approximate area of a polygon (in square kilometers)
 * using the shoelace formula on spherical coordinates.
 */
export function calculatePolygonArea(latlngs) {
  if (!latlngs || latlngs.length < 3) return 0;

  const R = 6371; // Earth's radius in km
  let area = 0;

  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    const lat1 = (latlngs[i][0] * Math.PI) / 180;
    const lat2 = (latlngs[j][0] * Math.PI) / 180;
    const lng1 = (latlngs[i][1] * Math.PI) / 180;
    const lng2 = (latlngs[j][1] * Math.PI) / 180;

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 2.0);
  return area;
}

export function updateLabelScales(map) {
  const zoom = map.getZoom();
  const offset = (zoom - 7) * 2;
  const labelOpacity = zoom < 7 ? 0 : 1;
  const subLabelOpacity = zoom < 11 ? 0 : 1;

  document.documentElement.style.setProperty("--label-opacity", labelOpacity);
  document.documentElement.style.setProperty(
    "--sub-label-opacity",
    subLabelOpacity,
  );
  document.documentElement.style.setProperty(
    "--large-font-size",
    Math.max(12, Math.min(40, 15 + offset)) + "px",
  );
  document.documentElement.style.setProperty(
    "--small-font-size",
    Math.max(8, Math.min(30, 10 + offset)) + "px",
  );
  document.documentElement.style.setProperty(
    "--sub-font-size",
    Math.max(6, Math.min(20, 8 + (zoom - 11) * 2)) + "px",
  );
}

export function subdividePolygon(latlngs, rows, cols) {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  latlngs.forEach((p) => {
    minLat = Math.min(minLat, p[0]);
    maxLat = Math.max(maxLat, p[0]);
    minLng = Math.min(minLng, p[1]);
    maxLng = Math.max(maxLng, p[1]);
  });

  const latStep = (maxLat - minLat) / rows;
  const lngStep = (maxLng - minLng) / cols;
  const results = [];
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXY".split("");

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const subMinLat = maxLat - (r + 1) * latStep;
      const subMaxLat = maxLat - r * latStep;
      const subMinLng = minLng + c * lngStep;
      const subMaxLng = minLng + (c + 1) * lngStep;

      const subLatlngs = [
        [subMaxLat, subMinLng],
        [subMaxLat, subMaxLng],
        [subMinLat, subMaxLng],
        [subMinLat, subMinLng],
      ];

      const labelIndex = r * cols + c;
      results.push({
        latlngs: subLatlngs,
        label: labels[labelIndex] || "",
      });
    }
  }
  return results;
}
