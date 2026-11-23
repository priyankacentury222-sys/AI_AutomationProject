import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { callOllama } from "./ollamaClient";

const execAsync = promisify(exec);

const SYSTEM_PROMPT = `You are an expert QA automation engineer who writes Playwright API tests in TypeScript.

Given an API endpoint description, generate a complete Playwright test file that:
- Uses Playwright's built-in "request" fixture (test.describe / test blocks)
- Imports { test, expect } from '@playwright/test'
- Calls Playwright API methods directly. For example:
  const response = await request.post('https://example.com/posts', { data: { title: 'Post' } });
  const response = await request.put(url, { data: body });
  await expect(response).toBeOK();
- Never use SuperAgent-style methods such as setBody, send, setMethod, or expect(status.code, value).
- Read JSON with await response.json().
- For JSONPlaceholder, POST /posts always returns a simulated 201 and only a generated id is guaranteed.
  Do not assert that missing, invalid, empty, or large payloads return 400/401/405; validate that this mock still returns 201 and an id.
  Do not assume echoed title/body/userId fields are guaranteed.
- For the happy path too, assert only 201 and a generated id because JSONPlaceholder does not guarantee echo fields.
- JSONPlaceholder's wrong-method response is 404 for PUT /posts, not 405.
- Use this exact response pattern for POST requests:
  const response = await request.post('https://jsonplaceholder.typicode.com/posts', { data: payload });
  expect(response.status()).toBe(201);
  const post = await response.json();
  expect(post).toHaveProperty('id');
- For all negative and edge POST cases, expect 201 and an id as well, because JSONPlaceholder is a permissive simulated API.
- Covers: 1 positive/happy-path case, 2-3 negative cases (invalid input, missing auth, wrong method), and 1-2 edge cases (boundary values, empty payloads)
- Includes clear, descriptive test titles
- Uses proper TypeScript typing for request/response bodies where the schema is known
- Adds a short comment above each test explaining WHY that case matters

Output ONLY the TypeScript code, no explanation before or after. Wrap it in a single code block.`;

/**
 * Helper to strip markdown code fences (```typescript ... ```) from LLM output
 */
function extractCodeBlock(markdown: string): string {
  const match = markdown.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : markdown.trim();
}

async function generateAndRunApiTests(endpointDescription: string, outputFileName: string) {
  console.log(`1. Generating Playwright API tests via Ollama (local)...`);
  const rawResult = await callOllama({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: endpointDescription,
  });

  //REQUEST

  // 2. Clean and save the generated code
  const cleanCode = extractCodeBlock(rawResult);
  const testDir = path.join(process.cwd(), "tests");
  const filePath = path.join(testDir, outputFileName);

  await fs.mkdir(testDir, { recursive: true });
  await fs.writeFile(filePath, cleanCode, "utf-8");
  console.log(`2. Saved generated tests to: ${filePath}\n`);

  // 3. Execute Playwright against the newly created file
  console.log(`3. Running Playwright tests...`);
  try {
    const { stdout, stderr } = await execAsync(`npx playwright test ${filePath}`);
    console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ All generated tests passed!`);
  } catch (error: any) {
    // Playwright exits with code 1 if any test fails, throwing an error in execAsync
    console.log(error.stdout);
    console.error(`❌ Some tests failed or encountered syntax errors.`);
  }
}

// ---- Demo run ----
const demoEndpoint = `
Base URL: https://jsonplaceholder.typicode.com
Endpoint: POST /posts
Description: Creates a new post (this is a fake/simulated REST API used for testing —
it always returns success and a fake generated id, but does not actually persist data).

Request body:
{
  "title": string (required),
  "body": string (required),
  "userId": number (required)
}

Success response: 201 Created
{
  "id": number,
  "title": string,
  "body": string,
  "userId": number
}

Notes:
- This API has no authentication.
- JSONPlaceholder accepts almost any payload on POST /posts and returns 201, so negative tests checking for 400 Bad Request may fail against this specific mock server.
`;

generateAndRunApiTests(demoEndpoint, "generated-posts.spec.ts");


//Local LLM through Ollama to generate Playwright API Tests and execute them
//System prompt (happy path negative path)
//extract the ts code and save to a tests folder 
//run the code
//AI workflow, Agent - prompt engineering, LLM Assisted test generation, Playwright API Automation