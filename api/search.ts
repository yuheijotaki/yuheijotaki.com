import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleAuth } from 'google-auth-library';

const projectId = 'vertex-ai-search-488002';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const rawBody = await readBody(req);
  const { query } = JSON.parse(rawBody) as { query?: string };

  if (!query) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'query is required' }));
    return;
  }

  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!) as object;
  const auth = new GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const engineId = process.env.VERTEX_AI_SEARCH_ENGINE_ID;
  const url =
    `https://discoveryengine.googleapis.com/v1/projects/${projectId}` +
    `/locations/global/collections/default_collection/engines/${engineId}` +
    `/servingConfigs/default_config:search`;

  const apiRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, pageSize: 100 }),
  });

  const data = await apiRes.json();
  res.statusCode = apiRes.status;
  res.end(JSON.stringify(data));
}
