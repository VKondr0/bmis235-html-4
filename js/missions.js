// Classic scripts keep the garage usable over file:// as well as HTTP.
window.CodeGarage = {
  chapters: {
    html: { title: "HTML Garage", url: "html-garage.html" }
  },
  missions: [{
    id: "missing-heading",
    chapter: "html",
    number: 1,
    title: "Missing Heading",
    difficulty: "Beginner",
    objective: "Repair the tag pair around Scuderia Ferrari so the team name is the page’s main heading.",
    concept: "An h1 marks the main heading. An opening tag starts it, and a closing tag with a slash ends it. The names in the pair must match. A browser can guess what a broken tag means, so even broken code can look right in the preview.",
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
