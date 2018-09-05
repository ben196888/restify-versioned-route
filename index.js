const restify = require('restify');
const semver = require('semver');

const server = restify.createServer({
  name: 'test-api',
});

server.pre(function (req, res, next) {
  const piece = req.url.replace(/^\/+/, '').split('/');
  let version = piece[0];

  if (semver.valid(semver.coerce(version))) {
    req.url = req.url.replace(version + '/', '');
    req.headers['accept-version'] = semver.valid(semver.coerce(version));
  }
  next();
});

// Only allow v1 and v2
server.use(restify.plugins.conditionalHandler([
  { version: '1.0.0', handler (req, res, next) { next(); } },
  { version: '2.0.0', handler (req, res, next) { next(); } },
]));

function respondV1(req, res, next) {
  res.send({message: 'v1 hello ' + req.params.name});
  next();
}

function respondV2(req, res, next) {
  res.send({message: 'v2 hello ' + req.params.name});
  next();
}

// /hello/:name     v2
// /v1/hello/:name  v1
// /v2/hello/:name  v2
// /v3/hello/:name  InvalidVersionError
server.get('/hello/:name', restify.plugins.conditionalHandler([
  { version: '1.0.0', handler: respondV1 },
  { version: '2.0.0', handler: respondV2 }
]));

function statusResponse(req, res, next) {
  res.send('ok');
  next();
}

// /status
// /v1/status
// /v2/status
// /v3/status InvalidVersionError
server.get('/status', statusResponse);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
