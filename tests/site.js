// Playwright CLI regression for shared navigation, reference pages and the arcade.
async currentPage => {
  const base = new URL("./", currentPage.url()).href;
  const context = await currentPage.context().browser().newContext();
  try {
    const page = await context.newPage();
    const pages = ["index", "html-garage", "links-and-paths", "css-lab", "final-grand-prix", "arcade", "drivers", "teams", "circuits"];
    const issues = [];
    const targets = new Set();
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    page.on("pageerror", e => issues.push(e.message));
    page.on("console", m => { if (m.type() === "error") issues.push(m.text()); });
    page.on("response", r => { if (!r.ok() && r.status() >= 400) issues.push(r.url()); });
    for (const name of pages) {
      const url = base + name + ".html";
      await page.goto(url);
      check(await page.locator("main h1").count() === 1, name + " main heading");
      check(await page.locator('nav a[aria-current=page]').getAttribute('href') === name + ".html", name + " selected link");
      check(await page.locator('meta[name=author]').getAttribute('content') === "Vitalii Kondratiuk", name + " author");
      check((await page.locator("footer").innerText()).includes("BMIS 235 · HTML-4"), name + " course");
      check((await page.locator(".primary a").evaluateAll(links => links.map(a => a.href))).join() === pages.slice(0,6).map(n => base + n + ".html").join(), name + " navigation");
      for (const target of await page.locator("a[href]").evaluateAll(links => links.map(a => a.href))) {
        if (!target.startsWith("mailto:")) targets.add(target);
      }
      for (const width of [320,375,390,768,1024,1440]) {
        await page.setViewportSize({width,height:900});
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + " overflows " + width);
      }
    }
    for (const target of targets) {
      const r = await page.goto(target);
      if (r) check(r.ok(), target);
      check(await page.evaluate(() => !location.hash || !!document.getElementById(location.hash.slice(1))), "missing anchor " + target);
    }
    await page.goto(base + "index.html");
    // macOS WebKit's links-inclusive traversal uses Option+Tab by default.
    const linkKey = context.browser().browserType().name() === "webkit" ? "Alt+Tab" : "Tab";
    await page.keyboard.press(linkKey);
    check(await page.locator(".skip").evaluate(el => el === document.activeElement), "first keyboard focus");
    await page.keyboard.press("Enter");
    check(await page.locator("main").evaluate(el => el === document.activeElement), "skip target");
    await page.getByRole("link",{name:"Browse briefings"}).click();
    check(page.url().endsWith("#modules"), "briefings link");
    await page.locator('.module-card').first().click();
    check(page.url().endsWith("html-garage.html"), "HTML briefing card");
    await page.goto(base + "drivers.html");
    const card = page.locator(".f1-card").first();
    await card.focus();
    await page.keyboard.press("Space");
    check(await card.getAttribute("aria-pressed") === "true", "driver card opens");
    await page.keyboard.press("Enter");
    check(await card.getAttribute("aria-pressed") === "false", "driver card closes");
    await page.goto(base + "index.html");
    await page.getByRole("link",{name:"Play reaction game"}).click();
    const button = page.locator(".reaction-button"), result = page.locator(".reaction-result");
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now()+1000));
    await button.focus();
    await page.keyboard.press("Enter");
    await page.clock.runFor(1000);
    check(await page.locator(".reaction-light.on").count() === 1, "first light");
    await page.keyboard.press("Space");
    check(await result.innerText() === "JUMP START", "false start");
    await page.clock.runFor(8000);
    check(await result.innerText() === "JUMP START", "cancelled timers");
    await page.keyboard.press("Enter");
    await page.clock.runFor(5000);
    check(await page.locator(".reaction-light.on").count() === 5, "five lights");
    await page.clock.runFor(2501);
    check(await result.innerText() === "GO!" && await page.locator(".reaction-light.on").count() === 0, "lights out");
    await button.click();
    const best = await page.evaluate(() => localStorage.getItem("f1ReactionBest"));
    check(best !== null && (await result.innerText()) === best + " ms", "best saved");
    await page.reload();
    check((await page.locator(".reaction-best").innerText()) === "Best time: " + best + " ms", "best restored");
    check(issues.length === 0, issues.join("\n"));
    return {pages:pages.length, testedWidths:[320,375,390,768,1024,1440], verifiedLinkTargets:targets.size, keyboard:"passed", arcade:"passed", consoleErrors:issues};
  } finally {
    await context.close();
  }
}
