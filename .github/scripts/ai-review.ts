/**
 * AI Code Review Script for VhanDelivery
 * Supports multiple AI providers: Gemini (Free), Groq (Free), OpenAI
 *
 * Usage: Called by GitHub Action on PR events
 *
 * Environment Variables:
 * - AI_PROVIDER: 'gemini' | 'groq' | 'openai' (default: 'gemini')
 * - GEMINI_API_KEY: Required if using Gemini (FREE at https://aistudio.google.com/)
 * - GROQ_API_KEY: Required if using Groq (FREE at https://console.groq.com/)
 * - OPENAI_API_KEY: Required if using OpenAI (PAID)
 * - AI_MODEL: Optional, override default model for each provider
 *
 * Auto-provided by GitHub Actions (NO need to add):
 * - GITHUB_TOKEN: Automatically provided
 * - GITHUB_REPOSITORY: Automatically set (e.g., owner/repo)
 * - PR_NUMBER: Set from workflow
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// =============================================================================
// CONFIGURATION - Easy to change AI provider here!
// =============================================================================
type AIProvider = 'gemini' | 'groq' | 'openai';

const AI_PROVIDER = (process.env['AI_PROVIDER'] || 'gemini') as AIProvider;

const PROVIDER_CONFIG: Record<
  AIProvider,
  { envKey: string; defaultModel: string; name: string }
> = {
  gemini: {
    envKey: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.0-flash', // Free, fast (updated model name)
    name: 'Google Gemini',
  },
  groq: {
    envKey: 'GROQ_API_KEY',
    defaultModel: 'llama-3.3-70b-versatile', // Free, very fast
    name: 'Groq (Llama 3.3)',
  },
  openai: {
    envKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini', // Paid but cheap
    name: 'OpenAI GPT-4o Mini',
  },
};

// =============================================================================
// Types
// =============================================================================
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

interface GroqOpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// =============================================================================
// Environment Variables
// =============================================================================
const config = PROVIDER_CONFIG[AI_PROVIDER];
const API_KEY = process.env[config.envKey];
const AI_MODEL = process.env['AI_MODEL'] || config.defaultModel;

// Auto-provided by GitHub Actions - NO need to add manually!
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];
const GITHUB_REPOSITORY = process.env['GITHUB_REPOSITORY'];
const PR_NUMBER = process.env['PR_NUMBER'];

// Validation
if (!API_KEY) {
  console.error(`❌ ${config.envKey} is required for ${config.name}`);
  console.error(`   Get free key at:`);
  console.error(`   - Gemini: https://aistudio.google.com/app/apikey`);
  console.error(`   - Groq: https://console.groq.com/keys`);
  process.exit(1);
}

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !PR_NUMBER) {
  console.error(
    '❌ GitHub environment variables are required (auto-provided in Actions)'
  );
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');

/**
 * Get git diff for the PR
 */
function getGitDiff(): string {
  try {
    // Fetch the base branch to compare
    execSync('git fetch origin main', { stdio: 'pipe' });

    // Get diff between main and current HEAD
    const diff = execSync('git diff origin/main...HEAD --unified=3', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    return diff;
  } catch (error) {
    console.error('Error getting git diff:', error);
    return '';
  }
}

/**
 * Load AI review rules from markdown file
 */
function loadRules(): string {
  const rulesPath = '.github/AI_RULES.md';

  if (existsSync(rulesPath)) {
    console.log('✅ Loaded custom rules from .github/AI_RULES.md');
    return readFileSync(rulesPath, 'utf-8');
  }

  console.log('⚠️ No custom rules found, using default Angular guidelines');
  return 'Review theo Angular best practices và TypeScript strict mode.';
}

/**
 * Build the review prompt
 */
function buildPrompt(diff: string, rules: string): string {
  return `
You are a Senior Angular/NestJS Developer and Tech Lead of the VhanDelivery project.
Your task: Review the code diff below and report any issues.

## RULES (MUST FOLLOW STRICTLY):
${rules}

## RESPONSE GUIDELINES:
1. Categorize issues by severity:
   - 🚨 CRITICAL: Severe violations that must be fixed before merge
   - ⚠️ WARNING: Should be fixed to improve code quality
   - 💡 INFO: Minor suggestions, optional

2. Format each issue as:
   **[SEVERITY] File: \`path/to/file.ts\` Line: XX**
   - Describe the issue
   - Quote the violating code (if applicable)
   - Suggest how to fix it

3. At the end, provide a SUMMARY:
   - Count of CRITICAL / WARNING / INFO issues
   - Overall verdict: APPROVE or REQUEST_CHANGES

4. If the code is good, give brief praise.

5. Be concise but thorough.

## CODE DIFF TO REVIEW:
\`\`\`diff
${diff.substring(0, 50000)}
\`\`\`
`;
}

/**
 * Call Gemini API
 */
async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${AI_MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gemini API error: ${response.status} - ${await response.text()}`
    );
  }

  const data = (await response.json()) as GeminiResponse;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
}

/**
 * Call Groq API (OpenAI-compatible)
 */
async function callGroq(prompt: string): Promise<string> {
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Groq API error: ${response.status} - ${await response.text()}`
    );
  }

  const data = (await response.json()) as GroqOpenAIResponse;
  return data.choices?.[0]?.message?.content || 'No response';
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI API error: ${response.status} - ${await response.text()}`
    );
  }

  const data = (await response.json()) as GroqOpenAIResponse;
  return data.choices?.[0]?.message?.content || 'No response';
}

/**
 * Call AI based on selected provider
 */
async function callAI(diff: string, rules: string): Promise<string> {
  const prompt = buildPrompt(diff, rules);

  switch (AI_PROVIDER) {
    case 'gemini':
      return callGemini(prompt);
    case 'groq':
      return callGroq(prompt);
    case 'openai':
      return callOpenAI(prompt);
    default:
      throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
  }
}

/**
 * Post comment to GitHub PR
 */
async function postGitHubComment(body: string): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({ body }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }

  console.log('✅ Posted review comment to PR');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🤖 VhanDelivery AI Code Review');
  console.log(`📦 Repository: ${GITHUB_REPOSITORY}`);
  console.log(`🔢 PR Number: ${PR_NUMBER}`);
  console.log(`🧠 AI Provider: ${config.name} (${AI_MODEL})`);
  console.log('');

  // 1. Get diff
  console.log('📝 Getting git diff...');
  const diff = getGitDiff();

  if (!diff.trim()) {
    console.log('ℹ️ No changes detected, skipping review');
    return;
  }

  console.log(`📊 Diff size: ${diff.length} characters`);

  // 2. Load rules
  console.log('📋 Loading review rules...');
  const rules = loadRules();

  // 3. Call AI
  console.log(`🧠 Sending to ${config.name} for review...`);
  const reviewResult = await callAI(diff, rules);

  // 4. Format and post comment
  const commentBody = `
## 🤖 AI Code Review (${config.name})

${reviewResult}

---
<sub>Powered by VhanDelivery AI Review Bot | Model: ${AI_MODEL} | [View Rules](.github/AI_RULES.md)</sub>
`;

  console.log('💬 Posting comment to PR...');
  await postGitHubComment(commentBody);

  console.log('✅ Review completed successfully!');
}

// Run
main().catch((error) => {
  console.error('❌ Review failed:', error);
  process.exit(1);
});
