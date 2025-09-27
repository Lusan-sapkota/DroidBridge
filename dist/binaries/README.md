# Binaries Directory

This directory contains platform-specific binaries for ADB and scrcpy.

## Structure

```
binaries/
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

## Notes

- Binaries will be bundled with the extension package
- The BinaryManager class handles platform detection and binary selection
- Custom binary paths can be configured in VSCode settings to override bundled binaries
- Binaries must be executable on Unix systems (handled automatically by BinaryManager)