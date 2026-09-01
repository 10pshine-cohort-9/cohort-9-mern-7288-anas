import request from "supertest";
import { expect } from "chai";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import app from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { NoteImage } from "../src/models/noteImage.model.js";
import { Note } from "../src/models/note.model.js"; // Required for the cleanup test

describe("Note Image Upload API Tests", () => {
  let testToken;
  let originalAccessTokenSecret;
  const mockUserId = "64c8c8e1f1a2b3c4d5e6f7a8";

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
    sinon.stub(User, "findById").returns({
      select: sinon.stub().resolves({ _id: mockUserId }),
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should successfully upload an image and return 200", async () => {
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
  });

  it("should successfully delete an image and return 200", async () => {
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
  });

  // --- EDGE CASES FOR COVERAGE ---

  it("should return 400 if image file is missing during upload", async () => {
    const response = await request(app)
      .post("/api/v1/notes/upload-image")
      .set("Authorization", `Bearer ${testToken}`);
    expect(response.status).to.equal(400);
  });

  it("should return 400 if public ID is missing during image delete", async () => {
    const response = await request(app)
      .delete("/api/v1/notes/delete-image")
      .set("Authorization", `Bearer ${testToken}`)
      .send({});
    expect(response.status).to.equal(400);
  });

  it("should return 404 if image to delete is not found in database", async () => {
    sinon.stub(NoteImage, "findOne").resolves(null);
    const response = await request(app)
      .delete("/api/v1/notes/delete-image")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ publicId: "missing-id" });
    expect(response.status).to.equal(404);
  });

  it("should return 403 if trying to delete an image owned by another user", async () => {
    sinon.stub(NoteImage, "findOne").resolves({ owner: "different-user-id" });
    const response = await request(app)
      .delete("/api/v1/notes/delete-image")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ publicId: "valid-id" });
    expect(response.status).to.equal(403);
  });

  it("should return 500 if database fails during single image deletion", async () => {
    // Corrected to use the body payload and the correct route
    sinon
      .stub(NoteImage, "findOne")
      .rejects(new Error("Simulated Image Delete Error"));

    const response = await request(app)
      .delete("/api/v1/notes/delete-image")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ publicId: "valid-id" });

    expect(response.status).to.equal(500);
  });

  it("should return 500 if database fails while deleting note image records during cleanup", async () => {
    const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";

    // 1. Pass the Note ownership check
    sinon
      .stub(Note, "findById")
      .resolves({ _id: validNoteId, owner: mockUserId });

    // 2. Provide a mock image so the controller doesn't trigger an early return
    sinon
      .stub(NoteImage, "find")
      .resolves([{ _id: "img1", publicId: "mock-id", note: validNoteId }]);

    // 3. Stub Cloudinary so it instantly succeeds without making a real network call
    sinon.stub(cloudinary.uploader, "destroy").resolves({ result: "ok" });

    // 4. Force the database crash exactly where we need it
    sinon
      .stub(NoteImage, "deleteMany")
      .rejects(new Error("Simulated DeleteMany Error"));

    const response = await request(app)
      .delete(`/api/v1/notes/${validNoteId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).to.equal(500);
  });
});
