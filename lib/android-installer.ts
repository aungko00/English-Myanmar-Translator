'use client';

import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface DownloadProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

export interface AppInstallerPlugin {
  canRequestPackageInstalls(): Promise<{ granted: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstallApk(options: {
    url: string;
    filename: string;
  }): Promise<{ status: 'installing' | 'permission_needed'; path: string }>;
  installApkFile(options: {
    path: string;
  }): Promise<{ status: 'installing' | 'permission_needed' }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (event: DownloadProgressEvent) => void
  ): Promise<PluginListenerHandle>;
}

export const AppInstaller = registerPlugin<AppInstallerPlugin>('AppInstaller');
