# YourCoverAI - App Store 上架 Checklist

## iOS App Store (Apple App Store)

### 1. 准备阶段
- [ ] 完成 Capacitor iOS 项目设置
- [ ] 生成 App Icon (1024x1024 PNG, 无透明度)
- [ ] 准备 Screenshots (6.5", 6.7", 5.5" iPhone)
- [ ] 准备 App Preview 视频（可选）
- [ ] 设计 App Store 描述文案（多语言）

### 2. Xcode 配置
- [ ] 在 Xcode 中打开项目：`npx cap open ios`
- [ ] 配置 Bundle Identifier: `com.yourcoverai.app`
- [ ] 设置 Version 和 Build Number
- [ ] 配置 Signing & Capabilities
- [ ] 添加 App Icon 到 Assets
- [ ] 配置 Info.plist（权限、URL Schemes）

### 3. App Store Connect
- [ ] 创建 App Store Connect 账号
- [ ] 创建新 App（选择 iOS）
- [ ] 填写 App 信息：
  - App Name: YourCoverAI
  - Primary Language: English
  - Bundle ID: com.yourcoverai.app
  - SKU: yourcoverai-ios-001
- [ ] 上传 App Icon
- [ ] 上传 Screenshots
- [ ] 填写 App 描述和关键词
- [ ] 设置价格和可用性
- [ ] 配置 App 隐私信息

### 4. 提交审核
- [ ] 在 Xcode 中 Archive
- [ ] 上传到 App Store Connect
- [ ] 填写审核信息
- [ ] 提交审核

---

## Android (Google Play Store)

### 1. 准备阶段
- [ ] 完成 Capacitor Android 项目设置
- [ ] 生成 App Icon (512x512 PNG)
- [ ] 准备 Screenshots (手机、平板、TV）
- [ ] 准备 Feature Graphic (1024x500)
- [ ] 设计 Google Play 描述文案（多语言）

### 2. Android Studio 配置
- [ ] 在 Android Studio 中打开项目：`npx cap open android`
- [ ] 配置 Application ID: `com.yourcoverai.app`
- [ ] 设置 Version Code 和 Version Name
- [ ] 配置 Signing Config（生成 keystore）
- [ ] 添加 App Icon 到 res/mipmap
- [ ] 配置 AndroidManifest.xml（权限、网络配置）

### 3. Google Play Console
- [ ] 创建 Google Play Console 账号（一次性费用 $25）
- [ ] 创建新 App
- [ ] 填写 App 信息：
  - App Name: YourCoverAI
  - Default Language: English
  - App ID: com.yourcoverai.app
- [ ] 上传 App Icon
- [ ] 上传 Screenshots 和 Feature Graphic
- [ ] 填写 App 描述和简短描述
- [ ] 设置内容分级
- [ ] 配置定价和分发

### 4. 提交审核
- [ ] 生成 Signed APK/AAB
- [ ] 上传到 Google Play Console
- [ ] 填写审核信息
- [ ] 提交审核

---

## 通用要求

### 法律和隐私
- [ ] 准备 Privacy Policy URL
- [ ] 准备 Terms of Service URL
- [ ] 配置 GDPR 合规（如适用）
- [ ] 配置数据收集声明

### 功能测试
- [ ] 测试所有 10 种语言切换
- [ ] 测试求职信生成功能
- [ ] 测试复制功能
- [ ] 测试网络错误处理
- [ ] 测试离线状态处理

### 性能优化
- [ ] 优化加载速度
- [ ] 优化图片资源
- [ ] 测试内存使用
- [ ] 测试电池消耗

### 多语言支持
- [ ] 确保所有 10 种语言在 App 中正常工作
- [ ] 准备 App Store 描述的多语言版本
- [ ] 测试 RTL 语言（阿拉伯语）显示

---

## 下一步操作

1. **安装 Capacitor CLI**:
   ```bash
   cd mobile
   npm install
   ```

2. **添加平台**:
   ```bash
   npx cap add ios
   npx cap add android
   ```

3. **同步项目**:
   ```bash
   npx cap sync
   ```

4. **打开 IDE**:
   ```bash
   npx cap open ios    # 打开 Xcode
   npx cap open android # 打开 Android Studio
   ```

5. **生成 App Icon**:
   - 使用设计工具创建 1024x1024 PNG
   - 放置到 `mobile/assets/app-icon.png`
   - 运行 `npx cap sync` 同步到原生项目

6. **构建和测试**:
   - iOS: 在 Xcode 中选择设备，点击 Run
   - Android: 在 Android Studio 中选择设备，点击 Run

---

## 预计时间线

- **准备阶段**: 1-2 天
- **开发配置**: 1 天
- **App Store 提交**: 1-2 天
- **审核等待**: 1-7 天（iOS），1-3 天（Android）
- **总计**: 约 1-2 周

---

## 资源链接

- [Apple App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Capacitor 文档](https://capacitorjs.com/docs)
- [iOS 人机界面指南](https://developer.apple.com/design/human-interface-guidelines/)
- [Android 设计指南](https://developer.android.com/design)

