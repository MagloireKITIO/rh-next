import { Module, Global } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PerformanceTestService } from './performance-test.service';

@Global()
@Module({
  providers: [TransactionService, PerformanceTestService],
  exports: [TransactionService, PerformanceTestService],
})
export class CommonModule {}