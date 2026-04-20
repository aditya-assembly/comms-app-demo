import { useQuery } from '@tanstack/react-query'

interface ContextualDataOptions {
  enabled?: boolean
}

export function useContextualData(
  _assemblyId: string | undefined,
  _key: string | undefined,
  options?: ContextualDataOptions,
) {
  return useQuery({
    queryKey: ['contextualData', _assemblyId, _key],
    queryFn: async () => null,
    enabled: options?.enabled ?? false,
  })
}

export function useAssemblyContext(_assemblyId: string | undefined) {
  return {
    data: null,
    isLoading: false,
  }
}
