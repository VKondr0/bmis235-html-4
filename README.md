# F1 Code Garage

Vitalii Kondratiuk (vkondratiuk) · BMIS 235 · HTML-4

## My path

Path 2 · Full build. F1 Code Garage uses a race report, circuit links and a shared team stylesheet to introduce HTML and CSS through motorsport examples. The planned practice loop is to edit code, see the result and try again.

## Current build

Open `index.html` in a browser, or run `python3 -m http.server 8000` from this directory and open `http://localhost:8000/`. The site uses plain HTML, CSS and JavaScript with local assets and no build step.

- `index.html` is the Mission Control dashboard.
- `html-garage.html`, `links-and-paths.html`, `css-lab.html` and `final-grand-prix.html` contain short module briefings.
- `arcade.html` runs the original F1 Reaction Challenge. Its best time uses the existing `f1ReactionBest` key in browser storage.
- `drivers.html`, `teams.html` and `circuits.html` retain the original F1 reference material.
- `styles.css` holds the shared design. Page-specific scripts live in `js/` and images in `img/`.

The next stage covers 15 interactive missions, an editor with an isolated preview, validation, hints, explanations and saved learning progress.

## By hand and with AI

Vitalii supplied the original F1 site, chose the learning game and defined the scope of this stage. The earlier Reaction Challenge was made with ChatGPT. Codex built the dashboard, briefings and shared layout and moved the existing game. The dashboard cover was generated with OpenAI ImageGen.

Codex checked all nine pages in Chrome at widths from 320 to 1440 pixels, followed the internal links and checked keyboard navigation. Arcade checks covered the light sequence, false starts, retries and restoring a saved best time after a reload.

## Assignment milestones

Cloudflare deployment and a test with a Path 1 classmate are pending. Record the live URL, the classmate’s feedback and the resulting change here once available. [HTML-4 assignment](https://gu-27.github.io/html-module/html-4.html)
