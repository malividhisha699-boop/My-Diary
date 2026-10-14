
const $ = (id) => document.getElementById(id);

const form = $("entryForm");
const entriesList = $("entriesList");
const emptyMessage = $("emptyMessage");

let entries = [];
let editingId = null;

try {
  const saved = JSON.parse(localStorage.getItem("myday-entries") || "[]");
  if (Array.isArray(saved)) {
    entries = saved.filter(
      (entry) => entry &&
      typeof entry.id === "number" &&
      typeof entry.title === "string" &&
      typeof entry.content === "string"
    );
  }
} catch (error) {
  entries = [];
}

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function saveEntries() {
  try {
    localStorage.setItem("myday-entries", JSON.stringify(entries));
  } catch (error) {
    $("formMessage").textContent =
      "Could not save entries. Check your browser storage settings.";
  }
}

function setupDate() {
  const today = new Date();
  $("dateLabel").textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  $("entryDate").value = todayString();
}

function updateStats() {
  $("entryCount").textContent = entries.length;
  $("todayCount").textContent =
    entries.filter((entry) => entry.date === todayString()).length;
}

function formatDate(dateString) {
  if (!dateString) return "Date not set";

  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function createButton(text, label, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", callback);
  return button;
}

function renderEntries() {
  entriesList.replaceChildren();

  const query = $("searchInput").value.trim().toLowerCase();

  const filtered = entries
    .filter((entry) =>
      `${entry.title} ${entry.content} ${entry.mood}`
        .toLowerCase().includes(query)
    )
    .sort((a, b) => {
      const dateOrder = (b.date || "").localeCompare(a.date || "");
      return dateOrder || b.id - a.id;
    });

  emptyMessage.hidden = filtered.length > 0;
  emptyMessage.textContent = query
    ? "No memories match your search. Try another word. 🌷"
    : "Your journal is waiting for its first story. 🌷";

  filtered.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "entry-card";

    const top = document.createElement("div");
    top.className = "entry-card-top";

    const mood = document.createElement("span");
    mood.className = "entry-mood";
    mood.textContent = entry.mood;

    const date = document.createElement("span");
    date.className = "entry-date";
    date.textContent = formatDate(entry.date);

    top.append(mood, date);

    const title = document.createElement("h3");
    title.textContent = entry.title;

    const content = document.createElement("p");
    content.className = "entry-content";
    content.textContent = entry.content;

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    actions.append(
      createButton("✏️ Edit", `Edit ${entry.title}`, () => editEntry(entry.id)),
      createButton("🗑️ Delete", `Delete ${entry.title}`, () => deleteEntry(entry.id))
    );

    card.append(top, title, content, actions);
    entriesList.append(card);
  });

  updateStats();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = $("entryTitle").value.trim();
  const content = $("entryContent").value.trim();

  if (!title || !content) {
    $("formMessage").textContent = "Please enter both a title and your thoughts.";
    return;
  }

  if (editingId !== null) {
    const entry = entries.find((item) => item.id === editingId);

    if (entry) {
      entry.title = title;
      entry.date = $("entryDate").value;
      entry.mood = $("entryMood").value;
      entry.content = content;
    }
  } else {
    entries.push({
      id: Date.now(),
      title,
      date: $("entryDate").value,
      mood: $("entryMood").value,
      content
    });
  }

  saveEntries();
  resetForm();
  renderEntries();
  $("formMessage").textContent = "Your memory has been saved. 💗";
  showView("home");
});

function editEntry(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  editingId = id;
  $("entryTitle").value = entry.title;
  $("entryDate").value = entry.date || todayString();
  $("entryMood").value = entry.mood;
  $("entryContent").value = entry.content;
  $("editorHeading").textContent = "Edit Your Memory ✏️";
  $("saveButton").textContent = "💌 Update Entry";
  $("cancelEdit").classList.remove("hidden");
  $("formMessage").textContent = "Make your changes below.";
  showView("write");
  $("editor").scrollIntoView({ behavior: "smooth" });
  $("entryTitle").focus();
}

function deleteEntry(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;

  entries = entries.filter((item) => item.id !== id);

  if (editingId === id) resetForm();

  saveEntries();
  renderEntries();
}

function resetForm() {
  editingId = null;
  form.reset();
  $("entryDate").value = todayString();
  $("editorHeading").textContent = "Dear Diary... 💌";
  $("saveButton").textContent = "💌 Save Entry";
  $("cancelEdit").classList.add("hidden");
}

$("cancelEdit").addEventListener("click", () => {
  resetForm();
  $("formMessage").textContent = "";
});

$("searchInput").addEventListener("input", renderEntries);

function showView(view) {
  $("editor").classList.toggle("hidden", view !== "write");
  $("entriesSection").classList.toggle("hidden", view === "write");

  $("entriesHeading").textContent =
    view === "memories" ? "All Your Memories 💌" : "Your Recent Memories 🌼";

  document.querySelectorAll(".nav").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  if (view === "write") {
    $("entryTitle").focus();
  } else {
    renderEntries();
  }
}

document.querySelectorAll(".nav").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

$("startWriting").addEventListener("click", () => {
  resetForm();
  showView("write");
  $("editor").scrollIntoView({ behavior: "smooth" });
});

$("themeButton").addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const dark = document.body.classList.contains("dark");
  $("themeButton").textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";

  try {
    localStorage.setItem("myday-dark", String(dark));
  } catch (error) {
    // Dark mode still works until the page is closed.
  }
});

try {
  if (localStorage.getItem("myday-dark") === "true") {
    document.body.classList.add("dark");
    $("themeButton").textContent = "☀️ Light Mode";
  }
} catch (error) {
  // Use the default theme if storage is unavailable.
}

setupDate();
renderEntries();
showView("home");
