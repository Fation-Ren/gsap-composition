#!/usr/bin/env node
// GSAP Composition — 安装脚本
// 复制 skill 文件到 ~/.claude/skills/gsap-composition/
// 用法: npx @fation-ren/gsap-composition

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'gsap-composition';
const TARGET_DIR = path.join(os.homedir(), '.claude', 'skills', SKILL_NAME);
const SOURCE_DIR = __dirname;

const DIRS_TO_COPY = ['scripts', 'references'];
const FILES_TO_COPY = ['SKILL.md'];

function cpDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      cpDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  console.log(`\n  Installing ${SKILL_NAME} skill...\n`);

  // Read version from package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'package.json'), 'utf-8'));
  const version = pkg.version;

  // Check if already installed
  const versionFile = path.join(TARGET_DIR, '.version');
  if (fs.existsSync(versionFile)) {
    const oldVersion = fs.readFileSync(versionFile, 'utf-8').trim();
    if (oldVersion === version) {
      console.log(`  Already up to date (v${version}), skipping.\n`);
      return;
    }
    console.log(`  Upgrading v${oldVersion} → v${version}\n`);
  }

  // Create target directory
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  // Copy files
  for (const file of FILES_TO_COPY) {
    const src = path.join(SOURCE_DIR, file);
    const dest = path.join(TARGET_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ ${file}`);
    }
  }

  // Copy directories
  for (const dir of DIRS_TO_COPY) {
    const src = path.join(SOURCE_DIR, dir);
    const dest = path.join(TARGET_DIR, dir);
    if (fs.existsSync(src)) {
      cpDir(src, dest);
      console.log(`  ✓ ${dir}/`);
    }
  }

  // Write version marker
  fs.writeFileSync(versionFile, version);

  const count = fs.readdirSync(TARGET_DIR).length - 1; // exclude .version
  console.log(`\n  Done — ${count} items installed to ${TARGET_DIR} (v${version})\n`);
  console.log('  Next: restart Claude Code or /clear to load the skill.\n');
}

main();
