(() => {
  const tags = new Set(("main section article header footer aside nav div p h1 h2 h3 h4 h5 h6 " +
    "span strong em b i small br hr ul ol li pre code blockquote a table caption thead tbody tr th td").split(" "));
  const attributes = ["class", "id", "title", "lang", "dir", "style"];
  const policy = "default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";
  const baseCSS = "body{padding:0.6rem;color:#17191f;background:white;font:1rem/1.5 system-ui,sans-serif;overflow-wrap:anywhere}";

  // Template content is inert. Rebuild only display elements in a detached
  // document. No original node, event attribute or navigation URL is adopted.
  function render(frame, code, mission) {
    const doc = document.implementation.createHTMLDocument("");
    const input = doc.createElement("template");
    input.innerHTML = mission.language === "css" ? mission.previewHTML ?? "" : code;
    const body = doc.createElement("div");
    const styles = [baseCSS];
    function copy(parent, nodes) {
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          parent.append(doc.createTextNode(node.data));
          continue;
        }
        if (node.namespaceURI !== "http://www.w3.org/1999/xhtml") continue;
        if (node.localName === "style") {
          styles.push(node.textContent);
          continue;
        }
        if (!tags.has(node.localName)) continue;
        const clean = doc.createElement(node.localName);
        for (const name of attributes) {
          if (node.hasAttribute(name)) clean.setAttribute(name, node.getAttribute(name));
        }
        parent.append(clean);
        copy(clean, node.childNodes);
      }
    }
    copy(body, input.content.childNodes);
    if (mission.language === "css") styles.push(code);
    // CSS lives in a raw-text element. Escape '<' so it cannot end that element.
    const css = styles.join("\n").replaceAll("<", "\\3c ");
    frame.srcdoc = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta http-equiv="Content-Security-Policy" content="' + policy + '">' +
      '<style>' + css + '</style></head><body>' + body.innerHTML + '</body></html>';
  }

  window.CodeGarage.renderPreview = render;
})();
