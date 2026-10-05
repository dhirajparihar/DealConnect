import { AsyncLocalStorage } from 'async_hooks';
import { DealerRole } from '@dealconnect/shared-types';

export interface TenantContextStore {
  requestId: string;
  userId?: string;
  dealerId?: string;
  role?: DealerRole;
  isPlatformAdmin?: boolean;
}

export const tenantContextStorage = new AsyncLocalStorage<TenantContextStore>();

export function getTenantContext(): TenantContextStore | undefined {
  return tenantContextStorage.getStore();
}

export function runWithTenantContext<R>(context: TenantContextStore, fn: () => R): R {
  return tenantContextStorage.run(context, fn);
}

export function requireDealerId(): string {
  const context = getTenantContext();
  if (!context || !context.dealerId) {
    throw new Error('Tenant context missing: dealer_id is required for this operation');
  }
  return context.dealerId;
}
