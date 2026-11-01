import { describeAlertsRepository } from './alertsRepository.contract';
import { MemoryAlertsRepository } from './memoryAlertsRepository';

describeAlertsRepository('MemoryAlertsRepository', () =>
  Promise.resolve(new MemoryAlertsRepository()),
);
