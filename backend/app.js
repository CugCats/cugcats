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
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  next();
});

// 连接到 SQLite 数据库
const db = new sqlite3.Database(path.join(__dirname, '../database/cats.db'), (err) => {
  if (err) {
    console.error('数据库连接错误:', err.message);
  } else {
    console.log('成功连接到数据库');
  }
});

// 创建区域表
db.run(`CREATE TABLE IF NOT EXISTS areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  weight INTEGER
)`);

// 创建猫咪表
db.run(`CREATE TABLE IF NOT EXISTS cats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT UNIQUE,
  name TEXT,
  area_id INTEGER,
  specific_location TEXT,
  count INTEGER,
  companion_count INTEGER DEFAULT 0,
  miss_count INTEGER DEFAULT 0,
  FOREIGN KEY (area_id) REFERENCES areas(id)
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

// 创建用户陪伴记录表
db.run(`CREATE TABLE IF NOT EXISTS companions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT,
  user_ip TEXT,
  companion_date DATE,
  UNIQUE(cat_id, user_ip, companion_date)
)`);

// 创建每日陪伴记录表
db.run(`CREATE TABLE IF NOT EXISTS daily_companions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT,
  companion_date DATE,
  count INTEGER,
  UNIQUE(cat_id, companion_date)
)`);

// 创建历史记录表
db.run(`CREATE TABLE IF NOT EXISTS feeding_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT,
  feed_date DATE,
  feed_count INTEGER,
  companion_count INTEGER,
  miss_count INTEGER
)`);

// 创建用户思念记录表
db.run(`CREATE TABLE IF NOT EXISTS misses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT,
  user_ip TEXT,
  miss_date DATE,
  UNIQUE(cat_id, user_ip, miss_date)
)`);

// 创建每日思念记录表
db.run(`CREATE TABLE IF NOT EXISTS daily_misses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT,
  miss_date DATE,
  count INTEGER,
  UNIQUE(cat_id, miss_date)
)`);

// 初始化区域数据
function initializeAreas() {
  const areas = [
    { name: '测试用', weight: 1 },
    { name: '宿舍区', weight: 2 },
    { name: '各学院', weight: 3 },
    { name: '其它区域', weight: 4 }
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO areas (name, weight) VALUES (?, ?)');
  areas.forEach(area => {
    stmt.run(area.name, area.weight);
  });
  stmt.finalize();

  console.log('区域数据初始化完成');
}

// 初始化猫咪数据
function initializeCats() {
  const cats = require('./cats_data');

  db.serialize(() => {
    // 准备插入或更新的语句
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO cats (cat_id, name, area_id, specific_location, count, companion_count, miss_count) 
      VALUES (?, ?, (SELECT id FROM areas WHERE name = ?), ?, 
        COALESCE((SELECT count FROM cats WHERE cat_id = ?), 0), 
        COALESCE((SELECT companion_count FROM cats WHERE cat_id = ?), 0), 
        COALESCE((SELECT miss_count FROM cats WHERE cat_id = ?), 0)
      )
    `);

    cats.forEach(cat => {
      stmt.run(cat.cat_id, cat.name, cat.area, cat.specific_location, cat.cat_id, cat.cat_id, cat.cat_id, (err) => {
        if (err) {
          console.error(`Error inserting or updating cat ${cat.cat_id}:`, err);
        }
      });
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('Error finalizing statement:', err);
      } else {
        console.log('猫咪数据初始化完成');
      }
    });
  });
}

