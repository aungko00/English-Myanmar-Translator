'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileDown,
  SkipForward,
  ExternalLink,
} from 'lucide-react';
import {
  AppUpdateInfo,
  formatBytes,
  isRunningInsideCapacitor,
  setSkippedUpdateVersion,
} from '@/lib/app-update';

interface AppUpdateDialogProps {
  isOpen: boolean;
  updateInfo: AppUpdateInfo | null;
  lang: 'en' | 'my';
  themeProps: {
    isCyber: boolean;
    isBrutal: boolean;
    isGlass: boolean;
    isDark: boolean;
  };
  onClose: () => void;
}

const COPY = {
  en: {
    title: 'App Update Available',
    subtitle: 'A newer version of ME Translator is ready on GitHub.',
    currentLabel: 'Current',
    latestLabel: 'New Version',
    notesTitle: "What's New",
    noNotes: 'Performance improvements, bug fixes, and latest translation updates.',
    packageLabel: 'Android APK',
    downloadNow: 'Download Update Now',
    downloading: 'Downloading Update...',
    downloadedTitle: 'Update Downloaded',
    downloadedDesc:
      'The APK installer has been saved to your device. Open your Downloads or notification bar to install the update.',
    browserFallbackDesc:
      'Download started directly inside the app. Check your device Downloads or notification bar to install.',
    downloadFailed: 'Could not stream package automatically. Tap below to retry direct download.',
    retryDirect: 'Retry Direct Download',
    later: 'Later',
    skipVersion: 'Skip This Version',
    noApkAsset: 'No APK file is attached to this release yet.',
    viewRelease: 'Open GitHub Release',
    close: 'Close',
  },
  my: {
    title: 'App ဗားရှင်းအသစ် ရရှိနိုင်ပါပြီ',
    subtitle: 'GitHub တွင် ME Translator ဗားရှင်းအသစ် ထွက်ရှိနေပါပြီ။',
    currentLabel: 'လက်ရှိဗားရှင်း',
    latestLabel: 'ဗားရှင်းအသစ်',
    notesTitle: 'အသစ်ပါဝင်ချက်များ',
    noNotes: 'စွမ်းဆောင်ရည် မြှင့်တင်မှုများနှင့် ဘာသာပြန်စနစ် ပြင်ဆင်ချက်အသစ်များ ပါဝင်ပါသည်။',
    packageLabel: 'Android APK ဖိုင်',
    downloadNow: 'App ထဲမှ တိုက်ရိုက် Download ဆွဲမည်',
    downloading: 'Update ကို Download ဆွဲနေပါသည်...',
    downloadedTitle: 'Download ပြီးဆုံးပါပြီ',
    downloadedDesc:
      'APK ဖိုင်ကို စက်ထဲသို့ သိမ်းဆည်းပြီးပါပြီ။ Notification bar သို့မဟုတ် Downloads ဖိုင်တွဲမှ ဖွင့်၍ Install လုပ်နိုင်ပါသည်။',
    browserFallbackDesc:
      'App ထဲမှ တိုက်ရိုက် Download စတင်လိုက်ပါပြီ။ ဖုန်း၏ Notification bar သို့မဟုတ် Downloads ထဲတွင် ကြည့်ရှု Install လုပ်ပါ။',
    downloadFailed: 'တိုက်ရိုက် Download ဆွဲရာတွင် အခက်အခဲရှိနေပါသည်။ ထပ်မံကြိုးစားကြည့်ပါ။',
    retryDirect: 'တိုက်ရိုက် ထပ်မံ Download လုပ်မည်',
    later: 'နောက်မှ',
    skipVersion: 'ဤဗားရှင်းကို ကျော်မည်',
    noApkAsset: 'ဤ Release တွင် APK ဖိုင် ပူးတွဲထားခြင်း မရှိသေးပါ။',
    viewRelease: 'GitHub Release ဖွင့်ကြည့်မည်',
    close: 'ပိတ်မည်',
  },
};

