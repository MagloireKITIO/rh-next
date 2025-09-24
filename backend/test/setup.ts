import { Test } from '@nestjs/testing';

jest.setTimeout(10000);

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
});

export const createTestingModule = async (providers: any[]) => {
  return await Test.createTestingModule({
    providers,
  }).compile();
};