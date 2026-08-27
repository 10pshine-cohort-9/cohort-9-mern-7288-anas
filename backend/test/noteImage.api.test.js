import request from "supertest";
import { expect } from "chai";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import app from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { NoteImage } from "../src/models/noteImage.model.js";

describe("Note Image Upload API Tests", () => {
  let testToken;
  let originalAccessTokenSecret;
  const mockUserId = "64c8c8e1f1a2b3c4d5e6f7a8";

  before(() => {
    originalAccessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    process.env.ACCESS_TOKEN_SECRET =
      process.env.ACCESS_TOKEN_SECRET || "fallback_secret";
    testToken = jwt.sign(
      { _id: mockUserId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" },
    );
  });

  after(() => {
    if (originalAccessTokenSecret !== undefined) {
      process.env.ACCESS_TOKEN_SECRET = originalAccessTokenSecret;
    } else {
      delete process.env.ACCESS_TOKEN_SECRET;
    }
  });

  beforeEach(() => {
    sinon.stub(User, "findById").returns({
      select: sinon.stub().resolves({ _id: mockUserId }),
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should successfully upload an image and return 200", async () => {
    try {
      sinon.stub(cloudinary.uploader, "upload").resolves({
        public_id: "mock_cloudinary_id_123",
        secure_url: "https://res.cloudinary.com/demo/image/upload/mock.jpg",
        url: "http://res.cloudinary.com/demo/image/upload/mock.jpg",
      });

      sinon.stub(NoteImage, "create").resolves({
        _id: "mockImageDbId",
        publicId: "mock_cloudinary_id_123",
        url: "https://res.cloudinary.com/demo/image/upload/mock.jpg",
        owner: mockUserId,
      });

      const fakeImageBuffer = Buffer.from("fake image content");

      const response = await request(app)
        .post("/api/v1/notes/upload-image")
        .set("Authorization", `Bearer ${testToken}`)
        .attach("image", fakeImageBuffer, "test.png");

      expect(response.status).to.equal(200);
      expect(response.body.data).to.have.property("public_id");
      expect(response.body.data.public_id).to.equal("mock_cloudinary_id_123");
    } catch (error) {
      throw error;
    }
  });

  it("should successfully delete an image and return 200", async () => {
    try {
      sinon.stub(NoteImage, "findOne").resolves({
        _id: "mockImageDbId",
        publicId: "mock_cloudinary_id_123",
        owner: mockUserId,
      });

      sinon.stub(cloudinary.uploader, "destroy").resolves({ result: "ok" });

      sinon.stub(NoteImage, "findByIdAndDelete").resolves(true);

      const response = await request(app)
        .delete("/api/v1/notes/delete-image")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ publicId: "mock_cloudinary_id_123" });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.include("successfully");
    } catch (error) {
      throw error;
    }
  });
});
