import { APP_VERSION, DEFAULT_GITHUB_REPO } from '@/lib/app-config';

export { APP_VERSION, DEFAULT_GITHUB_REPO };

const GITHUB_REPO_STORAGE_KEY = 'me_translator_github_repo';
const SKIPPED_VERSION_STORAGE_KEY = 'me_translator_skipped_update_version';

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
}

export interface AppUpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  tagName: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  htmlUrl: string;
  apkAsset: GitHubReleaseAsset | null;
  repo: string;
  noReleasesYet?: boolean;
  error?: string;
}

export function normalizeVersion(ver: string): string {
  return ver.trim().replace(/^v/i, '');
}

/**
 * Returns > 0 if `a > b`, < 0 if `a < b`, 0 if equal.
 */
export function compareVersions(a: string, b: string): number {
  const pa = normalizeVersion(a)
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map((n) => parseInt(n, 10) || 0);
  const pb = normalizeVersion(b)
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map((n) => parseInt(n, 10) || 0);

  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

export function getConfiguredGithubRepo(): string {
  if (typeof window === 'undefined') return DEFAULT_GITHUB_REPO;
  const saved = localStorage.getItem(GITHUB_REPO_STORAGE_KEY)?.trim();
  return saved && saved.includes('/') ? saved : DEFAULT_GITHUB_REPO;
}

export function setConfiguredGithubRepo(repo: string): string {
  const cleaned = repo
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '');
  if (typeof window !== 'undefined') {
    if (cleaned && cleaned.includes('/')) {
      localStorage.setItem(GITHUB_REPO_STORAGE_KEY, cleaned);
    } else {
      localStorage.removeItem(GITHUB_REPO_STORAGE_KEY);
    }
  }
  return cleaned && cleaned.includes('/') ? cleaned : DEFAULT_GITHUB_REPO;
}

export function getSkippedUpdateVersion(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SKIPPED_VERSION_STORAGE_KEY);
}

export function setSkippedUpdateVersion(version: string | null): void {
  if (typeof window === 'undefined') return;
  if (version) {
    localStorage.setItem(SKIPPED_VERSION_STORAGE_KEY, normalizeVersion(version));
  } else {
    localStorage.removeItem(SKIPPED_VERSION_STORAGE_KEY);
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isRunningInsideCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  if (win.Capacitor?.isNativePlatform?.()) return true;
  const proto = window.location?.protocol || '';
  return proto === 'capacitor:' || proto === 'file:';
}

export async function checkForGitHubUpdate(
  repoOverride?: string
): Promise<AppUpdateInfo> {
  const repo = repoOverride?.trim() || getConfiguredGithubRepo();
  const base: AppUpdateInfo = {
    hasUpdate: false,
    currentVersion: normalizeVersion(APP_VERSION),
    latestVersion: normalizeVersion(APP_VERSION),
    tagName: `v${normalizeVersion(APP_VERSION)}`,
    releaseName: '',
    releaseNotes: '',
    publishedAt: '',
    htmlUrl: `https://github.com/${repo}/releases`,
    apkAsset: null,
    repo,
  };

  if (!repo || !repo.includes('/')) {
    return { ...base, error: 'INVALID_REPO' };
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/releases/latest?t=${Date.now()}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
        },
        cache: 'no-store',
      }
    );

    if (res.status === 404) {
      return {
        ...base,
        noReleasesYet: true,
      };
    }

    if (res.status === 403 || res.status === 429) {
      return {
        ...base,
        error: 'RATE_LIMIT',
      };
    }

    if (!res.ok) {
      return {
        ...base,
        error: `HTTP_${res.status}`,
      };
    }

    const data = await res.json();
    const tagName = String(data?.tag_name || '');
    const latestVersion = normalizeVersion(tagName || data?.name || '');

    const assets: GitHubReleaseAsset[] = Array.isArray(data?.assets)
      ? data.assets
      : [];
    const apkAsset =
      assets.find((a) => String(a?.name || '').toLowerCase().endsWith('.apk')) ||
      null;

    const hasUpdate =
      !!latestVersion && compareVersions(latestVersion, APP_VERSION) > 0;

    return {
      hasUpdate,
      currentVersion: normalizeVersion(APP_VERSION),
      latestVersion: latestVersion || normalizeVersion(APP_VERSION),
      tagName: tagName || `v${latestVersion}`,
      releaseName: String(data?.name || tagName || ''),
      releaseNotes: String(data?.body || '').trim(),
      publishedAt: String(data?.published_at || ''),
      htmlUrl: String(data?.html_url || base.htmlUrl),
      apkAsset,
      repo,
    };
  } catch (err) {
    return {
      ...base,
      error: err instanceof Error ? err.message : 'NETWORK_ERROR',
    };
  }
}
