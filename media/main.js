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

// DOM elements (annotated for @ts-check)
/** @type {HTMLInputElement | null} */ let ipInput = null;
/** @type {HTMLInputElement | null} */ let portInput = null;
/** @type {HTMLButtonElement | null} */ let connectBtn = null;
/** @type {HTMLButtonElement | null} */ let disconnectBtn = null;
/** @type {HTMLButtonElement | null} */ let launchScrcpyBtn = null;
/** @type {HTMLButtonElement | null} */ let launchScrcpyScreenOffBtn = null;
/** @type {HTMLButtonElement | null} */ let stopScrcpyBtn = null;
/** @type {HTMLButtonElement | null} */ let showLogsBtn = null;
/** @type {HTMLElement | null} */ let connectionStatus = null;
/** @type {HTMLElement | null} */ let scrcpyStatus = null;
/** @type {HTMLElement | null} */ let connectionHistoryContainer = null;
/** @type {HTMLInputElement | null} */ let pairHostInput = null;
/** @type {HTMLInputElement | null} */ let pairPortInput = null;
/** @type {HTMLInputElement | null} */ let pairCodeInput = null;
/** @type {HTMLButtonElement | null} */ let pairManualBtn = null;
/** @type {HTMLButtonElement | null} */ let ejectScrcpyBtn = null;
/** @type {HTMLButtonElement | null} */ let closeScrcpyBtn = null;
/** @type {HTMLElement | null} */ let scrcpySidebarSection = null;
/** @type {HTMLElement | null} */ let scrcpyContainer = null;
/** @type {HTMLElement | null} */ let scrcpyPlaceholder = null;

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
    ipInput = /** @type {HTMLInputElement | null} */ (document.getElementById("ip-input"));
    portInput = /** @type {HTMLInputElement | null} */ (document.getElementById("port-input"));

  // Button elements
    connectBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("connect-btn"));
    disconnectBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("disconnect-btn"));
    launchScrcpyBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("launch-scrcpy-btn"));
    launchScrcpyScreenOffBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById(
      "launch-scrcpy-screen-off-btn"
    ));
    stopScrcpyBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("stop-scrcpy-btn"));
    showLogsBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("show-logs-btn"));

  // Status elements
  connectionStatus = document.getElementById("connection-status");
  scrcpyStatus = document.getElementById("scrcpy-status");
  
  // History elements
  connectionHistoryContainer = document.getElementById("connection-history");

  // Pairing elements
    pairHostInput = /** @type {HTMLInputElement | null} */(document.getElementById('pair-host-input'));
    pairPortInput = /** @type {HTMLInputElement | null} */(document.getElementById('pair-port-input'));
    pairCodeInput = /** @type {HTMLInputElement | null} */(document.getElementById('pair-code-input'));
    pairManualBtn = /** @type {HTMLButtonElement | null} */(document.getElementById('pair-manual-btn'));

  // Scrcpy sidebar elements
  ejectScrcpyBtn = /** @type {HTMLButtonElement | null} */(document.getElementById('eject-scrcpy-btn'));
  closeScrcpyBtn = /** @type {HTMLButtonElement | null} */(document.getElementById('close-scrcpy-btn'));
  scrcpySidebarSection = document.getElementById('scrcpy-sidebar-section');
  scrcpyContainer = document.getElementById('scrcpy-container');
  scrcpyPlaceholder = document.getElementById('scrcpy-placeholder');
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
  // Input change listeners
  if (ipInput) {
    ipInput.addEventListener("input", function (e) {
      const value = /** @type {HTMLInputElement} */(e.target).value.trim();
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
      const value = /** @type {HTMLInputElement} */(e.target).value.trim();
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

  // Pairing manual button
  if (pairManualBtn) {
    pairManualBtn.addEventListener('click', () => {
      const host = pairHostInput?.value.trim();
      const port = pairPortInput?.value.trim();
      const code = pairCodeInput?.value.trim();
      if (host && port && /^\d{6}$/.test(code || '')) {
        vscode.postMessage({ type: 'pairManual', host, port, code });
      } else {
        vscode.postMessage({ type: 'showError', error: 'Provide host, port and 6-digit code' });
      }
    });
  }

  // Scrcpy sidebar controls
  if (ejectScrcpyBtn) {
    ejectScrcpyBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'ejectScrcpySidebar' });
    });
  }

  if (closeScrcpyBtn) {
    closeScrcpyBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'stopScrcpy' });
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
      const target = /** @type {HTMLElement} */(e.target);
      const button = target.closest ? target.closest("button") : null;
      if (!button) return;
      if (button.classList.contains("history-connect-btn")) {
        const ip = button.getAttribute("data-ip");
        const port = button.getAttribute("data-port");
        if (ip && port) {
          vscode.postMessage({
            type: "connectFromHistory",
            ip: ip,
            port: port,
          });
        }
      } else if (button.classList.contains("history-remove-btn")) {
        const id = button.getAttribute("data-id");
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
/**
 * @param {Array<any>} history
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
 * @param {{isRunning?: boolean, processId?: number, windowId?: string}} scrcpySidebarState
 */
function updateScrcpySidebarSection(scrcpySidebarState) {
  if (!scrcpySidebarSection) {
    return;
  }

  const isRunning = !!scrcpySidebarState?.isRunning;
  
  if (isRunning) {
    scrcpySidebarSection.style.display = 'block';
    if (scrcpyPlaceholder) {
      scrcpyPlaceholder.style.display = 'none';
    }
    
    // Enable sidebar controls
    if (ejectScrcpyBtn) ejectScrcpyBtn.disabled = false;
    if (closeScrcpyBtn) closeScrcpyBtn.disabled = false;
  } else {
    scrcpySidebarSection.style.display = 'none';
    if (scrcpyPlaceholder) {
      scrcpyPlaceholder.style.display = 'flex';
    }
    
    // Disable sidebar controls
    if (ejectScrcpyBtn) ejectScrcpyBtn.disabled = true;
    if (closeScrcpyBtn) closeScrcpyBtn.disabled = true;
  }
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
/**
 * @param {any} state
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

  updateScrcpySidebarSection(state.scrcpySidebar);

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
    qrPairing: currentState?.qrPairing,
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
        qrPairing: message.qrPairing,
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

    case "scrcpySidebarUpdate":
      {
        const state = vscode.getState() || {};
        const newState = {
          ...state,
          scrcpySidebar: message.state,
        };
        vscode.setState(newState);
        updateScrcpySidebarSection(message.state);
      }
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
