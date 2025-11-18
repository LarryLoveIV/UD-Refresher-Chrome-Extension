const statusEl = document.getElementById("status");
const lastUpdatedEl = document.getElementById("last-updated");

// Function to update last-updated display
function updateLastUpdated() {
  chrome.storage.local.get("lastUpdated", (data) => {
    if (data.lastUpdated) {
      const date = new Date(data.lastUpdated);
      lastUpdatedEl.textContent = `Last updated: ${date.toLocaleString()}`;
    } else {
      lastUpdatedEl.textContent = "Last updated: never";
    }
  });
}

// Run this when the popup opens
updateLastUpdated();

document.getElementById("refresh").addEventListener("click", async () => {
  statusEl.textContent = "Updating…";

  chrome.runtime.sendMessage({ action: "runFantasyUpdate" }, (response) => {
    if (chrome.runtime.lastError) {
      statusEl.textContent = "Error: " + chrome.runtime.lastError.message;
      return;
    }

    statusEl.textContent = response?.status || "Fantasy update triggered!";

    // Update last-updated after refresh
    updateLastUpdated();
  });
});