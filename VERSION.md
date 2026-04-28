# Version Management

oh-my-colab uses a centralized version management system to keep version numbers consistent across all configuration files.

## Files Managed

The version system automatically updates version numbers in:

- `package.json` - NPM package version
- `.claude-plugin/plugin.json` - Claude Code plugin version
- `.cursor-plugin/manifest.json` - Cursor plugin version  
- `scripts/setup/index.js` - Template version references

## Commands

### Check Version Consistency
```bash
npm run version:check
```
Verifies all files have the same version number.

### Fix Version Inconsistencies
```bash
npm run version:fix
```
Synchronizes all files to match the `package.json` version.

### Set Specific Version
```bash
npm run version:set 1.2.3
```
Sets all files to the specified version number.

### Bump Version
```bash
# Patch version (0.2.1 → 0.2.2)
npm run version:bump

# Minor version (0.2.1 → 0.3.0)
npm run version:bump:minor

# Major version (0.2.1 → 1.0.0)  
npm run version:bump:major
```

### Create Git Tag
```bash
npm run version:tag
```
Creates a git tag for the current version (e.g., `v0.2.1`).

### Show Current Version
```bash
npm run version:current
```
Displays the current version number.

### Update Changelog
```bash
npm run version:changelog
```
Updates CHANGELOG.md with an entry for the current version.

## Workflow Examples

### Releasing a New Version
```bash
# 1. Bump version (automatically updates changelog)
npm run version:bump:minor

# 2. Commit changes
git commit -am "Release version 0.3.0"

# 3. Create git tag
npm run version:tag

# 4. Push to repository
git push && git push --tags
```

**Note**: Version bumping automatically updates the changelog with a new entry. The changelog follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

### Fixing Version Drift
If versions get out of sync during development:
```bash
# Check what's inconsistent
npm run version:check

# Fix all inconsistencies
npm run version:fix

# Verify everything is consistent
npm run version:check
```

## Benefits

- **Single Source of Truth**: `package.json` version drives all others
- **Consistency**: Prevents version mismatches across files
- **Automation**: Handles complex template file updates automatically  
- **Safety**: Validates version format before making changes
- **Git Integration**: Automatically creates tags for releases