export function isGreenApi(WEBHOOK_SECRET = "") {
  return function(req, res) {
    if (req.headers['x-green-api-secret'] !== WEBHOOK_SECRET) {
      return res.sendStatus(403);
    }
  }
}