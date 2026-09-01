import { Response } from "express";

interface TMeta {
  page: number;
  limit: number;
  totalPage: number;
  total: number;
}

interface TResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: TMeta;
  data: T;
  summary?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

export const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message || "Request successful",
    meta: data.meta,
    summary: data.summary,
    data: data.data,
    extra: data.extra,
  });
};
