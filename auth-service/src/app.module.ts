import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/auth.entity';

@Module({
  imports: [ TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123',
      database: 'sharehubdb',
      entities: [Users],
      synchronize: true,
    }),AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
