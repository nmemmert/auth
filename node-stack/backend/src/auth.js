export function requireAdminToken(req, res, next) {
  const configured = process.env.ADMIN_API_TOKEN;
  if (!configured) {
    return res.status(500).json({ error: "ADMIN_API_TOKEN is not configured" });
  }

  const token = req.header("x-admin-token");
  if (token !== configured) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}
