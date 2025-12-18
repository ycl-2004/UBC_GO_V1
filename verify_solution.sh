#!/bin/bash
# 驗證省份特定課程代碼解決方案

echo "=================================================="
echo "🔍 驗證 UBC PathFinder 省份課程代碼"
echo "=================================================="
echo ""

# 檢查文件存在
echo "📁 檢查數據文件..."
if [ -f "src/data/detailed_requirements.json" ]; then
    FILE_SIZE=$(ls -lh src/data/detailed_requirements.json | awk '{print $5}')
    echo "   ✅ src/data/detailed_requirements.json 存在 ($FILE_SIZE)"
else
    echo "   ❌ src/data/detailed_requirements.json 不存在"
    exit 1
fi

echo ""
echo "🎯 驗證 Alberta 課程代碼..."

# 檢查 Alberta 的具體代碼
if grep -q "English Language Arts 30-1" src/data/detailed_requirements.json; then
    echo "   ✅ Alberta: English Language Arts 30-1 找到"
else
    echo "   ❌ Alberta: English Language Arts 30-1 未找到"
fi

if grep -q "Math 30-1" src/data/detailed_requirements.json; then
    echo "   ✅ Alberta: Math 30-1 找到"
else
    echo "   ❌ Alberta: Math 30-1 未找到"
fi

if grep -q "Chemistry 20" src/data/detailed_requirements.json; then
    echo "   ✅ Alberta: Chemistry 20 找到"
else
    echo "   ❌ Alberta: Chemistry 20 未找到"
fi

echo ""
echo "🎯 驗證 British Columbia 課程代碼..."

if grep -q "English Studies 12" src/data/detailed_requirements.json; then
    echo "   ✅ BC: English Studies 12 找到"
else
    echo "   ❌ BC: English Studies 12 未找到"
fi

if grep -q "Pre-Calculus 12" src/data/detailed_requirements.json; then
    echo "   ✅ BC: Pre-Calculus 12 找到"
else
    echo "   ❌ BC: Pre-Calculus 12 未找到"
fi

echo ""
echo "🎯 驗證 Ontario 課程代碼..."

if grep -q "ENG4U" src/data/detailed_requirements.json; then
    echo "   ✅ Ontario: ENG4U 找到"
else
    echo "   ❌ Ontario: ENG4U 未找到"
fi

if grep -q "MHF4U" src/data/detailed_requirements.json; then
    echo "   ✅ Ontario: MHF4U 找到"
else
    echo "   ❌ Ontario: MHF4U 未找到"
fi

echo ""
echo "📊 統計映射數量..."
ALBERTA_COUNT=$(grep -o "English Language Arts 30-1" src/data/detailed_requirements.json | wc -l | tr -d ' ')
BC_COUNT=$(grep -o "English Studies 12" src/data/detailed_requirements.json | wc -l | tr -d ' ')
ONTARIO_COUNT=$(grep -o "ENG4U" src/data/detailed_requirements.json | wc -l | tr -d ' ')

echo "   Alberta 映射: $ALBERTA_COUNT 次"
echo "   BC 映射: $BC_COUNT 次"
echo "   Ontario 映射: $ONTARIO_COUNT 次"

echo ""
echo "=================================================="
echo "✅ 驗證完成！"
echo "=================================================="
echo ""
echo "📝 接下來的步驟："
echo "   1. 刷新瀏覽器 (Cmd+Shift+R)"
echo "   2. 進入 Calculator 頁面"
echo "   3. 選擇 Alberta → Applied Biology"
echo "   4. 確認顯示 'English Language Arts 30-1'"
echo ""

