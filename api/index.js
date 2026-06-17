import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';

let app;

function toWebStream(req) {
  if (typeof Readable.toWeb === 'function') {
    return Readable.toWeb(req);
  }

  return new ReadableStream({
    start(controller) {
      req.on('data', (chunk) => {
        controller.enqueue(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
      });
      req.on('end', () => controller.close());
      req.on('error', (err) => controller.error(err));
      req.resume();
    },
    cancel() {
      req.destroy();
    },
  });
}

function getRequestBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  return toWebStream(req);
}

function normalizeHeaders(headers) {
  const normalized = new Headers();
  for (const [key, value] of Object.entries(headers || {})) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.filter((v) => v != null).forEach((v) => normalized.append(key, String(v)));
    } else {
      normalized.append(key, String(value));
    }
  }
  return normalized;
}

async function getApp() {
  if (app) return app;
  const serverEntry = await import('../dist/server/server.js');
  app = serverEntry.default ?? serverEntry;
  if (!app?.fetch) {
    throw new Error('Server entry does not export a fetch handler');
  }
  return app;
}

function sendError(res, error) {
  console.error('Serverless handler error:', error);
  res.statusCode = 500;
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.end('Internal Server Error');
}

export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '/', `${protocol}://${host}`);

    const request = new Request(url.toString(), {
      method: req.method,
      headers: normalizeHeaders(req.headers),
      body: getRequestBody(req),
    });

    const appInstance = await getApp();
    const response = await appInstance.fetch(request, {}, {});

    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    const body = await response.arrayBuffer();
    res.end(Buffer.from(body));
  } catch (error) {
    sendError(res, error);
  }
}
