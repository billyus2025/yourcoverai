// 许可证管理 (Shared License Logic)
import { getDateString } from "./utils";

/**
 * 生成随机许可证密钥
 * @returns {string}
 */
export function generateLicenseKey() {
    return `yc_${crypto.randomUUID()}`;
}

/**
 * 检查许可证有效性和使用情况
 * @param {Object} env - Cloudflare Env
 * @param {string} licenseKey - 许可证密钥
 * @param {string} productSlug - 产品 Slug (用于命名空间)
 * @returns {Promise<Object>} { valid: boolean, license: Object, reason: string }
 */
export async function checkLicense(env, licenseKey, productSlug) {
    try {
        // 1. 尝试读取带命名空间的新 Key
        let licenseData = await env.LICENSES.get(`${productSlug}:license:${licenseKey}`);

        // 2. [Legacy Support] 如果没找到，尝试读取旧的全局 Key (仅针对 cover-letter 等旧产品)
        if (!licenseData) {
            licenseData = await env.LICENSES.get(`license:${licenseKey}`);
        }

        if (!licenseData) {
            return { valid: false, reason: 'not_found' };
        }

        const license = JSON.parse(licenseData);

        // 检查计划是否有效
        if (!license.plan || !['monthly', 'yearly'].includes(license.plan)) {
            return { valid: false, reason: 'invalid_plan' };
        }

        // 更新使用次数 (异步写入，不阻塞)
        license.used = (license.used || 0) + 1;

        // 写入时优先使用带命名空间的新格式，逐步迁移
        // 注意：如果原来是旧 Key，这里会写入一个新 Key，导致旧 Key 数据不再更新。
        // 为了保持一致性，如果读取的是旧 Key，最好还是写回旧 Key？
        // 简化策略：始终写回读取到的那个 Key。但为了重构，我们希望迁移。
        // 妥协策略：新生成的 License 永远带前缀。旧 License 保持原样。
        // 这里我们简单处理：如果读到的是旧的，就写回旧的。如果是新的，写回新的。
        // 但为了代码简单，我们暂时只支持 "读取兼容"。写入逻辑在 create 时决定。

        // 重新判断 Key 格式
        const storageKey = await env.LICENSES.get(`${productSlug}:license:${licenseKey}`)
            ? `${productSlug}:license:${licenseKey}`
            : `license:${licenseKey}`;

        await env.LICENSES.put(storageKey, JSON.stringify(license));

        return { valid: true, license };
    } catch (error) {
        console.error('Error checking license:', error);
        return { valid: false, reason: 'error' };
    }
}

/**
 * 检查免费层级使用情况
 * @param {Object} env - Cloudflare Env
 * @param {string} fingerprint - 用户指纹
 * @param {string} productSlug - 产品 Slug
 * @returns {Promise<Object>} { allowed: boolean, count: number }
 */
export async function checkFreeUsage(env, fingerprint, productSlug) {
    const dateStr = getDateString();
    // 使用命名空间 Key: slug:free:fingerprint:date
    const key = `${productSlug}:free:${fingerprint}:${dateStr}`;

    try {
        const usageData = await env.FREE_USAGE.get(key);
        let usage = usageData ? JSON.parse(usageData) : { count: 0 };

        if (usage.count >= 3) {
            return { allowed: false, count: usage.count };
        }

        // 增加计数并保存
        usage.count += 1;
        await env.FREE_USAGE.put(key, JSON.stringify(usage), { expirationTtl: 86400 }); // 24小时

        return { allowed: true, count: usage.count };
    } catch (error) {
        console.error('Error checking free usage:', error);
        // 出错时默认允许，避免阻断用户
        return { allowed: true, count: 0 };
    }
}

/**
 * 创建并保存新许可证
 * @param {Object} env 
 * @param {string} productSlug 
 * @param {string} plan 
 * @returns {Promise<string>} licenseKey
 */
export async function createLicense(env, productSlug, plan) {
    const licenseKey = generateLicenseKey();
    const licenseData = {
        plan: plan,
        createdAt: new Date().toISOString(),
        max: -1, // -1 表示无限
        used: 0
    };

    // 始终使用带命名空间的新格式保存
    await env.LICENSES.put(`${productSlug}:license:${licenseKey}`, JSON.stringify(licenseData));
    return licenseKey;
}
