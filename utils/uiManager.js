export class UIManager {
  constructor(statusEl, detailsEl) {
    this.statusEl = statusEl;
    this.detailsEl = detailsEl;
  }

  updateTheme(themeName) {
    const root = document.documentElement;
    if (themeName === "OSM") {
      root.style.setProperty("--small-grid-color", "orange");
      root.style.setProperty("--large-grid-color", "rgba(0, 0, 0, 0.4)");
    } else if (themeName === "Google Satellite") {
      root.style.setProperty("--small-grid-color", "orange");
      root.style.setProperty("--large-grid-color", "rgba(255, 255, 255, 0.7)");
    } else {
      root.style.setProperty("--small-grid-color", "cyan");
      root.style.setProperty("--large-grid-color", "rgba(255, 255, 255, 0.7)");
    }
  }

  updateStatus(message, isError = false) {
    this.statusEl.textContent = message;
    this.statusEl.className = isError ? "status err" : "status ok";
  }

  showDetails(html) {
    this.detailsEl.innerHTML = html;
  }
}
