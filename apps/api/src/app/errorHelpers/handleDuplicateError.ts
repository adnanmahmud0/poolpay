import { TGenericErrorResponse } from "../interfaces/error.types";

export const handlerDuplicateError = (err: Error): TGenericErrorResponse => {
  const matchedArray = err.message.match(/"([^"]*)"/);

  const match = matchedArray ? matchedArray[1] : "Value";

  return {
    statusCode: 400,
    message: `${match} already exists!!`,
  };
};
