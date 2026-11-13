'use client';

import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';

/**
 * Reads plain text from the system clipboard.
 * Uses Capacitor's native Clipboard plugin inside the Android/iOS app,
 * and falls back cleanly through browser Clipboard APIs on web.
 */
export async function readClipboardText(
  fallbackInput?: HTMLInputElement | HTMLTextAreaElement | null
): Promise<string> {
  // 1. Prefer native Capacitor bridge inside Android / iOS apps
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Clipboard.read();
      if (typeof result?.value === 'string') {
        return result.value;
      }
    } catch {
      // Fall through to web clipboard fallbacks
    }
  }

  // 2. Standard Web Async Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText();
      if (typeof text === 'string') {
        return text;
      }
    } catch {
      // Blocked by iframe policy or permission prompt — try fallback
    }
  }

  // 3. Capacitor Clipboard Web plugin fallback
  try {
    const result = await Clipboard.read();
    if (typeof result?.value === 'string') {
      return result.value;
    }
  } catch {
    // Ignore and try execCommand
  }

  // 4. Legacy execCommand('paste') fallback inside editable element
  if (typeof document !== 'undefined') {
    try {
      const target = fallbackInput || document.createElement('textarea');
      let isTemp = false;
      if (!fallbackInput) {
        isTemp = true;
        target.style.position = 'fixed';
        target.style.opacity = '0';
        target.style.pointerEvents = 'none';
        document.body.appendChild(target);
      }
      const prevVal = target.value;
      target.focus();
      const ok = document.execCommand('paste');
      const pasted = target.value;
      if (isTemp) {
        document.body.removeChild(target);
      }
      if (ok && pasted !== prevVal) {
        if (!isTemp && prevVal) {
          return pasted.slice(prevVal.length);
        }
        return pasted;
      }
    } catch {
      // Ignored
    }
  }

  throw new Error('CLIPBOARD_READ_BLOCKED');
}
