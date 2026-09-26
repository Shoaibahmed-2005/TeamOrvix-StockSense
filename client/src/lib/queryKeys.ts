// Central query key registry — import from here in every page.
// Using this ensures socket invalidations hit every affected query.

export const QK = {
  dashboard: ['dashboard'] as const,
  notifications: ['notifications'] as const,
  stock: ['stock'] as const,
  products: ['products'] as const,
  categories: ['categories'] as const,
  contacts: ['contacts'] as const,
  locations: ['locations'] as const,
  warehouses: ['warehouses'] as const,
  moves: ['moves'] as const,
  operations: (type?: string) => type ? ['operations', type] : ['operations'],
  operation: (id: string) => ['operation', id],
};

/** Call this after any inventory mutation (validate, cancel, adjust, etc.) */
export function invalidateInventory(queryClient: import('@tanstack/react-query').QueryClient) {
  queryClient.invalidateQueries({ queryKey: QK.dashboard });
  queryClient.invalidateQueries({ queryKey: QK.stock });
  queryClient.invalidateQueries({ queryKey: QK.moves });
  queryClient.invalidateQueries({ queryKey: QK.notifications });
  queryClient.invalidateQueries({ queryKey: QK.operations() });
  queryClient.invalidateQueries({ queryKey: QK.products });
}
