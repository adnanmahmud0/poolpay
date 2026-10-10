import mongoose from "mongoose";
import type {
  TErrorSources,
  TGenericErrorResponse,
} from "../interfaces/error.types";

export const handleValidationError = (
  err: mongoose.Error.ValidationError
): TGenericErrorResponse => {
  const errorSources: TErrorSources[] = [];

  const errors = Object.values(err.errors);
  errors.forEach(
    (errorObject: mongoose.Error.ValidatorError | mongoose.Error.CastError) =>
      errorSources.push({
        path: errorObject.path,
        message: errorObject.message,
      })
  );

  return {
    statusCode: 400,
    message: "Validation Error",
    errorSources,
  };
};
