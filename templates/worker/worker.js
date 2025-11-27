const PRODUCT_CONFIG = {

  name: "__PRODUCT_NAME__",

  slug: "__PRODUCT_SLUG__",

  themeColor: "__THEME_COLOR__",

  model: "__MODEL_NAME__",

  systemPrompt: `__SYSTEM_PROMPT__`

};



async function callOpenAI(apiKey, messages, model) {

  const res = await fetch("https://api.openai.com/v1/chat/completions", {

    method: "POST",

    headers: {

      Authorization: `Bearer ${apiKey}`,

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