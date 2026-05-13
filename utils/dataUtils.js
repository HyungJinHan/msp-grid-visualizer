
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
