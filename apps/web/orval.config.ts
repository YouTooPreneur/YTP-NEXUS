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
      override: {
        mutator: { path: './src/requests/nexus-fetch.ts', name: 'nexusFetch' },
        fetch: { forceSuccessResponse: true },
        query: {
          options: { retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false },
        },
      },
    },
  },
});
