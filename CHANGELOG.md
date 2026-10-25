# Change Log

All notable changes to the DroidBridge extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-10-25

### Added
- Mirror toolbar: Volume down, Volume up, Power, Notifications, Paste clipboard, Screenshot (full resolution PNG) and Record (MP4, click again to stop and save). Also available as DroidBridge: Save Device Screenshot and DroidBridge: Start or Stop Screen Recording
- Typing in the mirror works in any keyboard layout, and Ctrl+V (Cmd+V) pastes the computer clipboard onto the device
- Stop Emulator button next to Start Emulator in the sidebar, enabled while an emulator runs, including one stuck offline
- Emulator Settings (gear button or DroidBridge: Emulator Settings): CPU cores, memory, VM heap, internal storage, graphics (Automatic, Hardware or Software), Quick or cold boot, start orientation, computer keyboard and device frame, with Save and Restart, Delete Saved State and Wipe Data
- MCP tools: `set_display` (dark mode, font scale, screen size, density, rotation), `set_app_locale`, `stop_app`, `clear_app_data`, `set_permission`, `start_activity` (intents with typed extras), `push_file`, `pull_file` (including a debuggable app's private files), `screen_record`, `pair_device`, `connect_device` and `disconnect_device`
- MCP `expectPackage` on input tools: they refuse to act when another app is in the foreground
- MCP `install_apk` installs split APKs (`paths`) and .aab bundles through bundletool, with `grantPermissions` (-g) and `allowDowngrade` (-d)
- MCP `logcat` filters on the device by `package`, `tags` and `sinceSeconds`
- MCP `tap_element` scrolls the largest list to find an element that is not on screen yet (`maxScrolls`, `scrollDirection`)

### Changed
- MCP `type_text` types any language and emoji by pasting through the device clipboard, instead of rejecting text that is not ASCII
- MCP `tap` holds for 60 ms by default (`durationMs`), so gesture detectors that ignore zero length taps in some React Native, Compose and Flutter apps register it
- MCP `ui_tree` reports the app it read, the node count and whether another window has focus, explains empty results (such as Flutter without semantics), includes UI Automator's own error, and falls back to the Android view hierarchy when the screen cannot be read
- MCP `wait_for` polls less often the longer it waits, so repeated UI dumps do not load the device
- MCP `reset_adb` first only reconnects devices; restarting the ADB server, which also drops Android Studio, scrcpy and logcat sessions, needs `restartServer` or happens when ADB does not respond
- Stopping an emulator stops its mirror without a "device disconnected" warning

### Fixed
- Headless emulators could break the windowed emulator: they often render in software and saved their Quick Boot state on exit, so the next windowed start showed a black screen, "Failed to find ColorBuffer" and "System UI isn't responding". Headless starts now cold boot and never save state. To repair an emulator already affected, use Delete Saved State in Emulator Settings
- MCP `screenshot` assumed RGBA pixels; RGBX, RGB, BGRA and RGB_565 screens now decode with the right colours
- MCP `current_app` failed while the screen was changing
- Screen recording reported success when the device refused to record, for example right after boot before shared storage was ready. Recordings now go to app-independent temporary storage and a refusal is shown at start

## [1.1.0] - 2026-10-25

### Added
- Emulators from VS Code: with nothing connected, Start Mirror offers the emulators (AVDs) from your Android SDK, boots the one you pick and mirrors it. Also available as DroidBridge: Start Emulator, from the Start Emulator button in the sidebar and from the native scrcpy launch prompt
- Create a phone or tablet emulator from any installed system image without leaving VS Code (uses avdmanager). With no image installed, DroidBridge offers to download one with sdkmanager in a terminal
- Headless emulators, on by default: the emulator runs without its own window and shows only in the DroidBridge mirror. Switch between headless and windowed from the Start Emulator menu or the `droidbridge.emulator.headless` setting. Headless emulators started by DroidBridge stop when VS Code closes
- DroidBridge: Stop Emulator, and the `stop_emulator` MCP tool, which also stops an emulator stuck offline
- Device picker when several devices are connected, such as an emulator and a phone, for the embedded mirror and the native scrcpy window
- Reset ADB button and command for stuck situations: stops mirroring and scrcpy, removes port forwards, restarts the ADB server and reconnects a wireless device
- MCP tools: `start_emulator`, `stop_emulator`, `wait_for`, `open_url`, `device_info` and `reset_adb`. `list_devices` also lists the emulators that can be started

### Changed
- An emulator counts as ready only once Android's system services respond and the post-boot load has settled, so the mirror and agents do not act on a device that cannot respond yet
- An emulator that is still starting or stuck offline is reconnected and waited for, and restarted if it stays unresponsive, instead of starting a second copy. A broken Quick Boot snapshot is replaced by a cold boot
- Cancelling an emulator start, or a start that times out, shuts that emulator down instead of leaving it running unseen
- Starting an emulator from the sidebar in headless mode mirrors that emulator, switching away from any device already being mirrored
- Sidebar section headers show the connection and scrcpy status and the mirror pop out, native window and stop buttons
- Show Logs and Reset ADB share the footer row
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
