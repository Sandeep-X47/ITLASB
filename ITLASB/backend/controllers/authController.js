const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authPool } = require('../config/database');

async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const hash = await bcrypt.hash(password, 10);
    await authPool.query(
      `INSERT INTO users (username, password, role) VALUES (?, ?, 'customer')`,
      [username, hash]
    );
    res.json({ message: 'Account created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Username already taken' });
    res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const [rows] = await authPool.query(`SELECT * FROM users WHERE username=?`, [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, user: { user_id: user.user_id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login };
