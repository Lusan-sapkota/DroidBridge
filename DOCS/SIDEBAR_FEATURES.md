# DroidBridge Sidebar Features

## Overview

The DroidBridge sidebar provides a comprehensive interface for managing Android device connections and screen mirroring with scrcpy.

## Features

### 🔌 Device Connection

- **IP Address & Port Input**: Enter your Android device's IP address and port for wireless ADB connection
- **Connect/Disconnect Buttons**: One-click connection management
- **Connection Status**: Real-time status indicator showing connection state
- **Input Validation**: Automatic validation of IP addresses and port numbers

### 📱 Screen Mirroring (Scrcpy)

- **Launch Scrcpy**: Start screen mirroring with default settings
- **Launch with Screen Off**: Start mirroring while keeping the device screen off (saves battery)
- **Stop Scrcpy**: Terminate the screen mirroring session
- **Status Indicator**: Shows whether scrcpy is currently running

### 📚 Connection History

- **Recent Connections**: Displays the last 5 device connections
- **Quick Connect**: Click the plug icon to instantly connect to a previous device
- **Connection Details**: Shows IP:port, last connection date, and connection count
- **Remove Entries**: Delete unwanted entries from history with the trash icon
- **Persistent Storage**: History is saved across VSCode sessions

### 🎨 Theme Integration

- **Automatic Theme Detection**: Adapts to VSCode's current theme (light/dark/high contrast)
- **Theme-Specific Icons**: Uses appropriate icons for each theme
- **CSS Variables**: Leverages VSCode's CSS variables for consistent styling
- **Real-time Updates**: Automatically updates when theme changes

### 📋 Logs & Debugging

- **Show Logs**: Quick access to the DroidBridge output channel
- **Error Notifications**: Clear error messages with suggested actions
- **Success Feedback**: Confirmation messages for successful operations

## Usage

### First Time Setup

1. Open the DroidBridge sidebar from the Activity Bar (device icon)
2. Enter your Android device's IP address (e.g., 192.168.1.100)
3. Enter the ADB port (usually 5555)
4. Click "Connect Device"

### Using Connection History

1. Successfully connected devices are automatically added to history
2. Click the plug icon next to any history entry to reconnect
3. Use the trash icon to remove unwanted entries
4. History persists across VSCode restarts

### Screen Mirroring

1. Ensure your device is connected (green status indicator)
2. Click "Launch Scrcpy" for normal mirroring
3. Or click "Launch (Screen Off)" to mirror with device screen off
4. Use "Stop Scrcpy" to end the mirroring session

## Keyboard Shortcuts

- The sidebar supports standard keyboard navigation
- Tab through interactive elements
- Enter/Space to activate buttons
- Focus indicators for accessibility

## Troubleshooting

### "No data provider registered" Error

This error indicates the sidebar view provider isn't properly registered. This has been fixed in the latest version by:

- Ensuring proper view ID matching between package.json and extension registration
- Adding proper error handling for webview initialization
- Including connection history functionality

### Connection Issues

- Verify your device has wireless debugging enabled
- Check that both device and computer are on the same network
- Ensure the IP address and port are correct
- Try connecting via USB first to establish trust

### History Not Saving

- History is stored in VSCode's global state
- If history isn't persisting, check VSCode permissions
- Clear history and try adding a new connection

## Technical Details

### Data Provider Registration

The sidebar is registered as a webview view provider with the ID `droidbridge-sidebar` in the `droidbridge` view container.

### State Management

- Connection status is synchronized between the extension and webview
- History is managed by the ConnectionHistoryManager class
- Real-time updates via message passing between webview and extension

### Security

- Content Security Policy (CSP) restricts script execution
- Nonce-based script loading for security
- Input validation on both client and server sides
