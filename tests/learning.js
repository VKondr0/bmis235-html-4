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
    tab.on("pageerror", error => errors.push(error.message));
    tab.on("console", message => {
      if (message.type() !== "error") return;
      const detail = message.text();
      if (detail.startsWith("Blocked script execution in 'about:srcdoc'") ||
          (detail.includes("Content Security Policy") && detail.includes("preview-check.invalid"))) {
        restrictions.push(detail);
      } else {
        errors.push(detail);
      }
    });
    const missionURL = base + "mission.html?id=missing-heading";
    const key = "f1CodeGarage.progress.v1";
    const state = () => tab.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    const record = async () => (await state()).missions["missing-heading"];
    const editor = tab.locator("#editor");
    const click = id => tab.locator("#" + id).click();
    const text = id => tab.locator("#" + id).innerText();

    await tab.goto(base + "index.html");
    await tab.locator("[data-mission-link]").click();
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
    assert(tab.url().endsWith("html-garage.html") && (await tab.locator("[data-mission-status]").innerText()).includes("independently"), "Chapter reflects saved progress");
    await tab.locator("[data-mission-link]").click();
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
    for (const width of [320, 390, 768, 1024, 1440]) {
      await tab.setViewportSize({width, height:900});
      const layout = await tab.evaluate(() => {
        const [editor, preview] = [...document.querySelectorAll(".station")].map(el => el.getBoundingClientRect());
        return {fits:document.documentElement.scrollWidth <= innerWidth, stacked:preview.top >= editor.bottom};
      });
      assert(layout.fits && layout.stacked === (width <= 768), "Workbench layout at " + width + "px");
    }
    await tab.goto(base + "index.html");
    assert((await tab.locator("[data-mission-link]").innerText()).startsWith("Review") && (await tab.locator("[data-mission-status]").innerText()).includes("with help"), "Dashboard restores completed mission status");
    await tab.goto(base + "mission.html?id=unknown");
    assert(await tab.locator("#unavailable").isVisible() && await tab.locator("#workspace").isHidden(), "Unknown mission shows a working return link");

    for (const bad of ["{broken", '{"version":1,"missions":{"missing-heading":{"attempts":-9,"hints":"x","draft":false}}}', '{"version":99}']) {
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
