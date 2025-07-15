# GTK 4 Configuration Fix

## Issue
GTK 4 applications were showing warnings about:
1. Unknown key `gtk-modules`
2. Deprecated dark theme setting

## Fixes Applied
1. Removed unsupported `gtk-modules` line
2. Maintained `gtk-application-prefer-dark-theme` as the correct dark mode setting for GTK 4
3. Fixed font spacing in `gtk-font-name`

## Remaining Libadwaita Warning
The warning about using `gtk-application-prefer-dark-theme` with libadwaita is expected. The preferred solution is to configure dark mode within each libadwaita application using:

```ts
// Example for GNOME applications
const styleManager = Adw.StyleManager.get_default();
styleManager.colorScheme = Adw.ColorScheme.PREFER_DARK;
```

## Verification
After changes, applications should launch without the GTK warnings:
```bash
pinta  # Should launch without configuration warnings
```

## Recommended Next Steps
1. Application developers should migrate to libadwaita's color scheme API
2. System maintainers can ignore the libadwaita warning until applications are updated