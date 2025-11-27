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



export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    if (url.pathname !== "/api/generate")

      return new Response("Not Found", { status: 404 });



    const method = request.method;



    // Handle GET request

    if (method === "GET") {

      return new Response(JSON.stringify({

        status: "ok",

        message: "API online. Use POST to send input."

      }), {

        status: 200,

        headers: {"Content-Type":"application/json"}

      });

    }



    // Handle POST request

    if (method === "POST") {

      try {

        const { input } = await request.json();



        if (!input) {

          return new Response(JSON.stringify({

            error: "Missing input field"

          }), {

            status: 400,

            headers: {"Content-Type":"application/json"}

          });

        }



        if (!env.OPENAI_API_KEY) {

          return new Response(JSON.stringify({

            error: "OPENAI_API_KEY not configured"

          }), {

            status: 500,

            headers: {"Content-Type":"application/json"}

          });

        }



        const messages = [

          { role: "system", content: PRODUCT_CONFIG.systemPrompt },

          { role: "user", content: input }

        ];



        const out = await callOpenAI(env.OPENAI_API_KEY, messages, PRODUCT_CONFIG.model);

        return new Response(JSON.stringify({ output: out }), {

          headers: {"Content-Type":"application/json"}

        });

      } catch (error) {

        console.error("Error in POST handler:", error);

        return new Response(JSON.stringify({

          error: error.message || "Internal server error",

          details: error.stack

        }), {

          status: 500,

          headers: {"Content-Type":"application/json"}

        });

      }

    }



    // For any other method, return a friendly response instead of 405

    return new Response(JSON.stringify({

      status: "error",

      message: "Method not supported. Please use GET or POST."

    }), {

      status: 200,

      headers: {"Content-Type":"application/json"}

    });

  }

};