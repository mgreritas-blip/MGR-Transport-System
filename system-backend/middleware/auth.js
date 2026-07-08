module.exports = (req, res, next) => {
  // Simple authentication stub: read role from header X-User-Role
  const roleHeader = req.headers['x-user-role'];
  if (!roleHeader) {
    return res.status(401).json({ message: 'Unauthorized: missing role header' });
  }
  // In a real system, verify JWT and fetch user
  req.user = { role: roleHeader };
  next();
};
