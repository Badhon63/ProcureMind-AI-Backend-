export interface IItem {
  title: string;
  shortDesc: string;
  fullDesc: string;
  budget: number;
  location: string;
  category: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
