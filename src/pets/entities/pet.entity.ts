import { City } from "src/city/entities/city.entity";
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, CreateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { Attribute } from "../attributes/entities/attribute.entity";

@Entity({ name: 'pets' })
export class Pet {

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    creationDate: Date;

    @Column()
    name: string;

    @Column()
    specie: string;

    @Column()
    sex: string;

    @Column()
    age: number;

    @ManyToOne(() => City, city => city.pets)
    @JoinColumn({ name: 'fk_city_id' })
    city: City;

    @ManyToMany(() => Attribute, attributes => attributes.pets)
    @JoinTable({ name: 'pets_attributes'})
    attributes : Attribute[];

    @Column()
    description: string;

    @Column()
    urlImg: string;

    @Column({type: 'boolean', default: true})
    available: true;

    @Column({type: 'int', default : 0})
    interested: number;

    constructor(name: string, specie: string, sex: string, age: number, city: City , attributes: Attribute[], description: string, urlImg: string) {
        this.name = name;
        this.specie = specie;
        this.sex = sex;
        this.age = age;
        this.city = city;
        this.attributes = attributes;
        this.description = description;
        this.urlImg = urlImg;
    }
    public getName(): string {
        return this.name;
    }
    public getAge(): number {
        return this.age;
    }
    public getSpecie(): string {
        return this.specie;
    }
    public getSex(): string {
        return this.sex;
    }
    public getDescription(): string {
        return this.description;
    }
    public getUrlImg(): string {
        return this.urlImg;
    }
    public getInterested(): number {
        return this.interested;
    }
    public setAge(newAge: number): void {
        this.age = newAge;
    }
    public setDescription(newDescription: string): void {
        this.description = newDescription;
    }
    public setInterested(): void {
        this.interested += 1;
    }
    public setUrlImg(newUrlImg: string): void {
        this.urlImg = newUrlImg;
    }
    public setAvailable(): void {
        !this.available;
    }
}