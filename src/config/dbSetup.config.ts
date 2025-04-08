// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createConnection } from 'typeorm';

// @Injectable()
// export class DbSetupService {
//   private readonly logger = new Logger(DbSetupService.name);

//   constructor(private readonly configService: ConfigService) {}

//   async setupDb() {
//     const host = this.configService.get('DB_HOST', 'localhost');
//     const port = this.configService.get<number>('DB_PORT', 5432);
//     const username = this.configService.get('DB_USERNAME', 'postgres');
//     const password = this.configService.get('DB_PASSWORD', 'password');
//     const database = this.configService.get('DB_DATABASE', 'fx_trading');

//     // Create connection to the postgres server without specifying a database.
//     const connection = await createConnection({
//       type: 'postgres',
//       host,
//       port,
//       username,
//       password,
//       database: 'postgres', // Connect to the default database (postgres)
//     });

//     const queryRunner = connection.createQueryRunner();

//     try {
//       // Check if the target database exists
//       const dbCheck = await queryRunner.query(`
//         SELECT 1 FROM pg_database WHERE datname = '${database}';
//       `);

//       // If the database doesn't exist, create it
//       if (dbCheck.length === 0) {
//         await queryRunner.query(`CREATE DATABASE ${database}`);
//         this.logger.log(`Database ${database} created successfully.`);
//       } else {
//         this.logger.log(`Database ${database} already exists.`);
//       }

//       // Check if superuser exists
//       const roleCheck = await queryRunner.query(`
//         SELECT 1 FROM pg_roles WHERE rolname = 'superUser';
//       `);

//       // If superuser doesn't exist, create it
//       if (roleCheck.length === 0) {
//         await queryRunner.query(`
//           CREATE ROLE superUser WITH LOGIN PASSWORD 'superPassword';
//         `);
//         await queryRunner.query(`
//           ALTER ROLE superUser CREATEDB CREATEROLE;
//         `);
//         this.logger.log('SuperUser created successfully.');
//       } else {
//         this.logger.log('SuperUser already exists.');
//       }
//     } catch (error) {
//       this.logger.error('Error during DB setup:', error);
//     } finally {
//       await queryRunner.release();
//       await connection.close();
//     }
//   }
// }
