import { Readable } from 'stream';
import serverEntry from '../dist/server/server.js';

const app = serverEntry.default ?? serverEntry;

function getRequestBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  if (typeof Readable.toWeb === 'function') {
    return Readable.toWeb(req);
  }
  return req;
}

export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url, `${protocol}://${host}`);

  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: getRequestBody(req),
  });

  const response = await app.fetch(request, {}, {});

  res.statusCode = response.status;
  response.headers.forEach((value, name) => {
    res.setHeader(name, value);
  });

  const body = await response.arrayBuffer();
  res.end(Buffer.from(body));
}
