(() => {
  let png;

  // Draw the virtual project's Racer.png locally, once per page.
  window.CodeGarage.carImage = function carImage() {
    if (png) return png;
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");

    function shape(path, color) {
      ctx.fillStyle = color;
      ctx.fill(new Path2D(path));
    }

    function ellipse(x, y, rx, ry, color) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function wheel(x, radius) {
      const y = 137 - radius;
      ellipse(x, y, radius, radius, "#171a20");
      ellipse(x, y, radius - 4, radius - 4, "#373b40");
      ellipse(x, y, radius - 6, radius - 6, "#13161a");
      ellipse(x, y, radius * 0.56, radius * 0.56, "#77838b");
      ellipse(x, y, radius * 0.47, radius * 0.47, "#282e33");
      ctx.save();
      ctx.translate(x, y);
      for (let spoke = 0; spoke < 8; spoke++) {
        shape("M -2 0 L -3 -12 L 0 -14 L 2 -3 Z", "#a5acaf");
        ctx.rotate(Math.PI / 4);
      }
      ctx.restore();
      ellipse(x, y, 5, 5, "#202429");
      ellipse(x, y, 2, 2, "#e7a354");
    }

    // A pale pit wall keeps the car's dark wheels readable at editor size.
    ctx.fillStyle = "#e8edee";
    ctx.fillRect(0, 0, 480, 180);
    shape("M0 70 L114 29 L198 29 L57 80 L0 80 Z", "#dce3e5");
    shape("M96 80 L243 29 L277 29 L130 80 Z", "#dce3e5");
    shape("M0 80 H480 V86 H0 Z", "#c2ccd0");
    shape("M0 89 H480 V94 H0 Z", "#c2ccd0");
    shape("M0 98 H480 V180 H0 Z", "#aab5ba");
    shape("M0 164 L480 146 V152 L0 174 Z", "#f4eeeb");
    for (let x = -12; x < 480; x += 76) {
      const y = 164 - x * 0.0375;
      shape(`M${x} ${y} l40 -1.5 l-12 8 l-40 1.6 Z`, "#bd4745");
    }
    ellipse(244, 137, 193, 5, "rgba(33,41,46,.24)");

    // Rear wing, suspension, floor and front wing.
    shape("M31 65 L77 69 L79 77 L38 74 Z M42 77 L80 81 L79 86 L45 84 Z", "#333940");
    shape("M42 66 L48 67 L55 105 L44 103 Z", "#ce323b");
    shape("M52 83 L66 86 L79 109 L72 111 Z M99 100 L163 112 L152 118 L100 107 Z", "#22272c");
    shape("M283 102 L386 109 L384 114 L282 109 Z M299 117 L384 110 L389 114 L305 123 Z", "#353c43");
    shape("M80 119 L312 117 L331 123 L313 131 L108 131 L78 126 Z", "#23282e");
    shape("M399 119 L447 116 L453 123 L453 130 L406 131 Z", "#24292f");
    shape("M432 116 L455 115 L457 124 L440 127 Z", "#cc2633");

    // Engine cover, cockpit, sidepod and long tapered nose.
    shape("M69 106 Q110 93 160 68 L177 53 L202 53 L210 74 Q218 83 241 85 L260 91 L287 88 L299 92 L417 110 Q427 112 432 118 L419 119 L322 109 Q305 109 291 122 L156 126 L119 117 L73 117 Z", "#bd1e30");
    shape("M91 104 L164 72 L177 57 L198 57 L207 78 L235 88 L201 92 L138 99 Z", "#fa493e");
    shape("M148 98 Q172 87 223 88 L244 95 L286 94 L299 98 L261 116 L171 121 L130 113 Z", "#ed3536");
    shape("M153 102 L207 97 L179 104 L148 109 Z M250 96 L279 95 L261 102 L239 103 Z", "#fff0db");
    shape("M285 93 L299 94 L419 112 L426 115 L345 105 L299 99 Z", "#ff6850");
    shape("M185 56 L198 56 L201 64 L190 64 Z M211 79 L233 81 L244 87 L223 86 Z", "#25292f");
    ellipse(235, 77, 8, 8, "#e9c560");
    shape("M231 74 L243 74 L243 77 L235 78 Z", "#202b37");
    shape("M224 81 Q226 68 238 68 L254 70 L255 73 L241 72 L248 86 L244 86 L236 72 Q230 72 228 81 Z", "#363b40");
    shape("M256 87 L260 78 L268 77 L269 81 L263 82 L262 88 Z", "#bd2731");
    wheel(97, 29);
    wheel(382, 26);

    png = canvas.toDataURL("image/png");
    return png;
  };
})();
