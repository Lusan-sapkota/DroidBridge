# Build and Development Guide

## Development Setup

### Prerequisites
- Node.js 16+ 
- npm 8+
- VSCode 1.104.0+

### Installation
```bash
git clone https://github.com/Lusan-sapkota/DroidBridge.git
cd DroidBridge
npm install
```

### Development Commands

#### Building
```bash
npm run compile          # Development build
npm run package          # Production build
npm run watch            # Watch mode for development
```

#### Testing
```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # End-to-end tests only
npm run test:coverage    # Test with coverage report
```

#### Code Quality
```bash
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
npm run check-types      # TypeScript type checking
```

#### Packaging
```bash
npm run clean            # Clean build artifacts
npm run package:vsix     # Create .vsix package
npm run publish          # Publish to marketplace
```

## Build Process

### ESBuild Configuration
The extension uses ESBuild for fast bundling with the following optimizations:

- **Tree shaking**: Removes unused code
- **Minification**: Reduces bundle size in production
- **Source maps**: Available in development mode
- **Asset copying**: Automatically copies media and binary files
- **Bundle analysis**: Generates metadata for optimization

### Build Outputs
- `dist/extension.js` - Main extension bundle
- `dist/media/` - Webview assets (CSS, JS, icons)
- `dist/binaries/` - Platform-specific binaries (if present)
- `dist/meta.json` - Bundle analysis (production only)

### Development Workflow

1. **Start development**:
   ```bash
   npm run watch
   ```

2. **Open in VSCode**:
   - Press F5 to launch Extension Development Host
   - Test changes in real-time

3. **Run tests**:
   ```bash
   npm run test:watch
   ```

4. **Before committing**:
   ```bash
   npm run lint
   npm run check-types
   npm test
   ```

## Project Structure

```
droidbridge/
├── src/                    # Source code
│   ├── extension.ts        # Main extension entry
│   ├── managers/           # Core managers
│   ├── providers/          # VSCode providers
│   ├── utils/              # Utility functions
│   └── test/               # Test files
├── media/                  # Webview assets
│   ├── icons/              # Extension icons
│   ├── main.css            # Webview styles
│   └── main.js             # Webview scripts
├── binaries/               # Platform binaries (optional)
├── dist/                   # Build output
└── out/                    # Test compilation output
```

## Configuration Files

### TypeScript (`tsconfig.json`)
- Target: ES2020
- Module: CommonJS
- Strict type checking enabled
- Source maps for debugging

### ESLint (`eslint.config.mjs`)
- TypeScript ESLint rules
- VSCode extension specific rules
- Consistent code formatting

### ESBuild (`esbuild.js`)
- Bundle configuration
- Asset copying
- Production optimizations

## Binary Management

### Bundled Binaries
The extension can include platform-specific binaries:

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

### Binary Detection
The extension automatically:
1. Detects the current platform
2. Resolves binary paths
3. Falls back to system binaries if bundled ones aren't available
4. Validates binary permissions and existence

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock external dependencies
- Focus on business logic

### Integration Tests
- Test component interactions
- Use real VSCode APIs where possible
- Verify command registration and execution

### End-to-End Tests
- Test complete user workflows
- Simulate real user interactions
- Verify extension behavior in VSCode

### Coverage Requirements
- Minimum 80% code coverage
- Critical paths must be 100% covered
- All error scenarios tested

## Performance Considerations

### Bundle Size
- Target: < 1MB total extension size
- Use tree shaking to eliminate dead code
- Minimize dependencies
- Compress assets

### Startup Time
- Lazy load non-critical components
- Minimize activation time
- Use efficient data structures
- Cache expensive operations

### Memory Usage
- Proper cleanup of resources
- Dispose of event listeners
- Terminate child processes
- Clear timers and intervals

## Debugging

### Extension Development
1. Open project in VSCode
2. Press F5 to launch Extension Development Host
3. Set breakpoints in source code
4. Use Debug Console for inspection

### Production Issues
1. Enable detailed logging
2. Check Output panel (DroidBridge Logs)
3. Reproduce with minimal configuration
4. Collect system information

### Common Issues
- **Extension not activating**: Check activation events
- **Commands not working**: Verify command registration
- **Sidebar not showing**: Check view container configuration
- **Binary not found**: Verify platform detection and paths

## Contributing

### Code Style
- Follow TypeScript best practices
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all checks pass
5. Submit pull request with description

### Issue Reporting
- Use provided issue templates
- Include system information
- Provide reproduction steps
- Attach relevant logs

## Release Process

### Version Bumping
```bash
npm version patch   # Bug fixes
npm version minor   # New features
npm version major   # Breaking changes
```

### Release Checklist
1. Update CHANGELOG.md
2. Run full test suite
3. Build and test package
4. Create GitHub release
5. Publish to marketplace
6. Update documentation

## Troubleshooting

### Build Issues
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors

### Test Failures
- Ensure VSCode test environment is set up
- Check for timing issues in async tests
- Verify mock configurations
- Update test expectations if APIs changed

### Publishing Issues
- Verify publisher account access
- Check package.json configuration
- Ensure all required files are included
- Validate extension manifest