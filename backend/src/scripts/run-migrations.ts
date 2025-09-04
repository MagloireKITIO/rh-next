import { DataSource } from 'typeorm';
import { CreateMailAutomation1700000006000 } from '../migrations/1700000006000-CreateMailAutomation';
import { InsertHRTemplates1700000008000 } from '../migrations/1700000008000-InsertHRTemplates';

// Configuration de la base de données
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: [
    CreateMailAutomation1700000006000,
    InsertHRTemplates1700000008000
  ],
  ssl: {
    rejectUnauthorized: false,
  },
  logging: true,
});

async function runMigrations() {
  try {
    console.log('🔄 Initialisation de la connexion à la base de données...');
    await AppDataSource.initialize();
    
    console.log('🔄 Exécution des migrations...');
    await AppDataSource.runMigrations();
    
    console.log('✅ Migrations exécutées avec succès !');
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error);
    process.exit(1);
  }
}

runMigrations();