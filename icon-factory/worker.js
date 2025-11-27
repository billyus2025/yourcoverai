const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load config
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Load base prompt template
const promptTemplatePath = path.join(__dirname, 'prompts', 'base.txt');
const promptTemplate = fs.readFileSync(promptTemplatePath, 'utf8');

// Replace template variables
function buildPrompt(name, style) {
  const styleDescription = config.styles[style] || config.styles.professional;
  return promptTemplate
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{style\}\}/g, styleDescription);
}

// Generate icon using OpenAI DALL-E
async function generateIcon(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1024',
      quality: 'hd',
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].b64_json;
}

// Save base64 image to file
function saveImage(base64Data, outputPath) {
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Icon saved to: ${outputPath}`);
}

// Git operations
function gitAddCommitPush(filePath, name) {
  try {
    const repoRoot = path.resolve(__dirname, '../..');
    process.chdir(repoRoot);
    
    console.log(`Adding ${filePath} to git...`);
    execSync(`git add "${filePath}"`, { stdio: 'inherit' });
    
    console.log(`Committing icon for ${name}...`);
    execSync(`git commit -m "Generate icon for ${name}"`, { stdio: 'inherit' });
    
    console.log('Pushing to GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('Git operations completed successfully');
  } catch (error) {
    console.error('Git operation failed:', error.message);
    // Don't throw, just log - icon generation should still succeed
  }
}

// Main function for CLI usage
async function generateIconCLI(name, style = 'professional') {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  console.log(`Generating icon for "${name}" with style "${style}"...`);
  
  // Build prompt
  const prompt = buildPrompt(name, style);
  console.log('Prompt:', prompt);

  // Generate icon
  console.log('Calling OpenAI DALL-E API...');
  const base64Image = await generateIcon(apiKey, prompt);

  // Save to file
  const outputDir = path.join(__dirname, 'outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const fileName = `${name}.png`;
  const outputPath = path.join(outputDir, fileName);
  saveImage(base64Image, outputPath);

  // Git operations
  const repoRoot = path.resolve(__dirname, '../..');
  const relativePath = path.relative(repoRoot, outputPath);
  gitAddCommitPush(relativePath, name);

  return {
    status: 'ok',
    file: outputPath,
    relativePath: `icon-factory/outputs/${fileName}`
  };
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node worker.js <name> [style]');
    console.log('Example: node worker.js yourcoverai professional');
    process.exit(1);
  }

  const name = args[0];
  const style = args[1] || 'professional';

  generateIconCLI(name, style)
    .then(result => {
      console.log('\n✅ Icon generated successfully!');
      console.log(`File: ${result.relativePath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

// Export for use as module
module.exports = { generateIconCLI, buildPrompt };
