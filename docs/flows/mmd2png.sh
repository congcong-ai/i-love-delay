#!/bin/bash
# 批量把当前目录下的所有 .mmd 文件转换为 .png

for file in *.mmd; do
  # 检查目录里是否存在 .mmd 文件
  [ -e "$file" ] || { echo "没有找到 .mmd 文件"; exit 1; }

  filename="${file%.mmd}"
  echo "正在转换: $file -> ${filename}.png"
  mmdc -i "$file" -o "${filename}.png" -b transparent -w 1200
done

echo "全部完成 ✅"
