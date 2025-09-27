// @ts-check

// Get the VS Code API
const vscode = acquireVsCodeApi();

// DOM elements
let ipInput, portInput, connectBtn, disconnectBtn;
let launchScrcpyBtn, launchScrcpyScreenOffBtn, stopScrcpyBtn, showLogsBtn;
let connectionStatus, scrcpyStatus;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
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
  ipInput = document.getElementById('ip-input');
  portInput = document.getElementById('port-input');
  
  // Button elements
  connectBtn = document.getElementById('connect-btn');
  disconnectBtn = document.getElementById('disconnect-btn');
  launchScrcpyBtn = document.getElementById('launch-scrcpy-btn');
  launchScrcpyScreenOffBtn = document.getElementById('launch-scrcpy-screen-off-btn');
  stopScrcpyBtn = document.getElementById('stop-scrcpy-btn');
  showLogsBtn = document.getElementById('show-logs-btn');
  
  // Status elements
  connectionStatus = document.getElementById('connection-status');
  scrcpyStatus = document.getElementById('scrcpy-status');
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
  // Input change listeners
  if (ipInput) {
    ipInput.addEventListener('input', function(e) {
      const value = e.target.value.trim();
      vscode.postMessage({
        type: 'ipChanged',
        value: value
      });
      updateButtonStates();
      saveState();
    });
  }
  
  if (portInput) {
    portInput.addEventListener('input', function(e) {
      const value = e.target.value.trim();
      vscode.postMessage({
        type: 'portChanged',
        value: value
      });
      updateButtonStates();
      saveState();
    });
  }
  
  // Button click listeners
  if (connectBtn) {
    connectBtn.addEventListener('click', function() {
      const ip = ipInput?.value.trim();
      const port = portInput?.value.trim();
      
      if (ip && port) {
        vscode.postMessage({
          type: 'connectDevice',
          ip: ip,
          port: port
        });
      }
    });
  }
  
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', function() {
      vscode.postMessage({
        type: 'disconnectDevice'
      });
    });
  } 
 
  if (launchScrcpyBtn) {
    launchScrcpyBtn.addEventListener('click', function() {
      vscode.postMessage({
        type: 'launchScrcpy'
      });
    });
  }
  
  if (launchScrcpyScreenOffBtn) {
    launchScrcpyScreenOffBtn.addEventListener('click', function() {
      vscode.postMessage({
        type: 'launchScrcpyScreenOff'
      });
    });
  }
  
  if (stopScrcpyBtn) {
    stopScrcpyBtn.addEventListener('click', function() {
      vscode.postMessage({
        type: 'stopScrcpy'
      });
    });
  }
  
  if (showLogsBtn) {
    showLogsBtn.addEventListener('click', function() {
      vscode.postMessage({
        type: 'showLogs'
      });
    });
  }
}

/**
 * Update button states based on current connection and input values
 */
function updateButtonStates() {
  const ip = ipInput?.value.trim() || '';
  const port = portInput?.value.trim() || '';
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
    const statusIcon = connectionStatus.querySelector('.status-icon');
    const statusText = connectionStatus.querySelector('.status-text');
    
    if (state.connectionStatus) {
      connectionStatus.className = 'status-indicator connected';
      if (statusIcon) {
        statusIcon.className = 'codicon codicon-check status-icon';
      }
      if (statusText) {
        const ipPort = state.currentIp && state.currentPort ? ` (${state.currentIp}:${state.currentPort})` : '';
        statusText.textContent = `Connected${ipPort}`;
      }
    } else {
      connectionStatus.className = 'status-indicator disconnected';
      if (statusIcon) {
        statusIcon.className = 'codicon codicon-x status-icon';
      }
      if (statusText) {
        statusText.textContent = 'Disconnected';
      }
    }
  }  
 
 // Update scrcpy status
  if (scrcpyStatus) {
    const statusIcon = scrcpyStatus.querySelector('.status-icon');
    const statusText = scrcpyStatus.querySelector('.status-text');
    
    if (state.scrcpyStatus) {
      scrcpyStatus.className = 'status-indicator running';
      if (statusIcon) {
        statusIcon.className = 'codicon codicon-play status-icon';
      }
      if (statusText) {
        statusText.textContent = 'Running';
      }
    } else {
      scrcpyStatus.className = 'status-indicator stopped';
      if (statusIcon) {
        statusIcon.className = 'codicon codicon-stop status-icon';
      }
      if (statusText) {
        statusText.textContent = 'Stopped';
      }
    }
  }
  
  // Update input values only if they're different to avoid cursor jumping
  if (ipInput && state.currentIp !== undefined && ipInput.value !== state.currentIp) {
    // Only update if the input is not currently focused to avoid interrupting user input
    if (document.activeElement !== ipInput) {
      ipInput.value = state.currentIp;
    }
  }
  
  if (portInput && state.currentPort !== undefined && portInput.value !== state.currentPort) {
    // Only update if the input is not currently focused to avoid interrupting user input
    if (document.activeElement !== portInput) {
      portInput.value = state.currentPort;
    }
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
    currentIp: ipInput?.value.trim() || '',
    currentPort: portInput?.value.trim() || ''
  };
  vscode.setState(newState);
}

// Listen for messages from the extension
window.addEventListener('message', event => {
  const message = event.data;
  
  switch (message.type) {
    case 'updateState':
      const newState = {
        connectionStatus: message.connectionStatus,
        scrcpyStatus: message.scrcpyStatus,
        currentIp: message.currentIp,
        currentPort: message.currentPort
      };
      vscode.setState(newState);
      updateUIState(newState);
      break;
      
    case 'showError':
      // Handle error messages from extension
      console.error('DroidBridge Error:', message.error);
      break;
      
    case 'showSuccess':
      // Handle success messages from extension
      console.log('DroidBridge Success:', message.message);
      break;
      
    case 'refreshState':
      // Force refresh the UI state
      const currentState = vscode.getState();
      if (currentState) {
        updateUIState(currentState);
      }
      break;
  }
});

// Handle theme changes
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      // Theme changed, UI will automatically update via CSS variables
      console.log('Theme changed, UI updated automatically');
    }
  });
});

// Observe theme changes on document body
observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['class']
});