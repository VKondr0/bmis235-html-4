(() => {
  const { supported, fullDocument } = CodeGarage.markup;
  const { resolve, jump, broadcast } = CodeGarage.virtual;
  const attributes = ["class", "id", "title", "lang", "dir", "style"];
  const policy = "default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";
  const baseCSS = "body{padding:.6rem;color:#17191f;background:white;font:1rem/1.5 system-ui,sans-serif;overflow-wrap:anywhere}" +
    "img{max-width:100%;height:auto}nav a{margin-right:1em} .offline-player{padding:1.1em;border:2px solid #373a42;background:#17191f;color:white}";

  function render(frame, code, mission, destination) {
    const doc = document.implementation.createHTMLDocument("");
    const body = doc.createElement("div");
    const styles = [baseCSS];
    const links = [];
    const notes = [];
    let root, title = "", location = mission.filename;
    if (mission.documentMode) {
      const page = fullDocument(code);
      root = page.body;
      title = page.title;
    } else {
      root = supported(mission.language === "css" ? mission.previewHTML ?? "" : code);
    }
    if (destination?.target && destination.target !== mission.filename) {
      const page = mission.files?.[destination.target];
      if (!page?.heading) throw new Error("Unknown virtual page");
      root = doc.createDocumentFragment();
      const h1 = doc.createElement("h1"), p = doc.createElement("p");
      h1.textContent = page.heading;
      p.textContent = page.text;
      root.append(h1, p);
      location = destination.target;
    } else if (destination?.fragment) {
      const found = jump(root, destination.fragment);
      if (!found.node) throw new Error("Unknown section");
      const section = found.node.closest("section") || found.node;
      root = doc.createDocumentFragment();
      root.append(section.cloneNode(true));
      location += destination.fragment;
    }

    function copy(parent, nodes) {
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) { parent.append(node.data); continue; }
        if (node.namespaceURI !== "http://www.w3.org/1999/xhtml") continue;
        if (node.localName === "style") { styles.push(node.textContent); continue; }
        if (node.localName === "img") {
          if (!mission.files) continue;
          const resource = resolve(mission, node.getAttribute("src"));
          if (resource.file?.image) {
            const image = doc.createElement("img");
            image.src = CodeGarage.carImage();
            image.alt = node.getAttribute("alt") ?? "";
            parent.append(image);
          } else {
            parent.append("Image unavailable" + (node.alt ? " · " + node.alt : ""));
            notes.push(resource.error || "That path points to a page, not an image.");
          }
          continue;
        }
        if (node.localName === "iframe") {
          if (!mission.video) continue;
          const issue = broadcast(node, mission.video);
          const panel = doc.createElement("p");
          panel.className = "offline-player";
          panel.textContent = issue ? "Offline embed unavailable. " + issue :
            "Offline video preview · " + node.title + " · " + mission.video;
          parent.append(panel);
          continue;
        }
        if (!CodeGarage.markup.elements.has(node.localName)) continue;
        const clean = doc.createElement(node.localName);
        for (const name of attributes) {
          if (node.hasAttribute(name)) clean.setAttribute(name, node.getAttribute(name));
        }
        if (node.localName === "a" && ["menu","paths","jump"].includes(mission.rule?.type)) {
          const href = node.getAttribute("href")?.trim();
          let action;
          if (mission.rule.type === "jump") {
            action = { fragment: href, error: jump(root, href).error };
          } else {
            const result = resolve(mission, href);
            action = { target: result.target, error: result.error || (result.file?.image ? "This is an image file." : "") };
          }
          links.push({ ...action, label: node.textContent.trim() || "Unlabelled link" });
        }
        parent.append(clean);
        copy(clean, node.childNodes);
      }
    }
    copy(body, root.childNodes);
    if (mission.language === "css") styles.push(code);
    // Keep each stylesheet's rule order while preventing a raw-text end tag.
    const sheets = styles.map(css => "<style>" + css.replaceAll("<", "\\3c ") + "</style>").join("");
    const images = Object.values(mission.files ?? {}).some(file => file.image);
    const csp = policy + (images ? "; img-src data:" : "");
    frame.srcdoc = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta http-equiv="Content-Security-Policy" content="' + csp + '">' +
      sheets + '</head><body>' + body.innerHTML + '</body></html>';
    return { title, links, location, notes };
  }
  CodeGarage.renderPreview = render;
})();
