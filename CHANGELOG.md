# Change Log

All notable changes to the DroidBridge extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MCP server for AI agents: screenshot, UI tree, tap, swipe, type, keys, apps, logcat, APK install and shell; registered for Copilot agent mode, with a setup command for Claude Code, Cursor and other clients
- Live, interactive screen mirror embedded in the sidebar (tap, swipe, scroll, type, Back, Home, Recents, Rotate)
- Pop the mirror out into a resizable editor tab and dock it back to the sidebar
- Bundled scrcpy-server 3.3.4, so the embedded mirror needs only ADB
- Tablet support: the mirror keeps the device aspect ratio and follows rotation
- Settings for mirror resolution, bitrate and always-on-top

### Fixed
- Mirror window was locked to a fixed 280x350 borderless size and could not be resized
- Icon buttons were invisible in light themes

### Removed
- Eject Scrcpy from Sidebar and Embed Scrcpy in Sidebar commands, replaced by the embedded mirror
- Use `--video-bit-rate` for scrcpy 2.x and later
- Codicon icons not rendering in the sidebar
- Pairing inputs squeezing instead of wrapping in narrow sidebars

## [0.1.0] - 2024-12-27

### Added
- Initial release of DroidBridge extension
- Wireless ADB connection support via IP address and port
- Scrcpy screen mirroring integration with launch and stop controls
- Dedicated sidebar view for device management
- Command palette integration for all major functions
- Cross-platform support (Windows, macOS, Linux)
- Bundled ADB and scrcpy binaries for out-of-the-box functionality
- Configuration system for default IP/port and custom binary paths
- Comprehensive logging system with OutputChannel integration
- Theme integration supporting VSCode light and dark themes
- Error handling with user-friendly notifications
- Process management with proper cleanup and lifecycle handling
- Binary management with platform detection and validation
- Comprehensive test suite with unit, integration, and end-to-end tests

### Features
- **Device Connection**: Connect to Android devices wirelessly using ADB
- **Screen Mirroring**: Launch scrcpy for real-time device screen mirroring
- **Screen Off Mode**: Launch scrcpy with device screen turned off
- **Status Monitoring**: Real-time connection and scrcpy status indicators
- **Configuration**: Customizable default IP/port and binary paths
- **Logging**: Detailed operation logs for troubleshooting
- **Multi-platform**: Native support for Windows, macOS, and Linux

### Technical
- TypeScript implementation with full type safety
- ESBuild bundling for optimized extension size
- Comprehensive error handling and user feedback
- Platform-specific binary management
- Process lifecycle management with proper cleanup
- Configuration validation and change watching
- Theme-aware UI components and icons

## [0.0.1] - 2024-12-20

### Added
- Project initialization and basic structure
- Core TypeScript interfaces and type definitions
- Basic extension activation and command registration