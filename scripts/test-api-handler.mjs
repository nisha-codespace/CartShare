import http from 'http';
import { Duplex } from 'stream';
import handler from '../api/index.js';

const req = new http.IncomingMessage();
req.method = 'GET';
req.url = '/';
req.headers = { host: 'localhost:3000', 'x-forwarded-proto': 'http' };
req.socket = new (class extends Duplex {
  _read() {}
  _write(chunk, encoding, callback) { callback(); }
})();

const res = new http.ServerResponse(req);
res.assignSocket(req.socket);
res.on('finish', () => {
  console.log('status', res.statusCode);
  console.log('headers', res.getHeaders());
});

handler(req, res).catch(err => {
  console.error('HANDLER ERROR', err);
  process.exit(1);
});
