(() => {
  const { supported, inspectPairs, fullDocument } = CodeGarage.markup;
  const { resolve, jump, broadcast } = CodeGarage.virtual;
  function pairedHeading(root, source, mission) {
    const headings = root.querySelectorAll("h1");
    if (!headings.length) return "Use an opening <h1> for the team’s main heading.";
    if (headings.length !== 1) return "Keep one main heading. Check whether you opened a second h1 where you meant to close the first.";
    const trace = inspectPairs(source, ["h1","h2","h3","h4","h5","h6"]);
    if (trace.error || trace.select("h1").length !== 1) return trace.error || "Write a complete h1 tag pair.";
    const text = mission.rule.text;
    if (words(headings[0]) !== text) return "Put the team name “" + text + "” between the two heading tags.";
    return "";
  }

  const words = el => (el?.textContent ?? "").trim().replace(/\s+/g, " ");
  const only = (root, selector) => {
    const matches = root.querySelectorAll(selector);
    return matches.length === 1 ? matches[0] : null;
  };

  function profile(root, source) {
    const article = only(root, "article");
    if (!article || words(only(article, "h1")) !== "Lando Norris") return "Give the article one h1 containing the driver’s name, Lando Norris.";
    const description = [...article.querySelectorAll("p")].find(p =>
      [...p.querySelectorAll("strong")].some(el => words(el).toLowerCase() === "braking") &&
      [...p.querySelectorAll("em")].some(el => words(el).toLowerCase() === "late"));
    if (!description) return "In the same paragraph, mark braking with strong and late with em.";
    if (article.querySelector("h1").contains(description) || description.querySelector("h1") ||
        !words(description).replace(/\b(braking|late)\b/gi, "").match(/[a-z]/i)) return "Keep the heading separate and put the marked words inside a descriptive sentence.";
    return inspectPairs(source, ["article","h1","p","strong","em"]).error;
  }

  function imagePath(root, source, mission, target) {
    const image = only(root, "img");
    if (!image) return "Use one img element for the car illustration.";
    const trace = inspectPairs(source, ["img"]);
    if (trace.error || !trace.select("img").length) return trace.error || "Finish the img tag and quote each attribute value correctly.";
    const result = resolve(mission, image.getAttribute("src"));
    if (result.error) return result.error;
    if (result.target !== target) return "The image path must reach " + target + ".";
    return "";
  }
  function car(root, source, mission) {
    const problem = imagePath(root, source, mission, "images/Racer.png");
    if (problem) return problem;
    const alt = root.querySelector("img").alt;
    return /\b(red|scarlet|crimson)\b/i.test(alt) && /\b(car|racer|single[- ]seater|formula (one|1)|F1)\b/i.test(alt) ?
      "" : "Describe the red racing car in alt. Mention its color and what it is.";
  }

  function structure(root, source) {
    const { trace, body, title } = fullDocument(source);
    const top = trace.children(trace.root);
    const [html] = trace.select("html"), [head] = trace.select("head"), [content] = trace.select("body");
    if (top[0]?.nodeValue !== trace.declaration) return "Put <!doctype html> before the html element.";
    if (top.length !== 2 || top[1] !== html || trace.select("html").length !== 1) return "Wrap the document in one explicit html element after the doctype.";
    if (trace.select("head").length !== 1 || trace.select("body").length !== 1) return "Use exactly one head and one body in this document.";
    const sections = trace.children(html);
    if (sections.length !== 2 || sections[0] !== head || sections[1] !== content) return "Put head first and body second, directly inside html.";
    if (trace.error) return trace.error;
    const titles = trace.select("title"), headings = trace.select("h1");
    if (titles.length !== 1 || titles[0].parentNode !== head || titles[0].childElementCount || title !== "Pit Wall") return "Put one title reading Pit Wall inside head.";
    const allowedHead = new Set(["meta","link","style","base","script","noscript","template"]);
    if (trace.children(head).some(el => el !== titles[0] && !allowedHead.has(el.localName))) return "Move visible content out of head and into body.";
    if (headings.length !== 1 || !content.contains(headings[0]) || words(only(body, "h1")) !== "Race Notes") return "Place the visible Race Notes h1 inside body.";
    return "";
  }

  function linkTo(root, mission, label, target) {
    const links = [...root.querySelectorAll("a")].filter(a => words(a).toLowerCase() === label.toLowerCase());
    if (links.length !== 1) return "Give the page one clearly labelled " + label + " anchor.";
    const result = resolve(mission, links[0].getAttribute("href"));
    if (result.error) return label + " link: " + result.error;
    return result.target === target ? "" : label + " leads to /" + result.target + ". Aim for /" + target + ".";
  }
  function menu(root, source, mission) {
    const nav = only(root, "nav");
    if (!nav) return "Group Home and Drivers inside one nav.";
    return linkTo(nav, mission, "Home", "index.html") || linkTo(nav, mission, "Drivers", "drivers.html") ||
      inspectPairs(source, ["a","nav"]).error;
  }
  function paths(root, source, mission) {
    return linkTo(root, mission, "Setup", "pages/team/setup.html") ||
      linkTo(root, mission, "Strategy", "pages/team/notes/strategy.html") ||
      imagePath(root, source, mission, "media/Racer.png") || inspectPairs(source, ["a"]).error;
  }
  function fragmentLink(root, source) {
    const link = [...root.querySelectorAll("a")].filter(el => words(el).toLowerCase() === "garage");
    if (link.length !== 1) return "Give the page one Garage anchor to test.";
    const { node, error } = jump(root, link[0].getAttribute("href")?.trim());
    if (error) return error;
    const heading = node.matches("h2") ? node : node.matches("section") ? node.querySelector("h2") : null;
    const section = heading?.closest("section");
    if (words(heading).toLowerCase() !== "garage" || !words(section?.querySelector("p"))) return "Target the Garage section or its heading and keep the crew note inside that section.";
    if (!(link[0].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)) return "Put the link before its destination so readers can jump down the page.";
    return inspectPairs(source, ["a","section","h2"]).error;
  }
  function embed(root, source, mission) {
    const frame = only(root, "iframe");
    if (!frame) return "Use one iframe to embed the broadcast inside the page.";
    return broadcast(frame, mission.video) || inspectPairs(source, ["iframe"]).error;
  }

  const rules = { pairedHeading, profile, car, structure, menu, paths, jump: fragmentLink, broadcast: embed };
  CodeGarage.checkAnswer = (source, rule, mission) => {
    if (!source.trim()) return { correct: false, message: "The editor is empty. " + (rule.empty ?? "Restore the starter code or write a repair.") };
    const message = rules[rule.type](rule.type === "structure" ? null : supported(source), source, mission ?? { rule });
    return { correct: !message, message: message || rule.success };
  };
})();
