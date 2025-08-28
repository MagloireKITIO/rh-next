import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  timeout?: number; // en millisecondes
  retries?: number; // nombre de tentatives en cas d'erreur
}

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount?: number;
  executionTime?: number;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Exécute une opération dans une transaction avec gestion d'erreur avancée
   */
  async executeTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<TransactionResult<T>> {
    const { isolationLevel, timeout = 30000, retries = 1 } = options;
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
        
        // Configurer l'isolation si spécifiée
        if (isolationLevel) {
          await queryRunner.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
        }
        
        // Configurer le timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction timeout')), timeout);
        });
        
        await queryRunner.startTransaction();
        
        // Exécuter l'opération avec timeout
        const result = await Promise.race([
          operation(queryRunner.manager),
          timeoutPromise
        ]) as T;
        
        await queryRunner.commitTransaction();
        
        const executionTime = Date.now() - startTime;
        this.logger.log(`✅ Transaction completed successfully in ${executionTime}ms (attempt ${attempt + 1})`);
        
        return {
          success: true,
          data: result,
          retryCount: attempt,
          executionTime
        };
        
      } catch (error) {
        await queryRunner.rollbackTransaction();
        
        const executionTime = Date.now() - startTime;
        this.logger.error(`❌ Transaction failed on attempt ${attempt + 1}/${retries + 1}:`, error);
        
        // Vérifier s'il faut retry selon le type d'erreur
        if (attempt < retries && this.shouldRetry(error)) {
          this.logger.log(`🔄 Retrying transaction in ${Math.pow(2, attempt) * 1000}ms...`);
          await this.sleep(Math.pow(2, attempt) * 1000); // Backoff exponentiel
          continue;
        }
        
        return {
          success: false,
          error: error.message,
          retryCount: attempt,
          executionTime
        };
        
      } finally {
        await queryRunner.release();
      }
    }
  }

  /**
   * Transaction simple sans retry ni configuration avancée
   */
  async execute<T>(operation: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.dataSource.transaction(operation);
  }

  /**
   * Exécute plusieurs opérations en parallèle dans des transactions séparées
   */
  async executeParallel<T>(
    operations: Array<(manager: EntityManager) => Promise<T>>,
    options: TransactionOptions = {}
  ): Promise<TransactionResult<T>[]> {
    const promises = operations.map(operation => 
      this.executeTransaction(operation, options)
    );
    
    return await Promise.all(promises);
  }

  /**
   * Transaction avec verrous pour éviter les accès concurrents
   */
  async executeWithLock<T>(
    operation: (manager: EntityManager) => Promise<T>,
    lockKey: string,
    options: TransactionOptions = {}
  ): Promise<TransactionResult<T>> {
    return await this.executeTransaction(async (manager) => {
      // Acquérir un verrou advisory PostgreSQL
      await manager.query('SELECT pg_advisory_lock($1)', [this.hashLockKey(lockKey)]);
      
      try {
        return await operation(manager);
      } finally {
        // Libérer le verrou
        await manager.query('SELECT pg_advisory_unlock($1)', [this.hashLockKey(lockKey)]);
      }
    }, options);
  }

  /**
   * Batch transaction pour traiter de gros volumes par chunks
   */
  async executeBatch<T, R>(
    items: T[],
    operation: (items: T[], manager: EntityManager) => Promise<R[]>,
    chunkSize: number = 100,
    options: TransactionOptions = {}
  ): Promise<TransactionResult<R[]>> {
    const startTime = Date.now();
    const results: R[] = [];
    
    try {
      // Traiter par chunks
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        
        const chunkResult = await this.executeTransaction(
          async (manager) => await operation(chunk, manager),
          options
        );
        
        if (!chunkResult.success) {
          return {
            success: false,
            error: `Batch failed at chunk ${Math.floor(i / chunkSize) + 1}: ${chunkResult.error}`,
            executionTime: Date.now() - startTime
          };
        }
        
        results.push(...chunkResult.data);
        
        // Log progression
        this.logger.log(`Batch progress: ${Math.min(i + chunkSize, items.length)}/${items.length} items processed`);
      }
      
      return {
        success: true,
        data: results,
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Détermine s'il faut retry selon le type d'erreur
   */
  private shouldRetry(error: any): boolean {
    const retryableErrors = [
      'connection', 
      'timeout',
      'deadlock',
      'serialization_failure',
      'connection_failure'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Hash simple pour les clés de verrou
   */
  private hashLockKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit
    }
    return Math.abs(hash);
  }

  /**
   * Helper pour les delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}