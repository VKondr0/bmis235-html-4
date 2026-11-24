// Classic scripts keep the garage usable over file:// as well as HTTP.
window.CodeGarage = {
  chapters: {
    html: { title: "HTML Garage", url: "html-garage.html" },
    links: { title: "Links and Paths", url: "links-and-paths.html" }
  },
  missions: [{
    id: "missing-heading",
    chapter: "html",
    number: 1,
    title: "Missing Heading",
    difficulty: "Beginner",
    objective: "Repair the tag pair around Scuderia Ferrari so the team name is the page’s main heading.",
    concept: "An h1 marks the main heading. An opening tag starts it, and a closing tag with a slash ends it. The names in the pair must match. A browser can guess what a broken tag means, so even broken code can look right in the preview.",
    expected: "Scuderia Ferrari appears as one main heading with a matching end tag.",
    filename: "index.html",
    language: "html",
    starter: '<section class="team-profile">\n  <h1>Scuderia Ferrari</h2>\n</section>',
    solution: '<section class="team-profile">\n  <h1>Scuderia Ferrari</h1>\n</section>',
    explanation: "Changing the 2 to a 1 closes the same heading that <h1> opened. The team name stays between the two tags.",
    hints: [
      "Look immediately before and after the team name. Which heading level does each tag use?",
      "The opener is <h1>. After the team name, put a slash before the same tag name and finish with >."
    ],
    rule: {
      type: "pairedHeading",
      text: "Scuderia Ferrari",
      empty: "Start with an opening heading tag, then add the team name and its closing tag.",
      success: "The opening and closing h1 tags match and enclose the team name."
    }
  }]
};

