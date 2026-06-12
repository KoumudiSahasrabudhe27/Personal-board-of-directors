import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { AzureKeyCredential } from '@azure/core-auth';
import { DefaultAzureCredential } from '@azure/identity';
import {
  SearchIndexClient,
  SearchClient
} from '@azure/search-documents';

const INDEX_NAME = process.env.BOARD_INDEX_NAME || 'board-decisions';
const INDEXED_SOURCE_NAME = process.env.BOARD_KNOWLEDGE_SOURCE || 'board-decisions-source';
const KB_NAME = process.env.KNOWLEDGE_BASE_NAME || 'board-decisions-kb';

function getCredential() {
  const apiKey = process.env.SEARCH_API_KEY;
  if (apiKey) return new AzureKeyCredential(apiKey);
  return new DefaultAzureCredential();
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
}

async function main() {
  const searchEndpoint = requireEnv('SEARCH_ENDPOINT').replace(/\/$/, '');
  const aoaiEndpoint = requireEnv('AOAI_ENDPOINT').replace(/\/$/, '');
  const embeddingDeployment = process.env.AOAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large';
  const embeddingModel = process.env.AOAI_EMBEDDING_MODEL || 'text-embedding-3-large';
  const gptDeployment = process.env.AOAI_GPT_DEPLOYMENT || 'gpt-4o-mini';
  const gptModel = process.env.AOAI_GPT_MODEL || 'gpt-4o-mini';

  const credential = getCredential();
  const indexClient = new SearchIndexClient(searchEndpoint, credential);

  console.log('Creating board decisions search index...');

  await indexClient.createOrUpdateIndex({
    name: INDEX_NAME,
    fields: [
      { name: 'id', type: 'Edm.String', key: true, filterable: true },
      { name: 'title', type: 'Edm.String', searchable: true },
      { name: 'verdict', type: 'Edm.String', searchable: true },
      { name: 'timestamp', type: 'Edm.String', filterable: true, sortable: true },
      {
        name: 'content',
        type: 'Edm.String',
        searchable: true,
        analyzerName: 'en.microsoft'
      },
      {
        name: 'content_embedding',
        type: 'Collection(Edm.Single)',
        stored: false,
        vectorSearchDimensions: 3072,
        vectorSearchProfileName: 'board_vector_profile'
      }
    ],
    vectorSearch: {
      profiles: [
        {
          name: 'board_vector_profile',
          algorithmConfigurationName: 'board_hnsw',
          vectorizerName: 'board_embedder'
        }
      ],
      algorithms: [{ name: 'board_hnsw', kind: 'hnsw' }],
      vectorizers: [
        {
          name: 'board_embedder',
          kind: 'azureOpenAI',
          azureOpenAIParameters: {
            resourceUri: aoaiEndpoint,
            deploymentName: embeddingDeployment,
            modelName: embeddingModel
          }
        }
      ]
    },
    semanticSearch: {
      defaultConfigurationName: 'board_semantic',
      configurations: [
        {
          name: 'board_semantic',
          prioritizedFields: {
            titleField: { name: 'title' },
            contentFields: [{ name: 'content' }]
          }
        }
      ]
    }
  });

  console.log(`Index "${INDEX_NAME}" ready.`);

  console.log('Creating Foundry IQ knowledge source...');
  await indexClient.createOrUpdateKnowledgeSource({
    name: INDEXED_SOURCE_NAME,
    description: 'Personal Board of Directors — past life decision sessions',
    kind: 'searchIndex',
    searchIndexParameters: {
      searchIndexName: INDEX_NAME,
      sourceDataFields: [
        { name: 'id' },
        { name: 'title' },
        { name: 'verdict' },
        { name: 'timestamp' }
      ]
    }
  });

  console.log('Creating Foundry IQ knowledge base...');
  await indexClient.createOrUpdateKnowledgeBase({
    name: KB_NAME,
    models: [
      {
        kind: 'azureOpenAI',
        azureOpenAIParameters: {
          resourceUri: aoaiEndpoint,
          deploymentName: gptDeployment,
          modelName: gptModel
        }
      }
    ],
    knowledgeSources: [{ name: INDEXED_SOURCE_NAME }],
    outputMode: 'extractiveData',
    answerInstructions:
      'Summarize relevant past life decisions. Include the original question, key advisor themes, and the board verdict.'
  });

  console.log(`Knowledge base "${KB_NAME}" ready.`);

  const searchClient = new SearchClient(searchEndpoint, INDEX_NAME, credential);
  const seedDoc = {
    id: randomUUID(),
    title: 'Should I leave my stable job for a startup?',
    verdict:
      'Weigh runway and learning goals against stability; negotiate a longer decision window before committing.',
    timestamp: new Date().toISOString(),
    content: [
      'Decision: Should I leave my stable job for a startup?',
      '',
      'Advisor responses:',
      'ceo: Prioritize long-term career capital — a startup can accelerate ownership if the domain aligns.',
      'investor: Model 12-month runway; equity is uncertain until liquidity.',
      'psychologist: Check burnout signals — a leap under exhaustion rarely ends well.',
      '',
      'Board verdict: Weigh runway and learning goals against stability; negotiate a longer decision window before committing.'
    ].join('\n')
  };

  await searchClient.uploadDocuments([seedDoc]);
  console.log('Seeded one sample decision for demo retrieval.');
  console.log('\nSetup complete. Start the app with: npm run dev');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
