import requests
import pandas as pd
import json
import re
from io import StringIO
import ast

def fetch_cats_data():
    # 获取腾讯文档数据
    url = "https://docs.qq.com/sheet/DWXVLaUVPb1ZNdmlr?tab=fliaid"
    response = requests.get(url)
    
    # 使用 StringIO 来包装 HTML 内容
    html_io = StringIO(response.text)
    
    # 读取 HTML 表格
    dfs = pd.read_html(html_io)
    
    # 假设我们需要的数据在第一个数据框中
    df = dfs[0]
    
    # 删除第一行（它包含列名），并重置索引
    df = df.iloc[1:].reset_index(drop=True)
    
    # 删除包含 NaN 值的行
    df = df.dropna(how='all')
    
    print(f"Original dataframe rows: {len(df)}")
    
    print(f"Rows before dropping NA: {len(df)}")
    
    print(f"Number of dataframes found: {len(dfs)}")
    
    cats = []
    for index, row in df.iterrows():
        # 修改猫咪编号生成逻辑,支持三位数以上的ID
        cat_id = f"CAT{int(row['Unnamed: 0']):03d}" if pd.notna(row['Unnamed: 0']) else f"CAT{index+1:03d}"
        
        cat = {
            'cat_id': cat_id,
            'name': row['B'],
            'area': get_area(row['H']),
            'specific_location': get_specific_location(row['H']),
            'status': row['F']
        }
        cats.append(cat)
        print(f"Processed: {cat}")  # 调试信息

    print(f"Total cats processed: {len(cats)}")  # 调试信息
    return cats

def get_area(location):
    if pd.isna(location):
        return '未知'
    if '组' in location:
        return '宿舍区'
    elif '院' in location or '计算' in location:
        return '各学院'
    else:
        return '其它区域'

def get_specific_location(location):
    if pd.isna(location):
        return '未知'
    return location.split('、')[0].replace('&', '、')

def update_cats_data_js(cats):
    # 读取现有的cats_data.js文件
    try:
        with open('cats_data.js', 'r', encoding='utf-8') as f:
            content = f.read()
        existing_cats = re.findall(r'\{.*?\}', content, re.DOTALL)
        existing_cats = [eval(cat.replace('cat_id:', '"cat_id":').replace('name:', '"name":').replace('area:', '"area":').replace('specific_location:', '"specific_location":')) for cat in existing_cats]
    except:
        existing_cats = []

    # 更新猫咪数据
    updated_cats = []
    for cat in cats:
        existing_cat = next((c for c in existing_cats if c['cat_id'] == cat['cat_id']), None)
        if existing_cat:
            if cat['status'] == '在校':
                updated_cats.append(cat)
            else:
                updated_cats.append(f"//{{ cat_id: '{cat['cat_id']}', name: '{cat['name']}', area: '{cat['area']}', specific_location: '{cat['specific_location']}' }}")
        elif cat['status'] == '在校':
            updated_cats.append(cat)

    # 保留特殊的试用猫咪数据
    special_cats = [
        { 'cat_id': 'CAT000', 'name': '测试用', 'area': '测试用', 'specific_location': 'CUG校内' },
        { 'cat_id': 'CAT999', 'name': '测试用', 'area': '测试用', 'specific_location': 'CUG全境' }
    ]
    updated_cats = special_cats + sorted(updated_cats, key=lambda x: x['cat_id'] if isinstance(x, dict) else x.split("'")[1])

    # 生成新的cats_data.js内容
    new_content = "const cats = [\n"
    for cat in updated_cats:
        if isinstance(cat, str):
            new_content += f"    {cat},\n"
        else:
            new_content += f"    {{ cat_id: '{cat['cat_id']}', name: '{cat['name']}', area: '{cat['area']}', specific_location: '{cat['specific_location']}' }},\n"
    new_content += "];\n\nmodule.exports = cats;"

    # 写入更新后的内容到cats_data.js文件
    with open('cats_data.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

def update_cats_data_js(cats):
    # 读取现有cats_data.js文件
    with open('cats_data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 解析现有的猫咪数据
    existing_cats = re.findall(r'{\s*cat_id:.*?}', content, re.DOTALL)
    existing_cats = [eval(cat.replace('cat_id:', '"cat_id":').replace('name:', '"name":').replace('area:', '"area":').replace('specific_location:', '"specific_location":').replace("'", '"')) for cat in existing_cats]

    # 更新猫咪数据
    updated_cats = []
    for cat in cats:
        existing_cat = next((c for c in existing_cats if c['cat_id'] == cat['cat_id']), None)
        if existing_cat:
            if cat['status'] == '在校':
                updated_cats.append(cat)
            else:
                updated_cats.append(f"// {{ cat_id: '{cat['cat_id']}', name: '{cat['name']}', area: '{cat['area']}', specific_location: '{cat['specific_location']}' }}")
        elif cat['status'] == '在校':
            updated_cats.append(cat)

    # 保留特殊的试用猫咪数据
    special_cats = [
        { 'cat_id': 'CAT000', 'name': '测试用', 'area': '测试用', 'specific_location': 'CUG校内' },
        { 'cat_id': 'CAT999', 'name': '测试用', 'area': '测试用', 'specific_location': 'CUG全境' }
    ]
    updated_cats = special_cats + sorted(updated_cats, key=lambda x: x['cat_id'] if isinstance(x, dict) else x.split("'")[1])

    # 生成新的cats_data.js内容
    new_content = "const cats = [\n"
    for cat in updated_cats:
        if isinstance(cat, str):
            new_content += f"    {cat},\n"
        else:
            new_content += f"    {{ cat_id: '{cat['cat_id']}', name: '{cat['name']}', area: '{cat['area']}', specific_location: '{cat['specific_location']}' }},\n"
    new_content += "];\n\nmodule.exports = cats;"

    # 写入更新后的内容到cats_data.js文件
    with open('cats_data.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == "__main__":
    cats = fetch_cats_data()
    update_cats_data_js(cats)
    print("猫咪数据已更新")
