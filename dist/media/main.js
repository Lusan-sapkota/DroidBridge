// @ts-check

/**
 * @typedef {Object} VsCodeApi
 * @property {function(any): void} postMessage - Post a message to the extension
 * @property {function(any): void} setState - Set the webview state
 * @property {function(): any} getState - Get the webview state
 */

// VSCode webview API is available globally in webview context
// @ts-ignore - acquireVsCodeApi is provided by VSCode webview runtime
const vscode = acquireVsCodeApi();

// DOM elements
let ipInput, portInput, connectBtn, disconnectBtn;
let launchScrcpyBtn, launchScrcpyScreenOffBtn, stopScrcpyBtn, showLogsBtn;
let connectionStatus, scrcpyStatus, connectionHistoryContainer;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeElements();
  setupEventListeners();

  // Restore state from previous session
  const state = vscode.getState();
  if (state) {
    updateUIState(state);
  }
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
  // Input elements
  ipInput = document.getElementById("ip-input");
  portInput = document.getElementById("port-input");

  // Button elements
  connectBtn = document.getElementById("connect-btn");
  disconnectBtn = document.getElementById("disconnect-btn");
  launchScrcpyBtn = document.getElementById("launch-scrcpy-btn");
  launchScrcpyScreenOffBtn = document.getElementById(
    "launch-scrcpy-screen-off-btn"
  );
  stopScrcpyBtn = document.getElementById("stop-scrcpy-btn");
  showLogsBtn = document.getElementById("show-logs-btn");

  // Status elements
  connectionStatus = document.getElementById("connection-status");
  scrcpyStatus = document.getElementById("scrcpy-status");
  
  // History elements
  connectionHistoryContainer = document.getElementById("connection-history");
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
  // Input change listeners
  if (ipInput) {
    ipInput.addEventListener("input", function (e) {
      const value = e.target.value.trim();
      vscode.postMessage({
        type: "ipChanged",
        value: value,
      });
      updateButtonStates();
      saveState();
    });
  }

  if (portInput) {
    portInput.addEventListener("input", function (e) {
      const value = e.target.value.trim();
      vscode.postMessage({
        type: "portChanged",
        value: value,
      });
      updateButtonStates();
      saveState();
    });
  }

  // Button click listeners
  if (connectBtn) {
    connectBtn.addEventListener("click", function () {
      const ip = ipInput?.value.trim();
      const port = portInput?.value.trim();

      if (ip && port) {
        vscode.postMessage({
          type: "connectDevice",
          ip: ip,
          port: port,
        });
      }
    });
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", function () {
      vscode.postMessage({
        type: "disconnectDevice",
      });
    });
  }

  if (launchScrcpyBtn) {
    launchScrcpyBtn.addEventListener("click", function () {
      vscode.postMessage({
        type: "launchScrcpy",
      });
    });
  }

  if (launchScrcpyScreenOffBtn) {
    launchScrcpyScreenOffBtn.addEventListener("click", function () {
      vscode.postMessage({
        type: "launchScrcpyScreenOff",
      });
    });
  }

  if (stopScrcpyBtn) {
    stopScrcpyBtn.addEventListener("click", function () {
      vscode.postMessage({
        type: "stopScrcpy",
      });
    });
  }

  if (showLogsBtn) {
    showLogsBtn.addEventListener("click", function () {
      vscode.postMessage({
        type: "showLogs",
      });
    });
  }

  // Set up history event delegation
  setupHistoryEventListeners();
}

/**
 * Set up event listeners for connection history
 */
function setupHistoryEventListeners() {
  if (connectionHistoryContainer) {
    connectionHistoryContainer.addEventListener("click", function (e) {
      const target = e.target.closest("button");
      if (!target) return;

      if (target.classList.contains("history-connect-btn")) {
        const ip = target.getAttribute("data-ip");
        const port = target.getAttribute("data-port");
        if (ip && port) {
          vscode.postMessage({
            type: "connectFromHistory",
            ip: ip,
            port: port,
          });
        }
      } else if (target.classList.contains("history-remove-btn")) {
        const id = target.getAttribute("data-id");
        if (id) {
          vscode.postMessage({
            type: "removeFromHistory",
            id: id,
          });
        }
      }
    });
  }
}

/**
 * Update connection history display
 */
