(() => {
  const garage = window.CodeGarage;
  const key = "f1CodeGarage.progress.v1";
  const find = id => garage.missions.find(mission => mission.id === id);
  const fresh = () => ({ version: 1, lastVisited: null, missions: {} });
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  let state = fresh();
  let persistent = true;

  function read() {
    if (!persistent) return;
    try {
      const json = localStorage.getItem(key);
      if (json === null) {
        state = fresh();
        return;
      }
      const saved = JSON.parse(json);
      const clean = fresh();
      if (saved?.version === 1) {
        clean.lastVisited = find(saved.lastVisited)?.id ?? null;
        for (const mission of garage.missions) {
          const record = saved.missions?.[mission.id];
          if (!record || typeof record !== "object" || Array.isArray(record)) continue;
          clean.missions[mission.id] = {
            draft: typeof record.draft === "string" ? record.draft : mission.starter,
            attempts: count(record.attempts),
            hints: Math.min(count(record.hints), mission.hints.length),
            revealed: record.revealed === true,
            completion: ["independent", "assisted"].includes(record.completion) ? record.completion : null
          };
        }
      }
      state = clean;
    } catch (error) {
      if (error instanceof SyntaxError) state = fresh();
      else persistent = false;
    }
  }

  function recordFor(mission) {
    return state.missions[mission.id] ?? {
      draft: mission.starter, attempts: 0, hints: 0, revealed: false, completion: null
    };
  }

  function update(mission, change) {
    // Re-read before changing one record so edits in other tabs are retained.
    read();
    const record = recordFor(mission);
    change(record);
    state.missions[mission.id] = record;
    if (persistent) {
      try { localStorage.setItem(key, JSON.stringify(state)); }
      catch { persistent = false; }
    }
    return record;
  }

  function status(record) {
    if (record.completion === "independent") return "Completed independently";
    if (record.completion === "assisted") return "Completed with help";
    return "In progress";
  }

  garage.progress = {
    visit: mission => update(mission, () => { state.lastVisited = mission.id; }),
    saveDraft: (mission, code) => update(mission, record => { record.draft = code; }),
    hint: mission => update(mission, record => { record.hints = Math.min(record.hints + 1, mission.hints.length); }),
    reveal: mission => update(mission, record => { record.revealed = true; }),
    check: (mission, correct, code) => update(mission, record => {
      record.draft = code;
      record.attempts += 1;
      if (correct && !record.completion) {
        record.completion = record.hints || record.revealed ? "assisted" : "independent";
      }
    }),
    status,
    get persistent() { return persistent; }
  };

  function updateLinks() {
    read();
    for (const link of document.querySelectorAll("[data-mission-link]")) {
      const id = link.dataset.missionLink;
      const mission = id === "last" ? find(state.lastVisited) || garage.missions[0] : find(id);
      if (!mission) continue;
      const record = state.missions[mission.id];
      const verb = record?.completion ? "Review" : record ? "Resume" : "Open";
      link.href = "mission.html?id=" + encodeURIComponent(mission.id);
      link.textContent = verb + " mission " + mission.number + " · " + mission.title;
      const detail = link.parentElement.querySelector("[data-mission-status]");
      if (detail) detail.textContent = record ? status(record) : "";
    }
  }
  updateLinks();
  window.addEventListener("pageshow", updateLinks);
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) updateLinks();
  });
})();
