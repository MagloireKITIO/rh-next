import { DataSource } from 'typeorm';

// Configuration de la base de données
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: [],
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