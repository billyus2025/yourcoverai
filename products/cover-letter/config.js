// 产品配置 (Product Configuration)
export default {
    name: "AI Cover Letter Generator",
    slug: "cover-letter",
    themeColor: "#0f766e",
    model: "gpt-4o-mini",
    systemPrompt: `You are a senior HR specialist and a top-tier career coach. Your job is to generate professional, compelling, personalized cover letters that match the user's background and the job description. Use a confident, human tone. Personalize based on user experience. Highlight achievements. Max 4 paragraphs. No generic filler. Include a strong closing.`,
    prices: {
        monthly: "STRIPE_PRICE_ID_MONTHLY", // 对应环境变量名
        yearly: "STRIPE_PRICE_ID_YEARLY"    // 对应环境变量名
    }
};
