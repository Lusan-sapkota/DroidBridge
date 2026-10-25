// @ts-check

/**
 * @typedef {Object} VsCodeApi
 * @property {function(any): void} postMessage - Post a message to the extension
 * @property {function(any): void} setState - Set the webview state
 * @property {function(): any} getState - Get the webview state
 */

// @ts-ignore - acquireVsCodeApi is provided by VSCode webview runtime and may only be called once
const vscode = window.__droidbridgeApi || (window.__droidbridgeApi = acquireVsCodeApi());

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
/** @type {HTMLButtonElement | null} */ let startEmulatorBtn = null;
/** @type {HTMLElement | null} */ let emulatorSplit = null;
/** @type {HTMLButtonElement | null} */ let emulatorMenuBtn = null;
/** @type {HTMLElement | null} */ let emulatorMenu = null;

document.addEventListener("DOMContentLoaded", function () {
  initializeElements();
  setupEventListeners();

  const state = vscode.getState();
  setupCollapsibleSections(state && state.sections);
  if (state) {
    updateUIState(state);
  }
  vscode.postMessage({ type: "webviewReady" });
});

function initializeElements() {
    ipInput = /** @type {HTMLInputElement | null} */ (document.getElementById("ip-input"));
    portInput = /** @type {HTMLInputElement | null} */ (document.getElementById("port-input"));

    connectBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("connect-btn"));
    disconnectBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("disconnect-btn"));
    launchScrcpyBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("launch-scrcpy-btn"));
    launchScrcpyScreenOffBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById(
      "launch-scrcpy-screen-off-btn"
    ));
    stopScrcpyBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("stop-scrcpy-btn"));
    showLogsBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("show-logs-btn"));

  connectionStatus = document.getElementById("connection-status");
  scrcpyStatus = document.getElementById("scrcpy-status");
  
  connectionHistoryContainer = document.getElementById("connection-history");

    pairHostInput = /** @type {HTMLInputElement | null} */(document.getElementById('pair-host-input'));
    pairPortInput = /** @type {HTMLInputElement | null} */(document.getElementById('pair-port-input'));
    pairCodeInput = /** @type {HTMLInputElement | null} */(document.getElementById('pair-code-input'));
    pairManualBtn = /** @type {HTMLButtonElement | null} */(document.getElementById('pair-manual-btn'));
    startEmulatorBtn = /** @type {HTMLButtonElement | null} */(document.getElementById('start-emulator-btn'));
    emulatorSplit = document.querySelector('.split-button');
    emulatorMenuBtn = /** @type {HTMLButtonElement | null} */(document.getElementById('emulator-menu-btn'));
    emulatorMenu = document.getElementById('emulator-menu');

}

function setupEventListeners() {
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

  startEmulatorBtn?.addEventListener('click', () => vscode.postMessage({ type: 'startEmulator' }));
  document.getElementById('stop-emulator-btn')?.addEventListener('click', () => vscode.postMessage({ type: 'stopEmulator' }));
  document.getElementById('emulator-settings-btn')?.addEventListener('click', () => vscode.postMessage({ type: 'emulatorSettings' }));
  document.getElementById('reset-adb-btn')?.addEventListener('click', () => vscode.postMessage({ type: 'resetAdb' }));
  emulatorMenuBtn?.addEventListener('click', () => showEmulatorMenu(!!emulatorMenu?.hidden));
  emulatorMenu?.addEventListener('click', (e) => {
    const item = /** @type {HTMLElement} */ (e.target).closest('[data-headless]');
    if (item) {
      const headless = item.getAttribute('data-headless') === 'true';
      setHeadlessMode(headless);
      vscode.postMessage({ type: 'setHeadless', value: headless });
      showEmulatorMenu(false);
      emulatorMenuBtn?.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (emulatorSplit && !emulatorSplit.contains(/** @type {Node} */ (e.target))) {
      showEmulatorMenu(false);
    }
  });
  emulatorSplit?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      showEmulatorMenu(false);
      emulatorMenuBtn?.focus();
    }
  });

  setupHistoryEventListeners();
}

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

/** @param {boolean} open */
function showEmulatorMenu(open) {
  if (!emulatorMenu || !emulatorMenuBtn) return;
  emulatorMenu.hidden = !open;
  emulatorMenuBtn.setAttribute('aria-expanded', String(open));
  if (open) {
    /** @type {HTMLElement | null} */ (emulatorMenu.querySelector('[aria-checked="true"]'))?.focus();
  }
}

/** @param {boolean} headless */
function setHeadlessMode(headless) {
  if (!emulatorSplit) return;
  emulatorSplit.dataset.headless = String(headless);
  const mode = document.getElementById('emulator-mode');
  if (mode) mode.textContent = headless ? 'Headless' : 'Window';
  emulatorSplit.querySelectorAll('[data-headless]').forEach((item) => {
    if (item !== emulatorSplit) item.setAttribute('aria-checked', String(item.getAttribute('data-headless') === String(headless)));
  });
}

/** @param {Array<any>} history */
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
          ${entry.name ? `<div class="history-details">${entry.ip}:${entry.port}</div>` : ''}
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

