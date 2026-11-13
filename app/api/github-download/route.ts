import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'codeload.github.com',
]);

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  const rawName = req.nextUrl.searchParams.get('name') || 'ME-Translator-update.apk';

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json(
      { error: 'Only official GitHub release download URLs are permitted.' },
      { status: 403 }
    );
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      redirect: 'follow',
      headers: {
        'User-Agent': 'ME-Translator-Updater',
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `GitHub asset fetch failed (${upstream.status})` },
        { status: upstream.status || 502 }
      );
    }

    const safeFileName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const headers = new Headers();
    headers.set(
      'Content-Type',
      upstream.headers.get('content-type') || 'application/vnd.android.package-archive'
    );
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    headers.set('Content-Disposition', `attachment; filename="${safeFileName}"`);
    headers.set('Cache-Control', 'no-store');

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to stream update package from GitHub',
      },
      { status: 502 }
    );
  }
}
