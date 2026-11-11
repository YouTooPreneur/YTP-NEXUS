import { useGetHealth } from './api/nexus';

export function ApiStatus() {
  const { isPending, isSuccess, data } = useGetHealth();

  if (isPending) {
    return <p>API: checking…</p>;
  }

  if (isSuccess && data?.status === 200) {
    return <p>API: connected</p>;
  }

  return <p>API: not reachable</p>;
}