// Keep each repair beside its working example. Only published missions are listed.
(() => {
  const missions = CodeGarage.missions;
  function add(definition, breakExample) {
    missions.push({
      number: missions.length + 1,
      language: "html",
      filename: "index.html",
      ...definition,
      starter: breakExample(definition.solution)
    });
  }

  add({
    id: "driver-profile", chapter: "html", title: "Driver Profile", difficulty: "Beginner",
    objective: "Give Lando Norris an article with a main heading and a paragraph. Mark braking as important and late as emphasized.",
    concept: "A heading names the profile. A paragraph holds the description. Strong marks importance and em stresses a word. Close the inner element before closing its parent.",
    expected: "The driver’s name is a heading. In the sentence, braking is bold and late is italic.",
    solution: '<article>\n  <h1>Lando Norris</h1>\n  <p>His <strong>braking</strong> lets him turn in <em>late</em>.</p>\n</article>',
    hints: ["Which part names the driver and which part describes him?", "Inside the paragraph, wrap braking in strong and late in em. Close each pair around its own word."],
    explanation: "The article groups one profile. Its h1 labels the article and its paragraph gives the two marked words their context.",
    rule: { type: "profile", success: "The heading names the driver and the paragraph gives each word its intended meaning." }
  }, code => code.replaceAll("h1", "h2").replaceAll("strong>", "span>").replaceAll("em>", "span>"));

  add({
    id: "broken-car-image", chapter: "html", title: "Broken Car Image", difficulty: "Beginner",
    objective: "Find the car illustration in the file tree. Fix src and write alt text that identifies the red racing car.",
    concept: "An img gets its pixels from src. Every letter in the file name and its extension matters. Alt text describes the subject to screen-reader users and gives readers an alternative when the picture cannot load.",
    expected: "A red single-seater appears. Its text alternative describes the car even without the picture.",
    files: { "index.html": {}, "images/Racer.png": { image: true } },
    solution: '<h1>Garage reveal</h1>\n<img src="images/Racer.png" alt="Red racing car with black wheels">',
    hints: ["Compare the folder, capital R and file extension with the tree.", "Use images/Racer.png for src. In alt, describe the red car to someone who cannot see it."],
    explanation: "The path points into images and matches Racer.png exactly. The alt attribute communicates what the illustration shows.",
    rule: { type: "car", success: "The image resolves and its alternative identifies the car." }
  }, code => code.replace("Racer.png", "racer.jpg").replace("Red racing car with black wheels", "image"));

  add({
    id: "page-structure", chapter: "html", title: "Page Structure", difficulty: "Intermediate",
    objective: "Rebuild the complete document with an HTML doctype, explicit html, head and body pairs, a tab title of Pit Wall and a visible Race Notes heading.",
    concept: "The doctype selects modern HTML. Inside html, head contains metadata such as the tab title. Body contains the content a visitor reads on the page.",
    expected: "The simulated tab says Pit Wall. Race Notes appears as the main heading inside the page.",
    documentMode: true,
    solution: '<!doctype html>\n<html lang="en">\n<head>\n  <title>Pit Wall</title>\n</head>\n<body>\n  <h1>Race Notes</h1>\n</body>\n</html>',
    hints: ["Find the document declaration and the two sections inside html.", "Put title inside head and h1 inside body. Place the HTML doctype before the html opening tag."],
    explanation: "The browser reads the head before the body. The tab title and page heading can use different words because they serve different readers and locations.",
    rule: { type: "structure", success: "Your source places the tab title and visible heading in their own sections." }
  }, code => code.replace("<!doctype html>\n", "").replace("<title>Pit Wall</title>", "<h1>Race Notes</h1>").replace("<body>\n  <h1>Race Notes</h1>", "<body>\n  <title>Pit Wall</title>"));

  add({
    id: "broken-navigation", chapter: "links", title: "Broken Navigation", difficulty: "Beginner",
    objective: "Repair the Drivers link in the team menu. Keep Home pointing to index.html.",
    concept: "An anchor’s words label its destination. The href attribute tells the browser which file to open. Two files in the same folder can link using just their names.",
    expected: "Testing Drivers opens the virtual driver roster. Home shows the edited menu again.",
    files: { "index.html": {}, "drivers.html": { heading: "Driver roster", text: "Lando Norris and Oscar Piastri share the team garage." } },
    solution: '<nav>\n  <a href="index.html">Home</a>\n  <a href="drivers.html">Drivers</a>\n</nav>',
    hints: ["Read the link text, then look for its destination in the file tree.", "Drivers needs href pointing to drivers.html, including the final s in drivers."],
    explanation: "The menu labels stay the same. Each href now resolves to a real page in the virtual team folder.",
    rule: { type: "menu", success: "Both menu links lead to the intended pages." }
  }, code => code.replace('href="drivers.html"', 'href="driver.html"'));

  add({
    id: "missing-file", chapter: "links", title: "Missing File", difficulty: "Intermediate",
    filename: "pages/team/index.html",
    objective: "From the team page, repair the Setup and Strategy links and the path to the car image. Use the virtual file tree as your map.",
    concept: "Start in the folder containing the document. A plain name stays in that folder, a folder name takes you down one level, and each ../ takes you up one level.",
    expected: "Setup and Strategy open different team notes. The car illustration loads from the project’s media folder.",
    files: {
      "pages/team/index.html": {}, "pages/team/setup.html": { heading: "Setup sheet", text: "The crew checks front wing balance before qualifying." },
      "pages/team/notes/strategy.html": { heading: "Race strategy", text: "Plan the tyre change before the pit window opens." },
      "media/Racer.png": { image: true }
    },
    solution: '<h1>Team workshop</h1>\n<a href="setup.html">Setup</a>\n<a href="notes/strategy.html">Strategy</a>\n<img src="../../media/Racer.png" alt="Red racing car">',
    hints: ["Start at pages/team for each path. Which file is beside index.html and which is one folder below?", "Setup is in the same folder. Use notes/ for Strategy and go up twice before entering media for the car."],
    explanation: "Each path starts at pages/team. The image path leaves team and pages before entering media at the project root.",
    rule: { type: "paths", success: "All three paths resolve from the nested team page." }
  }, code => code.replace('href="setup', 'href="../setup').replace('href="notes/', 'href="').replace('../../media/Racer', '../media/racer'));

  add({
    id: "jump-to-garage", chapter: "links", title: "Jump to Garage", difficulty: "Intermediate",
    objective: "Make the Garage link jump to the Garage section on the same page. Give that section or its heading a unique id.",
    concept: "A file name opens a different document. A fragment starts with # and identifies one spot in the current document. The id itself has no #, and its capitalization must match.",
    expected: "Testing Garage brings the Garage heading and its crew note into view.",
    solution: '<a href="#garage">Garage</a>\n<h1>Race weekend</h1>\n<section>\n  <h2>Practice</h2>\n  <p>Record the lap times and listen for the tyre report.</p>\n</section>\n<section>\n  <h2>Qualifying</h2>\n  <p>Watch the timing board for the final flying lap.</p>\n</section>\n<section id="garage">\n  <h2>Garage</h2>\n  <p>The crew fits fresh tyres for the race.</p>\n</section>',
    hints: ["Compare the part after # with the id near the Garage heading.", "Make the link and the Garage section share one identifier. Check that no other element has that id."],
    explanation: "A unique matching id identifies the garage within this document. The preview can now locate the destination without opening another file.",
    rule: { type: "jump", success: "The fragment identifies one Garage destination in the current document." }
  }, code => code.replace('href="#garage"', 'href="#garages"'));

  add({
    id: "race-broadcast", chapter: "links", title: "Race Broadcast", difficulty: "Intermediate",
    objective: "Embed the qualifying lap with video ID GarageLap01. Give the iframe a title that describes the qualifying lap.",
    concept: "An ordinary link takes you to a watch page. An iframe embeds another page inside yours. In HTML-2, the local car art is owned, a remote file can be linked, a player is embedded, and this practice tool is built with code.",
    expected: "An offline broadcast card shows the qualifying lap’s title and its video ID.",
    video: "GarageLap01",
    solution: '<h1>Race broadcast</h1>\n<iframe src="https://www.youtube.com/embed/GarageLap01"\n  title="Onboard qualifying lap"></iframe>',
    hints: ["Find the video ID after v=. Keep that ID when changing the URL.", "Use https://www.youtube.com/embed/ followed by the same ID. Describe the qualifying lap in the iframe title."],
    explanation: "The embed address selects a player for that video. Its title names the frame for assistive technology. This exercise displays a local stand-in for the player.",
    rule: { type: "broadcast", success: "The frame identifies the intended video and describes its content." }
  }, code => code.replace("/embed/", "/watch?v=").replace("Onboard qualifying lap", "Video"));
})();
