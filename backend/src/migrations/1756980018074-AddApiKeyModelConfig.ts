import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class AddApiKeyModelConfig1756980018074 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Créer la table api_key_model_configs
        await queryRunner.createTable(new Table({
            name: "api_key_model_configs",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "api_key_id",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "primary_model",
                    type: "varchar",
                    isNullable: false
                },
                {
                    name: "fallback_model_1",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "fallback_model_2",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "fallback_model_3",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "is_active",
                    type: "boolean",
                    default: true
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP"
                }
            ]
        }));

        // Créer la contrainte de clé étrangère
        await queryRunner.createForeignKey(
            "api_key_model_configs",
            new TableForeignKey({
                name: "FK_api_key_model_configs_api_key_id",
                columnNames: ["api_key_id"],
                referencedTableName: "api_keys",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );

        // Créer les index
        await queryRunner.createIndex(
            "api_key_model_configs",
            new TableIndex({
                name: "IDX_api_key_model_configs_api_key_id",
                columnNames: ["api_key_id"]
            })
        );

        await queryRunner.createIndex(
            "api_key_model_configs",
            new TableIndex({
                name: "IDX_api_key_model_configs_is_active",
                columnNames: ["is_active"]
            })
        );

        // Créer un index unique sur api_key_id pour une seule config active par clé
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_api_key_model_configs_unique_active" 
            ON "api_key_model_configs" ("api_key_id") 
            WHERE "is_active" = true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer l'index unique conditionnel
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_key_model_configs_unique_active"`);
        
        // Supprimer les index
        await queryRunner.dropIndex("api_key_model_configs", "IDX_api_key_model_configs_is_active");
        await queryRunner.dropIndex("api_key_model_configs", "IDX_api_key_model_configs_api_key_id");
        
        // Supprimer la contrainte de clé étrangère
        await queryRunner.dropForeignKey("api_key_model_configs", "FK_api_key_model_configs_api_key_id");
        
        // Supprimer la table
        await queryRunner.dropTable("api_key_model_configs");
    }

}
