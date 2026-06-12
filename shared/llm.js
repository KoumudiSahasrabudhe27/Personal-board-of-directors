import { AzureOpenAI } from 'openai';
import { DefaultAzureCredential } from '@azure/identity';

let client = null;

function getClient() {
  if (client) return client;

  const endpoint = process.env.AOAI_ENDPOINT;
  const deployment = process.env.AOAI_GPT_DEPLOYMENT || 'gpt-4o-mini';
  const apiKey = process.env.AOAI_API_KEY;

  if (!endpoint) {
    throw new Error('Missing AOAI_ENDPOINT. Deploy Azure resources via the IQ Series template first.');
  }

  client = new AzureOpenAI({
    endpoint,
    apiKey: apiKey || undefined,
    azureADTokenProvider: apiKey
      ? undefined
      : async () => {
          const cred = new DefaultAzureCredential();
          const token = await cred.getToken('https://cognitiveservices.azure.com/.default');
          return token.token;
        },
    apiVersion: process.env.AOAI_API_VERSION || '2024-08-01-preview',
    deployment
  });

  return client;
}

export async function callLLM(systemPrompt, userMessage, { maxTokens = 300 } = {}) {
  const openai = getClient();
  const model = process.env.AOAI_GPT_DEPLOYMENT || 'gpt-4o-mini';

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: maxTokens
  });

  return response.choices[0]?.message?.content?.trim() || 'No response received.';
}
