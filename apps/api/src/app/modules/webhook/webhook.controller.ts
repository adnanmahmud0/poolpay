import { Request, Response } from "express";
import { WebhookServices } from "./webhook.service";
import { catchAsync } from "../../utils/catchAsync";

const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  // req.body must be a Buffer for stripe to verify the signature
  const result = await WebhookServices.handleStripeWebhook(req.body, signature);

  res.status(200).json(result);
});

export const WebhookControllers = {
  stripeWebhook,
};
