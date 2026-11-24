(() => {
  const garage = window.CodeGarage;
  const byId = id => document.getElementById(id);
  const id = new URLSearchParams(location.search).get("id");
  const mission = garage.missions.find(item => item.id === id);
  if (!mission) {
    byId("unavailable").hidden = false;
    return;
  }

  const chapter = garage.chapters[mission.chapter];
  const editor = byId("editor");
  const feedback = byId("feedback");
  const progress = garage.progress;
  let record = progress.visit(mission);
  let previewCode;

  document.title = mission.title + " | F1 Code Garage";
  byId("mission-meta").textContent = "Mission " + mission.number + " / " + mission.difficulty;
  byId("mission-title").textContent = mission.title;
  byId("objective").textContent = mission.objective;
  byId("concept").textContent = mission.concept;
  byId("filename").textContent = mission.filename;
  byId("chapter").href = byId("back").href = chapter.url;
  byId("chapter").textContent = chapter.title;
  byId("back").textContent = "Back to " + chapter.title;
  byId("solution-code").textContent = mission.solution;
  byId("explanation").textContent = mission.explanation;
  byId("workspace").hidden = false;

  function showProgress() {
    byId("progress").textContent = progress.status(record) + " · Attempts: " + record.attempts;
    byId("storage-note").textContent = progress.persistent ? "" :
      "Your browser cannot save progress right now. You can keep working on this page.";
  }

  function syncGutter() {
    byId("lines").style.transform = "translateY(-" + editor.scrollTop + "px)";
  }

  function numberLines() {
    const count = editor.value.split("\n").length;
    const lines = byId("lines");
    if (lines.dataset.count !== String(count)) {
      lines.textContent = Array.from({ length: count }, (_, i) => i + 1).join("\n");
      lines.dataset.count = count;
    }
    syncGutter();
  }

  function run() {
    previewCode = editor.value;
    garage.renderPreview(byId("preview"), previewCode, mission);
    byId("preview-status").textContent = "Preview shows the current editor code.";
  }

  function check() {
    const result = garage.checkAnswer(editor.value, mission.rule);
    record = progress.check(mission, result.correct, editor.value);
    feedback.textContent = (result.correct ? "Mission complete. " : "Try again. ") + result.message;
    feedback.dataset.result = result.correct ? "success" : "retry";
    showProgress();
  }

  function showHints() {
    const hints = byId("hints");
    for (let i = hints.children.length; i < record.hints; i++) {
      const item = document.createElement("li");
      item.textContent = mission.hints[i];
      hints.append(item);
    }
    const last = record.hints === mission.hints.length;
    byId("hint").disabled = last;
    byId("hint").textContent = last ? "All hints shown" :
      "Show hint " + (record.hints + 1) + " of " + mission.hints.length;
  }

  function showSolution(open) {
    byId("solution").hidden = !open;
    byId("reveal").setAttribute("aria-expanded", String(open));
    byId("reveal").textContent = open ? "Hide Solution" : "Show Solution";
  }

  editor.addEventListener("input", () => {
    record = progress.saveDraft(mission, editor.value);
    feedback.textContent = "";
    byId("preview-status").textContent = editor.value === previewCode ?
      "Preview shows the current editor code." : "Draft changed. Run Code to update the preview.";
    numberLines();
    showProgress();
  });
  editor.addEventListener("scroll", syncGutter);
  editor.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      if (event.repeat) return;
      if (event.shiftKey) check();
      else run();
    }
  });
  byId("run").addEventListener("click", run);
  byId("check").addEventListener("click", check);
  byId("hint").addEventListener("click", () => {
    record = progress.hint(mission);
    showHints();
    showProgress();
  });
  byId("reveal").addEventListener("click", () => {
    const opening = byId("solution").hidden;
    if (opening) record = progress.reveal(mission);
    showSolution(opening);
    showProgress();
  });
  byId("reset").addEventListener("click", () => {
    if (!window.confirm("Replace your draft with the starter code? Your attempts, help history and completion will be kept.")) return;
    editor.value = mission.starter;
    editor.scrollTop = editor.scrollLeft = 0;
    record = progress.saveDraft(mission, editor.value);
    feedback.removeAttribute("data-result");
    feedback.textContent = "Starter code restored.";
    numberLines();
    run();
    showProgress();
    editor.focus();
  });

  editor.value = record.draft;
  numberLines();
  run();
  showProgress();
  showHints();
  showSolution(record.revealed);
})();
