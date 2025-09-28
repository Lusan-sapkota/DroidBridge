# Smart Binary Management System

DroidBridge uses an intelligent binary management system that automatically detects and downloads only the binaries you need.

## How It Works

1. **Detection First**: The extension first checks if ADB and scrcpy are already installed on your system
2. **Smart Downloads**: Only downloads binaries that are missing from your system
3. **Multiple Sources**: Supports system PATH, common installation directories, and downloaded binaries
4. **Cost Efficient**: No bundled binaries in the extension package - saves bandwidth and storage

## Binary Sources (Priority Order)

1. **Custom Paths**: User-configured paths in VSCode settings
2. **System PATH**: Binaries available in system PATH (e.g., installed via package managers)
3. **Common Locations**: Standard installation directories for each platform
4. **Downloaded Binaries**: Automatically downloaded when needed

## Directory Structure

```
downloaded-binaries/
├── win32/
│   ├── adb.exe
│   └── scrcpy.exe
├── darwin/
│   ├── adb
│   └── scrcpy
└── linux/
    ├── adb
    └── scrcpy
```

## Commands

- **Check Binary Status**: `DroidBridge: Check Binary Status` - Shows current binary detection status
- **Download Missing Binaries**: `DroidBridge: Download Missing Binaries` - Downloads any missing binaries
- **Refresh Binary Detection**: `DroidBridge: Refresh Binary Detection` - Re-scans for binaries

## Configuration

You can still override binary paths in VSCode settings:

```json
{
  "droidbridge.adbPath": "/custom/path/to/adb",
  "droidbridge.scrcpyPath": "/custom/path/to/scrcpy"
}
```

## Binary Download Sources

The extension downloads binaries from configurable sources (see `src/config/binaryConfig.ts`):

- GitHub releases (default)
- Direct download URLs
- Fallback sources

## Platform Support

- **Windows**: Detects binaries in Program Files, PATH, and common locations
- **macOS**: Checks Homebrew, MacPorts, PATH, and standard directories  
- **Linux**: Scans package manager locations, PATH, and user directories

## Notes

- Binaries are automatically made executable on Unix systems
- Download progress is shown in VSCode notifications
- Failed downloads fall back to manual installation instructions
- All binary operations are logged for troubleshooting