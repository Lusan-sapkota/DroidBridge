# Binary Download System

DroidBridge uses an automatic binary download system to ensure users always have the latest ADB and scrcpy binaries without bloating the extension package.

## How It Works

### Detection Priority
1. **System PATH**: Checks if ADB/scrcpy are installed globally
2. **Downloaded Binaries**: Checks for previously downloaded binaries in the extension's data directory
3. **Common Paths**: Checks common installation locations
4. **Auto-Download**: Downloads binaries if none are found

### Download Sources

#### Primary Source (GitHub Releases)
- Repository: `https://github.com/Lusan-sapkota/droidbridge-binaries`
- URL Pattern: `https://github.com/Lusan-sapkota/droidbridge-binaries/releases/latest/download/{binary-name}`

#### Binary Naming Convention
- **ADB**: `adb-{platform}-{arch}.exe` (Windows) or `adb-{platform}-{arch}` (Unix)
- **Scrcpy**: `scrcpy-{platform}-{arch}.exe` (Windows) or `scrcpy-{platform}-{arch}` (Unix)

#### Supported Platforms
- **Windows**: `win32` (x64, arm64)
- **macOS**: `darwin` (x64, arm64)
- **Linux**: `linux` (x64, arm64)

### Fallback Sources
- **ADB**: Google's official platform-tools
- **Scrcpy**: Genymobile's official releases

## Download Process

### When Downloads Occur
- First time the extension is activated
- When binary validation fails
- When user manually triggers "Download Binaries" command
- When binaries are missing or corrupted

### Download Location
Binaries are downloaded to the extension's global storage directory:
- **Windows**: `%APPDATA%/Code/User/globalStorage/droidbridge/binaries/`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/droidbridge/binaries/`
- **Linux**: `~/.config/Code/User/globalStorage/droidbridge/binaries/`

### Progress Tracking
- Real-time download progress in the output channel
- Progress notifications for large downloads
- Automatic retry on network failures

## Configuration

### Custom Binary Paths
Users can specify custom binary paths in VSCode settings:
```json
{
  "droidbridge.adbPath": "/custom/path/to/adb",
  "droidbridge.scrcpyPath": "/custom/path/to/scrcpy"
}
```

### Download Preferences
The system prioritizes GitHub releases but can fall back to official sources if needed.

## Security

### Verification
- Downloaded binaries are verified for basic integrity
- Executable permissions are set automatically on Unix systems
- Files are downloaded to secure, user-specific directories

### Network Requirements
- HTTPS connections only
- No telemetry or tracking
- Minimal network usage (downloads only when needed)

## Troubleshooting

### Download Failures
1. Check internet connection
2. Verify GitHub repository accessibility
3. Check available disk space
4. Review logs in DroidBridge output channel

### Permission Issues
1. Ensure VSCode has write permissions to user directories
2. Check antivirus software isn't blocking downloads
3. Verify firewall allows HTTPS connections

### Manual Download
If automatic downloads fail, users can:
1. Download binaries manually from the GitHub repository
2. Place them in the expected directory structure
3. Use custom binary paths in settings

## Commands

### Available Commands
- `DroidBridge: Check Binaries` - Verify binary status
- `DroidBridge: Download Binaries` - Force download missing binaries
- `DroidBridge: Refresh Binaries` - Clear cache and re-detect

### Command Palette
All binary management commands are available through VSCode's command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

## Benefits

### For Users
- No large extension download
- Always up-to-date binaries
- Automatic setup and maintenance
- Cross-platform compatibility

### For Developers
- Smaller extension package size
- Easier maintenance and updates
- Flexible binary source management
- Better user experience

## Technical Details

### Implementation
- TypeScript-based download manager
- Platform-specific binary detection
- Configurable download sources
- Progress tracking and error handling

### Dependencies
- Node.js built-in modules (https, fs, path)
- VSCode extension API for storage and notifications
- Platform utilities for cross-platform compatibility