// 在初始化猫咪数据之前调用
function createTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS cats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id TEXT UNIQUE,
      name TEXT,
      area_id INTEGER,
      specific_location TEXT,
      count INTEGER,
      companion_count INTEGER DEFAULT 0,
      miss_count INTEGER DEFAULT 0,
      FOREIGN KEY (area_id) REFERENCES areas(id)
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
    db.run(`CREATE TABLE IF NOT EXISTS companions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id TEXT,
      user_ip TEXT,
      companion_date DATE,
      UNIQUE(cat_id, user_ip, companion_date)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS daily_companions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id TEXT,
      companion_date DATE,
      count INTEGER,
      UNIQUE(cat_id, companion_date)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS feeding_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id TEXT,
      feed_date DATE,
      feed_count INTEGER,
      companion_count INTEGER,
      miss_count INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS misses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id TEXT,
      user_ip TEXT,
      miss_date DATE,
      UNIQUE(cat_id, user_ip, miss_date)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS daily_misses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id TEXT,
      miss_date DATE,
      count INTEGER,
      UNIQUE(cat_id, miss_date)
    )`);
  });
}

// 检查数据库是否存在，如果不存在则初始化
const fs = require('fs');
const dbPath = path.join(__dirname, '../database/cats.db');

console.log('正在检查数据库结构...');
createTables();
initializeAreas();
initializeCats();

console.log('数据库结构检查完成');

// 更新猫咪信息
updateCatsInfo();

function updateCatsInfo() {
  const cats = require('./cats_data');

  const stmt = db.prepare('INSERT OR REPLACE INTO cats (cat_id, name, area_id, specific_location, count, companion_count, miss_count) VALUES (?, ?, (SELECT id FROM areas WHERE name = ?), ?, COALESCE((SELECT count FROM cats WHERE cat_id = ?), 0), COALESCE((SELECT companion_count FROM cats WHERE cat_id = ?), 0), COALESCE((SELECT miss_count FROM cats WHERE cat_id = ?), 0))');
  
  cats.forEach(cat => {
    stmt.run(cat.cat_id, cat.name, cat.area, cat.specific_location, cat.cat_id, cat.cat_id, cat.cat_id, (err) => {
      if (err) {
        console.error(`Error updating cat ${cat.cat_id}:`, err);
      }
    });
  });
  
  stmt.finalize((err) => {
    if (err) {
      console.error('Error finalizing statement:', err);
    } else {
      console.log('猫咪信息更新完成');
    }
  });
}

// 恢复当天的投喂和陪伴数据
function restoreDailyCounts() {
  const today = new Date().toISOString().split('T')[0];
  
  const tables = ['daily_feedings', 'daily_companions', 'daily_misses'];
  const updates = {
    'daily_feedings': 'UPDATE cats SET count = ? WHERE cat_id = ?',
    'daily_companions': 'UPDATE cats SET companion_count = ? WHERE cat_id = ?',
    'daily_misses': 'UPDATE cats SET miss_count = ? WHERE cat_id = ?'
  };
  const dateColumns = {
    'daily_feedings': 'feed_date',
    'daily_companions': 'companion_date',
    'daily_misses': 'miss_date'
  };

  tables.forEach(table => {
    const dateColumn = dateColumns[table];
    db.all(`SELECT cat_id, count FROM ${table} WHERE ${dateColumn} = ?`, [today], (err, rows) => {
      if (err) {
        if (err.code === 'SQLITE_ERROR' && err.message.includes('no such table')) {
          console.log(`表 ${table} 不存在，跳过恢复`);
        } else {
          console.error(`恢复 ${table} 时出错:`, err);
        }
        return;
      }
      rows.forEach(row => {
        db.run(updates[table], [row.count, row.cat_id]);
      });
      console.log(`${table} 恢复完成`);
    });
  });
}

// 在服务启动时调用恢复函数
restoreDailyCounts();

