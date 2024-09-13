import sqlite3
import os

# 连接到数据库
db_path = os.path.join(os.path.dirname(__file__), 'cats.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 查询历史被关注次数
query = '''
    SELECT 
        cat_id,
        SUM(feed_count) + SUM(companion_count) + SUM(miss_count) AS total_attention
    FROM feeding_history
    GROUP BY cat_id
'''
cursor.execute(query)

# 将结果写入文件
output_path = os.path.join(os.path.dirname(__file__), 'historical_attention_counts.txt')
with open(output_path, 'w') as f:
    for row in cursor.fetchall():
        cat_id, total_attention = row
        f.write(f"{cat_id} | {total_attention}\n")

# 关闭数据库连接
conn.close()

print("Historical attention counts generated successfully.")
