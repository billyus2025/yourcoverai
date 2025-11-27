# Checkout 错误排查指南

## 错误信息："Failed to create checkout session"

### 可能原因和解决方案

#### 1. **Worker 环境变量未配置**

**检查步骤：**
1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages → yourcoverai
3. 点击 Settings → Variables
4. 确认以下环境变量已设置：
   - `STRIPE_SECRET_KEY` (格式: `sk_test_...` 或 `sk_live_...`)
   - `STRIPE_PRICE_MONTHLY` (格式: `price_...`)
   - `STRIPE_PRICE_YEARLY` (格式: `price_...`)
   - `APP_BASE_URL` (格式: `https://yourcoverai.com` 或你的域名)

**如何获取 Stripe 信息：**
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 Products → 创建或查看产品
3. 创建两个价格：
   - Monthly: $9.9/month (订阅模式)
   - Yearly: $79/year (订阅模式)
4. 复制每个价格的 Price ID (格式: `price_xxxxx`)
5. 在 API Keys 页面获取 Secret Key

#### 2. **Worker 未部署或部署失败**

**检查步骤：**
```bash
cd products/cover-letter/worker
npx wrangler deploy
```

**查看部署日志：**
- 检查是否有错误信息
- 确认 Worker 名称正确
- 确认 `wrangler.toml` 配置正确

#### 3. **网络请求失败**

**检查步骤：**
1. 打开浏览器开发者工具 (F12)
2. 进入 Network 标签
3. 点击 "Subscribe Monthly" 按钮
4. 查看 `/create-checkout-session` 请求：
   - Status Code: 应该是 200
   - Response: 查看返回的错误信息

**常见错误：**
- `404 Not Found`: Worker 路由未匹配，检查路由配置
- `500 Internal Server Error`: Worker 内部错误，查看 Worker 日志
- `CORS error`: 检查 Worker 的 CORS 设置

#### 4. **Stripe API 调用失败**

**检查步骤：**
1. 在 Cloudflare Dashboard 查看 Worker 日志
2. 查找错误信息，常见错误：
   - `Invalid API Key`: STRIPE_SECRET_KEY 错误
   - `No such price`: Price ID 不存在或错误
   - `Invalid request`: 请求参数错误

#### 5. **调试方法**

**在 Worker 中添加日志：**
```javascript
console.log("Checkout request:", {
  plan,
  hasSecretKey: !!env.STRIPE_SECRET_KEY,
  hasMonthlyPrice: !!env.STRIPE_PRICE_MONTHLY,
  hasYearlyPrice: !!env.STRIPE_PRICE_YEARLY,
  hasBaseUrl: !!env.APP_BASE_URL
});
```

**查看 Worker 实时日志：**
```bash
npx wrangler tail
```

**测试 API 端点：**
```bash
curl -X POST https://yourcoverai.workers.dev/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"plan":"monthly"}'
```

### 快速检查清单

- [ ] Worker 已部署 (`npx wrangler deploy`)
- [ ] 环境变量已配置（4个变量）
- [ ] Stripe 账户已创建产品和价格
- [ ] Price ID 格式正确 (`price_...`)
- [ ] Secret Key 格式正确 (`sk_test_...` 或 `sk_live_...`)
- [ ] APP_BASE_URL 格式正确 (`https://...`)
- [ ] 浏览器控制台无 CORS 错误
- [ ] Network 请求返回 200 状态码

### 测试步骤

1. **测试 Worker 健康检查：**
   ```
   GET https://yourcoverai.workers.dev/api/generate
   ```
   应该返回: `{"status":"ok","message":"API online..."}`

2. **测试 Checkout 端点：**
   ```bash
   curl -X POST https://yourcoverai.workers.dev/create-checkout-session \
     -H "Content-Type: application/json" \
     -d '{"plan":"monthly"}'
   ```
   应该返回: `{"id":"cs_test_...","url":"https://checkout.stripe.com/..."}`

3. **如果返回错误：**
   - 查看错误信息中的具体原因
   - 检查 Worker 日志 (`npx wrangler tail`)
   - 确认环境变量配置正确

### 常见错误信息

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `STRIPE_SECRET_KEY not configured` | 环境变量未设置 | 在 Cloudflare Dashboard 设置变量 |
| `STRIPE_PRICE_MONTHLY not configured` | 月付价格 ID 未设置 | 设置 `STRIPE_PRICE_MONTHLY` 变量 |
| `Stripe API error: 401` | API Key 无效 | 检查 Stripe Secret Key 是否正确 |
| `Stripe API error: 404` | Price ID 不存在 | 检查 Price ID 是否正确 |
| `No checkout URL received` | Stripe 返回格式错误 | 检查 Worker 日志，查看 Stripe 响应 |

### 联系支持

如果以上步骤都无法解决问题，请提供：
1. Worker 日志 (`npx wrangler tail` 的输出)
2. 浏览器 Network 标签的请求/响应详情
3. 环境变量配置截图（隐藏敏感信息）
4. `wrangler.toml` 文件内容

