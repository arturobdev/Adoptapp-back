import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { CreateUserDTO } from './dto/user.dto';
import { checkEmptyValues, checkValues } from 'src/Services/valuesValidation';
import { City } from 'src/city/entities/city.entity';
import { Pet } from 'src/pets/entities/pet.entity';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>
  ) { }

  validValues = ['fullname', 'age', 'email', 'phoneNumber', 'address', 'zipCode', 'hasPet', 'livingPlace', 'interestedIn'];

  async addUser(userDTO: CreateUserDTO): Promise<string> {
    try {
      // Check if required values are missing
      if (!checkValues(userDTO, this.validValues)) {
        throw new Error('Required fields missing: fullname, age, email, phoneNumber, address, zipCode, hasPet, livingPlace, interestedIn.');
      };
      // Check if empty values are not accepted
      if (!checkEmptyValues(userDTO)) {
        throw new Error('Empty fields are not accepted.');
      }
      // Verify the city with its zip code
      const cityCriteria: FindOneOptions = { where: { zipCode: Number(userDTO.zipCode) } };
      const city = await this.cityRepository.findOne(cityCriteria);
      // If the city doesn't exist, throw an error
      if (!city) {
        throw new Error(`There is no city with zip code ${userDTO.zipCode}.`);
      }

      if (userDTO.interestedIn.length === 0) {
        throw new Error('No pet information requested.');
      }

      const petCriteria: FindOneOptions = { where: { id: userDTO.interestedIn[0] } };
      const existingPet = await this.petRepository.findOne(petCriteria);

      if (!existingPet) {
        throw new Error(`There is no pet with ID ${userDTO.interestedIn[0]}.`);
      }

      const emailCriteria: FindOneOptions = { where: { email: userDTO.email }, relations: ['pets'] };
      const user: User = await this.userRepository.findOne(emailCriteria);

      if (!user) {

        const petCriteria: FindManyOptions = { where: { id: userDTO.interestedIn[0] } };
        const requestedPet = await this.petRepository.find(petCriteria);

        const newUser: User = new User(userDTO.fullname, userDTO.age, userDTO.email, userDTO.phoneNumber, userDTO.address, city, userDTO.hasPet, userDTO.livingPlace, requestedPet);

        if (!newUser) {
          throw new Error(`Error adding new user.`);
        };

        await this.userRepository.save(newUser);
        return `User ${newUser.getFullname()} was added.`
      }

      if (user && user.pets.length > 2) {
        throw new Error(`Maximum adoption requests reached.`);
      } else {

        const petRequested = user.pets.map(pet => pet.id);

        if (petRequested.includes(userDTO.interestedIn[0])) {
          throw new Error('You are already registered to adopt this pet.');
        } else {
          petRequested.push(userDTO.interestedIn[0]);
        }

        const petCriteria: FindManyOptions = { where: petRequested.map(petId => ({ id: petId })) };
        const requestedPet = await this.petRepository.find(petCriteria);

        user.setInterestedIn(requestedPet);
        await this.userRepository.save(user);
        return `User ${userDTO.fullname} was added.`
      }
    } catch (error) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: 'Error adding new user - ' + error.message
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async allUsers(): Promise<User[]> {
    try {
      const criterion: FindManyOptions = { relations: ['pets'] };
      const allUsers: User[] = await this.userRepository.find(criterion);

      if (!allUsers) {
        throw new Error(`Error getting users.`);
      }
      return allUsers;
    } catch (error) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: 'Error getting users - ' + error.message
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(userId: number): Promise<User> {
    try {
      const criterion: FindOneOptions = { relations: ['pets'], where: { id: userId } };
      const user: User = await this.userRepository.findOne(criterion);

      if (!user) {
        throw new Error(`There is no user with ID ${userId}.`);
      }
      return user;
    } catch (error) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: 'Error getting user - ' + error.message
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteUser(userEmail: string): Promise<string> {
    try {
      const criterion: FindOneOptions = { where: { email: userEmail } };
      const user: User = await this.userRepository.findOne(criterion);

      if (!user) {
        throw new Error(`The user does not exist in the database.`);
      }

      const userName = user.getFullname();
      await this.userRepository.remove(user);

      return `${userName} was deleted from database.`;

    } catch (error) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: 'Error getting user - ' + error.message
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async removePet(userEmail: string, petId: number): Promise<string> {
    try {
      const criterion: FindOneOptions = { where: { email: userEmail }, relations: ['pets'] };
      const user: User = await this.userRepository.findOne(criterion);

      if (!user) {
        throw new Error(`The user does not exist in the database.`);
      }

      const requestedPet = user.pets.map(pet => pet.id);

      if (!requestedPet.includes(petId)) {
        throw new Error(`The user ${user.getFullname()} does not have a registered pet with ID ${petId}.`);

      } else {

        const indexPet = requestedPet.indexOf(petId);
        requestedPet.splice(indexPet, 1);

        const petCriteria: FindManyOptions = { where: requestedPet.map(petId => ({ id: petId })) };
        const newPets = await this.petRepository.find(petCriteria);
        user.setInterestedIn(newPets);

        if (requestedPet.length === 0) {
          user.pets = [];
        }

        await this.userRepository.save(user);
        return `The pet with id ${petId} was remove from user ${user.getFullname()}.`
      }
    } catch (error) {
      throw new HttpException({
        status: HttpStatus.CONFLICT,
        error: 'Error getting user - ' + error.message
      }, HttpStatus.CONFLICT);
    }
  }
}
