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

## Mission 1 · Missing Heading

Open the mission from Mission Control or HTML Garage. Repair the mismatched end tag around the team name. The browser may already display a heading because HTML parsers recover from errors. Run Code shows the rendered result. Check Answer examines the written tag pair and the parsed heading. The exercise follows the course section on reading HTML. [HTML-1 course material](https://gu-27.github.io/html-module/html-1.html)

Drafts, attempts, hints, solution use, last visited mission and first completion are saved in the browser under `f1CodeGarage.progress.v1`. Help used before the first successful check marks the completion as assisted. Reset Code restores only the starter draft after confirmation. Use the same browser and site address to resume. When storage is unavailable, progress lasts for the current page visit.

## Learning engine

- `mission.html` and `js/learning.js` provide the shared workspace and its controls.
- `js/missions.js` defines chapter routes, mission content and the validation rule for each exercise. Mission 1 is available. The other 14 are planned.
- `js/app.js` owns versioned progress and the mission links on the dashboard and chapter page.
- `js/checker.js` checks the source and an inert parse independently of the preview. Each rule checks a teaching objective.
- `js/preview.js` copies supported display elements into a sandboxed, opaque-origin iframe. Inline CSS can style the preview. Scripts, forms, link destinations and remote assets are excluded. CSS-only exercises can supply a fixed HTML sample.

The browser regression scenario runs in a disposable profile and leaves learner storage intact. To repeat it with Playwright CLI, serve the repository locally, run `playwright-cli open http://localhost:8000/index.html --browser=chrome`, then `playwright-cli run-code --filename=tests/learning.js` from the repository root.

## By hand and with AI

Vitalii supplied the original F1 site, chose the learning game and defined the scope of each stage. The earlier Reaction Challenge was made with ChatGPT. Codex built the dashboard, briefings, shared layout, learning engine and first mission and moved the existing game. The dashboard cover was generated with OpenAI ImageGen.

Codex checked all nine pages in Chrome at widths from 320 to 1440 pixels, followed the internal links and checked keyboard navigation. Arcade checks covered the light sequence, false starts, retries and restoring a saved best time after a reload.

## Assignment milestones

Cloudflare deployment and a test with a Path 1 classmate are pending. Record the live URL, the classmate’s feedback and the resulting change here once available. [HTML-4 assignment](https://gu-27.github.io/html-module/html-4.html)
