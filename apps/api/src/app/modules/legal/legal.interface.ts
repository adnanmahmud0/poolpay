import { Types, Document } from "mongoose";

export interface ILegalPolicy {
  slug: string;
  title: string;
  summary?: string;
  content: string;
  version?: string;
  isPublished: boolean;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILegalPolicyDocument extends ILegalPolicy, Document {}
