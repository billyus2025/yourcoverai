// create-all.js

// 一键生成 SKYSEED AI 母工厂 V1 的全部目录与文件

// 复制这一整个文件到 Cursor 即可自动创建所有文件



const fs = require("fs");

const path = require("path");



function write(filePath, content) {

  const full = path.join(process.cwd(), filePath);

  fs.mkdirSync(path.dirname(full), { recursive: true });

  fs.writeFileSync(full, content);

  console.log("Created:", filePath);

}



// ==============================================

// DIRECTORY STRUCTURE & FILE CONTENTS

// ==============================================



const files = {

  "README.md": `# SKYSEED AI Product Factory (V1)



Usage example:

node factory-engine/create-product.js "AI Cover Letter" cover-letter "#0f766e" "You are a professional coach..."

`,



  "templates/config.json": `{

  "defaultModel": "gpt-4.1-mini",

  "defaultThemeColor": "#0f766e",

  "defaultSystemPrompt": "You are a helpful AI assistant."

}`,



  "templates/frontend/index.html": `<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8" />

  <title>__PRODUCT_NAME__</title>

  <script src="https://cdn.tailwindcss.com"></script>

</head>

<body class="p-6 text-white bg-slate-900">

  <h1 class="text-xl font-bold mb-2">__PRODUCT_NAME__</h1>

  <p class="mb-4">__PRODUCT_DESCRIPTION__</p>



  <textarea id="userInput" rows="5"

    class="w-full bg-slate-800 p-2 rounded mb-4"></textarea>



  <button id="submitBtn"

    class="bg-[__THEME_COLOR__] px-4 py-2 rounded">

    Generate

  </button>



  <pre id="output" class="mt-4 bg-slate-800 p-4 rounded"></pre>



<script>

document.getElementById("submitBtn").onclick = async () => {

  const output = document.getElementById("output");

  const input = document.getElementById("userInput").value.trim();

  if (!input) return alert("Enter input");

  output.textContent = "Thinking...";



  const res = await fetch("/api/generate", {

    method: "POST",

    headers: {"Content-Type":"application/json"},

    body: JSON.stringify({ input })

  });



  const data = await res.json();

  output.textContent = data.output || "(no output)";

};

</script>

</body>

</html>`,



  "templates/worker/worker.js": `const PRODUCT_CONFIG = {

  name: "__PRODUCT_NAME__",

  slug: "__PRODUCT_SLUG__",

  themeColor: "__THEME_COLOR__",

  model: "__MODEL_NAME__",

  systemPrompt: \`__SYSTEM_PROMPT__\`

};



async function callOpenAI(apiKey, messages, model) {

  const res = await fetch("https://api.openai.com/v1/chat/completions", {

    method: "POST",

    headers: {

      Authorization: \`Bearer \${apiKey}\`,

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

};`,



  "factory-engine/prompt-injector.js": `function injectSystemPrompt(template, prompt) {

  return template

    .replace(/__SYSTEM_PROMPT__/g, prompt.replace(/\\\`/g, "\\\\\`"))

    .replace(/\\\$/g, "\\\\$");

}



function replacePlaceholders(str, map) {

  return Object.entries(map).reduce(

    (acc, [k, v]) => acc.replace(new RegExp(\`__\${k}__\`, "g"), v),

    str

  );

}



module.exports = { injectSystemPrompt, replacePlaceholders };`,



  "factory-engine/create-product.js": `const fs = require("fs");

const path = require("path");

const { injectSystemPrompt, replacePlaceholders } = require("./prompt-injector");



function ensureDir(d) {

  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });

}

function readTemplate(p) {

  return fs.readFileSync(path.join(__dirname, "..", "templates", p), "utf8");

}

function write(p, c) {

  ensureDir(path.dirname(p));

  fs.writeFileSync(p, c);

  console.log("Created:", p);

}



function main() {

  const [name, slug, color, prompt] = process.argv.slice(2);

  if (!name || !slug || !color || !prompt) {

    console.log("Usage: node create-product.js \"Name\" slug \"#color\" \"Prompt\"");

    process.exit(1);

  }



  const model = "gpt-4.1-mini";

  const base = path.join("products", slug);



  // FRONTEND

  let front = readTemplate("frontend/index.html");

  front = replacePlaceholders(front, {

    PRODUCT_NAME: name,

    PRODUCT_DESCRIPTION: \`AI tool for \${name}\`,

    THEME_COLOR: color,

    MODEL_NAME: model

  });

  write(path.join(base, "frontend/index.html"), front);



  // WORKER

  let worker = readTemplate("worker/worker.js");

  worker = replacePlaceholders(worker, {

    PRODUCT_NAME: name,

    PRODUCT_SLUG: slug,

    THEME_COLOR: color,

    MODEL_NAME: model

  });

  worker = injectSystemPrompt(worker, prompt);

  write(path.join(base, "worker/worker.js"), worker);



  // CONFIG

  write(

    path.join(base, "product.config.json"),

    JSON.stringify({ name, slug, color, model, prompt }, null, 2)

  );



  console.log("\\n🎉 Product Generated:", slug);

}



main();`,



  "products/.gitkeep": ""

};



// ==============================================

// WRITE ALL FILES

// ==============================================

Object.entries(files).forEach(([file, content]) => write(file, content));



console.log("\n🚀 SKYSEED AI Factory V1 Installed Successfully!");

