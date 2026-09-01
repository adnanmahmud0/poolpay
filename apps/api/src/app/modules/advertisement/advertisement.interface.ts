import { Types } from "mongoose";

export interface IAdvertisement {
  title: string;
  description?: string;
  bannerImage: string;
  redirectUrl?: string;
  isActive: boolean;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  createdBy: Types.ObjectId;
  isMock?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
