(() => {
  const elements = new Set(("main section article header footer aside nav div p h1 h2 h3 h4 h5 h6 " +
    "span strong em b i small br hr ul ol li pre code blockquote a table caption thead tbody tr th td " +
    "figure figcaption img iframe style").split(" "));
  function fragment(source) {
    const template = document.implementation.createHTMLDocument("").createElement("template");
    template.innerHTML = source;
    return template.content;
  }

  // Validators and simulations see the same supported subtrees. Attribute
  // values remain inert until the renderer copies its own small allowlist.
  function supported(source) {
    const tree = fragment(source);
    for (const node of tree.querySelectorAll("*")) {
      if (node.namespaceURI !== "http://www.w3.org/1999/xhtml" || !elements.has(node.localName)) node.remove();
    }
    return tree;
  }

  // Only instrument tags explicitly taught by an exercise. The browser does
  // the parsing. Neutral names prevent automatic closing of p/head/body and
  // adoption-agency repair of crossed strong/em pairs from hiding mistakes.
  function inspectPairs(source, names) {
    const prefix = "garage-" + Math.random().toString(36).slice(2) + "-";
    const tags = new Set(names);
    const endMarker = prefix + "end";
    const invalid = prefix + "invalid";
    const declaration = prefix + "doctype";
    const tokens = /<!--[\s\S]*?(?:-->|$)|<!doctype\b[^>]*>|<\/?[a-z](?:[^<>"']|"[^"]*"|'[^']*')*>/gi;
    const marked = source.replace(tokens, token => {
      if (/^<!doctype[\t\n\r\f ]+html[\t\n\r\f ]*>$/i.test(token)) return "<!--" + declaration + "-->";
      if (/^<!doctype\b/i.test(token)) return "<!--" + invalid + "-->";
      const match = /^<(\/?)([a-z][a-z0-9-]*)(?=[\s/>])/i.exec(token);
      if (!match) return token;
      const name = match[2].toLowerCase();
      if (!tags.has(name)) return token;
      if (match[1]) {
        const valid = /^<\/[a-z][a-z0-9-]*\s*>$/i.test(token);
        return "<!--" + endMarker + (valid ? name : "!") + "--></" + prefix + name + ">";
      }
      const attributes = token.slice(match[0].length);
      const regular = /^(?:[\t\n\f\r ]+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>\x60]+))?)*[\t\n\f\r ]*>$/;
      const voidImage = name === "img";
      const valid = regular.test(voidImage ? attributes.replace(/\/>$/, ">") : attributes);
      return (valid ? "" : "<!--" + invalid + "-->") + "<" + prefix + name +
        attributes + (voidImage ? "</" + prefix + name + ">" : "");
    });
    const root = fragment(marked);
    const comments = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
    let error = "";
    while (comments.nextNode()) {
      const comment = comments.currentNode;
      if (comment.data === invalid) error = "Check the opening tag. Separate attributes with spaces and finish the tag with >.";
      if (comment.data.startsWith(endMarker) &&
          comment.parentElement?.localName !== prefix + comment.data.slice(endMarker.length)) {
        const name = comment.data.slice(endMarker.length);
        error = name === "!" ? "Write only the tag name after the slash in a closing tag." :
          "The closing </" + name + "> is out of place. Close the innermost element first and match its name.";
      }
    }
    const select = name => [...root.querySelectorAll(prefix + name)];
    for (const name of names) {
      if (name === "img") continue;
      if (select(name).some(node => node.lastChild?.nodeType !== Node.COMMENT_NODE ||
          node.lastChild.data !== endMarker + name)) error ||= "Complete the opening and closing tags for " + name + ".";
    }
    const children = node => [...node.childNodes].filter(n => n.nodeType === Node.ELEMENT_NODE ||
      (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) || n.nodeValue === declaration);
    return { root, select, children, declaration, error };
  }

  function fullDocument(source) {
    const trace = inspectPairs(source, ["html", "head", "title", "body", "h1"]);
    // Parse a resource-free projection in document mode. Raw learner HTML
    // only enters inert templates; the full document parser gets no URLs.
    const doc = document.implementation.createHTMLDocument("");
    const container = doc.createElement("div");
    const names = new Map();
    for (const name of ["html", "head", "title", "body", "h1"]) {
      for (const node of trace.select(name)) names.set(node, name);
    }
    function copy(node, parent) {
      if (node.nodeType === Node.TEXT_NODE) { parent.append(node.data); return; }
      const name = names.get(node) ?? node.localName;
      if (!names.has(node) && !["p","article","section","main","div","em","strong","h2","span","br"].includes(name)) return;
      const clean = doc.createElement(name);
      parent.append(clean);
      for (const child of node.childNodes) copy(child, clean);
    }
    for (const child of trace.root.childNodes) copy(child, container);
    const parsed = new DOMParser().parseFromString("<!doctype html>" + container.innerHTML, "text/html");
    return { trace, body: parsed.body, title: parsed.title };
  }
  CodeGarage.markup = { supported, inspectPairs, fullDocument, elements };
})();
