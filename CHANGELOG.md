# Change Log

All notable changes to the DroidBridge extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-25

### Added
- Emulators from VS Code: with nothing connected, Start Mirror offers the emulators (AVDs) from your Android SDK, boots the one you pick and mirrors it. Also available as DroidBridge: Start Emulator, from the Start Emulator button in the sidebar and from the native scrcpy launch prompt
- Create a phone or tablet emulator from any installed system image without leaving VS Code (uses avdmanager). With no image installed, DroidBridge offers to download one with sdkmanager in a terminal
- Headless emulators, on by default: the emulator runs without its own window and shows only in the DroidBridge mirror. Switch between headless and windowed from the Start Emulator menu or the `droidbridge.emulator.headless` setting. Headless emulators started by DroidBridge stop when VS Code closes
- DroidBridge: Stop Emulator
- Device picker when several devices are connected, such as an emulator and a phone, for the embedded mirror and the native scrcpy window
- Reset ADB button and command for stuck situations: stops mirroring and scrcpy, removes port forwards, restarts the ADB server and reconnects a wireless device
- MCP tools: `start_emulator`, `stop_emulator`, `wait_for`, `open_url`, `device_info` and `reset_adb`. `list_devices` also lists the emulators that can be started

### Changed
- An emulator counts as ready only once Android's system services respond and the post-boot load has settled, so the mirror and agents do not act on a device that cannot respond yet
- An emulator that is still starting or stuck offline is reconnected and waited for, and restarted if it stays unresponsive, instead of starting a second copy. A broken Quick Boot snapshot is replaced by a cold boot
- Sidebar section headers show the connection and scrcpy status and the mirror pop out, native window and stop buttons
- MCP errors say when a device is too busy to read its screen

### Fixed
- Unauthorized devices and devices without USB permissions were picked for mirroring
- The sidebar showed Disconnected with the mirror buttons disabled when opened with only a USB device or emulator attached
- Pairing with a missing host, port or code did nothing instead of showing an error
- Dismissing the no-device prompt still launched the native scrcpy window
- Sidebar headers and buttons were cut off in a very narrow sidebar
- Recent Connections showed the address twice
- MCP `tap`, `long_press` and `swipe` silently did nothing with non-numeric coordinates
- MCP server dropped replies to calls still running when the client closed its input
- MCP `wait_for` with `gone` reported success when the screen could not be read, and parallel `ui_tree` calls could kill each other
- ADB and scrcpy path settings claimed the binaries are bundled

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
