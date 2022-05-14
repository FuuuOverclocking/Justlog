# Justlog

Fuu 的博客解决方案.

## 安装

```shell
git clone git@github.com:FuuuOverclocking/Justlog.git

# 安装
yarn

# 将 justlog 命令添加到 yarn/bin 中
yarn link

# 查看帮助
justlog help
```

已确认在以下环境中可用:

- Windows 10/11 x64
- Node.js v16.xx.xx
- Yarn v1.22.xx
- VS Code

## 快速上手

首先, 选一个文件夹, 用来放置所有博客 (推荐选择一个网盘文件夹, e.g. OneDrive):

```shell
justlog set blogRootDir "X:/path-to-blogs"
# 可以在 Justlog/data/settings.json 找到设置
```

然后, 创建一篇新博客 "hello-world":

```shell
justlog new hello-world
```

用编辑器打开文件夹 `X:/path-to-blogs/hello-world`, 可看到两个文件:

- `article.md`: 在该文件内用 JustMark 编写博客内容
- `article.tsx`: 在该文件内用 TypeScript (with React jsx) 编写博客脚本

参考 [docs/JustMark.md](./docs/JustMark.md) 以了解写法.

在该目录下, 可执行这些命令:

```shell
justlog build   # 构建
justlog view    # 实时预览
justlog publish # 发布
```

## 卸载

在 Justlog 文件夹下, 执行:

```shell
yarn unlink
```

然后删除 Justlog 和博客文件夹.

## Docs of Packages

- `justlog-cli`: [docs/justlog-cli.md](./docs/justlog-cli.md)
- `justlog-proto`: -
- `justlog-proto-backend`: -
- `justmark`: [docs/JustMark.md](./docs/JustMark.md)

## License

MIT License

Copyright (c) 2022 Fuu g.for.xyz@gmail.com
