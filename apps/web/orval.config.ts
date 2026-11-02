import { defineConfig } from 'orval';

export default defineConfig({
  nexus: {
    input: { target: '../../packages/contracts/openapi.json' },
    output: {
      target: './src/api/nexus.ts',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'single',
      clean: true,
    },
  },
});
