# DroidBridge

DroidBridge is a VSCode extension that seamlessly integrates Android device management into your development workflow. Connect to Android devices via ADB, launch scrcpy for screen mirroring, and manage your Android debugging sessions directly from VSCode's sidebar.

## Features

- **Wireless ADB Connection**: Connect to Android devices over WiFi using IP address and port
- **Screen Mirroring**: Launch and control scrcpy sessions for real-time device interaction
- **Integrated Sidebar**: Dedicated sidebar view for device management and status monitoring
- **Command Palette Integration**: Access all features through VSCode's command palette
- **Cross-Platform Support**: Works on Windows, macOS, and Linux
- **Automatic Binary Downloads**: Detects installed ADB/scrcpy or automatically downloads the latest binaries when needed
- **Theme Integration**: Automatically adapts to VSCode's light and dark themes
- **Comprehensive Logging**: Detailed logs for troubleshooting connection and mirroring issues

## Installation

### From VSCode Marketplace

1. Open VSCode
2. Go to Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "DroidBridge"
4. Click "Install"

### Manual Installation

1. Download the `.vsix` file from the releases page
2. Open VSCode
3. Go to Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

## Quick Start

1. **Enable Developer Options** on your Android device:
   - Go to Settings > About phone
   - Tap "Build number" 7 times
   - Go back to Settings > Developer options
   - Enable "USB debugging" and "Wireless debugging"

2. **Connect via WiFi**:
   - In Developer options, tap "Wireless debugging"
   - Tap "Pair device with pairing code"
   - Note the IP address and port (e.g., 192.168.1.100:5555)

3. **Use DroidBridge**:
   - Click the DroidBridge icon in VSCode's activity bar
   - Enter your device's IP address and port
   - Click "Connect Device"
   - Once connected, click "Launch Scrcpy" to start screen mirroring

## Usage

### Sidebar Interface

The DroidBridge sidebar provides two main sections:

**Connect Section:**
- IP Address input field (pre-populated with default from settings)
- Port input field (pre-populated with default from settings)
- "Connect Device" button
- Connection status indicator

**Scrcpy Section:**
- "Launch Scrcpy" button
- "Launch Scrcpy Screen Off" button (keeps device screen off during mirroring)
- "Stop Scrcpy" button
- Scrcpy status indicator

### Command Palette

Access DroidBridge commands via `Ctrl+Shift+P` / `Cmd+Shift+P`:

- `DroidBridge: Connect to Device`
- `DroidBridge: Disconnect Device`
- `DroidBridge: Launch Scrcpy`
- `DroidBridge: Launch Scrcpy Screen Off`
- `DroidBridge: Stop Scrcpy`
- `DroidBridge: Show Logs`

## Configuration

Configure DroidBridge through VSCode settings (`Ctrl+,` / `Cmd+,`):

### Available Settings

```json
{
  "droidbridge.defaultIp": "192.168.1.100",
  "droidbridge.defaultPort": "5555",
  "droidbridge.adbPath": "",
  "droidbridge.scrcpyPath": ""
}
```

### Configuration Examples

**Basic Configuration:**
```json
{
  "droidbridge.defaultIp": "192.168.1.150",
  "droidbridge.defaultPort": "5555"
}
```

**Custom Binary Paths:**
```json
{
  "droidbridge.adbPath": "/usr/local/bin/adb",
  "droidbridge.scrcpyPath": "/usr/local/bin/scrcpy"
}
```

**Development Setup:**
```json
{
  "droidbridge.defaultIp": "10.0.0.100",
  "droidbridge.defaultPort": "5037",
  "droidbridge.adbPath": "/Android/Sdk/platform-tools/adb"
}
```

## Binary Management

DroidBridge uses a smart binary management system that automatically handles ADB and scrcpy binaries:

### Automatic Detection

