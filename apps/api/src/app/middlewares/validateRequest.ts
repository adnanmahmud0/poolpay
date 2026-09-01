import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validateRequest = (schema: ZodType<unknown>) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validateRequest;
