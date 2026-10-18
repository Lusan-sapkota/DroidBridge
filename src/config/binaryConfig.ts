
export interface BinarySource {
  name: "adb" | "scrcpy";
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

export const BINARY_CONFIG: BinarySource[] = [
  {
    name: "adb",
    downloadUrls: {
      github:
        "https://github.com/Lusan-sapkota/droidbridge-binaries/releases/latest/download",
      fallback:
        "https://dl.google.com/android/repository/platform-tools-latest",
    },
    version: "latest",
  },
  {
    name: "scrcpy",
    downloadUrls: {
      github:
        "https://github.com/Lusan-sapkota/droidbridge-binaries/releases/latest/download",
      fallback: "https://github.com/Genymobile/scrcpy/releases/latest/download",
    },
    version: "latest",
  },
];

export function getBinaryConfig(
  name: "adb" | "scrcpy"
): BinarySource | undefined {
  return BINARY_CONFIG.find((config) => config.name === name);
}

export function getDownloadUrl(
  name: "adb" | "scrcpy",
  preference: "github" | "direct" | "fallback" = "github"
): string | undefined {
  const config = getBinaryConfig(name);
  if (!config) {
    return undefined;
  }

  return (
    config.downloadUrls[preference] ||
    config.downloadUrls.github ||
    config.downloadUrls.direct
  );
}

export const BINARY_PATTERNS = {
  adb: {
    win32: "adb-windows-{arch}.exe",
    darwin: "adb-macos-{arch}",
    linux: "adb-linux-{arch}",
  },
  scrcpy: {
    win32: "scrcpy-windows-{arch}.exe",
    darwin: "scrcpy-macos-{arch}",
    linux: "scrcpy-linux-{arch}",
  },
};

export function getBinaryPattern(
  name: "adb" | "scrcpy",
  platform: string,
  arch: string
): string {
  const pattern =
    BINARY_PATTERNS[name]?.[platform as keyof typeof BINARY_PATTERNS.adb];
  if (!pattern) {
    const extension = platform === "win32" ? ".exe" : "";
    return `${name}-${platform}-${arch}${extension}`;
  }

  return pattern.replace("{arch}", arch);
}
