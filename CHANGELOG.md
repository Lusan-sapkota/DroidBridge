# Change Log

All notable changes to the DroidBridge extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- ADB and scrcpy path settings no longer claim the binaries are bundled

## [1.0.0] - 2026-10-18

First public release.

### Added
- Live, interactive screen mirror inside VS Code: tap, swipe, scroll, type, Back, Home, Recent apps and Rotate
- Mirror in the sidebar or in a resizable editor tab, and move it between the two
- Phone and tablet support: the mirror keeps the device aspect ratio at any size and follows rotation
- Bundled scrcpy-server 3.3.4, so the embedded mirror needs only ADB
- MCP server for AI agents (screenshot, UI tree, tap, swipe, type, keys, apps, logcat, APK install, shell), available to GitHub Copilot agent mode, with a setup command for Claude Code, Cursor and other clients
- Native scrcpy window option with resolution, bitrate and always-on-top settings
- Wireless ADB connect and disconnect, pairing with a code, and connection history
- Automatic detection of USB devices and emulators, shown as ready in the sidebar
- Collapsible sidebar sections that remember their state
- Detection of installed ADB and scrcpy, with download of missing binaries
- Light, dark and high contrast theme support

### Changed
- Pre-release builds (0.0.1 and 0.1.0) were never published. This release replaces their sidebar eject and embed commands with the embedded mirror.
