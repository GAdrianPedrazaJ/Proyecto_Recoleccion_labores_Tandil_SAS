const ALLOWED_ORIGINS = [
  'https://jolly-moss-0d6b7e40f1.azurestaticapps.net',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]

function getCorsHeaders(req) {
  const origin = (req.headers && req.headers.origin) || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

function withCors(handler) {
  return async function (context, req) {
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      context.res = { status: 204, headers: getCorsHeaders(req), body: '' }
      return
    }
    await handler(context, req)
    if (context.res) {
      context.res.headers = { ...getCorsHeaders(req), ...(context.res.headers || {}) }
    }
  }
}

module.exports = { withCors, getCorsHeaders }
