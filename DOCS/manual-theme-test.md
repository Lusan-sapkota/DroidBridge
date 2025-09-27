# Manual Theme Integration Test

This document describes how to manually test the theme integration functionality.

## Prerequisites

1. Build and run the extension in development mode
2. Open VSCode with the extension loaded

## Test Steps

### 1. Initial Theme Detection
1. Open VSCode with your current theme
2. Open the DroidBridge sidebar (click the device icon in the activity bar)
3. Verify that the sidebar displays correctly with appropriate colors for your current theme

### 2. Light Theme Testing
1. Switch VSCode to a light theme (e.g., "Light (Visual Studio)")
   - Go to File > Preferences > Color Theme
   - Select a light theme
2. Observe the DroidBridge sidebar
3. **Expected Results:**
   - Section headers should use light theme colors
   - Icons should be visible and appropriate for light backgrounds
   - Status indicators should use proper contrast colors
   - Input fields and buttons should follow light theme styling

### 3. Dark Theme Testing
1. Switch VSCode to a dark theme (e.g., "Dark (Visual Studio)")
   - Go to File > Preferences > Color Theme
   - Select a dark theme
2. Observe the DroidBridge sidebar
3. **Expected Results:**
   - Section headers should use dark theme colors
   - Icons should be visible and appropriate for dark backgrounds
   - Status indicators should use proper contrast colors
   - Input fields and buttons should follow dark theme styling

### 4. High Contrast Theme Testing
1. Switch VSCode to a high contrast theme
   - Go to File > Preferences > Color Theme
   - Select "Dark High Contrast" or "Light High Contrast"
2. Observe the DroidBridge sidebar
3. **Expected Results:**
   - All elements should have high contrast colors
   - Text should be clearly readable
   - Icons should be visible with proper contrast
   - Status indicators should use high contrast colors

### 5. Dynamic Theme Switching
1. With the DroidBridge sidebar open, switch between different themes rapidly
2. **Expected Results:**
   - The sidebar should update immediately when themes change
   - No visual glitches or delays should occur
   - All elements should consistently follow the new theme

### 6. Theme Persistence
1. Switch to a specific theme
2. Close and reopen VSCode
3. Open the DroidBridge sidebar
4. **Expected Results:**
   - The sidebar should immediately display with the correct theme
   - No flash of incorrect theme should occur

## Verification Checklist

- [ ] Light theme displays correctly
- [ ] Dark theme displays correctly  
- [ ] High contrast themes display correctly
- [ ] Theme switching is immediate and smooth
- [ ] Icons are appropriate for each theme
- [ ] Status colors have proper contrast
- [ ] Input fields follow theme styling
- [ ] Buttons follow theme styling
- [ ] No console errors during theme changes
- [ ] Theme persistence works across sessions

## Common Issues to Watch For

1. **Icon visibility**: Icons should always be visible regardless of theme
2. **Color contrast**: Text should always be readable
3. **Flash of unstyled content**: Theme should apply immediately
4. **Console errors**: No JavaScript errors should occur during theme changes
5. **Memory leaks**: Theme listeners should be properly disposed

## Browser Developer Tools Testing

1. Open the webview developer tools:
   - Right-click in the sidebar
   - Select "Inspect" or use Ctrl+Shift+I
2. Check the console for any errors
3. Verify CSS variables are being applied correctly
4. Check that theme classes are being added/removed properly

## Automated Test Verification

Run the theme tests to ensure programmatic functionality:

```bash
npm test -- --grep "Theme"
```

All tests should pass without errors.