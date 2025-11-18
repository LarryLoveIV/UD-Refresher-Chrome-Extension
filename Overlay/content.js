async function addVegasData() {
  const { playerData } = await chrome.storage.local.get("playerData");
  if (!playerData) {
    console.warn("No player data found in storage yet");
    return;
  }

  // Select all player name elements
  const playerElements = document.querySelectorAll(".styles__playerName__FI3Zf");

  playerElements.forEach(el => {
    const name = el.textContent.trim().toLowerCase();
    const data = playerData[name];
    if (data && !el.dataset.vegasAdded) {
      const overlay = document.createElement("span");
      overlay.textContent = `  |  ${data.implied || "-"} ttl  |  ${data.szn || "-"} |  ${data.l4 || "-"} |  ${data.ds_proj || "-"}`;
      overlay.style.fontSize = "13px";
      overlay.style.color = "#00b300";
      overlay.style.marginLeft = "6px";

      el.appendChild(overlay);
      el.dataset.vegasAdded = "true"; // avoid duplicates
    }
  });
}

// Run initially and re-run when content changes (since the site uses React)
const observer = new MutationObserver(() => addVegasData());
observer.observe(document.body, { childList: true, subtree: true });

// Initial run
addVegasData();
