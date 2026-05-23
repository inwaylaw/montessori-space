# TestFlight 发布预检

当前 Windows 环境不能直接上传 TestFlight。上传需要 macOS、Xcode、Apple Developer Program 账号，以及 App Store Connect 中已创建的 app 记录。

## 需要先确认

- Apple Developer Team ID。
- 正式 bundle id。建议使用你拥有域名或品牌命名空间下的反向域名，例如 `com.<your-org>.montessoridailycards`。
- Widget extension bundle id，通常为主 bundle id 后追加 `.widget`。
- App Store Connect 中创建同 bundle id 的 app 记录。
- Xcode 登录对应 Apple ID，并允许自动签名。

不要直接使用当前占位 bundle id `local.montessori.dailycards` / `local.montessori.dailycards.widget` 上传正式 TestFlight。

## Xcode 图形界面上传

1. 在 Mac 上打开 `MontessoriDailyCards.xcodeproj`。
2. 选择 `MontessoriDailyCards` target，设置 Team 和 bundle id。
3. 选择 `MontessoriDailyCardsWidget` target，设置同一个 Team 和 widget bundle id。
4. 选择 Any iOS Device，执行 `Product > Archive`。
5. 在 Organizer 中点 `Distribute App`。
6. 选择 `App Store Connect`，再选择 `Upload`。
7. 使用自动签名，完成上传。
8. 等 App Store Connect 处理完成后，在 TestFlight 页面加入内部测试人员。

## 命令行上传参考

在 Mac 上执行，先替换 Team 和 bundle id 设置：

```bash
cd "/path/to/goal/ios"
xcodebuild \
  -project MontessoriDailyCards.xcodeproj \
  -scheme MontessoriDailyCards \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$PWD/build/MontessoriDailyCards.xcarchive" \
  archive

xcodebuild \
  -exportArchive \
  -archivePath "$PWD/build/MontessoriDailyCards.xcarchive" \
  -exportPath "$PWD/build/export" \
  -exportOptionsPlist "$PWD/TestFlight/ExportOptions.plist"
```

如果使用 Xcode GUI 的 `Distribute App > Upload`，通常不需要手动运行第二条命令。

## Beta Review 备注建议

```text
This TestFlight build is a local-first Montessori observation card preview. It uses bundled synthetic sample data by default. It does not collect camera input, does not store raw child images, and does not perform child scoring, diagnosis, identity recognition, or emotion recognition. The local demo sync button is optional and falls back to bundled synthetic cards if no local demo endpoint is reachable.
```

## 已在工程中准备

- `ITSAppUsesNonExemptEncryption = false`，用于声明本版本不使用非豁免加密。
- `PrivacyInfo.xcprivacy`，声明本版本不跟踪、不采集数据、不使用需声明的 required reason API。
- `ExportOptions.plist`，用于 App Store Connect 上传导出。
