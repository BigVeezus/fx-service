import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllUsers(
    page = 1,
    limit = 10,
  ): Promise<{ users: User[]; total: number; page: number; lastPage: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const lastPage = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      lastPage,
    };
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['wallets', 'transactions'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findUserById(id);

    // Update user properties
    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);

    await this.userRepository.remove(user);
  }
}
