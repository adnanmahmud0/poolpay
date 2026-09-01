import bcryptjs from "bcryptjs";
import crypto from "crypto";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { IUser, UserStatus } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";

// Local Strategy for Credentials Authentication (Email or Phone + Password)
passport.use(
  new LocalStrategy(
    {
      usernameField: "identifier",
      passwordField: "password",
    },
    async (identifier, password, done) => {
      try {
        const identifierHash = crypto.createHash("sha256").update(identifier).digest("hex");
        const user = await User.findOne({
          $or: [{ email: identifier }, { phoneHash: identifierHash }],
        });

        if (!user) {
          return done(null, false, { message: "User does not exist" });
        }

        if (user.status === UserStatus.PENDING) {
          return done(null, false, { message: "User account is pending approval" });
        }

        if (user.status === UserStatus.BLOCKED) {
          return done(null, false, { message: "User account is blocked" });
        }

        if (!user.password) {
          return done(null, false, { message: "No password is set for this account." });
        }

        const isPasswordMatched = await bcryptjs.compare(password, user.password);

        if (!isPasswordMatched) {
          return done(null, false, { message: "Invalid email/phone or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as IUser)._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
