// ==========================
// Configuration
// ==========================
const CONFIG = {
  SHEET_ID: '18CdAlA9Aq3aEARwZoB8LkCdycwKU0qr48OwbafZ1lhU',
  API_KEY: 'AIzaSyBgL1yfIeHxCEOd9B4EihmoL8EWzpR7rtM',
  RANGE: 'Sheet1!A:Q',
  CLOUD_RUN_URL: 'https://ud-data-refresher-487662280539.us-east5.run.app' // replace with your Cloud Run endpoint
};

// ==========================
// Fetch Google Sheet data
// ==========================
async function fetchSheetData() {
  try {
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.RANGE}?key=${CONFIG.API_KEY}`;
    const res = await fetch(sheetUrl);

    if (!res.ok) {
      console.error('Sheets API request failed:', res.status, res.statusText);
      return;
    }

    const data = await res.json();
    if (!data.values || data.values.length < 2) {
      console.error("No data found in sheet or invalid range");
      return;
    }

    const header = data.values[0];
    const rows = data.values.slice(1);

    // Column indexes (0-based)
    const playerIdx = 0;   // Column A
    const impliedIdx = 1;  // Column B
    const dsprojIdx = 12;  // Column M
    const sznIdx = 13;     // Column N
    const l4Idx = 14;      // Column O

    const playerData = {};

    rows.forEach(row => {
      const name = (row[playerIdx] || "").trim().toLowerCase();
      const implied = row[impliedIdx] || "";
      const ds_proj = row[dsprojIdx] || "";
      const szn = row[sznIdx] || "";
      const l4 = row[l4Idx] || "";

      if (name) {
        playerData[name] = { implied, ds_proj, szn, l4 };
      }
    });

    await chrome.storage.local.set({
      playerData,
      lastUpdated: new Date().toISOString()
    });

    console.log("Stored player data:", playerData);
    console.log(`Total players: ${Object.keys(playerData).length}`);

  } catch (err) {
    console.error("Failed to fetch sheet data:", err);
  }
}

// ==========================
// Trigger Cloud Run Python script
// ==========================
async function triggerFantasyUpdate() {
  try {
    const res = await fetch(CONFIG.CLOUD_RUN_URL, { method: "GET" });

    if (!res.ok) {
      console.error("Cloud Run request failed:", res.status, res.statusText);
      return { success: false, status: res.status };
    }

    const text = await res.text();
    console.log("Cloud Run response:", text);
    return { success: true, response: text };

  } catch (err) {
    console.error("Error triggering Cloud Run:", err);
    return { success: false, error: err.message };
  }
}

// ==========================
// Chrome runtime listeners
// ==========================

// Fetch data on install
chrome.runtime.onInstalled.addListener(() => {
  fetchSheetData();
});

// Fetch data on startup
chrome.runtime.onStartup.addListener(() => {
  fetchSheetData();
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Manual sheet refresh
  if (msg.action === "refreshSheet") {
    fetchSheetData().then(() => {
      sendResponse({ status: "Sheet data refreshed!" });
    }).catch(err => {
      sendResponse({ status: "Failed to refresh", error: err.message });
    });
    return true; // keep async response channel open
  }

  // Run Cloud Run script then refresh sheet
  if (msg.action === "runFantasyUpdate") {
    triggerFantasyUpdate()
      .then(result => {
        console.log("Fantasy update result:", result);
        // Optionally fetch updated sheet after script runs
        fetchSheetData().then(() => {
          sendResponse({ status: "Script executed and sheet updated!", result });
        });
      })
      .catch(err => {
        sendResponse({ status: "Failed to run fantasy update", error: err.message });
      });
    return true;
  }
});