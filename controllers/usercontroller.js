import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jsonWebToken from "jsonwebtoken";
import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";

export const register = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // Checking if required fields are provided
    if (!userName || !email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields.",
        success: false,
      });
    }

    // Checking if user already exists with the same email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists.",
        success: false,
      });
    }

    // Hashing the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creating a new user and save to the database
    const newUser = await User.create({
      userName,
      email,
      password: hashedPassword,
    });

    // Send a response back excluding sensitive data
    return res.status(201).json({
      message: "User registered successfully.",
      success: true,
      user: { userName, email }, // Only include non-sensitive info
    });
  } catch (error) {
    console.error(`Registration Error: ${error}`);
    return res.status(500).json({
      message: "An error occurred during registration.",
      success: false,
    });
  }
};

// User Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email, password required.",
        success: false,
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password.",
        success: false,
      });
    }

    // Check if password matches
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        message: "Invalid email or password.",
        success: false,
      });
    }

    // Generate a JWT token
    const token = jsonWebToken.sign(
      { userId: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    // Return the token in a cookie and user data (excluding sensitive info)
    const userData = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
    };

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back, ${user.userName}!`,
        success: true,
        user: userData,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while logging in.",
      success: false,
    });
  }
};

// User Logout
export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", {
        maxAge: 0,
        path: "/",
      })
      .json({
        message: "Logged out successfully.",
        success: true,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error occurred during logout.",
      success: false,
    });
  }
};

export const generateOtp = async (req, res) => {
  try {
    const { email } = req.body;
    // Check for missing fields
    if (!email) {
      return res.status(400).json({
        message: "Email required.",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email.",
        success: false,
      });
    }

    const resetToken = cryptoRandomString({ length: 6, type: "numeric" });
    // Set token in the database and expire time (e.g., 10 minutes)
    const resetTokenExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    user.resetToken = resetToken;
    user.resetTokenExpire = resetTokenExpire;
    await user.save();

    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Example with Gmail; adjust according to your needs
        auth: {
            user: 'meshramsomesh00@gmail.com', // Your email
            pass: 'tlqt xkwg tlno dper' // Your email password
        }
    });

    // Send email
    const mailOptions = {
        from: 'meshramsomesh00@gmail.com',
        to: user.email,
        subject: 'Password Reset',
        text: `Your OTP is: ${resetToken}. It is valid for 10 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
        message: "OTP sent to email successfully.",
        success: true
    });

  } catch (error) {
    console.error(error);
        res.status(500).json({
            message: "An error occurred.",
            success: false
        });
  }
};

export const verifyOtp = async (req, res) => {
//getting body parms from req body.
  const { email, otp } = req.body;
  if (!email || !otp) {
      return res.status(400).json({
          message: "Both email and OTP are required.",
          success: false
      });
  }
//checking resetotken matched or not .
  try {
      const user = await User.findOne({ email, resetToken: otp, resetTokenExpire: { $gt: Date.now() } });
      if (!user) {
          return res.status(400).json({
              message: "Invalid OTP or OTP has expired.",
              success: false
          });
      }

      res.status(200).json({
          message: "OTP verified successfully. Proceed to reset password.",
          success: true
      });
  } catch (error) {
    console.error(`fromConsoleLog ${error}`);

      res.status(500).json({
          message: "An error occurred during OTP verification.",
          success: false
      });
  }
};


export const resetPassword = async (req, res) => {
  //getting value from body params
  const { email, otp, newPassword, confirmNewPassword } = req.body;
  if (!email || !otp || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
          message: "All fields are required.",
          success: false
      });
  }

  //cross checking new password and confirm password are equal or not.
  if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
          message: "Passwords do not match.",
          success: false
      });
  }

  //finding in mongo db resettoken is matched or not.
  try {
      const user = await User.findOne({
          email,
          resetToken: otp,
          resetTokenExpire: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({
              message: "Invalid OTP or OTP has expired.",
              success: false
          });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetToken = undefined;  // Clear the reset token fields
      user.resetTokenExpire = undefined;
      await user.save();

      res.status(200).json({
          message: "Password reset successfully.",
          success: true
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: "An error occurred while resetting the password.",
          success: false
      });
  }
};




