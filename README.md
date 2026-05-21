# SocialResearch Pro 使用手册 Demo

这是一个可直接发布到 GitHub Pages 的静态站点。

## 本地预览

```bash
cd /Users/sienna/Documents/edgeone-pages-srp-manual
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

## 发布到 GitHub Pages

1. 在 GitHub 创建一个新仓库，例如 `edgeone-pages-srp-manual`。
2. 把本目录推送到该仓库的 `main` 分支。
3. 进入仓库的 `Settings -> Pages`。
4. `Build and deployment` 选择 `Deploy from a branch`。
5. `Branch` 选择 `main` 和 `/ (root)`，保存。

发布后预览地址通常是：

```text
https://<github-username>.github.io/edgeone-pages-srp-manual/
```

## 后续更新

把新生成的 demo 文件覆盖到本目录后执行：

```bash
git add .
git commit -m "Update demo"
git push
```