function updateButtonStates() {
  const ip = ipInput?.value.trim() || "";
  const port = portInput?.value.trim() || "";
  const hasValidInputs = ip.length > 0 && port.length > 0;

  const state = vscode.getState() || {};
  const isConnected = state.connectionStatus || false;
  const hasDevice = isConnected || (state.availableDevices || []).length > 0;
  const isScrcpyRunning = state.scrcpyStatus || false;

  if (connectBtn) {
    connectBtn.disabled = isConnected || !hasValidInputs;
  }

  if (disconnectBtn) {
    disconnectBtn.disabled = !isConnected;
  }

  if (launchScrcpyBtn) {
    launchScrcpyBtn.disabled = isScrcpyRunning || !hasDevice;
  }

  if (launchScrcpyScreenOffBtn) {
    launchScrcpyScreenOffBtn.disabled = isScrcpyRunning || !hasDevice;
  }

  if (stopScrcpyBtn) {
    stopScrcpyBtn.disabled = !isScrcpyRunning;
  }

  const stopEmulatorBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('stop-emulator-btn'));
  if (stopEmulatorBtn) {
    stopEmulatorBtn.disabled = (state.emulators || []).length === 0;
  }
}

/** @param {any} state */
function updateUIState(state) {
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
        statusText.textContent = "Connected";
        connectionStatus.title = `Connected${ipPort}`;
      }
    } else if ((state.availableDevices || []).length > 0) {
      const devices = state.availableDevices;
      connectionStatus.className = "status-indicator connected";
      if (statusIcon) {
        statusIcon.className = "codicon codicon-device-mobile status-icon";
      }
      if (statusText) {
        statusText.textContent = devices.length === 1 ? "Ready" : `${devices.length} ready`;
        connectionStatus.title = `Device ready: ${devices.join(", ")}`;
      }
    } else {
      connectionStatus.className = "status-indicator disconnected";
      if (statusIcon) {
        statusIcon.className = "codicon codicon-x status-icon";
      }
      if (statusText) {
        statusText.textContent = "Disconnected";
        connectionStatus.title = "No device connected";
      }
    }
  }

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

  if (
    ipInput &&
    state.currentIp !== undefined &&
    ipInput.value !== state.currentIp
  ) {
    if (document.activeElement !== ipInput) {
      ipInput.value = state.currentIp;
    }
  }

  if (
    portInput &&
    state.currentPort !== undefined &&
    portInput.value !== state.currentPort
  ) {
    if (document.activeElement !== portInput) {
      portInput.value = state.currentPort;
    }
  }

  if (state.connectionHistory) {
    updateConnectionHistory(state.connectionHistory);
  }

  if (state.headless !== undefined) {
    setHeadlessMode(state.headless);
  }


  updateButtonStates();
}

/** @param {Record<string, boolean> | undefined} saved */
function setupCollapsibleSections(saved) {
  document.querySelectorAll("details[data-section]").forEach((el) => {
    const details = /** @type {HTMLDetailsElement} */ (el);
    const key = details.dataset.section || "";
    if (saved && key in saved) {
      details.open = saved[key];
    }
    details.addEventListener("toggle", () => {
      const current = vscode.getState() || {};
      vscode.setState({ ...current, sections: { ...(current.sections || {}), [key]: details.open } });
    });
  });
}

function saveState() {
  const currentState = vscode.getState() || {};
  const newState = {
    ...currentState,
    currentIp: ipInput?.value.trim() || "",
    currentPort: portInput?.value.trim() || "",
  };
  vscode.setState(newState);
}

window.addEventListener("message", (event) => {
  const message = event.data;

  switch (message.type) {
    case "updateState":
      const newState = {
        ...(vscode.getState() || {}),
        connectionStatus: message.connectionStatus,
        scrcpyStatus: message.scrcpyStatus,
        currentIp: message.currentIp,
        currentPort: message.currentPort,
        connectionHistory: message.connectionHistory,
        availableDevices: message.availableDevices || [],
        emulators: message.emulators || [],
        headless: message.headless,
      };
      vscode.setState(newState);
      updateUIState(newState);
      break;

    case "showError":
      console.error("DroidBridge Error:", message.error);
      break;

    case "showSuccess":
      console.log("DroidBridge Success:", message.message);
      break;

    case "refreshState":
      const currentState = vscode.getState();
      if (currentState) {
        updateUIState(currentState);
      }
      break;

    case "themeChanged":
      updateThemeClass();
      console.log("Theme changed to:", message.themeCssClass);
      break;

  }
});

const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === "attributes" && mutation.attributeName === "class") {
      updateThemeClass();
      console.log("Theme changed, UI updated automatically");
    }
  });
});

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});

function updateThemeClass() {
  const container = document.querySelector(".container");
  if (!container) return;

  container.classList.remove(
    "vscode-light",
    "vscode-dark",
    "vscode-high-contrast",
    "vscode-high-contrast-light"
  );

  const bodyClasses = document.body.className;

  if (bodyClasses.includes("vscode-light")) {
    container.classList.add("vscode-light");
  } else if (bodyClasses.includes("vscode-high-contrast-light")) {
    container.classList.add("vscode-high-contrast-light");
  } else if (bodyClasses.includes("vscode-high-contrast")) {
    container.classList.add("vscode-high-contrast");
  } else {
    container.classList.add("vscode-dark");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  updateThemeClass();
});
