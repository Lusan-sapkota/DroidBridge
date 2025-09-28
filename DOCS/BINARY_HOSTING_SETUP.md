# Binary Hosting Setup Guide

This guide explains how to set up binary hosting for the DroidBridge extension's smart download system.

## Quick Setup Options

### Option 1: GitHub Releases (Recommended)

1. Create a new repository (e.g., `droidbridge-binaries`)
2. Download platform-specific binaries:
   - **ADB**: From [Android SDK Platform Tools](https://developer.android.com/studio/releases/platform-tools)
   - **Scrcpy**: From [Scrcpy Releases](https://github.com/Genymobile/scrcpy/releases)

3. Rename binaries using the pattern:
   ```
   adb-windows-x64.exe
   adb-macos-x64
   adb-linux-x64
   scrcpy-windows-x64.exe
   scrcpy-macos-x64
   scrcpy-linux-x64
   ```

4. Create a GitHub release and upload the binaries
5. Update `src/config/binaryConfig.ts` with your repository URL:
   ```typescript
   github: 'https://github.com/YOUR-USERNAME/droidbridge-binaries/releases/latest/download'
   ```

### Option 2: CDN/Web Server

1. Set up a web server or CDN
2. Create directory structure:
   ```
   /binaries/
   ├── adb-windows-x64.exe
   ├── adb-macos-x64
   ├── adb-linux-x64
   ├── scrcpy-windows-x64.exe
   ├── scrcpy-macos-x64
   └── scrcpy-linux-x64
   ```

3. Update `src/config/binaryConfig.ts`:
   ```typescript
   direct: 'https://your-cdn.com/binaries'
   ```

## Binary Preparation

### ADB Binary Extraction

1. Download Android SDK Platform Tools
2. Extract the `adb` binary (and `adb.exe` on Windows)
3. Rename according to platform pattern

### Scrcpy Binary Extraction

1. Download scrcpy release for each platform
2. Extract the main executable
3. Rename according to platform pattern

## Architecture Support

Current patterns support:
- `x64` (Intel/AMD 64-bit)
- `arm64` (ARM 64-bit, for Apple Silicon)

Add more architectures by updating `BINARY_PATTERNS` in `binaryConfig.ts`.

## Testing Your Setup

1. Update the configuration with your URLs
2. Use the command: `DroidBridge: Check Binary Status`
3. If binaries are missing, use: `DroidBridge: Download Missing Binaries`
4. Check the logs for any download issues

## Security Considerations

- Use HTTPS for all download URLs
- Consider adding checksums to verify binary integrity
- Host binaries on trusted infrastructure
- Regularly update binaries to latest versions

## Fallback Strategy

The extension will try multiple sources in order:
1. Your configured GitHub/direct URLs
2. Fallback URLs (if configured)
3. Show manual installation instructions

## Example Repository Structure

```
droidbridge-binaries/
├── README.md
├── .github/
│   └── workflows/
│       └── update-binaries.yml  # Auto-update workflow
└── releases/
    ├── adb-windows-x64.exe
    ├── adb-macos-x64
    ├── adb-linux-x64
    ├── scrcpy-windows-x64.exe
    ├── scrcpy-macos-x64
    └── scrcpy-linux-x64
```

## Automation

Consider setting up GitHub Actions to automatically:
1. Check for new ADB/scrcpy releases
2. Download and rename binaries
3. Create new releases with updated binaries

This ensures users always get the latest versions without manual intervention.