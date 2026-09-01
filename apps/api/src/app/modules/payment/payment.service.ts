import { Types } from "mongoose";
import { Payment } from "./payment.model";
import { QueryBuilder } from "../../utils/QueryBuilder";

const getMyPayments = async (userId: string, query: Record<string, string>) => {
  const paymentQuery = Payment.find({ userId: new Types.ObjectId(userId) })
    .populate("groupId", "name");

  const queryBuilder = new QueryBuilder(paymentQuery, query);
  const result = queryBuilder.filter().sort().paginate().fields();

  const data = await result.build();
  const meta = await queryBuilder.getMeta();

  return {
    data,
    meta,
  };
};

export const PaymentServices = {
  getMyPayments,
};
