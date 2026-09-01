import { Request, Response, NextFunction } from "express";

const trimStrings = (obj: unknown): unknown => {
  if (typeof obj === "string") {
    return obj.trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(trimStrings);
  }
  // Traverse only plain objects to avoid mutating Dates, Buffers, etc.
  if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    const record = obj as Record<string, unknown>;
    Object.keys(record).forEach((key) => {
      record[key] = trimStrings(record[key]);
    });
  }
  return obj;
};

export const trimInput = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) trimStrings(req.body);
  if (req.query) trimStrings(req.query);
  if (req.params) trimStrings(req.params);
  next();
};
