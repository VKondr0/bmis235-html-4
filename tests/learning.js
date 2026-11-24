// Playwright CLI run-code scenario. Run from a locally served garage page.
// Each case uses disposable browser storage, separate from the learner's tab.
async page => {
  const base = new URL("./", page.url()).href;
  const browser = page.context().browser();
  const context = await browser.newContext();
  const results = [];
  function assert(ok, description) {
    if (!ok) throw new Error(description);
    results.push(description);
  }

  try {
    const tab = await context.newPage();
    const errors = [];
    const restrictions = [];
    function recordBrowserMessage(detail, url) {
      // WebKit can surface a sandbox-origin denial as a page error; Chromium
      // reports policy denials through the console. Preserve both as evidence.
      if ((detail.startsWith("Blocked a frame at") && detail.includes('lacks the "allow-same-origin" flag')) ||
          detail.startsWith("Blocked script execution in 'about:srcdoc'") ||
          (detail.includes("Content Security Policy") && detail.includes("preview-check.invalid"))) {
        restrictions.push(detail);
      } else {
        errors.push(url ? detail + " (" + url + ")" : detail);
      }
    }
    tab.on("pageerror", error => recordBrowserMessage(error.message));
    tab.on("console", message => {
      if (message.type() !== "error") return;
      recordBrowserMessage(message.text(), message.location().url);
    });
    const missionURL = base + "mission.html?id=missing-heading";
    const key = "f1CodeGarage.progress.v1";
    const state = () => tab.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    const record = async () => (await state()).missions["missing-heading"];
    const editor = tab.locator("#editor");
    const click = id => tab.locator("#" + id).click();
    const text = id => tab.locator("#" + id).innerText();

    await tab.goto(base + "index.html");
    await tab.locator("[data-mission-link]").first().click();
    await editor.waitFor({ state: "visible" });
    assert(tab.url() === missionURL, "Dashboard opens the mission");
    const starter = await editor.inputValue();
    const correct = "<h1>Scuderia Ferrari</h1>";
    const cases = [
      [correct, true],
      [" \n<H1 class='team' title=\"1 > 0\">Scuderia   Ferrari</h1  >\n", true],
      ["<main><h1 class=team>Scuderia <em>Ferrari</em></h1></main>", true],
      ["<!-- Heading example --> <h1>Scuderia&#32;Ferrari</h1>", true],
      ["<!doctype html><html><body>" + correct + "</body></html>", true],
      [starter, false], [" \t\n", false], ["<h2>Scuderia Ferrari</h2>", false],
      ["<h1>Scuderia Ferrari", false], ["<h1>Scuderia Ferrari</h1", false],
      ["<h1>Scuderia Ferrari<h1>", false], ["<h1>Other team</h1>", false],
      ["<h1></h1>Scuderia Ferrari", false], ["<h1/>Scuderia Ferrari</h1>", false],
      ["<h1>Scuderia Ferrari<!-- </h1> -->", false],
      ["<h1 title='</h1>'>Scuderia Ferrari", false],
      ["<section><h1>Scuderia Ferrari</section></h1>", false],
      ["<template>" + correct + "</template>", false],
      [correct + "</h1>", false], ["<h1>Scuderia Ferrari</h1 wrong>", false]
    ];
    const mismatches = await tab.evaluate(cases => {
      const rule = CodeGarage.missions[0].rule;
      return cases.filter(([code, expected]) => CodeGarage.checkAnswer(code, rule).correct !== expected);
    }, cases);
    assert(!mismatches.length, cases.length + " source and structure cases: " + JSON.stringify(mismatches));

    await click("check");
    await tab.locator("#feedback").filter({ hasText: "</h2>" }).waitFor();
    assert((await text("feedback")).includes("</h2>") && await editor.inputValue() === starter, "Specific feedback preserves a failed draft");
    const draft = "<h1>Temporary name</h1>\n  ";
    await editor.fill(draft);
    await editor.press("Control+Enter");
    await tab.frameLocator("#preview").getByRole("heading", {name:"Temporary name"}).waitFor();
    assert((await record()).attempts === 1, "Run updates the frame without recording an attempt");
    await tab.reload();
    assert(await editor.inputValue() === draft && await text("lines") === "1\n2", "Refresh restores code, whitespace and line numbers");
    await editor.fill(correct);
    await editor.press("Control+Shift+Enter");
    assert((await record()).completion === "independent", "Shortcut checks current code independently");
    assert(await tab.frameLocator("#preview").locator("h1").innerText() === "Temporary name", "Check leaves the last run visible");
    await click("check");
    assert(Object.keys((await state()).missions).length === 1 && (await record()).attempts === 3, "Repeated checks count attempts and retain one completion");
    await click("hint");
    assert((await record()).completion === "independent", "Later help preserves the original completion");
    await tab.locator("#back").click();
    assert(tab.url().endsWith("html-garage.html") && (await tab.locator("[data-mission-status]").first().innerText()).includes("independently"), "Chapter reflects saved progress");
    await tab.locator("[data-mission-link]").first().click();
    assert((await state()).lastVisited === "missing-heading", "Chapter launch and last visited mission");

    // Begin a fresh learner profile in this isolated context.
    await tab.evaluate(k => localStorage.removeItem(k), key);
    await tab.reload();
    await click("hint");
    assert(await tab.locator("#hints li").count() === 1, "First hint appears on its own");
    await click("hint");
    assert(await tab.locator("#hints li").count() === 2 && await tab.locator("#hint").isDisabled(), "Second hint exhausts the hint list");
    await click("reveal");
    assert((await record()).revealed && !(await record()).completion && await editor.inputValue() === starter, "Showing the solution preserves the draft and does not pass the mission");
    await click("reveal");
    assert(await tab.locator("#solution").isHidden(), "Solution can be closed");
    await tab.reload();
    assert(await tab.locator("#solution").isVisible() && await tab.locator("#hints li").count() === 2, "Help history survives refresh");
    await editor.fill(correct);
    await click("check");
    assert((await record()).completion === "assisted", "Help before passing records assisted completion");
    tab.once("dialog", dialog => dialog.dismiss());
    await click("reset");
    assert(await editor.inputValue() === correct, "Cancelling reset preserves code");
    tab.once("dialog", dialog => dialog.accept());
    await click("reset");
    const reset = await record();
    assert(reset.draft === starter && reset.attempts === 1 && reset.completion === "assisted" && reset.hints === 2 && reset.revealed, "Confirmed reset restores starter and preserves history");
    await editor.fill("");
    await click("check");
    assert((await text("feedback")).includes("empty"), "Empty editor receives a specific explanation");
    await tab.reload();
    assert(await editor.inputValue() === "", "An empty draft survives refresh");

    const outbound = [];
    await context.route("https://preview-check.invalid/**", route => {
      outbound.push(route.request().url());
      return route.abort();
    });
    const probe = "https://preview-check.invalid/";
    const sample = '<style>h1{color:rgb(12,34,56);background-image:url(' + probe + 'paint)}</style>' +
      '<h1>Preview test</h1><script>document.title="script ran"</script>' +
      '<img src="' + probe + 'image"><form action="' + probe + 'form"></form>' +
      '<a href="' + probe + 'link">Sample link</a><meta http-equiv="refresh" content="0;url=' + probe + 'nav">';
    await editor.fill(sample);
    await click("run");
    const frame = tab.frameLocator("#preview");
    await frame.getByRole("heading", {name:"Preview test"}).waitFor();
    const facts = await frame.locator("body").evaluate(body => ({
      color: getComputedStyle(body.querySelector("h1")).color,
      title: document.title, active: body.querySelectorAll("script, img, form, [href], meta").length
    }));
    assert(facts.color === "rgb(12, 34, 56)" && !facts.active && !facts.title, "Local CSS renders while active elements and navigation attributes are removed");
    assert(await tab.locator("#preview").evaluate(f => f.sandbox.length === 0 && f.contentDocument === null), "Sandbox has no permissions and isolates the frame origin");
    await frame.getByText("Sample link").click();
    await click("check");
    assert(tab.url() === missionURL && tab.frames()[1].url() === "about:srcdoc" && outbound.length === 0, "Run and validation issue no external requests or navigation");
    assert(await tab.locator("main h1").innerText() === "Missing Heading", "Preview did not replace application content");
    await tab.evaluate(() => CodeGarage.renderPreview(document.querySelector("#preview"),
      "p { color: rgb(24, 48, 72) }", { language: "css", previewHTML: "<p>CSS sample</p>" }));
    const cssSample = frame.getByText("CSS sample");
    await cssSample.waitFor();
    assert(await cssSample.evaluate(el => getComputedStyle(el).color) === "rgb(24, 48, 72)", "CSS-only preview uses mission-provided HTML");

    await editor.fill(" ".repeat(200) + correct);
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      await tab.setViewportSize({width, height:900});
      const layout = await tab.evaluate(() => {
        const [editor, preview] = [...document.querySelectorAll(".station")].map(el => el.getBoundingClientRect());
        return {fits:document.documentElement.scrollWidth <= innerWidth, stacked:preview.top >= editor.bottom};
      });
      assert(layout.fits && layout.stacked === (width <= 768), "Workbench layout at " + width + "px");
    }
    await tab.goto(base + "index.html");
    assert((await tab.locator("[data-mission-link]").innerText()).startsWith("Review") && (await tab.locator("[data-mission-status]").first().innerText()).includes("with help"), "Dashboard restores completed mission status");
    await tab.goto(base + "mission.html?id=unknown");
    assert(await tab.locator("#unavailable").isVisible() && await tab.locator("#workspace").isHidden(), "Unknown mission shows a working return link");

    // Seed the exact v1 shape used before the new chapters were added.
    const original = { draft: "<h1>Saved from Stage 2</h1>", attempts: 7, hints: 1, revealed: true, completion: "assisted" };
    await tab.evaluate(([k, old]) => localStorage.setItem(k, JSON.stringify({
      version: 1, lastVisited: "missing-heading", missions: { "missing-heading": old }
    })), [key, original]);
    await tab.goto(missionURL);
    assert(await editor.inputValue() === original.draft && JSON.stringify(await record()) === JSON.stringify(original), "Existing Stage 2 record restores without migration");

    const missions = await tab.evaluate(() => CodeGarage.missions);
    const invalid = {
      "driver-profile": [["<strong>braking</strong>", "<b>braking</b>"], ["</em>", ""], ["<p>", "<div>"], ["<strong>braking</strong>", "<strong>braking<em></strong></em>"]],
      "broken-car-image": [["Racer.png", "racer.png"], ["Racer.png", "Racer.jpg"], ["src=", "data-src="], ["alt=", "title="], [' alt=', 'alt=']],
      "page-structure": [["<!doctype html>", "<!-- <!doctype html> -->"], ["</head>", ""], ["</body>", "</head>"], ["<title>Pit Wall</title>", "<!-- <title>Pit Wall</title> -->"], ["<h1>", "<body></body><h1>"]],
      "broken-navigation": [["drivers.html", "driver.html"], ['href="drivers.html"', 'title="drivers.html"'], ["</a>", ""]],
      "missing-file": [["../../media/", "../media/"], ["setup.html", "../../../setup.html"], ["notes/strategy.html", "notes/Strategy.html"], ['src=', 'title='], ["</a>", ""]],
      "jump-to-garage": [["#garage", "#Garage"], ["<h1>", '<h1 id="garage">'], ["id=", "title="], ["</section>", ""]],
      "race-broadcast": [["/embed/", "/watch?v="], ["GarageLap01", "GarageLap02"], ["title=", "name="], ["</iframe>", ""], ["youtube.com/", "youtube.com.invalid/"], ["<iframe ", "<iframe srcdoc=example "]]
    };
    for (const [i, m] of missions.entries()) {
      await tab.goto(base + "mission.html?id=" + m.id);
      for (const width of [320,375,390,768,1440]) {
        await tab.setViewportSize({width, height:900});
        assert(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth), m.id + " fits " + width + "px");
      }
      const saved = () => state().then(value => value.missions[m.id]);
      const expectedChapter = m.chapter === "html" ? "html-garage.html" : "links-and-paths.html";
      assert(await tab.locator('.primary [aria-current="location"]').getAttribute("href") === expectedChapter, m.id + " chapter highlight");
      for (const [id, neighbour] of [["#prev",missions[i-1]],["#next",missions[i+1]]]) {
        const link = tab.locator(id);
        assert(neighbour ? (await link.getAttribute("href")) === "mission.html?id=" + neighbour.id : await link.isHidden(), m.id + " " + id);
      }
      const alternatives = m.solution.replace(/<(\/?)(\w+)/g, (_,slash,name) => "<" + slash + name.toUpperCase())
        .replaceAll('"', "'").replace("images/Racer.png", "./images/./Racer.png")
        .replace("notes/strategy.html", "./notes/../notes/strategy.html")
        .replace("href='drivers.html'", "title='Driver roster' href='./drivers.html'")
        .replace("id='garage'", "id='pit-crew'").replace("#garage'", "#pit-crew'")
        .replace("src='./images/./Racer.png' alt='Red racing car with black wheels'", "alt='Scarlet single-seater' src='./images/./Racer.png'");
      const inputs = [m.starter, "", "<!-- " + m.solution + " -->", "<p>unfinished</p>",
        ...(invalid[m.id] || []).map(([from,to]) => m.solution.replace(from,to))];
      const matrix = await tab.evaluate(({id, alt, wrong}) => {
        const mission = CodeGarage.missions.find(item => item.id === id);
        const accepts = code => CodeGarage.checkAnswer(code, mission.rule, mission).correct;
        return [accepts(mission.solution), accepts(alt), ...wrong.map(code => !accepts(code))];
      }, {id:m.id, alt:alternatives, wrong:inputs});
      assert(matrix.every(Boolean), m.id + " validation matrix (failed indexes: " + matrix.flatMap((ok,n) => ok ? [] : [n]) + ")");

      if (i === 0) continue; // Full interaction coverage for mission 01 runs above.
      await click("check");
      assert((await text("feedback")).startsWith("Try again") && await editor.inputValue() === m.starter, m.id + " starter feedback");
      await click("hint"); await click("hint"); await click("reveal");
      assert(await tab.locator("#hints li").count() === 2 && await tab.locator("#hint").isDisabled() && !(await saved()).completion, m.id + " progressive help");
      await editor.fill(alternatives);
      await tab.reload();
      assert(await editor.inputValue() === alternatives && (await saved()).revealed && (await saved()).hints === 2, m.id + " draft and help restore");
      await click("run");
      const view = tab.frameLocator("#preview");
      if (m.number === 2) assert(await view.locator("article p strong").innerText() === "braking" && await view.locator("article p em").innerText() === "late", "Driver profile semantics render");
      if ([3,6].includes(m.number)) {
        await view.locator("img").waitFor();
        await tab.waitForFunction(() => !!document.querySelector("#preview").srcdoc.includes("data:image/png"));
        assert(await view.locator("img").evaluate(async img => { await img.decode(); return img.naturalWidth === 480; }), m.id + " virtual PNG decodes");
        assert((await text("file-tree")).includes("Racer.png") && (await text("file-tree")).includes("(editing)"), m.id + " accessible file listing");
      }
      if (m.number === 4) assert((await text("tab-title")).includes("Pit Wall") && await view.getByRole("heading").innerText() === "Race Notes", "Document tab and visible heading differ");
      const destinations = {5:[["Drivers","Driver roster"],["Home","Home"]],6:[["Setup","Setup sheet"],["Strategy","Race strategy"]],7:[["Garage","Garage"]]};
      for (const [label, target] of destinations[m.number] ?? []) {
        await tab.getByRole("button",{name:"Test link · " + label, exact:true}).click();
        await view.getByText(target, {exact:true}).first().waitFor();
        assert(tab.url().endsWith("id=" + m.id) && (await text("preview-status")).includes("Virtual destination"), m.id + " demonstrates " + label);
        if (m.number === 7) assert(await view.getByText("Practice", {exact:true}).count() === 0, "Jump displays destination section");
        await tab.getByRole("button",{name:"Return to edited page"}).click();
      }
      if (m.number === 8) {
        await view.getByText(/Offline video preview/).waitFor();
        assert(await view.locator("iframe").count() === 0 && (await view.locator("body").innerText()).includes(m.video), "Broadcast is simulated locally");
      }
      await click("check");
      await tab.locator("#feedback").filter({ hasText: "Mission complete." }).waitFor();
      await click("check");
      await tab.locator("#progress").filter({ hasText: "Attempts: 3" }).waitFor();
      await tab.reload();
      const complete = await saved();
      assert(complete.completion === "assisted" && complete.attempts === 3 && (await text("progress")).includes("with help"), m.id + " repeat checks and restored completion (" + complete.attempts + ", " + complete.completion + ")");
      tab.once("dialog", d => d.dismiss()); await click("reset");
      assert(await editor.inputValue() === alternatives, m.id + " reset cancel");
      tab.once("dialog", d => d.accept()); await click("reset");
      assert(await editor.inputValue() === m.starter && (await saved()).completion === "assisted", m.id + " reset retains credit");
      if ([3,6].includes(m.number)) {
        await view.getByText(/Image unavailable/).waitFor();
        assert(await view.locator("img").count() === 0, m.id + " broken path cannot show the car");
      }
      if ([5,7].includes(m.number)) {
        await tab.getByRole("button",{name:"Test link · " + (m.number === 5 ? "Drivers" : "Garage")}).click();
        assert(!(await text("preview-status")).startsWith("Virtual destination"), m.id + " unresolved link gives diagnostic");
      }
    }
    assert(JSON.stringify(await record()) === JSON.stringify(original), "Unrelated missions preserve the existing heading record");
    await tab.goto(base + "index.html");
    assert((await tab.locator("[data-chapter-progress]").allInnerTexts()).every(t => t === "4 of 4 missions complete"), "Dashboard computes both actual chapter totals");
    for (const chapter of ["html-garage","links-and-paths"]) {
      await tab.goto(base + chapter + ".html");
      assert(await tab.locator("[data-mission-link]").count() === 4 && (await tab.locator("[data-chapter-progress]").innerText()) === "4 of 4 missions complete", chapter + " four playable mission records");
    }
    await tab.goto(base + "mission.html?id=missing-file");
    const pathCases = await tab.evaluate(() => {
      const mission = CodeGarage.missions.find(m => m.id === "missing-file");
      return ["./setup.html","notes/../setup.html","../../media/Racer.png","../../media/racer.png","../../../outside","notes/missing.html","/media/Racer.png","javascript:void(0)","https://preview-check.invalid/"].map(raw => CodeGarage.virtual.resolve(mission, raw));
    });
    assert(pathCases.slice(0,3).every(v => v.file) && pathCases.slice(3).every(v => v.error) && pathCases[3].error.includes("capitalization") && pathCases[5].error.includes("pages/team/notes/missing.html"), "Relative path boundaries and concrete diagnostics");
    await tab.evaluate(() => { CodeGarage.renderPreview = () => { throw new Error("Test render failure"); }; });
    await click("run");
    assert((await text("preview-status")).includes("could not render"), "Unexpected rendering error is recoverable");
    await tab.evaluate(() => { CodeGarage.checkAnswer = () => { throw new Error("Test check failure"); }; });
    await click("check");
    assert((await text("feedback")).includes("could not finish") && await editor.inputValue() === missions[5].starter, "Unexpected checker error preserves code");
    await tab.goto(missionURL);

    // Exercise the new rendering paths with harmless canaries. Intercept every
    // HTTP(S) origin outside this local app and fail if a request reaches routing.
    const foreign = [];
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      if (["https:", "http:"].includes(url.protocol) && url.origin !== new URL(base).origin) {
        foreign.push(url.href);
        return route.abort();
      }
      return route.continue();
    });
    const fixture = '<style>@import url("'+ probe +'sheet.css");p{background-image:url("'+ probe +'back.png")}</style>' +
      '<link rel="stylesheet" href="'+probe+'other.css"><p>Local sample</p>' +
      '<a href="javascript:void(0)" target="_top" onclick="this.textContent=123">Unsafe destination</a>' +
      '<a href="'+probe+'away" download>Remote file</a><img src="'+probe+'image" onerror="this.alt=123">' +
      '<iframe src="'+probe+'frame" title="External frame"></iframe><form action="'+probe+'submit"><button>Send</button></form>' +
      '<meta http-equiv="refresh" content="0;url='+probe+'away"><script>document.title="Unexpected"</script>';
    for (const id of ["page-structure","missing-file","jump-to-garage","race-broadcast"]) {
      await tab.goto(base + "mission.html?id=" + id);
      await editor.fill(id === "page-structure" ? "<!doctype html><html><head><title>Test</title></head><body>" + fixture + "</body></html>" : fixture);
      await click("run");
      const sandbox = tab.frameLocator("#preview");
      await sandbox.getByText("Local sample", {exact:true}).waitFor();
      const safety = await sandbox.locator("body").evaluate(body => {
        let isolated = false;
        try { void window.parent.document.body; } catch (error) { isolated = error.name === "SecurityError"; }
        return {isolated, active:body.querySelectorAll("[href], [onclick], [onerror], [target], [download], form, script, iframe, link, meta, img[src]").length};
      });
      assert(safety.isolated && !safety.active, id + " sandbox, parent isolation and active attribute filtering");
      if (id === "missing-file") {
        await tab.getByRole("button",{name:"Test link · Unsafe destination"}).click();
        assert((await text("preview-status")).includes("relative"), "Unsafe URL gives a path diagnostic");
      }
      await click("check");
      assert(tab.url().endsWith("id=" + id) && tab.frames().length === 2 && tab.frames()[1].url() === "about:srcdoc", id + " no external frame, form or navigation");
    }
    assert(!foreign.length && !outbound.length, "No outbound HTTP requests reached interception during security checks");

    await tab.goto(base + "mission.html?id=page-structure");
    await tab.locator("#next").click();
    await tab.locator("#prev").click();
    assert(tab.url().endsWith("id=page-structure"), "Previous and next cross the chapter boundary");
    const otherTab = await context.newPage();
    try {
      await otherTab.goto(base + "mission.html?id=broken-navigation");
      await otherTab.locator("#editor").fill("separate tab draft");
      await otherTab.goto(base + "index.html");
      await editor.fill("another chapter draft");
      await tab.locator("#back").click();
      const merged = (await state()).missions;
      assert(merged["broken-navigation"].draft === "separate tab draft" && merged["page-structure"].draft === "another chapter draft", "Navigating away flushes drafts and unrelated tab edits survive");
    } finally { await otherTab.close(); }

    // A future client may have written the same key. Leave its data untouched.
    await tab.evaluate(k => localStorage.setItem(k, '{"version":99}'), key);
    await tab.goto(missionURL);
    await editor.fill(correct);
    await click("check");
    assert((await state()).version === 99 && (await text("progress")).includes("Completed independently"), "Future storage version is preserved while practice continues in memory");
    for (const bad of ["{broken", '{"version":1,"missions":{"missing-heading":{"attempts":-9,"hints":"x","draft":false}}}']) {
      await tab.evaluate(([k, v]) => localStorage.setItem(k, v), [key,bad]);
      await tab.goto(missionURL);
      const recovered = await record();
      assert(recovered.draft === starter && recovered.attempts === 0 && recovered.hints === 0, "Invalid saved data recovers: " + bad);
    }
    await tab.evaluate(() => {
      Storage.prototype.setItem = () => { throw new DOMException("Storage unavailable", "QuotaExceededError"); };
    });
    await click("reveal");
    await editor.fill(correct);
    await click("check");
    assert((await text("progress")).includes("Completed with help") && (await text("storage-note")).includes("cannot save"), "Without writable storage the mission works in memory");
    // Fail reads before the app initializes, in the top-level page only.
    await context.addInitScript(() => {
      if (window === window.top) {
        Storage.prototype.getItem = () => { throw new DOMException("Storage unavailable", "SecurityError"); };
      }
    });
    await tab.reload();
    await click("hint");
    await editor.fill(correct);
    await click("check");
    assert((await text("progress")).includes("Completed with help") && (await text("storage-note")).includes("cannot save"), "A blocked storage read still allows hint-assisted completion");
    assert(!errors.length, "No unexpected console or runtime errors: " + errors.join(", "));
    return { passed: results, browserPolicyMessages: [...new Set(restrictions)] };
  } finally {
    await context.close();
  }
}
