import { IUser } from "../user/user.interface";

export interface ILoginResponse {
  requires2FA: boolean;
  message?: string;
  email?: string;
  phone?: string;
  channel?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: Partial<IUser>;
}

export interface ILoginPayload {
  identifier: string;
  password?: string;
  isDashboardLogin?: boolean;
}
