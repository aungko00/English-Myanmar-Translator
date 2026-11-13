import fs from 'node:fs';
import path from 'node:path';

const versionCode = parseInt(process.argv[2] || '111', 10) || 111;
const versionName = process.argv[3] || '1.1.0';
const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');

if (!fs.existsSync(androidDir)) {
  console.error('android/ directory does not exist. Run `npx cap add android` first.');
  process.exit(1);
}

// 1. Update versionCode, versionName, and optional persistent release keystore in android/app/build.gradle
const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
buildGradle = buildGradle
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);

const keystorePath = process.env.ANDROID_KEYSTORE_PATH;
const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
const keyAlias = process.env.ANDROID_KEY_ALIAS;
const keyPassword = process.env.ANDROID_KEY_PASSWORD;

if (keystorePath && fs.existsSync(keystorePath) && keystorePassword && keyAlias && keyPassword) {
  const escapedPath = keystorePath.replace(/\\/g, '/');
  const signingBlock = `
    signingConfigs {
        persistent {
            storeFile file("${escapedPath}")
            storePassword "${keystorePassword}"
            keyAlias "${keyAlias}"
            keyPassword "${keyPassword}"
        }
    }
`;
  if (!buildGradle.includes('signingConfigs {')) {
    buildGradle = buildGradle.replace('buildTypes {', `${signingBlock}\n    buildTypes {`);
  }
  if (!buildGradle.includes('signingConfig signingConfigs.persistent')) {
    buildGradle = buildGradle.replace(
      /buildTypes\s*\{/,
      `buildTypes {\n        debug {\n            signingConfig signingConfigs.persistent\n        }`
    );
    buildGradle = buildGradle.replace(
      /release\s*\{/,
      `release {\n            signingConfig signingConfigs.persistent`
    );
  }
  console.log('Configured persistent Android signing keystore from environment.');
}

fs.writeFileSync(buildGradlePath, buildGradle, 'utf8');

// 2. Ensure required AndroidManifest.xml permissions (Audio + Package Install Prompt)
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');
const requiredPermissions = [
  'android.permission.RECORD_AUDIO',
  'android.permission.MODIFY_AUDIO_SETTINGS',
  'android.permission.REQUEST_INSTALL_PACKAGES',
];

const missingPerms = requiredPermissions.filter((perm) => !manifest.includes(perm));
if (missingPerms.length > 0) {
  const permTags = missingPerms
    .map((perm) => `    <uses-permission android:name="${perm}" />`)
    .join('\n');
  manifest = manifest.replace(
    '<uses-permission android:name="android.permission.INTERNET" />',
    `<uses-permission android:name="android.permission.INTERNET" />\n${permTags}`
  );
  fs.writeFileSync(manifestPath, manifest, 'utf8');
}

// 3. Ensure FileProvider paths cover cacheDir & filesDir for direct APK installation
const filePathsXml = path.join(androidDir, 'app', 'src', 'main', 'res', 'xml', 'file_paths.xml');
fs.mkdirSync(path.dirname(filePathsXml), { recursive: true });
fs.writeFileSync(
  filePathsXml,
  `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path name="my_cache_images" path="." />
    <files-path name="internal_files" path="." />
    <external-path name="my_images" path="." />
</paths>
`,
  'utf8'
);

// 4. Write native AppInstallerPlugin.java for direct in-app APK download + Android package installer prompt
const javaPkgDir = path.join(androidDir, 'app', 'src', 'main', 'java', 'com', 'metranslator', 'app');
fs.mkdirSync(javaPkgDir, { recursive: true });

const pluginJava = `package com.metranslator.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "AppInstaller",
    permissions = {
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone")
    }
)
public class AppInstallerPlugin extends Plugin {
    private static final ExecutorService DOWNLOAD_EXECUTOR = Executors.newSingleThreadExecutor();

    private String mapPermissionState(PermissionState state) {
        if (state == PermissionState.GRANTED) {
            return "granted";
        }
        if (state == PermissionState.DENIED) {
            return "denied";
        }
        return "prompt";
    }

    @PluginMethod
    public void hasAudioPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("state", mapPermissionState(getPermissionState("microphone")));
        call.resolve(result);
    }

    @PluginMethod
    public void requestAudioPermission(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("state", "granted");
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("microphone", call, "audioPermissionCallback");
    }

    @PermissionCallback
    private void audioPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("state", mapPermissionState(getPermissionState("microphone")));
        call.resolve(result);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent intent = new Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.parse("package:" + getContext().getPackageName())
        );
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    private boolean hasInstallPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return getContext().getPackageManager().canRequestPackageInstalls();
        }
        return true;
    }

    private boolean isAllowedUrl(String urlStr) {
        try {
            URL parsed = new URL(urlStr);
            if (!"https".equalsIgnoreCase(parsed.getProtocol())) {
                return false;
            }
            String host = parsed.getHost().toLowerCase();
            return host.equals("github.com")
                || host.endsWith(".github.com")
                || host.equals("objects.githubusercontent.com")
                || host.equals("release-assets.githubusercontent.com")
                || host.endsWith(".githubusercontent.com");
        } catch (Exception e) {
            return false;
        }
    }

    private void launchApkInstaller(File apkFile) {
        Context context = getContext();
        Uri contentUri = FileProvider.getUriForFile(
            context,
            context.getPackageName() + ".fileprovider",
            apkFile
        );
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        context.startActivity(intent);
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasInstallPermission());
        call.resolve(result);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void installApkFile(PluginCall call) {
        String filePath = call.getString("path");
        if (filePath == null || filePath.trim().isEmpty()) {
            call.reject("Missing APK file path");
            return;
        }

        File apkFile = new File(filePath);
        if (!apkFile.exists()) {
            call.reject("Downloaded APK file not found");
            return;
        }

        JSObject result = new JSObject();
        if (!hasInstallPermission()) {
            result.put("status", "permission_needed");
            call.resolve(result);
            return;
        }

        try {
            launchApkInstaller(apkFile);
            result.put("status", "installing");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to open Android installer: " + e.getMessage());
        }
    }

    @PluginMethod
    public void downloadAndInstallApk(PluginCall call) {
        String downloadUrl = call.getString("url");
        String rawFilename = call.getString("filename", "ME-Translator-update.apk");

        if (downloadUrl == null || !isAllowedUrl(downloadUrl)) {
            call.reject("Invalid APK download URL");
            return;
        }

        String safeName = rawFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!safeName.toLowerCase().endsWith(".apk")) {
            safeName = safeName + ".apk";
        }
        final String finalName = safeName;

        DOWNLOAD_EXECUTOR.execute(() -> {
            HttpURLConnection conn = null;
            try {
                String currentUrl = downloadUrl;
                int redirects = 0;
                while (redirects < 6) {
                    URL url = new URL(currentUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setInstanceFollowRedirects(false);
                    conn.setConnectTimeout(20000);
                    conn.setReadTimeout(60000);
                    conn.setRequestProperty("User-Agent", "ME-Translator-Android-Updater");
                    conn.connect();

                    int code = conn.getResponseCode();
                    if (code >= 300 && code < 400) {
                        String location = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (location == null || !isAllowedUrl(location)) {
                            throw new SecurityException("Blocked redirect destination");
                        }
                        currentUrl = location;
                        redirects++;
                        continue;
                    }
                    break;
                }

                if (conn == null || conn.getResponseCode() < 200 || conn.getResponseCode() >= 300) {
                    int errCode = conn != null ? conn.getResponseCode() : -1;
                    call.reject("Download failed with HTTP " + errCode);
                    return;
                }

                long totalBytes = conn.getContentLengthLong();
                File updatesDir = new File(getContext().getCacheDir(), "updates");
                if (!updatesDir.exists()) {
                    updatesDir.mkdirs();
                }

                // Clean older cached APKs before saving new one
                File[] oldFiles = updatesDir.listFiles();
                if (oldFiles != null) {
                    for (File oldFile : oldFiles) {
                        oldFile.delete();
                    }
                }

                File tempFile = new File(updatesDir, finalName + ".tmp");
                File targetFile = new File(updatesDir, finalName);

                try (InputStream in = new BufferedInputStream(conn.getInputStream());
                     FileOutputStream out = new FileOutputStream(tempFile)) {
                    byte[] buffer = new byte[16384];
                    long loaded = 0;
                    long lastEmit = 0;
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                        loaded += read;
                        long now = SystemClock.uptimeMillis();
                        if (now - lastEmit >= 120) {
                            lastEmit = now;
                            JSObject progressObj = new JSObject();
                            progressObj.put("loaded", loaded);
                            progressObj.put("total", Math.max(totalBytes, 0));
                            int pct = totalBytes > 0 ? (int) Math.min(99, (loaded * 100L) / totalBytes) : 0;
                            progressObj.put("percent", pct);
                            notifyListeners("downloadProgress", progressObj);
                        }
                    }
                    out.flush();
                }

                if (targetFile.exists()) {
                    targetFile.delete();
                }
                if (!tempFile.renameTo(targetFile)) {
                    throw new IllegalStateException("Could not finalize downloaded APK file");
                }

                JSObject finalProgress = new JSObject();
                finalProgress.put("loaded", targetFile.length());
                finalProgress.put("total", targetFile.length());
                finalProgress.put("percent", 100);
                notifyListeners("downloadProgress", finalProgress);

                JSObject result = new JSObject();
                result.put("path", targetFile.getAbsolutePath());

                if (!hasInstallPermission()) {
                    result.put("status", "permission_needed");
                    call.resolve(result);
                    return;
                }

                launchApkInstaller(targetFile);
                result.put("status", "installing");
                call.resolve(result);
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Download failed");
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        });
    }
}
`;

fs.writeFileSync(path.join(javaPkgDir, 'AppInstallerPlugin.java'), pluginJava, 'utf8');

// 5. Register AppInstallerPlugin in MainActivity.java
const mainActivityPath = path.join(javaPkgDir, 'MainActivity.java');
const mainActivityJava = `package com.metranslator.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;
fs.writeFileSync(mainActivityPath, mainActivityJava, 'utf8');

// 6. Copy app icons across mipmap densities
const mipmaps192 = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi'];
const mipmaps512 = ['mipmap-xxhdpi', 'mipmap-xxxhdpi'];

for (const folder of mipmaps192) {
  const dest = path.join(androidDir, 'app', 'src', 'main', 'res', folder);
  fs.mkdirSync(dest, { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'public', 'pwa-192x192.png'), path.join(dest, 'ic_launcher.png'));
  fs.copyFileSync(path.join(rootDir, 'public', 'pwa-192x192.png'), path.join(dest, 'ic_launcher_round.png'));
  fs.copyFileSync(path.join(rootDir, 'public', 'pwa-maskable-512x512.png'), path.join(dest, 'ic_launcher_foreground.png'));
}

for (const folder of mipmaps512) {
  const dest = path.join(androidDir, 'app', 'src', 'main', 'res', folder);
  fs.mkdirSync(dest, { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'public', 'pwa-512x512.png'), path.join(dest, 'ic_launcher.png'));
  fs.copyFileSync(path.join(rootDir, 'public', 'pwa-512x512.png'), path.join(dest, 'ic_launcher_round.png'));
  fs.copyFileSync(path.join(rootDir, 'public', 'pwa-maskable-512x512.png'), path.join(dest, 'ic_launcher_foreground.png'));
}

console.log(`Configured Android native project (v${versionName}, code ${versionCode}) with AppInstallerPlugin.`);
