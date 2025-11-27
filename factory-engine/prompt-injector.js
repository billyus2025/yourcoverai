function injectSystemPrompt(template, prompt) {

  return template

    .replace(/__SYSTEM_PROMPT__/g, prompt.replace(/\`/g, "\\`"))

    .replace(/\$/g, "\\$");

}



function replacePlaceholders(str, map) {

  return Object.entries(map).reduce(

    (acc, [k, v]) => acc.replace(new RegExp(`__${k}__`, "g"), v),

    str

  );

}



module.exports = { injectSystemPrompt, replacePlaceholders };