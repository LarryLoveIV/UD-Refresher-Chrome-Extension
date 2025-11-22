const statusEl = document.getElementById("status");
const lastUpdatedEl = document.getElementById("last-updated");

// 🔥 Your Cloud Run endpoint that returns { lastFinished: "ISO_DATE" }
const STATUS_URL = "https://ud-data-refresher-487662280539.us-east5.run.app";

// Fetch timestamp from Cloud Run -> Firestore
async function fetchLastUpdated() {
  try {
    const res = await fetch(STATUS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Bad response from server");

    const data = await res.json();

    if (data.lastFinished) {
      const date = new Date(data.lastFinished);
      lastUpdatedEl.textContent = `Last updated: ${date.toLocaleString()}`;
    } else {
      lastUpdatedEl.textContent = "Last updated: never";
    }
  } catch (err) {
    console.error("Error fetching last updated:", err);
    lastUpdatedEl.textContent = "Error loading timestamp";
  }
}

// Run this when popup opens
fetchLastUpdated();

document.getElementById("refresh").addEventListener("click", async () => {
  statusEl.textContent = "Updating…";

  chrome.runtime.sendMessage({ action: "runFantasyUpdate" }, async (response) => {
    if (chrome.runtime.lastError) {
      statusEl.textContent = "Error: " + chrome.runtime.lastError.message;
      return;
    }

    statusEl.textContent = response?.status
