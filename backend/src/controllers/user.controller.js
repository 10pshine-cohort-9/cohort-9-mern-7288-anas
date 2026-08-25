import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (
    ![username, email, password].every(
      (field) => typeof field === "string" && field.trim().length > 0,
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  try {
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email or usename already exists");
    }

    const user = await User.create({
      username: username.toLowerCase(),
      email,
      password,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user",
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User register successfully"));
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error?.message || "Something went wrong while registering the user",
        );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  if (
    !password ||
    typeof password !== "string" ||
    password.trim().length === 0
  ) {
    throw new ApiError(400, "Password is required");
  }

  try {
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (!user) {
      throw new ApiError(409, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Password Incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id,
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
          },
          "User logged In Successfully!",
        ),
      );
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error?.message || "Something went wrong while logging in",
        );
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        returnDocument: "after",
      },
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out"));
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error?.message || "Something went wrong while logging out",
        );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired and used");
    }

    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        refreshToken: incomingRefreshToken,
      },
      {
        $set: {
          refreshToken: newRefreshToken,
        },
      },
      {
        new: true,
      },
    );

    if (!updatedUser) {
      throw new ApiError(401, "Refresh token is expired and used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, {}, "Access token refreshed successfully"));
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeSubscriptionPlan = asyncHandler(async (req, res) => {
  const { planName } = req.body;
  const allowedPlans = ["Starter", "Pro Creator", "Team Workspace"];

  const planToSet = allowedPlans.includes(planName) ? planName : "Starter";

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        subscriptionPlan: planToSet,
      },
    },
    { new: true },
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        `Subscription plan updated to ${planToSet}`,
      ),
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeSubscriptionPlan,
};
