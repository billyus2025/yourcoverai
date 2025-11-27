const fs = require("fs");

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

    console.log('Usage: node create-product.js "Name" slug "#color" "Prompt"');

    process.exit(1);

  }



  const model = "gpt-4.1-mini";

  const base = path.join("products", slug);



  // FRONTEND

  let front = readTemplate("frontend/index.html");

  front = replacePlaceholders(front, {

    PRODUCT_NAME: name,

    PRODUCT_DESCRIPTION: `AI tool for ${name}`,

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



  console.log("\n🎉 Product Generated:", slug);

}



main();