// 共享工具库 (Shared Utilities)

/**
 * 标准 JSON 响应
 * @param {Object} data - 响应数据
 * @param {number} status - HTTP 状态码 (默认 200)
 * @returns {Response}
 */
export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // 允许跨域
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-license-key"
        }
    });
}

/**
 * 错误响应
 * @param {string} message - 错误信息
 * @param {number} status - HTTP 状态码 (默认 500)
 * @returns {Response}
 */
export function errorResponse(message, status = 500) {
    return jsonResponse({ error: message }, status);
}

/**
 * 处理 CORS 预检请求
 * @returns {Response}
 */
export function handleCors() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-license-key"
        }
    });
}

/**
 * 简单的哈希函数 (用于指纹识别)
 * @param {string} str 
 * @returns {Promise<string>}
 */
export async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 * @returns {string}
 */
export function getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}
