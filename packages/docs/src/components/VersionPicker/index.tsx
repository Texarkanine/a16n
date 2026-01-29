/**
 * VersionPicker Component
 *
 * A dropdown component for selecting API documentation versions.
 * Reads from /versions.json manifest generated at build time.
 * Sorts versions descending (latest first).
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';

/**
 * Version manifest structure.
 * Maps package names (without @a16njs/ prefix) to array of version strings.
 */
interface VersionManifest {
  [pkg: string]: string[];
}

interface VersionPickerProps {
  /** Package name (e.g., 'models', 'engine', 'cli') */
  pkg: string;
}

/**
 * Internal component that handles the version picker logic.
 * Wrapped in BrowserOnly to prevent SSR issues.
 */
function VersionPickerInner({ pkg }: VersionPickerProps): JSX.Element | null {
  const [versions, setVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetch('/versions.json')
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Failed to fetch versions.json: ${r.status}`);
        }
        return r.json();
      })
      .then((manifest: VersionManifest) => {
        // Sort versions descending (latest first)
        const pkgVersions = manifest[pkg] || [];
        const sorted = pkgVersions.sort((a, b) =>
          b.localeCompare(a, undefined, { numeric: true })
        );
        setVersions(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('VersionPicker: Could not load versions.json', err);
        setLoading(false);
      });
  }, [pkg]);

  // Extract current version from URL path
  // Pattern: /{pkg}/api/{version}/...
  const versionMatch = location.pathname.match(/\/api\/(\d+\.\d+\.\d+)(\/|$)/);
  const currentVersion = versionMatch?.[1] || (versions.length > 0 ? versions[0] : '');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVersion = e.target.value;
    
    // Determine base path (e.g., /models/api)
    const baseMatch = location.pathname.match(/^(.*\/api)/);
    const basePath = baseMatch?.[1] || location.pathname;
    
    // Navigate to versioned overview page
    let newPath: string;
    if (versionMatch) {
      // Already on a versioned page, replace version
      newPath = location.pathname.replace(
        /\/api\/\d+\.\d+\.\d+(\/.*)?$/,
        `/api/${newVersion}/`
      );
    } else {
      // On wrapper page, add version
      newPath = `${basePath}/${newVersion}/`;
    }
    
    // Use window.location for navigation to avoid SSR issues
    window.location.href = newPath;
  };

  // Don't render if no versions available or still loading
  if (loading || versions.length === 0) {
    return null;
  }

  return (
    <div className={styles.versionPicker}>
      <label htmlFor={`version-picker-${pkg}`} className={styles.label}>
        Version:
      </label>
      <select
        id={`version-picker-${pkg}`}
        value={currentVersion}
        onChange={handleChange}
        className={styles.select}
        aria-label={`Select ${pkg} API version`}
      >
        {versions.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Dropdown component for selecting API documentation versions.
 * Wrapped in BrowserOnly to prevent SSR hydration issues.
 *
 * @example
 * ```tsx
 * <VersionPicker pkg="models" />
 * ```
 */
export default function VersionPicker({ pkg }: VersionPickerProps): JSX.Element {
  return (
    <BrowserOnly fallback={<div>Loading...</div>}>
      {() => <VersionPickerInner pkg={pkg} />}
    </BrowserOnly>
  );
}
