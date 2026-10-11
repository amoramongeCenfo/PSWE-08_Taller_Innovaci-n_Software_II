import type { BusinessRepository } from './businessRepository';
import type { Business, BusinessInput } from './types';

export class MemoryBusinessRepository implements BusinessRepository {
  private business: Business = { name: null, region: null, address: null };

  async get() {
    return { ...this.business };
  }

  async save(input: BusinessInput) {
    this.business = { ...this.business, name: input.name, address: input.address };
    return { ...this.business };
  }
}
