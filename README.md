# F1 Code Garage

Vitalii Kondratiuk (vkondratiuk) · BMIS 235 · HTML-4

## My path

Path 2 · Full build. F1 Code Garage uses motorsport examples to teach HTML and CSS. Learners edit code, run a visual preview and check their repair.

## Current build

Open `index.html` in a browser, or run `python3 -m http.server 8000` from this directory and open `http://localhost:8000/`. The site uses plain HTML, CSS and JavaScript with local assets and no build step.

- `index.html` is the Mission Control dashboard. Its mission link opens the last visited mission when progress is available.
- `html-garage.html`, `links-and-paths.html`, `css-lab.html` and `final-grand-prix.html` contain short module briefings.
- `arcade.html` runs the original F1 Reaction Challenge. Its best time uses the existing `f1ReactionBest` key in browser storage.
- `drivers.html`, `teams.html` and `circuits.html` retain the original F1 reference material.
- `styles.css` holds the shared design. Page-specific scripts live in `js/` and images in `img/`.

## Playable missions

Mission Control resumes the last visited mission. Both chapters list their four missions and show completions calculated from this browser’s records. CSS Lab and Final Grand Prix remain briefings for a later stage.

| Mission | Chapter | Repair |
| --- | --- | --- |
| 01 · Missing Heading | HTML Garage | Match the tags around the team’s main heading. |
| 02 · Driver Profile | HTML Garage | Structure a driver profile with an article, heading, paragraph, importance and emphasis. |
| 03 · Broken Car Image | HTML Garage | Find the original car illustration by its case-sensitive file name and describe it with alt text. |
| 04 · Page Structure | HTML Garage | Put the doctype, document sections, tab title and visible heading in the right places. |
| 05 · Broken Navigation | Links and Paths | Connect a team menu to the existing roster page. |
| 06 · Missing File | Links and Paths | Resolve three paths starting in a nested folder. |
| 07 · Jump to Garage | Links and Paths | Link to a unique section of the current document. |
| 08 · Race Broadcast | Links and Paths | Turn a watch URL into a titled offline embed for the same video. |

Run Code updates the preview. Check Answer evaluates the current draft. In the editor, Ctrl/Command + Enter runs the code and adding Shift checks it. Two hints and an explained solution are available for each mission. Using help before the first successful check records an assisted completion. Reset Code asks before replacing the draft and keeps the attempt and completion history.

The lessons draw on the course sections about tags and images, embedding, and links between project files. [HTML-1](https://gu-27.github.io/html-module/html-1.html) · [HTML-2](https://gu-27.github.io/html-module/html-2.html) · [HTML-3](https://gu-27.github.io/html-module/html-3.html)

## Engine and persistence

- `mission.html` and `js/learning.js` provide the shared editor, file tree, preview controls and mission navigation. `js/missions.js` holds the lessons and their virtual project manifests.
- `js/markup.js` parses fragments in inert templates. For a full document it retains evidence of the written tag positions and sends a resource-free outline to the browser’s document parser. `js/checker.js` checks each lesson’s objective, including explicit tag pairs where relevant.
- `js/virtual-files.js` resolves paths against the editing document and checks local destinations. All names come from the mission manifest. `js/car-art.js` draws the local illustration once and supplies its PNG to the image exercises.
- `js/preview.js` rebuilds supported display elements inside an opaque-origin sandbox. Its content policy denies external resources. Image lessons can display a generated PNG. Controls beside the frame test the actual paths and fragments from the last run. Race Broadcast simulates the player without contacting YouTube.
- `js/app.js` reads the existing version-one key `f1CodeGarage.progress.v1`. Drafts, attempts, help history, first completion and last visit survive refresh. Draft writes are grouped while typing and flushed when the page is hidden or left. A successful check saves immediately.

## Testing

The site has no production dependencies. To run the optional browser regressions, serve it with the command above. From the repository root, use an installed Playwright CLI and browser:

```sh
playwright-cli open http://localhost:8000/index.html --browser=chrome
playwright-cli run-code --filename=tests/learning.js
playwright-cli run-code --filename=tests/site.js
```

Use `--browser=webkit` for a WebKit installation. Both scenarios create disposable browser contexts. The learning suite exercises validators, the editor, simulations, storage, sandbox boundaries and layouts. The site suite follows internal links and tests keyboard navigation, reference cards and the Reaction Challenge.

## Current limitations

The checker focuses on each exercise’s stated objective. Image descriptions and broadcast titles use simple vocabulary checks. The virtual preview supports a subset of HTML and CSS. Testing a jump displays its destination section, and video playback is simulated. The course’s remaining seven missions are planned.

Use the same browser and site address to resume. If storage is unavailable or a newer version owns the key, practice continues in memory. Each update reads the latest stored record, but localStorage has no transaction spanning a read and a write. Truly simultaneous tab writes can race. A browser or OS crash before a pending draft flush can lose the most recent keystrokes.

## By hand and with AI

Vitalii supplied the original F1 site, chose the learning game and defined the scope of each stage. The earlier Reaction Challenge was made with ChatGPT. Codex built the dashboard, briefings, shared layout, learning engine, eight missions, local car illustration and browser checks and moved the existing game. The dashboard cover was generated with OpenAI ImageGen.

The test scenarios above document the automated checks. Classmate feedback is a separate assignment milestone.

## Assignment milestones

The project owner reports that Cloudflare Pages is connected. The Stage 3 changes are local pending review. A Path 1 classmate test and a documented change based on that feedback are still pending. [HTML-4 assignment](https://gu-27.github.io/html-module/html-4.html)
