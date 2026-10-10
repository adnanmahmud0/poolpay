import { ZodError, ZodIssue } from "zod";
import type {
  TErrorSources,
  TGenericErrorResponse,
} from "../interfaces/error.types";

export const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSources[] = [];

  err.issues.forEach((issue: ZodIssue) => {
    errorSources.push({
      // ? "nickname inside last inside name"
      // path: issue.path.length > 1 && issue.path.reverse().join(" inside")
      path: String(issue.path[issue.path.length - 1]),
      message: issue.message,
    });
  });
  return {
    statusCode: 400,
    message: "Zod Error",
    errorSources,
  };
};
