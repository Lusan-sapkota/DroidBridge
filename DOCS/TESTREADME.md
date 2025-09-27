# DroidBridge Extension Test Suite

This directory contains a comprehensive test suite for the DroidBridge VSCode extension, covering all requirements through unit tests, integration tests, and end-to-end tests.

## Test Structure

### Unit Tests
- **binaryManager.test.ts** - Tests binary management functionality
- **commandManager.test.ts** - Tests command execution and validation
- **configManager.test.ts** - Tests configuration management and validation
- **logger.test.ts** - Tests logging functionality and output
- **processManager.test.ts** - Tests process execution and lifecycle
- **errorHandler.test.ts** - Tests error handling and user feedback
- **errorHandler.comprehensive.test.ts** - Comprehensive error scenario testing
- **platformUtils.test.ts** - Tests platform-specific utilities
- **themeManager.test.ts** - Tests theme integration

### Integration Tests
- **errorScenarios.integration.test.ts** - Tests error handling workflows
- **sidebarCommandIntegration.test.ts** - Tests sidebar-command integration
- **extension.lifecycle.test.ts** - Tests extension activation/deactivation
- **platformIntegration.test.ts** - Tests cross-platform functionality
- **themeIntegration.test.ts** - Tests theme switching integration

### End-to-End Tests
- **endToEnd.test.ts** - Complete user workflow testing
- **adbConnection.test.ts** - ADB connection workflow testing
- **sidebarProvider.test.ts** - Sidebar functionality testing
- **errorScenarios.comprehensive.test.ts** - Comprehensive error testing

### Test Coverage and Utilities
- **coverage.test.ts** - Test coverage verification
- **testRunner.ts** - Test execution configuration
- **index.ts** - Test suite configuration

## Requirements Coverage

### Requirement 1 - Sidebar Interface
- ✅ Sidebar display and theming (sidebarProvider.test.ts)
- ✅ Activity bar integration (extension.lifecycle.test.ts)
- ✅ Theme adaptation (themeIntegration.test.ts)

### Requirement 2 - ADB Connection
- ✅ IP/port input validation (configManager.test.ts)
- ✅ Connection execution (commandManager.test.ts, processManager.test.ts)
- ✅ Status indicators (sidebarCommandIntegration.test.ts)
- ✅ Progress notifications (errorScenarios.integration.test.ts)

### Requirement 3 - Scrcpy Screen Mirroring
- ✅ Launch/stop functionality (commandManager.test.ts, processManager.test.ts)
- ✅ Process management (processManager.test.ts)
- ✅ Duplicate instance prevention (processManager.test.ts)
- ✅ Status monitoring (sidebarCommandIntegration.test.ts)

### Requirement 4 - Command Palette Integration
- ✅ Command registration (commandManager.test.ts)
- ✅ Command execution (endToEnd.test.ts)
- ✅ Keyboard shortcuts (extension.lifecycle.test.ts)

### Requirement 5 - Binary Management
- ✅ Platform-specific binaries (binaryManager.test.ts)
- ✅ Binary validation (binaryManager.test.ts)
- ✅ Custom path configuration (binaryManager.test.ts)

### Requirement 6 - Logging and Error Messages
- ✅ Output channel creation (logger.test.ts)
- ✅ Process output capture (logger.test.ts, processManager.test.ts)
- ✅ Error logging (errorHandler.test.ts)
- ✅ User notifications (errorScenarios.integration.test.ts)

### Requirement 7 - Configuration Management
- ✅ Settings validation (configManager.test.ts)
- ✅ Default values (configManager.test.ts)
- ✅ Configuration watchers (extension.lifecycle.test.ts)

### Requirement 8 - Error Handling and User Feedback
- ✅ Progress indicators (errorScenarios.integration.test.ts)
- ✅ Success notifications (commandManager.test.ts)
- ✅ Error notifications (errorHandler.comprehensive.test.ts)
- ✅ Input validation (configManager.test.ts)
- ✅ Offline device handling (errorScenarios.comprehensive.test.ts)
- ✅ Process failure handling (errorScenarios.comprehensive.test.ts)

### Requirement 9 - Cross-Platform Compatibility
- ✅ Platform detection (platformUtils.test.ts)
- ✅ Binary path resolution (binaryManager.test.ts)
- ✅ Process execution (processManager.test.ts)
- ✅ File permissions (platformIntegration.test.ts)

### Requirement 10 - Theme Integration
- ✅ Theme detection (themeManager.test.ts)
- ✅ Icon switching (themeIntegration.test.ts)
- ✅ CSS variables (themeIntegration.test.ts)
- ✅ Runtime theme changes (themeIntegration.test.ts)

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# With coverage reporting
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Configuration

Tests are configured with:
- **Timeout**: 10 seconds per test
- **Slow threshold**: 2 seconds
- **Reporter**: Spec (detailed output)
- **Coverage threshold**: 80% lines, functions, statements; 70% branches

### Mocking Strategy

The test suite uses comprehensive mocking:
- **VSCode API**: All VSCode APIs are mocked using Sinon
- **File System**: File operations are mocked for consistent testing
- **Child Processes**: Process execution is mocked with controllable behavior
- **Network Operations**: Network calls are mocked to simulate various scenarios

### Error Scenario Testing

Comprehensive error testing covers:
- **Binary Management Errors**: Missing binaries, permission issues, corruption
- **Network Errors**: Connection failures, timeouts, DNS issues
- **Process Errors**: Spawn failures, crashes, resource exhaustion
- **Configuration Errors**: Invalid values, missing settings, corruption
- **Device Errors**: Offline devices, unauthorized access, busy states
- **UI Errors**: VSCode API failures, notification issues
- **Concurrent Operations**: Multiple simultaneous operations
- **Recovery Scenarios**: Cleanup failures, partial state recovery

### Test Data and Fixtures

Test data includes:
- **Valid/Invalid IP addresses**: Comprehensive validation testing
- **Valid/Invalid ports**: Range and format testing
- **Mock process outputs**: Simulated ADB and scrcpy responses
- **Error messages**: Real-world error scenarios
- **Configuration examples**: Various configuration states

## Continuous Integration

The test suite is designed for CI/CD integration:
- **Fast execution**: Optimized for quick feedback
- **Deterministic results**: No flaky tests due to comprehensive mocking
- **Coverage reporting**: Automated coverage analysis
- **Multiple environments**: Cross-platform testing support

## Test Maintenance

When adding new features:
1. Add unit tests for new classes/methods
2. Add integration tests for new workflows
3. Update end-to-end tests for new user scenarios
4. Add error scenarios for new failure modes
5. Update coverage requirements if needed

## Debugging Tests

For debugging failing tests:
1. Use `npm run test:watch` for rapid iteration
2. Add `console.log` statements in test code
3. Use VSCode debugger with test configuration
4. Check mock call history with Sinon assertions
5. Verify test isolation by running tests individually