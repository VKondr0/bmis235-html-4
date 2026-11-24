(() => {
  function fragment(source) {
    const template = document.implementation.createHTMLDocument("").createElement("template");
    template.innerHTML = source;
    return template.content;
  }

  // The browser repairs a missing or mismatched end tag. Mark the location
  // of literal heading tokens in a second, inert parse to check their pairing.
  function pairedHeading(source, rule) {
    const tree = fragment(source);
    const headings = tree.querySelectorAll("h1");
    if (!headings.length) return "Use an opening <h1> for the team’s main heading.";
    if (headings.length !== 1) return "Keep one main heading. Check whether you opened a second h1 where you meant to close the first.";

    // Consume comments and entire tags (including quoted attribute values).
    // Raw-text and template contents cannot supply the marker for a real h1.
    const tokens = /<!--[\s\S]*?(?:-->|$)|<\/?[a-z](?:[^<>"']|"[^"]*"|'[^']*')*>/gi;
    const marker = "garage-heading-end-" + Math.random().toString(36).slice(2);
    const opening = /^<h1(?:[\t\n\f\r ]+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>\x60]+))?)*[\t\n\f\r ]*>$/i;
    const marked = source.replace(tokens, token => {
      if (opening.test(token)) {
        return token + "<!--" + marker + "-open-->";
      }
      const closing = /^<\/(h[1-6])[\t\n\f\r ]*>$/i.exec(token);
      if (closing) return "<!--" + marker + "-" + closing[1].toLowerCase() + "-->" + token;
      return token;
    });
    const markedTree = fragment(marked);
    const heading = markedTree.querySelector("h1");
    if (heading?.firstChild?.nodeType !== Node.COMMENT_NODE || heading.firstChild.data !== marker + "-open") {
      return "Finish the opening <h1> with >. Put the slash only in the closing tag.";
    }
    const comments = document.createTreeWalker(markedTree, NodeFilter.SHOW_COMMENT);
    while (comments.nextNode()) {
      const comment = comments.currentNode;
      if (!comment.data.startsWith(marker + "-h")) continue;
      const closing = comment.data.slice(marker.length + 1);
      const parent = comment.parentElement?.localName;
      if (closing !== parent) {
        return parent === "h1" ? "Your heading opens with <h1> but closes with </" + closing + ">. Match the closing level to the opening level." :
          "There is a closing heading tag outside its matching heading. Keep the team name inside one complete pair.";
      }
    }
    if (heading.lastChild.nodeType !== Node.COMMENT_NODE || heading.lastChild.data !== marker + "-h1") {
      return "Add the matching closing tag immediately after the team name. Include the slash and the final >.";
    }
    const text = headings[0].textContent.replace(/\s+/g, " ").trim();
    if (text !== rule.text) return "Put the team name “" + rule.text + "” between the two heading tags.";
    return "";
  }

  const rules = { pairedHeading };
  window.CodeGarage.checkAnswer = (source, rule) => {
    if (!source.trim()) return { correct: false, message: "The editor is empty. " + rule.empty };
    const message = rules[rule.type](source, rule);
    return { correct: !message, message: message || rule.success };
  };
})();
