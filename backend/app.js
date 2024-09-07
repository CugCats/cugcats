const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const app = express();
const port = 7789;

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, '../frontend')));

// 连接到 SQLite 数据库
const db = new sqlite3.Database(path.join(__dirname, '../database/cats.db'), (err) => {
  if (err) {
    console.error('数据库连接错误:', err.message);
  } else {
    console.log('成功连接到数据库');
  }
});

// 创建猫咪表
db.run(`CREATE TABLE IF NOT EXISTS cats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT UNIQUE,
  name TEXT,
  count INTEGER
)`);

// 创建每日投喂记录表
db.run(`CREATE TABLE IF NOT EXISTS daily_feedings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT,
  feed_date DATE,
  count INTEGER,
  UNIQUE(cat_id, feed_date)
)`);

// 创建用户投喂记录表
db.run(`CREATE TABLE IF NOT EXISTS feedings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT,
  user_ip TEXT,
  fed_date DATE,
  UNIQUE(cat_id, user_ip, fed_date)
)`);

// 初始化猫咪数据
function initializeCats() {
  const cats = [
    { cat_id: 'CAT001', name: '测试用' },
    { cat_id: 'CAT002', name: '口水胆' },
    { cat_id: 'CAT003', name: '口水胆的朋友' },
    { cat_id: 'CAT004', name: '四组团深色幼猫' },
    { cat_id: 'CAT005', name: '四组团橘色小幼猫' },
    { cat_id: 'CAT006', name: '四组团橘白幼猫' },
    { cat_id: 'CAT007', name: '四组团不记得颜色猫' },
    { cat_id: 'CAT008', name: '图书馆旁边池塘旁脖子一点黑的黑白相间猫' },
    { cat_id: 'CAT009', name: '上面那只猫会欺负的深色好看猫（不见了）' },
    { cat_id: 'CAT010', name: '海胆' },
    { cat_id: 'CAT011', name: '环境学院的一群猫' },
    { cat_id: 'CAT012', name: '图书馆的黑白相间猫' },
    { cat_id: 'CAT013', name: '图书馆的另一只猫' },
  ];

  db.run('DELETE FROM cats');
  const stmt = db.prepare('INSERT OR REPLACE INTO cats (cat_id, name, count) VALUES (?, ?, 0)');
  cats.forEach(cat => {
    stmt.run(cat.cat_id, cat.name);
  });
  stmt.finalize();

  console.log('猫咪数据初始化完成');
}

// 在初始化猫咪数据之前调用
function createTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS cats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id TEXT UNIQUE,
      name TEXT,
      count INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS daily_feedings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id TEXT,
      feed_date DATE,
      count INTEGER,
      UNIQUE(cat_id, feed_date)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS feedings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id TEXT,
      user_ip TEXT,
      fed_date DATE,
      UNIQUE(cat_id, user_ip, fed_date)
    )`);
  });
}

// 调用初始化
createTables();
initializeCats();

// 恢复当天的投喂数据
function restoreDailyFeedings() {
  const today = new Date().toISOString().split('T')[0];
  db.all('SELECT cat_id, count FROM daily_feedings WHERE feed_date = ?', [today], (err, rows) => {
    if (err) {
      console.error('Error restoring daily feedings:', err);
      return;
    }
    rows.forEach(row => {
      db.run('UPDATE cats SET count = ? WHERE cat_id = ?', [row.count, row.cat_id]);
    });
    console.log('Daily feedings restored');
  });
}

// 在服务启动时调用恢复函数
restoreDailyFeedings();

// API 端点: 获取所有猫咪数据
app.get('/cats', (req, res) => {
  db.all('SELECT * FROM cats', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API 端点: 更新猫咪喂食状态
app.post('/feed/:cat_id', (req, res) => {
  const { cat_id } = req.params;
  const userIp = getClientIp(req);
  const today = new Date().toISOString().split('T')[0];

  db.get('SELECT * FROM feedings WHERE cat_id = ? AND user_ip = ? AND fed_date = ?', [cat_id, userIp, today], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, message: err.message });
      return;
    }

    if (row) {
      res.json({ success: false, message: '您今天已经投喂过这只猫了' });
      return;
    }

    db.run('INSERT INTO feedings (cat_id, user_ip, fed_date) VALUES (?, ?, ?)', [cat_id, userIp, today], (err) => {
      if (err) {
        res.status(500).json({ success: false, message: err.message });
        return;
      }

      db.run('UPDATE cats SET count = count + 1 WHERE cat_id = ?', [cat_id], (err) => {
        if (err) {
          res.status(500).json({ success: false, message: err.message });
          return;
        }

        db.run('INSERT OR REPLACE INTO daily_feedings (cat_id, feed_date, count) VALUES (?, ?, COALESCE((SELECT count FROM daily_feedings WHERE cat_id = ? AND feed_date = ?), 0) + 1)', 
          [cat_id, today, cat_id, today], (err) => {
          if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
          }
          res.json({ success: true });
        });
      });
    });
  });
});

// 每日重置喂食计数的函数
function resetDailyCounts() {
  const today = new Date().toISOString().split('T')[0];
  db.run('UPDATE cats SET count = 0', (err) => {
    if (err) {
      console.error('Error resetting daily counts:', err);
    } else {
      console.log('Daily counts reset successfully');
    }
  });
  db.run('DELETE FROM daily_feedings WHERE feed_date < ?', [today], (err) => {
    if (err) {
      console.error('Error clearing old daily feedings:', err);
    } else {
      console.log('Old daily feedings cleared successfully');
    }
  });
}

// 设置每日午夜重置
const resetTime = new Date();
resetTime.setHours(24, 0, 0, 0);
const msUntilMidnight = resetTime - new Date();

setTimeout(() => {
  resetDailyCounts();
  setInterval(resetDailyCounts, 24 * 60 * 60 * 1000);
}, msUntilMidnight);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(7789, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:7789');
});

// 新增路由: 获取用户IP
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

app.get('/user-ip', (req, res) => {
  const ip = getClientIp(req);
  console.log('User IP:', ip); // 添加日志
  res.json({ ip: ip || '无法获取IP' });
});