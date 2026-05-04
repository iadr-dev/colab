#!/usr/bin/env node
/**
 * Central Version Control for oh-my-colab
 * Manages version across all configuration files from a single source of truth
 */

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const VERSION_FILES = [
  {
    file: 'package.json',
    path: ['version'],
    format: 'json'
  },
  {
    file: '.claude-plugin/plugin.json',
    path: ['version'],
    format: 'json'
  },
  {
    file: '.cursor-plugin/manifest.json',
    path: ['version'],
    format: 'json'
  },
  {
    file: 'scripts/setup/index.js',
    format: 'template',
    patterns: [
      {
        pattern: /version:\s*'([0-9]+\.[0-9]+\.[0-9]+[^']*)'/g,
        replacement: "version: '$VERSION'"
      },
      {
        pattern: /version:\s*"([0-9]+\.[0-9]+\.[0-9]+[^"]*)"/g,
        replacement: 'version: "$VERSION"'
      }
    ]
  }
];

class VersionManager {
  constructor() {
    this.packageJsonPath = path.join(ROOT, 'package.json');
    this.currentVersion = this.getCurrentVersion();
  }

  getCurrentVersion() {
    try {
      const pkg = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      return pkg.version;
    } catch (error) {
      throw new Error(`Failed to read current version from package.json: ${error.message}`);
    }
  }

  setVersion(newVersion) {
    if (!this.isValidVersion(newVersion)) {
      throw new Error(`Invalid version format: ${newVersion}. Use semantic versioning (e.g., 1.0.0)`);
    }

    console.log(`Updating version from ${this.currentVersion} to ${newVersion}...`);
    
    // Update all version files
    for (const versionFile of VERSION_FILES) {
      this.updateVersionFile(versionFile, newVersion);
    }

    this.currentVersion = newVersion;
    console.log(`✅ Version updated successfully to ${newVersion}`);
    
    // Show what files were updated
    console.log('\nUpdated files:');
    VERSION_FILES.forEach(vf => {
      const filePath = path.join(ROOT, vf.file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${vf.file}`);
      }
    });
  }

  updateVersionFile(versionFile, newVersion) {
    const filePath = path.join(ROOT, versionFile.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ Skipping ${versionFile.file} (file not found)`);
      return;
    }

    try {
      if (versionFile.format === 'json') {
        this.updateJsonFile(filePath, versionFile.path, newVersion);
      } else if (versionFile.format === 'template') {
        if (versionFile.patterns) {
          this.updateTemplateFileMultiPattern(filePath, versionFile.patterns, newVersion);
        } else {
          this.updateTemplateFile(filePath, versionFile.pattern, versionFile.replacement, newVersion);
        }
      }
    } catch (error) {
      console.error(`  ✗ Failed to update ${versionFile.file}: ${error.message}`);
    }
  }

  updateJsonFile(filePath, pathArray, newVersion) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // For simple version field
    if (pathArray.length === 1 && pathArray[0] === 'version') {
      content.version = newVersion;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
  }

  updateTemplateFile(filePath, pattern, replacement, newVersion) {
    let content = fs.readFileSync(filePath, 'utf8');
    const replacementString = replacement.replace('$VERSION', newVersion);
    
    // Count matches first
    const matches = [...content.matchAll(pattern)];
    if (matches.length === 0) {
      console.log(`  ⚠ No version patterns found in ${path.basename(filePath)}`);
      return;
    }

    // Replace all occurrences
    content = content.replace(pattern, replacementString);
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ Updated ${matches.length} version reference(s) in ${path.basename(filePath)}`);
  }

  updateTemplateFileMultiPattern(filePath, patterns, newVersion) {
    let content = fs.readFileSync(filePath, 'utf8');
    let totalMatches = 0;

    for (const { pattern, replacement } of patterns) {
      const replacementString = replacement.replace('$VERSION', newVersion);
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        content = content.replace(pattern, replacementString);
        totalMatches += matches.length;
      }
    }

    if (totalMatches === 0) {
      console.log(`  ⚠ No version patterns found in ${path.basename(filePath)}`);
      return;
    }

    fs.writeFileSync(filePath, content);
    console.log(`  ✓ Updated ${totalMatches} version reference(s) in ${path.basename(filePath)}`);
  }

  bump(type = 'patch') {
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);
    
    let newVersion;
    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        throw new Error(`Invalid bump type: ${type}. Use 'major', 'minor', or 'patch'`);
    }

    this.setVersion(newVersion);
    return newVersion;
  }

  check() {
    console.log(`Current version: ${this.currentVersion}`);
    console.log('\nVersion consistency check:');
    
    let inconsistencies = 0;
    
    for (const versionFile of VERSION_FILES) {
      const filePath = path.join(ROOT, versionFile.file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠ ${versionFile.file} - file not found`);
        continue;
      }

