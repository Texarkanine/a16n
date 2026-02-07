#!/usr/bin/env bash
# Generate CHANGELOG pages for each package in .generated/
# Called as part of the 'stage' npm script.
#
# For each package that has a CHANGELOG.md, creates:
#   .generated/<docs-dir>/changelog.md
# with Docusaurus frontmatter prepended.

set -euo pipefail

DOCS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGES_DIR="$(cd "$DOCS_DIR/.." && pwd)"

# Map: package-dir -> docs-dir (same in our case)
declare -A PACKAGE_MAP=(
  [cli]=cli
  [engine]=engine
  [models]=models
  [plugin-cursor]=plugin-cursor
  [plugin-claude]=plugin-claude
  [plugin-a16n]=plugin-a16n
  [glob-hook]=glob-hook
)

for pkg_dir in "${!PACKAGE_MAP[@]}"; do
  docs_dir="${PACKAGE_MAP[$pkg_dir]}"
  changelog_src="$PACKAGES_DIR/$pkg_dir/CHANGELOG.md"
  changelog_dest="$DOCS_DIR/.generated/$docs_dir/changelog.md"

  if [ -f "$changelog_src" ]; then
    # Ensure target directory exists
    mkdir -p "$(dirname "$changelog_dest")"

    # Write frontmatter + CHANGELOG content
    {
      echo "---"
      echo "title: Changelog"
      echo "sidebar_position: 99"
      echo "pagination_next: null"
      echo "pagination_prev: null"
      echo "---"
      echo ""
      cat "$changelog_src"
    } > "$changelog_dest"
  fi
done

echo "Staged $(ls "$DOCS_DIR"/.generated/*/changelog.md 2>/dev/null | wc -l) changelog pages"