export default function AppUpdateDialog({
  isOpen,
  updateInfo,
  lang,
  themeProps,
  onClose,
}: AppUpdateDialogProps) {
  const { isCyber, isBrutal, isGlass, isDark } = themeProps;
  const copy = COPY[lang];

  const [downloadState, setDownloadState] = useState<
    'idle' | 'downloading' | 'done' | 'fallback' | 'error'
  >('idle');
  const [progress, setProgress] = useState<number>(0);
  const [loadedBytes, setLoadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setDownloadState('idle');
      setProgress(0);
      setLoadedBytes(0);
      setTotalBytes(updateInfo?.apkAsset?.size || 0);
    }
  }, [isOpen, updateInfo?.tagName, updateInfo?.apkAsset?.size]);

  if (!isOpen || !updateInfo) return null;

  const triggerBrowserDirectDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDirectDownload = async () => {
    const asset = updateInfo.apkAsset;
    if (!asset) return;

    setDownloadState('downloading');
    setProgress(0);
    setLoadedBytes(0);
    setTotalBytes(asset.size || 0);

    const isCapacitor = isRunningInsideCapacitor();
    const fetchUrl = isCapacitor
      ? asset.browser_download_url
      : `/api/github-download?url=${encodeURIComponent(asset.browser_download_url)}&name=${encodeURIComponent(asset.name)}`;

    try {
      const res = await fetch(fetchUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const contentLengthHeader = res.headers.get('content-length');
      const expectedTotal =
        (contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0) ||
        asset.size ||
        0;
      setTotalBytes(expectedTotal);

      if (!res.body) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        triggerBrowserDirectDownload(blobUrl, asset.name);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        setProgress(100);
        setDownloadState('done');
        return;
      }

      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.byteLength;
          setLoadedBytes(received);
          if (expectedTotal > 0) {
            setProgress(Math.min(99, Math.round((received / expectedTotal) * 100)));
          }
        }
      }

      const blob = new Blob(chunks, {
        type: 'application/vnd.android.package-archive',
      });
      const blobUrl = URL.createObjectURL(blob);
      triggerBrowserDirectDownload(blobUrl, asset.name);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      setProgress(100);
      setDownloadState('done');
    } catch {
      // Fallback: let Android WebView DownloadManager or browser handle the direct APK URL inside the app
      try {
        triggerBrowserDirectDownload(asset.browser_download_url, asset.name);
        setDownloadState('fallback');
      } catch {
        setDownloadState('error');
      }
    }
  };

  const handleSkip = () => {
    if (updateInfo.latestVersion) {
      setSkippedUpdateVersion(updateInfo.latestVersion);
    }
    onClose();
  };

  const modalShellClass = isCyber
    ? 'bg-black border-2 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_40px_rgba(0,242,255,0.35)]'
    : isBrutal
      ? 'bg-white border-4 border-black text-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] rounded-none'
      : isGlass
        ? 'bg-[#1a1c1e]/90 backdrop-blur-2xl border border-white/20 text-white shadow-2xl'
        : isDark
          ? 'bg-[#202124] border border-white/15 text-white shadow-2xl'
          : 'bg-white border border-gray-200 text-gray-900 shadow-2xl';

  const surfaceSubClass = isCyber
    ? 'bg-[#00f2ff]/5 border-[#00f2ff]/25 text-[#00f2ff]/90'
    : isBrutal
      ? 'bg-stone-100 border-2 border-black text-black rounded-none'
      : isDark
        ? 'bg-white/5 border-white/10 text-gray-200'
        : 'bg-gray-50 border-gray-200 text-gray-700';

  const primaryBtnClass = isCyber
    ? 'bg-[#00f2ff] text-black hover:bg-[#00d8e6] shadow-[0_0_20px_rgba(0,242,255,0.4)]'
    : isBrutal
      ? 'bg-[#ff3e00] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#e63700] rounded-none'
      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={downloadState === 'downloading' ? undefined : onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className={`relative w-full max-w-md rounded-2xl p-5 sm:p-6 overflow-hidden z-10 ${modalShellClass}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isCyber
                    ? 'bg-[#00f2ff]/15 text-[#00f2ff] border border-[#00f2ff]/40'
                    : isBrutal
                      ? 'bg-emerald-400 text-black border-2 border-black rounded-none'
                      : isDark
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold leading-snug">
                  {copy.title}
                </h3>
                <p className="text-xs opacity-75 mt-0.5">{copy.subtitle}</p>
              </div>
            </div>
            {downloadState !== 'downloading' && (
              <button
                type="button"
                onClick={onClose}
                aria-label={copy.close}
                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Version Summary */}
          <div
            className={`mt-4 p-3 rounded-xl border flex items-center justify-between gap-2 text-xs tabular-nums ${surfaceSubClass}`}
          >
            <div>
              <div className="opacity-65 text-[11px]">{copy.currentLabel}</div>
              <div className="font-mono font-bold text-sm mt-0.5">
                v{updateInfo.currentVersion}
              </div>
            </div>
            <div className="text-emerald-500 font-bold text-base">→</div>
            <div className="text-right">
              <div className="opacity-65 text-[11px]">{copy.latestLabel}</div>
              <div className="font-mono font-bold text-sm text-emerald-500 mt-0.5">
                v{updateInfo.latestVersion}
              </div>
            </div>
          </div>

          {/* Release Notes */}
          <div className="mt-4 space-y-1.5">
            <div className="text-xs font-bold opacity-80">{copy.notesTitle}</div>
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap ${surfaceSubClass}`}
            >
              {updateInfo.releaseNotes || copy.noNotes}
            </div>
          </div>

          {/* APK Metadata */}
          {updateInfo.apkAsset ? (
            <div className="mt-3 flex items-center justify-between text-[11px] opacity-75 px-1 tabular-nums">
              <span className="truncate font-mono">
                {copy.packageLabel}: {updateInfo.apkAsset.name}
              </span>
              {updateInfo.apkAsset.size > 0 && (
                <span className="shrink-0 font-semibold ml-2">
                  {formatBytes(updateInfo.apkAsset.size)}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-3 text-xs text-amber-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{copy.noApkAsset}</span>
            </div>
          )}

          {/* Download Progress / Status */}
          {downloadState === 'downloading' && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
                <span className="flex items-center gap-1.5">
                  <FileDown className="w-4 h-4 animate-bounce text-emerald-500" />
                  <span>{copy.downloading}</span>
                </span>
                <span>
                  {totalBytes > 0
                    ? `${progress}% · ${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)}`
                    : formatBytes(loadedBytes) || `${progress}%`}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-black/20 dark:bg-white/10">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${Math.max(progress, 8)}%` }}
                />
              </div>
            </div>
          )}

          {(downloadState === 'done' || downloadState === 'fallback') && (
            <div
              className={`mt-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
                isDark
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">{copy.downloadedTitle}</div>
                <p className="mt-0.5 opacity-90">
                  {downloadState === 'done'
                    ? copy.downloadedDesc
                    : copy.browserFallbackDesc}
                </p>
              </div>
            </div>
          )}

          {downloadState === 'error' && (
            <div
              className={`mt-4 p-3 rounded-xl border flex items-start gap-2 text-xs leading-relaxed ${
                isDark
                  ? 'bg-red-500/15 border-red-500/30 text-red-200'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{copy.downloadFailed}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-5 space-y-2.5">
            {updateInfo.apkAsset ? (
              <button
                type="button"
                disabled={downloadState === 'downloading'}
                onClick={handleDirectDownload}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${primaryBtnClass}`}
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadState === 'downloading'
                    ? copy.downloading
                    : downloadState === 'error'
                      ? copy.retryDirect
                      : copy.downloadNow}
                </span>
              </button>
            ) : (
              <a
                href={updateInfo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${primaryBtnClass}`}
              >
                <ExternalLink className="w-4 h-4" />
                <span>{copy.viewRelease}</span>
              </a>
            )}

            {downloadState !== 'downloading' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    isDark
                      ? 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>{copy.skipVersion}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'border-white/10 text-gray-300 hover:bg-white/10'
                      : 'border-gray-200 text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {downloadState === 'done' || downloadState === 'fallback'
                    ? copy.close
                    : copy.later}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
