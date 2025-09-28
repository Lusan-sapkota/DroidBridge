/**
 * Configuration for binary downloads and sources
 */

export interface BinarySource {
  name: 'adb' | 'scrcpy';
  downloadUrls: {
    github?: string;
    direct?: string;
    fallback?: string;
  };
  version?: string;
  checksums?: {
    [platform: string]: string;
  };
}

/**
 * Binary download configuration
 * Update these URLs to point to your hosted binaries
 */
export const BINARY_CONFIG: BinarySource[] = [
  {
    name: 'adb',
    downloadUrls: {
      // GitHub releases - replace with your repository
      github: 'https://github.com/your-username/droidbridge-binaries/releases/latest/download',
      // Direct download URLs - replace with your hosting
      direct: 'https://your-cdn.com/binaries',
      // Fallback to official sources (may require extraction)
      fallback: 'https://dl.google.com/android/repository/platform-tools-latest'
    },
    version: 'latest'
  },
  {
    name: 'scrcpy',
    downloadUrls: {
      // GitHub releases - replace with your repository  
      github: 'https://github.com/your-username/droidbridge-binaries/releases/latest/download',
      // Direct download URLs - replace with your hosting
      direct: 'https://your-cdn.com/binaries',
      // Fallback to official releases
      fallback: 'https://github.com/Genymobile/scrcpy/releases/latest/download'
    },
    version: 'latest'
  }
];

/**
 * Get binary configuration by name
 */
export function getBinaryConfig(name: 'adb' | 'scrcpy'): BinarySource | undefined {
  return BINARY_CONFIG.find(config => config.name === name);
}

/**
 * Get download URL for a binary based on preference
 */
export function getDownloadUrl(name: 'adb' | 'scrcpy', preference: 'github' | 'direct' | 'fallback' = 'github'): string | undefined {
  const config = getBinaryConfig(name);
  if (!config) {
    return undefined;
  }

  return config.downloadUrls[preference] || config.downloadUrls.github || config.downloadUrls.direct;
}

/**
 * Platform-specific binary file patterns
 */
export const BINARY_PATTERNS = {
  adb: {
    win32: 'adb-windows-{arch}.exe',
    darwin: 'adb-macos-{arch}',
    linux: 'adb-linux-{arch}'
  },
  scrcpy: {
    win32: 'scrcpy-windows-{arch}.exe', 
    darwin: 'scrcpy-macos-{arch}',
    linux: 'scrcpy-linux-{arch}'
  }
};

/**
 * Get binary filename pattern for platform
 */
export function getBinaryPattern(name: 'adb' | 'scrcpy', platform: string, arch: string): string {
  const pattern = BINARY_PATTERNS[name]?.[platform as keyof typeof BINARY_PATTERNS.adb];
  if (!pattern) {
    const extension = platform === 'win32' ? '.exe' : '';
    return `${name}-${platform}-${arch}${extension}`;
  }
  
  return pattern.replace('{arch}', arch);
}