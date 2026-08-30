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
  let originalAccessTokenSecret;
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
    originalAccessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    process.env.ACCESS_TOKEN_SECRET =
      process.env.ACCESS_TOKEN_SECRET || "fallback_secret";
    testToken = jwt.sign({ _id: mockUserId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });
  });

  after(() => {
    if (originalAccessTokenSecret !== undefined) {
      process.env.ACCESS_TOKEN_SECRET = originalAccessTokenSecret;
    } else {
      delete process.env.ACCESS_TOKEN_SECRET;
    }
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
    it("should return 500 if user creation fails and returns null", async () => {
      sinon.stub(User, "findOne").resolves(null);
      sinon.stub(User, "create").resolves(null); // Triggers the if (!createdUser) block

      const res = await request(app).post("/api/v1/users/register").send({
        username: "failuser",
        email: "fail@test.com",
        password: "password123",
      });

      expect(res.status).to.equal(500);
    });

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

        const res = await request(app).post("/api/v1/users/register").send({
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

        const res = await request(app).post("/api/v1/users/register").send({
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
    it("should return 400 if username and email are both missing", async () => {
      const res = await request(app)
        .post("/api/v1/users/login")
        .send({ password: "password123" }); // Missing email/username

      expect(res.status).to.equal(400);
    });

    it("should return 400 if password is missing or empty", async () => {
      const res = await request(app)
        .post("/api/v1/users/login")
        .send({ email: "anas@example.com", password: "   " }); // Empty string

      expect(res.status).to.equal(400);
    });

    it("should return 500 if token generation fails in the helper function catch block", async () => {
      sinon.stub(User, "findOne").resolves({
        _id: mockUserId,
        isPasswordCorrect: sinon.stub().resolves(true),
      });

      // Force the save() method inside generateAccessAndRefreshTokens to crash
      sinon.stub(User, "findById").resolves({
        ...mockUserDocument,
        generateAccessToken: sinon.stub().returns("token"),
        generateRefreshToken: sinon.stub().returns("token"),
        save: sinon.stub().rejects(new Error("Simulated Save Error")),
      });

      const res = await request(app)
        .post("/api/v1/users/login")
        .send({ email: "anas@example.com", password: "password123" });

      expect(res.status).to.equal(500);
    });

    it("should successfully log in and return 200 with cookies", async () => {
      try {
        sinon.stub(User, "findOne").resolves(mockUserDocument);
        sinon
          .stub(User, "findById")
          .returns(mockMongooseQuery(mockUserDocument));

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
   it("should return 500 if database fails during logout", async () => {
     // 1. Let the auth middleware find the user successfully
     sinon.stub(User, "findById").returns(mockMongooseQuery(mockUserDocument));

     // 2. Force the controller's update/save call to fail, triggering the 500 catch block
     sinon
       .stub(User, "findByIdAndUpdate")
       .rejects(new Error("Simulated DB Error"));

     const res = await request(app)
       .post("/api/v1/users/logout")
       .set("Authorization", `Bearer ${testToken}`);

     expect(res.status).to.equal(500);
   });

    it("should successfully log out and clear cookies", async () => {
      try {
        sinon
          .stub(User, "findById")
          .returns(mockMongooseQuery(mockUserDocument));
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
        sinon
          .stub(User, "findById")
          .returns(mockMongooseQuery(mockUserDocument));

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
    it("should return 401 if user is not found in database", async () => {
      process.env.REFRESH_TOKEN_SECRET = "temporary_test_secret";
      const validToken = jwt.sign(
        { _id: mockUserId },
        process.env.REFRESH_TOKEN_SECRET,
      );

      sinon.stub(User, "findById").resolves(null); // Triggers the if (!user) block

      const res = await request(app)
        .post("/api/v1/users/refresh-token")
        .send({ refreshToken: validToken });

      expect(res.status).to.equal(401);
    });

    it("should return 401 if incoming refresh token does not match database", async () => {
      process.env.REFRESH_TOKEN_SECRET = "temporary_test_secret";
      const incomingToken = jwt.sign(
        { _id: mockUserId },
        process.env.REFRESH_TOKEN_SECRET,
      );

      sinon.stub(User, "findById").resolves({
        ...mockUserDocument,
        refreshToken: "different-token-in-database", // Triggers the mismatch block
      });

      const res = await request(app)
        .post("/api/v1/users/refresh-token")
        .send({ refreshToken: incomingToken });

      expect(res.status).to.equal(401);
    });

    it("should return 401 if token verification throws an error", async () => {
      // Sending a totally malformed token forces the jwt.verify method to throw into the catch block
      const res = await request(app)
        .post("/api/v1/users/refresh-token")
        .send({ refreshToken: "invalid.malformed.token" });

      expect(res.status).to.equal(401);
    });

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
        sinon
          .stub(User, "findById")
          .returns(mockMongooseQuery(mockUserDocument));

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

  // --- USER CONTROLLER EDGE CASES & DB FAILURES ---
  it("should return 500 if database fails during registration", async () => {
    // We must mock findOne here, because it is the FIRST database call the controller makes
    if (User.findOne.restore) User.findOne.restore();
    sinon.stub(User, "findOne").rejects(new Error("Simulated DB Error"));

    const response = await request(app).post("/api/v1/users/register").send({
      fullName: "Test",
      email: "fail@test.com",
      username: "failtest",
      password: "password123",
    });
    expect(response.status).to.equal(500);
  });

  it("should return 500 if database fails during login", async () => {
    if (User.findOne.restore) User.findOne.restore();
    sinon.stub(User, "findOne").rejects(new Error("Simulated DB Error"));

    const response = await request(app).post("/api/v1/users/login").send({
      email: "fail@test.com",
      password: "password123",
    });

    expect(response.status).to.equal(500);
  });

  it("should return 500 if token generation fails during login", async () => {
    if (User.findOne.restore) User.findOne.restore();
    if (User.findById.restore) User.findById.restore();

    // Pass the initial login password check
    sinon.stub(User, "findOne").resolves({
      _id: mockUserId,
      isPasswordCorrect: sinon.stub().resolves(true),
    });

    // Force the database to crash inside generateAccessAndRefreshTokens
    sinon
      .stub(User, "findById")
      .rejects(new Error("Simulated Token Generation Error"));

    const response = await request(app).post("/api/v1/users/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(response.status).to.equal(500);
  });

  it("should return 500 if createdUser is null after user creation", async () => {
    sinon.stub(User, "findOne").resolves(null);
    sinon.stub(User, "create").resolves(null); // Triggers if (!createdUser)

    const res = await request(app).post("/api/v1/users/register").send({
      username: "anas",
      email: "anas@example.com",
      password: "password123",
    });

    expect(res.status).to.equal(500);
  });

  it("should return 404 if user to update plan for is not found", async () => {
    sinon.stub(User, "findById").returns(mockMongooseQuery(mockUserDocument));
    sinon.stub(User, "findByIdAndUpdate").returns(mockMongooseQuery(null)); // Triggers if (!updatedUser)

    const res = await request(app)
      .post("/api/v1/users/change-plan")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ planName: "Pro Creator" });

    expect(res.status).to.equal(404);
  });
});
