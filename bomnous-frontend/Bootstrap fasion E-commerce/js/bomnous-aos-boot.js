/* Initializes Animate On Scroll after DOM ready; exposes refresh for dynamic grids. */
(function () {
  "use strict";

  function refresh() {
    if (typeof window.AOS !== "undefined") {
      window.AOS.refresh();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof window.AOS !== "undefined") {
      window.AOS.init({
        duration: 800,
        easing: "ease-in-out",
        once: true,
        offset: 80
      });
    }
    window.bomnousAOSRefresh = refresh;
  });
})();