The extension automatically detects binaries in this order:
1. **Custom paths** (if configured in settings)
2. **System PATH** (if installed via package managers like Homebrew, apt, etc.)
3. **Common installation directories** (platform-specific locations)
4. **Bundled binaries** (included with the extension as fallback)
5. **Downloaded binaries** (automatically downloaded when needed)

### Manual Binary Management

Use these commands from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `DroidBridge: Check Binary Status` - Shows current binary detection status
- `DroidBridge: Download Missing Binaries` - Downloads any missing binaries
- `DroidBridge: Refresh Binary Detection` - Re-scans for binaries

### Custom Binary Paths

If you have ADB or scrcpy installed in custom locations, configure them in settings:

```json
{
  "droidbridge.adbPath": "/custom/path/to/adb",
  "droidbridge.scrcpyPath": "/custom/path/to/scrcpy"
}
```

### No Internet Connection

If you can't download binaries automatically:
1. Install ADB and scrcpy manually on your system
2. Ensure they're in your system PATH, or
3. Configure custom paths in DroidBridge settings

## Troubleshooting

### Connection Issues

**Device not connecting:**
1. Ensure both device and computer are on the same network
2. Verify wireless debugging is enabled on the device
3. Check if the IP address and port are correct
4. Try restarting ADB: `adb kill-server && adb start-server`

**"Device offline" error:**
1. Disconnect and reconnect the device
2. Check network connectivity
3. Restart wireless debugging on the device
4. Verify firewall settings aren't blocking the connection

### Scrcpy Issues

**Scrcpy won't launch:**
1. Ensure device is connected via ADB first
2. Check that USB debugging is enabled
3. Verify device authorization (check device screen for authorization prompt)
4. Try launching scrcpy manually to test: `scrcpy --help`

**Poor performance:**
1. Reduce screen resolution: use scrcpy with `--max-size` parameter
2. Lower bitrate: use `--bit-rate` parameter
3. Close other applications using the device
4. Check network bandwidth

### Binary Issues

**"Binary not found" errors:**
1. Run `DroidBridge: Check Binary Status` to see what's missing
2. Use `DroidBridge: Download Missing Binaries` to download automatically
3. If download fails, install ADB/scrcpy manually:
   - **Windows**: Download from Android SDK or use Chocolatey
   - **macOS**: Use Homebrew: `brew install android-platform-tools scrcpy`
   - **Linux**: Use package manager: `sudo apt install adb scrcpy` (Ubuntu/Debian)

**Download failures:**
1. Check internet connection
2. Verify firewall/proxy settings
3. Try `DroidBridge: Refresh Binary Detection` after manual installation
4. Configure custom paths if binaries are installed in non-standard locations

### General Issues

**Extension not loading:**
1. Check VSCode version compatibility (requires VSCode 1.104.0+)
2. Restart VSCode
3. Check the Output panel for error messages (View > Output > DroidBridge Logs)

**Binary permission errors (macOS/Linux):**
1. The extension should handle permissions automatically
2. If issues persist, manually set permissions: `chmod +x /path/to/binary`

**Custom binary not found:**
1. Verify the path in settings is correct
2. Ensure the binary is executable
3. Test the binary manually in terminal

### Getting Help

1. **Check Logs**: Use `DroidBridge: Show Logs` command to view detailed logs
2. **Reset Settings**: Clear custom paths to use bundled binaries
3. **Restart Extension**: Reload VSCode window (`Ctrl+Shift+P` > "Developer: Reload Window")

## Requirements

- VSCode 1.104.0 or higher
- Android device with Developer Options enabled
- Network connection between computer and Android device (for wireless debugging)

## Known Issues

- Multiple scrcpy instances may conflict - always stop existing sessions before starting new ones
- Some Android devices may require additional setup for wireless debugging
- Network latency can affect scrcpy performance over WiFi connections
- Custom binary paths on Windows may require full path including `.exe` extension

## Contributing

This extension is open source. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [scrcpy](https://github.com/Genymobile/scrcpy) - Screen mirroring tool
- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb) - Android debugging tool
