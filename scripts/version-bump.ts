#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

type VersionType = "major" | "minor" | "patch";

function bumpVersion(currentVersion: string, type: VersionType): string {
  const [major, minor, patch] = currentVersion.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

function main() {
  const args = process.argv.slice(2);
  const type = (args[0] as VersionType) || "patch";

  const pkgPath = resolve(process.cwd(), "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

  const newVersion = bumpVersion(pkg.version, type);
  pkg.version = newVersion;

  const oldVersion = pkg.version;
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  console.log(`Version bumped: ${oldVersion} -> ${newVersion} (${type})`);
}

main();