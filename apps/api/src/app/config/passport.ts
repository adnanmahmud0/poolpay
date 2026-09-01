import bcryptjs from "bcryptjs";
import crypto from "crypto";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from "passport-facebook";
import { AuthProvider, IUser, Role, UserStatus } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { Settings } from "../modules/settings/settings.model";
import { envVars } from "./env";

// Local Strategy
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
          if (user.authProviders.includes(AuthProvider.GOOGLE)) {
            return done(null, false, {
              message: "Please login with Google or set a password first.",
            });
          }
          if (user.authProviders.includes(AuthProvider.FACEBOOK)) {
            return done(null, false, {
              message: "Please login with Facebook or set a password first.",
            });
          }
          return done(null, false, { message: "Authentication failed" });
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

// Google Strategy
if (envVars.GOOGLE_CLIENT_ID && envVars.GOOGLE_CLIENT_SECRET && envVars.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: envVars.GOOGLE_CLIENT_ID as string,
        clientSecret: envVars.GOOGLE_CLIENT_SECRET as string,
        callbackURL: envVars.GOOGLE_CALLBACK_URL as string,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          // Check if social login is enabled globally
          const settings = await Settings.findOne();
          if (settings && !settings.isSocialLoginEnabled) {
            return done(null, false, {
              message: "Social login is currently disabled by admin.",
            });
          }

          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;

          // Try to find user by googleId first, then by email
          let user = await User.findOne({
            $or: [{ googleId }, ...(email ? [{ email }] : [])],
          });

          if (user) {
            if (user.status === UserStatus.BLOCKED) {
              return done(null, false, { message: "User account is blocked" });
            }
            if (user.status === UserStatus.PENDING) {
              return done(null, false, { message: "User account is pending approval" });
            }

            // Update googleId and provider if missing
            let updated = false;
            if (!user.googleId) {
              user.googleId = googleId;
              updated = true;
            }
            if (!user.authProviders.includes(AuthProvider.GOOGLE)) {
              user.authProviders.push(AuthProvider.GOOGLE);
              updated = true;
            }
            if (updated) await user.save();
          } else {
            // Create new user if not exists
            user = await User.create({
              googleId,
              email: email || undefined,
              firstName: profile.name?.givenName || profile.displayName.split(" ")[0] || "User",
              lastName: profile.name?.familyName || profile.displayName.split(" ").slice(1).join(" ") || " ",
              profileImage: profile.photos?.[0]?.value,
              role: Role.USER,
              status: UserStatus.ACTIVE,
              authProviders: [AuthProvider.GOOGLE],
              isVerified: true,
              // phone and agreeToTerms are now conditionally optional based on googleId
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    ) as passport.Strategy
  );
}

// Facebook Strategy
if (envVars.FACEBOOK_CLIENT_ID && envVars.FACEBOOK_CLIENT_SECRET && envVars.FACEBOOK_CALLBACK_URL) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: envVars.FACEBOOK_CLIENT_ID as string,
        clientSecret: envVars.FACEBOOK_CLIENT_SECRET as string,
        callbackURL: envVars.FACEBOOK_CALLBACK_URL as string,
        profileFields: ["id", "displayName", "photos", "emails", "name"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: FacebookProfile,
        done: VerifyCallback
      ) => {
        try {
          // Check if social login is enabled globally
          const settings = await Settings.findOne();
          if (settings && !settings.isSocialLoginEnabled) {
            return done(null, false, {
              message: "Social login is currently disabled by admin.",
            });
          }

          const email = profile.emails?.[0]?.value;
          const facebookId = profile.id;

          // Try to find user by facebookId first, then by email
          let user = await User.findOne({
            $or: [{ facebookId }, ...(email ? [{ email }] : [])],
          });

          if (user) {
            if (user.status === UserStatus.BLOCKED) {
              return done(null, false, { message: "User account is blocked" });
            }
            if (user.status === UserStatus.PENDING) {
              return done(null, false, { message: "User account is pending approval" });
            }

            // Update facebookId and provider if missing
            let updated = false;
            if (!user.facebookId) {
              user.facebookId = facebookId;
              updated = true;
            }
            if (!user.authProviders.includes(AuthProvider.FACEBOOK)) {
              user.authProviders.push(AuthProvider.FACEBOOK);
              updated = true;
            }
            if (updated) await user.save();
          } else {
            // Create new user if not exists
            user = await User.create({
              facebookId,
              email: email || undefined,
              firstName: profile.name?.givenName || profile.displayName.split(" ")[0] || "User",
              lastName: profile.name?.familyName || profile.displayName.split(" ").slice(1).join(" ") || " ",
              profileImage: profile.photos?.[0]?.value,
              role: Role.USER,
              status: UserStatus.ACTIVE,
              authProviders: [AuthProvider.FACEBOOK],
              isVerified: true,
              // phone and agreeToTerms are now conditionally optional based on facebookId
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

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
