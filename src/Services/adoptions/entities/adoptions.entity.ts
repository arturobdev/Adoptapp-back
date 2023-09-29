import { City } from "src/city/entities/city.entity";
import { Pet } from "src/pets/entities/pet.entity";
import { User } from "src/users/entities/user.entity";
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'adoptions' })
export class Adoption {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    adoption_date: Date;

    @OneToOne(() => Pet, pet => pet.adoption) 
    pet: Pet;

    @ManyToOne(() => User, user => user.adoption)
    user: User;

    @ManyToOne(() => City, city => city.adoption)
    city: City;
}