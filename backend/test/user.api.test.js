import request from "supertest";
import { expect } from "chai";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User } from "../src/models/user.model.js";

const mockMongooseQuery = (resolvedValue) => {
  return {
    select: sinon.stub().resolves(resolvedValue),
    then: function (resolve) {
      resolve(resolvedValue);
    },
  };
};

describe("User Controller API Tests", () => {
  let testToken;
  let originalRefreshTokenSecret;
  const mockUserId = "64c8c8e1f1a2b3c4d5e6f7a8";

  const mockUserDocument = {
    _id: mockUserId,
    username: "anas",
    email: "anas@example.com",
    refreshToken: "valid-old-refresh-token",
    subscriptionPlan: "Starter",
    isPasswordCorrect: sinon.stub().resolves(true),
    generateAccessToken: sinon.stub().returns("mockAccessToken"),
    generateRefreshToken: sinon.stub().returns("mockRefreshToken"),
    save: sinon.stub().resolves(true),
  };

  before(() => {
    testToken = jwt.sign(
      { _id: mockUserId },
      process.env.ACCESS_TOKEN_SECRET || "fallback_secret",
      { expiresIn: "1h" },
    );
  });

  beforeEach(() => {
    originalRefreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  });

  afterEach(() => {
    if (originalRefreshTokenSecret !== undefined) {
      process.env.REFRESH_TOKEN_SECRET = originalRefreshTokenSecret;
    } else {
      delete process.env.REFRESH_TOKEN_SECRET;
    }
    sinon.restore();
  });

  describe("POST /api/v1/users/register", () => {
    it("should successfully register a user and return 201", async () => {
      try {
        sinon.stub(User, "findOne").resolves(null);
        sinon.stub(User, "create").resolves({ _id: mockUserId });

        sinon.stub(User, "findById").returns(
          mockMongooseQuery({
            _id: mockUserId,
            username: "anas",
            email: "anas@example.com",
          }),
        );

        const res = await request(app)
          .post("/api/v1/users/register")
          .send({
            username: "anas",
            email: "anas@example.com",
            password: "password123",
          });

        expect(res.status).to.equal(201);
        expect(res.body.data.username).to.equal("anas");
      } catch (error) {
        throw error;
      }
    });

    it("should return 400 if required fields are missing", async () => {
      try {
        const res = await request(app)
          .post("/api/v1/users/register")
          .send({ username: "anas" });

        expect(res.status).to.equal(400);
      } catch (error) {
        throw error;
      }
    });

    it("should return 409 if username or email already exists", async () => {
      try {
        sinon.stub(User, "findOne").resolves({ _id: "existingUser" });

        const res = await request(app)
          .post("/api/v1/users/register")
          .send({
            username: "anas",
            email: "anas@example.com",
            password: "password123",
          });

        expect(res.status).to.equal(409);
      } catch (error) {
        throw error;
      }
    });
  });

  describe("POST /api/v1/users/login", () => {
    it("should successfully log in and return 200 with cookies", async () => {
      try {
        sinon.stub(User, "findOne").resolves(mockUserDocument);
        sinon.stub(User, "findById").returns(mockMongooseQuery(mockUserDocument));

        const res = await request(app)
          .post("/api/v1/users/login")
          .send({ email: "anas@example.com", password: "password123" });

        expect(res.status).to.equal(200);
        expect(res.headers["set-cookie"].join()).to.include(
          "accessToken=mockAccessToken",
        );
      } catch (error) {
        throw error;
      }
    });

    it("should return 401 if password is incorrect", async () => {
      try {
        const failedPasswordUser = {
          ...mockUserDocument,
          isPasswordCorrect: sinon.stub().resolves(false),
        };
        sinon.stub(User, "findOne").resolves(failedPasswordUser);

        const res = await request(app)
          .post("/api/v1/users/login")
          .send({ email: "anas@example.com", password: "wrongpassword" });

        expect(res.status).to.equal(401);
      } catch (error) {
        throw error;
      }
    });
  });

  describe("POST /api/v1/users/logout", () => {
    it("should successfully log out and clear cookies", async () => {
      try {
        sinon.stub(User, "findById").returns(mockMongooseQuery(mockUserDocument));
        sinon.stub(User, "findByIdAndUpdate").resolves(true);

        const res = await request(app)
          .post("/api/v1/users/logout")
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers["set-cookie"].join()).to.include("accessToken=;");
      } catch (error) {
        throw error;
      }
    });
  });

  describe("GET /api/v1/users/current-user", () => {
    it("should fetch the current user profile", async () => {
      try {
        sinon.stub(User, "findById").returns(mockMongooseQuery(mockUserDocument));

        const res = await request(app)
          .get("/api/v1/users/current-user")
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.data.email).to.equal("anas@example.com");
      } catch (error) {
        throw error;
      }
    });
  });

  describe("POST /api/v1/users/refresh-token", () => {
    it("should refresh tokens and return 200", async () => {
      try {
        process.env.REFRESH_TOKEN_SECRET = "temporary_test_secret";

        const realRefreshToken = jwt.sign(
          { _id: mockUserId },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "1d" },
        );

        const refreshUserDoc = {
          ...mockUserDocument,
          refreshToken: realRefreshToken,
        };

        sinon.stub(User, "findById").resolves(refreshUserDoc);
        sinon.stub(User, "findOneAndUpdate").resolves(refreshUserDoc);

        const res = await request(app)
          .post("/api/v1/users/refresh-token")
          .send({ refreshToken: realRefreshToken });

        expect(res.status).to.equal(200);
        expect(res.headers["set-cookie"].join()).to.include(
          "accessToken=mockAccessToken",
        );
      } catch (error) {
        throw error;
      }
    });

    it("should return 401 if refresh token is missing", async () => {
      try {
        const res = await request(app).post("/api/v1/users/refresh-token");
        expect(res.status).to.equal(401);
      } catch (error) {
        throw error;
      }
    });
  });

  describe("POST /api/v1/users/change-plan", () => {
    it("should update the subscription plan to Pro Creator", async () => {
      try {
        sinon.stub(User, "findById").returns(mockMongooseQuery(mockUserDocument));

        const updatedUser = {
          ...mockUserDocument,
          subscriptionPlan: "Pro Creator",
        };
        sinon
          .stub(User, "findByIdAndUpdate")
          .returns(mockMongooseQuery(updatedUser));

        const res = await request(app)
          .post("/api/v1/users/change-plan")
          .set("Authorization", `Bearer ${testToken}`)
          .send({ planName: "Pro Creator" });

        expect(res.status).to.equal(200);
        expect(res.body.data.subscriptionPlan).to.equal("Pro Creator");
      } catch (error) {
        throw error;
      }
    });
  });
});
