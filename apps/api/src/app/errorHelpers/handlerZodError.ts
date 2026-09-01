import { ZodError, ZodIssue } from "zod";
import {
  TErrorSources,
  TGenericErrorResponse,
} from "../interfaces/error.types";

export const handlerZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSources[] = [];

  err.issues.forEach((issue: ZodIssue) => {
    errorSources.push({
      //path : "nickname inside last inside name"
      // path: issue.path.length > 1 && issue.path.reverse().join(" inside "),

      path: issue.path[issue.path.length - 1].toString(),
      message: issue.message,
    });
  });

  return {
    statusCode: 400,
    message: "Zod Error",
    errorSources,
  };
};