// API 端点: 获取所有猫咪数
app.get('/cats', (req, res) => {
  db.all(`
    SELECT c.*, a.name as area_name, a.weight as area_weight
    FROM cats c
    JOIN areas a ON c.area_id = a.id
    ORDER BY a.weight, c.cat_id
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching cats:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Fetched cats:', rows);
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
          res.json({ success: true, firstTime: true });
        });
      });
    });
  });
});

// 每日重置喂食和陪伴计数的函数
function resetDailyCounts() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];

  // 将昨天的数据存入历史记录表
  db.run(`INSERT INTO feeding_history (cat_id, feed_date, feed_count, companion_count, miss_count)
          SELECT cat_id, ?, count, companion_count, miss_count
          FROM cats`, [yesterday]);

  // 重置cats表中的计数
  db.run('UPDATE cats SET count = 0, companion_count = 0, miss_count = 0', (err) => {
    if (err) {
      console.error('Error resetting daily counts:', err);
    } else {
      console.log('Daily counts reset successfully');
    }
  });

  // 清理旧的用户记录
  db.run('DELETE FROM feedings WHERE fed_date < ?', [today]);
  db.run('DELETE FROM companions WHERE companion_date < ?', [today]);
  db.run('DELETE FROM misses WHERE miss_date < ?', [today]);
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

// 新增路由: 处理陪伴操作
app.post('/companion/:cat_id', (req, res) => {
  const { cat_id } = req.params;
  const userIp = getClientIp(req);
  const today = new Date().toISOString().split('T')[0];

  db.get('SELECT * FROM companions WHERE cat_id = ? AND user_ip = ? AND companion_date = ?', [cat_id, userIp, today], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, message: err.message });
      return;
    }

    if (row) {
      res.json({ success: false, message: '您今天已经陪伴过这只猫了' });
      return;
    }

    db.run('INSERT INTO companions (cat_id, user_ip, companion_date) VALUES (?, ?, ?)', [cat_id, userIp, today], (err) => {
      if (err) {
        res.status(500).json({ success: false, message: err.message });
        return;
      }

      db.run('UPDATE cats SET companion_count = companion_count + 1 WHERE cat_id = ?', [cat_id], (err) => {
        if (err) {
          res.status(500).json({ success: false, message: err.message });
          return;
        }

        db.run('INSERT OR REPLACE INTO daily_companions (cat_id, companion_date, count) VALUES (?, ?, COALESCE((SELECT count FROM daily_companions WHERE cat_id = ? AND companion_date = ?), 0) + 1)', 
          [cat_id, today, cat_id, today], (err) => {
          if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
          }
          res.json({ success: true, firstTime: true });
        });
      });
    });
  });
});

// 新增路由: 获取历史数据
app.get('/history/:cat_id', (req, res) => {
  const { cat_id } = req.params;
  db.all('SELECT * FROM feeding_history WHERE cat_id = ? ORDER BY feed_date DESC', [cat_id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 新增路由: 处理思念操作
app.post('/miss/:cat_id', (req, res) => {
  const { cat_id } = req.params;
  const userIp = getClientIp(req);
  const today = new Date().toISOString().split('T')[0];

  db.get('SELECT * FROM misses WHERE cat_id = ? AND user_ip = ? AND miss_date = ?', [cat_id, userIp, today], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, message: err.message });
      return;
    }

    if (row) {
      res.json({ success: false, message: '知道你非常想它啦，有空了带着粮快去找它！❤️' });
      return;
    }

    db.run('INSERT INTO misses (cat_id, user_ip, miss_date) VALUES (?, ?, ?)', [cat_id, userIp, today], (err) => {
      if (err) {
        res.status(500).json({ success: false, message: err.message });
        return;
      }

      db.run('UPDATE cats SET miss_count = miss_count + 1 WHERE cat_id = ?', [cat_id], (err) => {
        if (err) {
          res.status(500).json({ success: false, message: err.message });
          return;
        }

        db.run('INSERT OR REPLACE INTO daily_misses (cat_id, miss_date, count) VALUES (?, ?, COALESCE((SELECT count FROM daily_misses WHERE cat_id = ? AND miss_date = ?), 0) + 1)', 
          [cat_id, today, cat_id, today], (err) => {
          if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
          }
          res.json({ success: true, firstTime: true });
        });
      });
    });
  });
});