import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiStatus } from './ApiStatus';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main>
        <h1 className="font-title text-2xl font-semibold">YTP Nexus</h1>
        <ApiStatus />
      </main>
    </QueryClientProvider>
  );
}
