const PRODUCT_CONFIG = {

  name: "AI Cover Letter Generator",

  slug: "cover-letter",

  themeColor: "#0f766e",

  model: "gpt-4.1-mini",

  systemPrompt: `You are a senior HR specialist and a top-tier career coach. Your job is to generate professional, compelling, personalized cover letters that match the user's background and the job description. Use a confident, human tone. Personalize based on user experience. Highlight achievements. Max 4 paragraphs. No generic filler. Include a strong closing.`

};



async function callOpenAI(apiKey, messages, model) {

  const res = await fetch("https://api.openai.com/v1/chat/completions", {

    method: "POST",

    headers: {

      Authorization: `Bearer \${apiKey}`,

      "Content-Type": "application/json"

    },

    body: JSON.stringify({ model, messages })

  });



  const json = await res.json();

  return json.choices?.[0]?.message?.content || "";

}



export default {

  async fetch(request, env) {

    if (new URL(request.url).pathname !== "/api/generate")

      return new Response("Not Found", { status: 404 });



    const { input } = await request.json();



    const messages = [

      { role: "system", content: PRODUCT_CONFIG.systemPrompt },

      { role: "user", content: input }

    ];



    const out = await callOpenAI(env.OPENAI_API_KEY, messages, PRODUCT_CONFIG.model);

    return new Response(JSON.stringify({ output: out }), {

      headers: {"Content-Type":"application/json"}

    });

  }

};