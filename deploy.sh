#!/bin/bash

# 词汇学习游戏 - 快速部署脚本
# Vocabulary Learning Game - Quick Deploy Script

echo "🚀 词汇学习游戏 - 部署助手"
echo "================================"
echo ""

# 检查Git是否已配置
if ! git config user.name &> /dev/null; then
    echo "⚠️  请先配置Git用户信息："
    echo "   git config --global user.name \"Your Name\""
    echo "   git config --global user.email \"your.email@example.com\""
    exit 1
fi

echo "✅ Git已配置"
echo "   用户: $(git config user.name)"
echo "   邮箱: $(git config user.email)"
echo ""

# 检查是否有远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo "📝 请输入您的GitHub用户名："
    read -r username

    echo "📝 请输入仓库名（建议：vocab-game）："
    read -r repo_name

    echo ""
    echo "🔗 正在配置远程仓库..."
    git remote add origin "https://github.com/$username/$repo_name.git"

    echo ""
    echo "⚠️  请确保您已在GitHub创建了仓库："
    echo "   https://github.com/$username/$repo_name"
    echo ""
    echo "按回车键继续部署，或Ctrl+C取消..."
    read -r
fi

echo "📦 正在提交最新更改..."
git add .

if git diff --cached --quiet; then
    echo "✅ 没有新的更改需要提交"
else
    echo "📝 请输入提交信息（直接回车使用默认信息）："
    read -r commit_msg

    if [ -z "$commit_msg" ]; then
        commit_msg="Update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi

    git commit -m "$commit_msg"
    echo "✅ 提交完成"
fi

echo ""
echo "🚀 正在推送到GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo ""
    echo "📋 接下来的步骤："
    echo "1. 访问您的GitHub仓库"
    echo "2. 进入 Settings → Pages"
    echo "3. Source选择 'main' 分支"
    echo "4. 点击 Save"
    echo "5. 等待1-2分钟后访问您的网站"
    echo ""

    origin_url=$(git remote get-url origin)
    username=$(echo "$origin_url" | sed -n 's/.*github\.com[:/]\([^/]*\).*/\1/p')
    repo_name=$(echo "$origin_url" | sed -n 's/.*\/\([^/]*\)\.git/\1/p')

    echo "🌐 您的网站地址将是："
    echo "   https://$username.github.io/$repo_name/"
    echo ""
    echo "🎉 恭喜！您的应用已准备好上线！"
else
    echo ""
    echo "❌ 推送失败，请检查："
    echo "1. 是否已在GitHub创建仓库"
    echo "2. 是否有权限推送到该仓库"
    echo "3. 是否需要使用Personal Access Token"
    echo ""
    echo "💡 如需帮助，请查看 部署指南.md"
fi