function updateConnectionHistory(history) {
  if (!connectionHistoryContainer || !history) return;

  if (history.length === 0) {
    connectionHistoryContainer.innerHTML = '<div class="history-empty">No recent connections</div>';
    return;
  }

  const historyHtml = history.map(entry => {
    const displayName = entry.name || `${entry.ip}:${entry.port}`;
    const lastConnected = new Date(entry.lastConnected).toLocaleDateString();
    
    return `
      <div class="history-item" data-id="${entry.id}">
        <div class="history-info">
          <div class="history-name">${displayName}</div>
          <div class="history-details">${entry.ip}:${entry.port}</div>
          <div class="history-meta">Last: ${lastConnected} (${entry.connectionCount}x)</div>
        </div>
        <div class="history-actions">
          <button class="history-connect-btn" data-ip="${entry.ip}" data-port="${entry.port}" title="Connect">
            <span class="codicon codicon-plug"></span>
          </button>
          <button class="history-remove-btn" data-id="${entry.id}" title="Remove">
            <span class="codicon codicon-trash"></span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  connectionHistoryContainer.innerHTML = historyHtml;
}

/**
 * Update button states based on current connection and input values
 */
function updateButtonStates() {
  const ip = ipInput?.value.trim() || "";
  const port = portInput?.value.trim() || "";
  const hasValidInputs = ip.length > 0 && port.length > 0;

  // Get current state
  const state = vscode.getState() || {};
  const isConnected = state.connectionStatus || false;
  const isScrcpyRunning = state.scrcpyStatus || false;

  // Update connect button
  if (connectBtn) {
    connectBtn.disabled = isConnected || !hasValidInputs;
  }

  // Update disconnect button
  if (disconnectBtn) {
    disconnectBtn.disabled = !isConnected;
  }

  // Update scrcpy buttons
  if (launchScrcpyBtn) {
    launchScrcpyBtn.disabled = isScrcpyRunning || !isConnected;
  }

  if (launchScrcpyScreenOffBtn) {
    launchScrcpyScreenOffBtn.disabled = isScrcpyRunning || !isConnected;
  }

  if (stopScrcpyBtn) {
    stopScrcpyBtn.disabled = !isScrcpyRunning;
  }
}

/**
 * Update UI state based on extension state
 */
function updateUIState(state) {
  // Update connection status
  if (connectionStatus) {
    const statusIcon = connectionStatus.querySelector(".status-icon");
    const statusText = connectionStatus.querySelector(".status-text");

    if (state.connectionStatus) {
      connectionStatus.className = "status-indicator connected";
      if (statusIcon) {
        statusIcon.className = "codicon codicon-check status-icon";
      }
      if (statusText) {
        const ipPort =
          state.currentIp && state.currentPort
            ? ` (${state.currentIp}:${state.currentPort})`
            : "";
        statusText.textContent = `Connected${ipPort}`;
      }
    } else {
      connectionStatus.className = "status-indicator disconnected";
      if (statusIcon) {
        statusIcon.className = "codicon codicon-x status-icon";
      }
      if (statusText) {
        statusText.textContent = "Disconnected";
      }
    }
  }

  // Update scrcpy status
  if (scrcpyStatus) {
    const statusIcon = scrcpyStatus.querySelector(".status-icon");
    const statusText = scrcpyStatus.querySelector(".status-text");

    if (state.scrcpyStatus) {
      scrcpyStatus.className = "status-indicator running";
      if (statusIcon) {
        statusIcon.className = "codicon codicon-play status-icon";
      }
      if (statusText) {
        statusText.textContent = "Running";
      }
    } else {
      scrcpyStatus.className = "status-indicator stopped";
      if (statusIcon) {
        statusIcon.className = "codicon codicon-stop status-icon";
      }
      if (statusText) {
        statusText.textContent = "Stopped";
      }
    }
  }

  // Update input values only if they're different to avoid cursor jumping
  if (
    ipInput &&
    state.currentIp !== undefined &&
    ipInput.value !== state.currentIp
  ) {
    // Only update if the input is not currently focused to avoid interrupting user input
    if (document.activeElement !== ipInput) {
      ipInput.value = state.currentIp;
    }
  }

  if (
    portInput &&
    state.currentPort !== undefined &&
    portInput.value !== state.currentPort
  ) {
    // Only update if the input is not currently focused to avoid interrupting user input
    if (document.activeElement !== portInput) {
      portInput.value = state.currentPort;
    }
  }

  // Update connection history
  if (state.connectionHistory) {
    updateConnectionHistory(state.connectionHistory);
  }

  // Update button states
  updateButtonStates();
}

/**
 * Save current state to VS Code state
 */
function saveState() {
  const currentState = vscode.getState() || {};
  const newState = {
    ...currentState,
    currentIp: ipInput?.value.trim() || "",
    currentPort: portInput?.value.trim() || "",
  };
  vscode.setState(newState);
}

// Listen for messages from the extension
window.addEventListener("message", (event) => {
  const message = event.data;

  switch (message.type) {
    case "updateState":
      const newState = {
        connectionStatus: message.connectionStatus,
        scrcpyStatus: message.scrcpyStatus,
        currentIp: message.currentIp,
        currentPort: message.currentPort,
        connectionHistory: message.connectionHistory,
      };
      vscode.setState(newState);
      updateUIState(newState);
      break;

    case "showError":
      // Handle error messages from extension
      console.error("DroidBridge Error:", message.error);
      break;

    case "showSuccess":
      // Handle success messages from extension
      console.log("DroidBridge Success:", message.message);
      break;

    case "refreshState":
      // Force refresh the UI state
      const currentState = vscode.getState();
      if (currentState) {
        updateUIState(currentState);
      }
      break;

    case "themeChanged":
      // Handle theme change from extension
      updateThemeClass();
      console.log("Theme changed to:", message.themeCssClass);
      break;
  }
});

// Handle theme changes
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === "attributes" && mutation.attributeName === "class") {
      // Theme changed, update theme class on container
      updateThemeClass();
      console.log("Theme changed, UI updated automatically");
    }
  });
});

// Observe theme changes on document body
observer.observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});

/**
 * Update theme class on the container based on VSCode theme
 */
function updateThemeClass() {
  const container = document.querySelector(".container");
  if (!container) return;

  // Remove existing theme classes
  container.classList.remove(
    "vscode-light",
    "vscode-dark",
    "vscode-high-contrast",
    "vscode-high-contrast-light"
  );

  // Detect current theme from body classes
  const bodyClasses = document.body.className;

  if (bodyClasses.includes("vscode-light")) {
    container.classList.add("vscode-light");
  } else if (bodyClasses.includes("vscode-high-contrast-light")) {
    container.classList.add("vscode-high-contrast-light");
  } else if (bodyClasses.includes("vscode-high-contrast")) {
    container.classList.add("vscode-high-contrast");
  } else {
    // Default to dark theme
    container.classList.add("vscode-dark");
  }
}

// Initialize theme class on load
document.addEventListener("DOMContentLoaded", function () {
  updateThemeClass();
});
