(() => {
  function resolve(mission, raw) {
    const path = (raw ?? "").trim();
    const parts = mission.filename.split("/").slice(0, -1);
    if (!path) return { error: "Add a relative file name to the path." };
    if (path.startsWith("/")) return { error: "Use a relative project path with forward slashes." };
    for (const part of path.split("/")) {
      let segment;
      try { segment = decodeURIComponent(part); } catch { return { error: "Check the percent encoding in this file name." }; }
      if (/[:\\/?#\u0000-\u001f]/.test(segment)) return { error: "Use a relative project path with forward slashes." };
      if (!segment || segment === ".") continue;
      if (segment === "..") {
        if (!parts.length) return { error: "This path climbs above the virtual project root." };
        parts.pop();
      } else {
        parts.push(segment);
      }
    }
    const target = parts.join("/");
    const files = mission.files ?? {};
    if (Object.hasOwn(files, target) && !/(?:\/|\/\.{1,2})$/.test(path)) return { target, file: files[target] };
    const match = Object.keys(files).find(name => name.toLowerCase() === target.toLowerCase());
    const hint = match && match !== target ? " Check capitalization against " + match + "." : "";
    return { error: "From " + mission.filename + ", this leads to /" + target + ". No file matches." + hint };
  }

  function jump(root, href) {
    if (!href?.startsWith("#") || href.length < 2) return { error: "Start the jump link with # and follow it with the destination id." };
    let id;
    try { id = decodeURIComponent(href.slice(1)); } catch { return { error: "Check the spelling of the fragment identifier." }; }
    if (/[\t\n\f\r ]/.test(id)) return { error: "Use an id without spaces for the destination." };
    const targets = [...root.querySelectorAll("[id]")].filter(node => node.id === id);
    if (!targets.length) return { error: "There is no element with id “" + id + "”. Check spelling and capitalization." };
    if (targets.length !== 1) return { error: "More than one element has id “" + id + "”. Give the destination a unique id." };
    return { node: targets[0] };
  }

  function broadcast(frame, video) {
    if (frame.hasAttribute("srcdoc")) return "Remove srcdoc so the iframe uses the video address in src.";
    let address;
    try { address = new URL(frame.getAttribute("src")); } catch { return "Give the iframe a full HTTPS embed URL."; }
    if (address.protocol !== "https:" || !["www.youtube.com","youtube.com"].includes(address.hostname) ||
        address.port || address.username || address.password) return "Use the HTTPS YouTube embed address for this exercise.";
    if (address.pathname === "/watch") return "This is a watch page. Move the video ID from v= to the /embed/ path.";
    if (address.pathname !== "/embed/" + video) return "Keep the supplied video ID after /embed/: " + video + ".";
    if (!/\bqualif\w*/i.test(frame.title) || !/\b(lap|run)\b/i.test(frame.title)) return "Give the iframe a title describing the qualifying lap.";
    return "";
  }

  CodeGarage.virtual = { resolve, jump, broadcast };
})();
