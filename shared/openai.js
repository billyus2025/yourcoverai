// OpenAI API 封装 (Shared OpenAI Wrapper)

/**
 * 调用 OpenAI API
 * @param {string} apiKey - OpenAI API Key
 * @param {string} model - 模型名称 (如 gpt-4o-mini)
 * @param {Array} messages - 消息数组
 * @returns {Promise<string>} - AI 生成的内容
 */
export async function callOpenAI(apiKey, model, messages) {
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY not configured");
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ model, messages })
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("OpenAI API error:", res.status, errorText);
        throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "";
}
