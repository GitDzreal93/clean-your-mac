# 贡献指南 / Contributing Guide

感谢您对 CleanYourMac 项目的关注！我们欢迎所有形式的贡献。

Thank you for your interest in contributing to CleanYourMac! We welcome all forms of contributions.

## 🌟 如何贡献 / How to Contribute

### 🐛 报告问题 / Reporting Issues

如果您发现了 bug 或有功能建议，请：

If you find a bug or have a feature suggestion, please:

1. 检查 [Issues](https://github.com/GitDzreal93/clean-your-mac/issues) 确保问题未被报告
   Check [Issues](https://github.com/GitDzreal93/clean-your-mac/issues) to ensure the issue hasn't been reported

2. 创建新的 Issue，包含：
   Create a new Issue with:
   - 清晰的标题和描述 / Clear title and description
   - 重现步骤 / Steps to reproduce
   - 预期行为 / Expected behavior
   - 实际行为 / Actual behavior
   - 系统信息（macOS 版本等）/ System information (macOS version, etc.)
   - 截图（如适用）/ Screenshots (if applicable)

### 💻 代码贡献 / Code Contributions

#### 开发环境设置 / Development Setup

1. **Fork 仓库 / Fork the repository**
   ```bash
   git clone https://github.com/your-username/clean-your-mac.git
   cd clean-your-mac
   ```

2. **安装依赖 / Install dependencies**
   ```bash
   # 安装 Rust / Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # 安装 Node.js 18+ / Install Node.js 18+
   nvm install 18
   nvm use 18
   
   # 安装 pnpm / Install pnpm
   npm install -g pnpm
   
   # 安装项目依赖 / Install project dependencies
   pnpm install
   
   # 安装 Tauri CLI / Install Tauri CLI
   cargo install tauri-cli
   ```

3. **创建功能分支 / Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **开发和测试 / Develop and test**
   ```bash
   # 启动开发服务器 / Start development server
   pnpm run tauri dev
   
   # 运行测试 / Run tests
   pnpm run test
   
   # 类型检查 / Type checking
   pnpm run type-check
   ```

#### 代码规范 / Code Standards

- **前端 / Frontend**:
  - 使用 TypeScript / Use TypeScript
  - 遵循 ESLint 规则 / Follow ESLint rules
  - 使用 Prettier 格式化代码 / Use Prettier for code formatting
  - 组件使用 React Hooks / Use React Hooks for components
  - 状态管理使用 Zustand / Use Zustand for state management

- **后端 / Backend**:
  - 遵循 Rust 编码规范 / Follow Rust coding conventions
  - 使用 `cargo fmt` 格式化代码 / Use `cargo fmt` for code formatting
  - 使用 `cargo clippy` 进行代码检查 / Use `cargo clippy` for linting
  - 添加适当的错误处理 / Add proper error handling

#### 提交规范 / Commit Convention

使用语义化提交信息 / Use semantic commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

**类型 / Types**:
- `feat`: 新功能 / New feature
- `fix`: 修复 bug / Bug fix
- `docs`: 文档更新 / Documentation update
- `style`: 代码格式化 / Code formatting
- `refactor`: 代码重构 / Code refactoring
- `test`: 测试相关 / Test related
- `chore`: 构建过程或辅助工具的变动 / Build process or auxiliary tool changes

**示例 / Examples**:
```
feat(cleanup): add smart snapshot classification
fix(ui): resolve memory leak in analysis report
docs(readme): update installation instructions
```

### 🔄 Pull Request 流程 / Pull Request Process

1. **确保代码质量 / Ensure code quality**
   ```bash
   # 运行所有检查 / Run all checks
   pnpm run lint
   pnpm run type-check
   pnpm run test
   cargo fmt
   cargo clippy
   ```

2. **更新文档 / Update documentation**
   - 如果添加了新功能，更新 README.md / Update README.md for new features
   - 添加或更新代码注释 / Add or update code comments
   - 更新类型定义 / Update type definitions

3. **创建 Pull Request**
   - 使用清晰的标题和描述 / Use clear title and description
   - 链接相关的 Issues / Link related Issues
   - 添加截图或 GIF（如适用）/ Add screenshots or GIFs (if applicable)
   - 标记为 Draft 如果还在开发中 / Mark as Draft if still in development

4. **代码审查 / Code Review**
   - 响应审查意见 / Respond to review comments
   - 进行必要的修改 / Make necessary changes
   - 保持提交历史整洁 / Keep commit history clean

### 📝 文档贡献 / Documentation Contributions

- 改进 README.md / Improve README.md
- 添加代码注释 / Add code comments
- 创建使用教程 / Create usage tutorials
- 翻译文档 / Translate documentation

### 🎨 设计贡献 / Design Contributions

- UI/UX 改进建议 / UI/UX improvement suggestions
- 图标和界面设计 / Icon and interface design
- 用户体验优化 / User experience optimization

## 🤝 社区准则 / Community Guidelines

- 保持友善和尊重 / Be kind and respectful
- 欢迎新贡献者 / Welcome new contributors
- 提供建设性反馈 / Provide constructive feedback
- 遵循行为准则 / Follow the code of conduct

## 📞 联系方式 / Contact

- GitHub Issues: [问题反馈](https://github.com/GitDzreal93/clean-your-mac/issues)
- GitHub Discussions: [功能讨论](https://github.com/GitDzreal93/clean-your-mac/discussions)

## 🙏 致谢 / Acknowledgments

感谢所有为 CleanYourMac 项目做出贡献的开发者！

Thanks to all developers who contribute to the CleanYourMac project!

---

**记住：每一个贡献都很重要，无论大小！**

**Remember: Every contribution matters, no matter how small!**