      try {
        if (versionFile.format === 'template' && versionFile.patterns) {
          // For template files with multiple patterns, check if any version references exist
          // and if they can be updated (we'll fix them in the fix command)
          const versions = this.getAllVersionsFromFile(versionFile, filePath);
          if (versions.length === 0) {
            console.log(`  ⚠ ${versionFile.file} - no version references found`);
          } else {
            const allMatch = versions.every(v => v === this.currentVersion);
            if (allMatch) {
              console.log(`  ✓ ${versionFile.file} - ${versions.length} reference(s) at ${this.currentVersion}`);
            } else {
              const uniqueVersions = [...new Set(versions)];
              console.log(`  ✗ ${versionFile.file} - found versions: ${uniqueVersions.join(', ')} (expected: ${this.currentVersion})`);
              inconsistencies++;
            }
          }
        } else {
          const actualVersion = this.getVersionFromFile(versionFile, filePath);
          
          if (actualVersion === this.currentVersion) {
            console.log(`  ✓ ${versionFile.file} - ${actualVersion}`);
          } else {
            console.log(`  ✗ ${versionFile.file} - ${actualVersion} (expected: ${this.currentVersion})`);
            inconsistencies++;
          }
        }
      } catch (error) {
        console.log(`  ✗ ${versionFile.file} - error reading version: ${error.message}`);
        inconsistencies++;
      }
    }

    if (inconsistencies > 0) {
      console.log(`\n⚠ Found ${inconsistencies} inconsistencies. Run 'npm run version:fix' to synchronize all versions.`);
      return false;
    } else {
      console.log('\n✅ All versions are consistent!');
      return true;
    }
  }

  getAllVersionsFromFile(versionFile, filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const versions = [];
    
    if (versionFile.patterns) {
      for (const { pattern } of versionFile.patterns) {
        const matches = [...content.matchAll(pattern)];
        for (const match of matches) {
          if (match[1]) {
            versions.push(match[1]);
          }
        }
      }
    }
    
    return versions;
  }

  getVersionFromFile(versionFile, filePath) {
    if (versionFile.format === 'json') {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return content.version;
    } else if (versionFile.format === 'template') {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (versionFile.patterns) {
        // Try each pattern until we find a match
        for (const { pattern } of versionFile.patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            return match[1];
          }
        }
        throw new Error('No version patterns matched');
      } else {
        const match = content.match(versionFile.pattern);
        if (match && match[1]) {
          return match[1];
        }
        throw new Error('Version pattern not found');
      }
    }
  }

  fix() {
    console.log('Synchronizing all versions to package.json version...');
    this.setVersion(this.currentVersion);
  }

  isValidVersion(version) {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(version);
  }

  tagRelease(version = this.currentVersion) {
    try {
      // Check if git repo
      child_process.execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      
      // Create git tag
      child_process.execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'pipe' });
      console.log(`✅ Created git tag: v${version}`);
      
      // Optionally push tag
      try {
        child_process.execSync('git push origin --tags', { stdio: 'pipe' });
        console.log(`✅ Pushed tag to origin`);
      } catch (e) {
        console.log(`⚠ Could not push tag to origin: ${e.message}`);
      }
      
    } catch (error) {
      console.log(`⚠ Could not create git tag: ${error.message}`);
    }
  }

  updateChangelog(version, releaseDate = null, changes = null) {
    const changelogPath = path.join(ROOT, 'CHANGELOG.md');
    
    if (!fs.existsSync(changelogPath)) {
      console.log('⚠ CHANGELOG.md not found, skipping changelog update');
      return;
    }

    try {
      let content = fs.readFileSync(changelogPath, 'utf8');
      const date = releaseDate || new Date().toISOString().split('T')[0];
      
      // Detect line ending style
      const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
      
      // Prepare new version entry
      const newVersionEntry = changes ? 
        `## [${version}] — ${date}${lineEnding}${lineEnding}${changes}${lineEnding}${lineEnding}---${lineEnding}${lineEnding}` :
        `## [${version}] — ${date}${lineEnding}${lineEnding}### Changed${lineEnding}${lineEnding}- Version bump to ${version}${lineEnding}${lineEnding}---${lineEnding}${lineEnding}`;

      // Replace [Unreleased] section with new version (handle both LF and CRLF)
      const unreleasedPattern = /## \[Unreleased\]\r?\n\r?\n---\r?\n\r?\n/;
      
      if (unreleasedPattern.test(content)) {
        content = content.replace(
          unreleasedPattern,
          `## [Unreleased]${lineEnding}${lineEnding}---${lineEnding}${lineEnding}${newVersionEntry}`
        );
      } else {
        // If no Unreleased section, add after first heading
        const firstVersionPattern = /(---\s*\n\n)(## \[)/;
        if (firstVersionPattern.test(content)) {
          content = content.replace(firstVersionPattern, `$1${newVersionEntry}$2`);
        }
      }

      // Update the links section at the bottom
      const linksPattern = /(\[Unreleased\]: https:\/\/github\.com\/[^\/]+\/[^\/]+\/compare\/v[^.]+\.[^.]+\.[^.]+\.\.\.HEAD\n)/;
      const repoMatch = content.match(/\[Unreleased\]: https:\/\/github\.com\/([^\/]+\/[^\/]+)/);
      
      if (repoMatch && linksPattern.test(content)) {
        const repoPath = repoMatch[1];
        const newUnreleasedLink = `[Unreleased]: https://github.com/${repoPath}/compare/v${version}...HEAD\n`;
        const newVersionLink = `[${version}]: https://github.com/${repoPath}/compare/v${this.getPreviousVersion(content)}...v${version}\n`;
        
        content = content.replace(linksPattern, `${newUnreleasedLink}${newVersionLink}`);
      }

      fs.writeFileSync(changelogPath, content, 'utf8');
      console.log(`✅ Updated CHANGELOG.md for version ${version}`);
      
    } catch (error) {
      console.log(`⚠ Could not update CHANGELOG.md: ${error.message}`);
    }
  }

  getPreviousVersion(changelogContent) {
    // Extract the most recent version from changelog links
    const versionMatch = changelogContent.match(/\[([0-9]+\.[0-9]+\.[0-9]+)\]:/);
    return versionMatch ? versionMatch[1] : '0.0.0';
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const versionManager = new VersionManager();

  try {
    switch (command) {
      case 'check':
        const isConsistent = versionManager.check();
        if (!isConsistent) {
          process.exit(1);
        }
        break;
        
      case 'fix':
        versionManager.fix();
        break;
        
      case 'set':
        if (!args[1]) {
          console.error('Error: Version number required. Usage: npm run version:set 1.0.0');
          process.exit(1);
        }
        versionManager.setVersion(args[1]);
        break;
        
      case 'bump':
        const bumpType = args[1] || 'patch';
        const newVersion = versionManager.bump(bumpType);
        
        // Automatically update changelog
        versionManager.updateChangelog(newVersion);
        
        console.log(`\nNext steps:`);
        console.log(`  git commit -am "Release version ${newVersion}"`);
        console.log(`  npm run version:tag`);
        break;
        
      case 'tag':
        versionManager.tagRelease(args[1]);
        break;
        
      case 'current':
        console.log(versionManager.currentVersion);
        break;
        
      case 'changelog':
        const changelogVersion = args[1] || versionManager.currentVersion;
        versionManager.updateChangelog(changelogVersion);
        break;
        
      default:
        console.log(`oh-my-colab Version Manager

Usage:
  npm run version:check          Check version consistency across all files
  npm run version:fix            Sync all versions to package.json
  npm run version:set <ver>      Set version across all files
  npm run version:bump [type]    Bump version (patch|minor|major)
  npm run version:tag [ver]      Create git tag for release
  npm run version:current        Show current version
  npm run version:changelog      Update CHANGELOG.md for current version

Examples:
  npm run version:check
  npm run version:set 1.0.0
  npm run version:bump minor
  npm run version:tag
`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = VersionManager;