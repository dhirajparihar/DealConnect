import { runWithTenantContext, getTenantContext, requireDealerId } from './tenant-context.js';
import { DealerRole } from '@dealconnect/shared-types';

describe('Tenant Context Store', () => {
  it('should isolate context across async execution boundaries', async () => {
    const dealerA = 'dealer-uuid-1111-1111-1111';
    const dealerB = 'dealer-uuid-2222-2222-2222';

    const promiseA = runWithTenantContext(
      { requestId: 'req_A', dealerId: dealerA, role: DealerRole.OWNER },
      async () => {
        await new Promise((r) => setTimeout(r, 20));
        return getTenantContext();
      }
    );

    const promiseB = runWithTenantContext(
      { requestId: 'req_B', dealerId: dealerB, role: DealerRole.SALES },
      async () => {
        await new Promise((r) => setTimeout(r, 10));
        return getTenantContext();
      }
    );

    const [contextA, contextB] = await Promise.all([promiseA, promiseB]);

    expect(contextA?.dealerId).toBe(dealerA);
    expect(contextA?.requestId).toBe('req_A');
    expect(contextB?.dealerId).toBe(dealerB);
    expect(contextB?.requestId).toBe('req_B');
  });

  it('should throw an error when requireDealerId is called without dealerId', () => {
    runWithTenantContext({ requestId: 'req_test' }, () => {
      expect(() => requireDealerId()).toThrow('Tenant context missing: dealer_id is required for this operation');
    });
  });
});
