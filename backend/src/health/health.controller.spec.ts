import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return health status', () => {
      const result = controller.checkHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'rh-backend');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return current timestamp in ISO format', () => {
      const beforeCall = new Date();
      const result = controller.checkHealth();
      const afterCall = new Date();

      const timestamp = new Date(result.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should always return status ok', () => {
      const result1 = controller.checkHealth();
      const result2 = controller.checkHealth();

      expect(result1.status).toBe('ok');
      expect(result2.status).toBe('ok');
    });

    it('should return consistent service name', () => {
      const result = controller.checkHealth();

      expect(result.service).toBe('rh-backend');
    });

    it('should return different timestamps on subsequent calls', async () => {
      const result1 = controller.checkHealth();

      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));

      const result2 = controller.checkHealth();

      expect(result1.timestamp).not.toBe(result2.timestamp);
      expect(new Date(result2.timestamp).getTime()).toBeGreaterThan(
        new Date(result1.timestamp).getTime()
      );
    });
  });
});