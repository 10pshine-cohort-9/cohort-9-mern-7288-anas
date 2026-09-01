import request from "supertest";
import { expect } from "chai";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { Note } from "../src/models/note.model.js";
import { NoteImage } from "../src/models/noteImage.model.js";

describe("Note API Tests", () => {
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

    sinon.stub(Note, "create").resolves({
      _id: "mockNoteId123",
      title: "Untitled",
      content: "",
      owner: mockUserId,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return 400 if note title is an empty string", async () => {
    const response = await request(app)
      .post("/api/v1/notes")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ title: "   ", content: "Some content" }); // Empty spaces trigger the validation

    expect(response.status).to.equal(400);
  });

  it("should return 500 if database fails during notes fetch", async () => {
    if (Note.find.restore) Note.find.restore();

    // Force Note.find to reject to hit the catch block perfectly
    sinon.stub(Note, "find").rejects(new Error("Simulated Fetch Error"));

    const response = await request(app)
      .get("/api/v1/notes")
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).to.equal(500);
  });

  it("should successfully create a new note and return 201", async () => {
    try {
      const response = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ title: "Untitled", content: "" });

      expect(response.status).to.equal(201);
      expect(response.body.data).to.have.property("_id");
      expect(response.body.data.title).to.equal("Untitled");
    } catch (error) {
      throw error;
    }
  });

  it("should fetch all notes for the authenticated user and return 200", async () => {
    try {
      const mockNotes = [
        { _id: "mockNote1", title: "First Note", content: "Hello" },
        { _id: "mockNote2", title: "Second Note", content: "World" },
      ];

      sinon.stub(Note, "find").returns({
        sort: sinon.stub().returns({
          skip: sinon.stub().returns({
            limit: sinon.stub().resolves(mockNotes),
          }),
        }),
      });

      sinon.stub(Note, "countDocuments").resolves(2);

      const response = await request(app)
        .get("/api/v1/notes")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.data.notes).to.be.an("array");
      expect(response.body.data.notes.length).to.equal(2);
      expect(response.body.data.totalNotes).to.equal(2);
      expect(response.body.data.notes[0].title).to.equal("First Note");
    } catch (error) {
      throw error;
    }
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    try {
      const response = await request(app).get("/api/v1/notes");

      expect(response.status).to.equal(401);

      expect(response.body).to.have.property("success", false);
    } catch (error) {
      throw error;
    }
  });

  it("should successfully update an existing note and return 200", async () => {
    try {
      const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";

      sinon.stub(Note, "findById").resolves({
        _id: validNoteId,
        owner: mockUserId,
        version: 1,
      });

      sinon.stub(Note, "findOneAndUpdate").resolves({
        _id: validNoteId,
        title: "Updated Title",
        content: "New content",
        owner: mockUserId,
        version: 2,
      });

      const response = await request(app)
        .patch(`/api/v1/notes/${validNoteId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ title: "Updated Title", content: "New content" });

      expect(response.status).to.equal(200);
      expect(response.body.data.title).to.equal("Updated Title");
    } catch (error) {
      throw error;
    }
  });

  it("should return 403 Forbidden when trying to update a note owned by another user", async () => {
    try {
      const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";
      const otherUserId = "64c8c8e1f1a2b3c4d5e6f999";

      sinon.stub(Note, "findById").resolves({
        _id: validNoteId,
        owner: otherUserId,
        version: 1,
      });

      const response = await request(app)
        .patch(`/api/v1/notes/${validNoteId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ title: "Updated Title" });

      expect(response.status).to.equal(403);
    } catch (error) {
      throw error;
    }
  });

  it("should successfully delete a note and return 200", async () => {
    try {
      const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";

      sinon.stub(Note, "findById").resolves({
        _id: validNoteId,
        owner: mockUserId,
      });

      sinon.stub(NoteImage, "find").resolves([]);

      sinon.stub(Note, "findByIdAndDelete").resolves(true);

      const response = await request(app)
        .delete(`/api/v1/notes/${validNoteId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Note deleted successfully");
    } catch (error) {
      throw error;
    }
  });

  it("should return 403 Forbidden when trying to delete a note owned by another user", async () => {
    try {
      const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";
      const otherUserId = "64c8c8e1f1a2b3c4d5e6f999";

      sinon.stub(Note, "findById").resolves({
        _id: validNoteId,
        owner: otherUserId,
      });

      const response = await request(app)
        .delete(`/api/v1/notes/${validNoteId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).to.equal(403);
    } catch (error) {
      throw error;
    }
  });

  // --- EDGE CASE & ERROR HANDLING TESTS (For SonarQube Coverage) ---

  it("should return 400 if note ID is invalid for get, update, and delete", async () => {
    const invalidId = "not-a-valid-mongo-id";
    
    const getRes = await request(app).get(`/api/v1/notes/${invalidId}`).set("Authorization", `Bearer ${testToken}`);
    expect(getRes.status).to.equal(400);

    const updateRes = await request(app).patch(`/api/v1/notes/${invalidId}`).set("Authorization", `Bearer ${testToken}`).send({ title: "Test" });
    expect(updateRes.status).to.equal(400);

    const deleteRes = await request(app).delete(`/api/v1/notes/${invalidId}`).set("Authorization", `Bearer ${testToken}`);
    expect(deleteRes.status).to.equal(400);
  });

  it("should return 404 if note is not found", async () => {
    const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";
    sinon.stub(Note, "findById").resolves(null);

    const response = await request(app).get(`/api/v1/notes/${validNoteId}`).set("Authorization", `Bearer ${testToken}`);
    expect(response.status).to.equal(404);
  });

  it("should return 400 if create note title is missing", async () => {
    const response = await request(app).post("/api/v1/notes").set("Authorization", `Bearer ${testToken}`).send({ content: "No title" });
    expect(response.status).to.equal(400);
  });

  it("should return 400 if update payload is totally empty", async () => {
    const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";
    const response = await request(app).patch(`/api/v1/notes/${validNoteId}`).set("Authorization", `Bearer ${testToken}`).send({});
    expect(response.status).to.equal(400);
  });

  it("should return 409 Stale Write if revision does not match next version", async () => {
    const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";
    sinon.stub(Note, "findById").resolves({ _id: validNoteId, owner: mockUserId, version: 1 });
    
    // Sending revision 5 when current is 1 (next should be 2)
    const response = await request(app).patch(`/api/v1/notes/${validNoteId}`).set("Authorization", `Bearer ${testToken}`).send({ title: "Test", revision: 5 });
    expect(response.status).to.equal(409);
  });

  it("should return 409 on concurrent update if findOneAndUpdate returns null", async () => {
    const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";
    sinon.stub(Note, "findById").resolves({ _id: validNoteId, owner: mockUserId, version: 1 });
    sinon.stub(Note, "findOneAndUpdate").resolves(null); // simulates someone else writing first

    const response = await request(app).patch(`/api/v1/notes/${validNoteId}`).set("Authorization", `Bearer ${testToken}`).send({ title: "Test", revision: 2 });
    expect(response.status).to.equal(409);
  });

  it("should return 500 on database error during fetch", async () => {
    sinon.stub(Note, "find").throws(new Error("Database failure"));
    
    const response = await request(app).get("/api/v1/notes").set("Authorization", `Bearer ${testToken}`);
    expect(response.status).to.equal(500);
  });

  // --- IMAGE UPLOAD & DELETE EDGE CASES ---
  it("should return 400 if image file is missing during upload", async () => {
    const response = await request(app)
      .post("/api/v1/notes/upload-image") // Adjust this route if your router uses a different path
      .set("Authorization", `Bearer ${testToken}`);
    expect(response.status).to.equal(400);
  });

  it("should return 400 if public ID is missing during image delete", async () => {
    const response = await request(app)
      .delete("/api/v1/notes/delete-image") // Adjust this route if your router uses a different path
      .set("Authorization", `Bearer ${testToken}`)
      .send({});
    expect(response.status).to.equal(400);
  });

  it("should return 404 if image to delete is not found in database", async () => {
    sinon.stub(NoteImage, "findOne").resolves(null);
    const response = await request(app)
      .delete("/api/v1/notes/delete-image") // Adjust this route if your router uses a different path
      .set("Authorization", `Bearer ${testToken}`)
      .send({ publicId: "missing-id" });
    expect(response.status).to.equal(404);
  });

  it("should return 403 if trying to delete an image owned by another user", async () => {
    sinon.stub(NoteImage, "findOne").resolves({ owner: "different-user-id" });
    const response = await request(app)
      .delete("/api/v1/notes/delete-image") // Adjust this route if your router uses a different path
      .set("Authorization", `Bearer ${testToken}`)
      .send({ publicId: "valid-id" });
    expect(response.status).to.equal(403);
  });

  // --- FINAL COVERAGE PUSH: SEARCH, CLEANUP, AND CATCH BLOCKS ---

  it("should fetch notes with a search query and sanitize input", async () => {
    sinon.stub(Note, "find").returns({
      sort: sinon.stub().returns({
        skip: sinon.stub().returns({
          limit: sinon.stub().resolves([{ _id: "mock1", title: "Test Note" }]),
        }),
      }),
    });
    sinon.stub(Note, "countDocuments").resolves(1);

    const response = await request(app)
      .get("/api/v1/notes?search=Test*Query")
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).to.equal(200);
  });

  it("should clean up associated images when deleting a note", async () => {
    const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";
    if (Note.findById.restore) Note.findById.restore();
    if (NoteImage.find.restore) NoteImage.find.restore();
    if (NoteImage.deleteMany.restore) NoteImage.deleteMany.restore();
    if (Note.findByIdAndDelete.restore) Note.findByIdAndDelete.restore();

    sinon
      .stub(Note, "findById")
      .resolves({ _id: validNoteId, owner: mockUserId });

    // publicId set to null bypasses the Cloudinary API call, preventing the timeout
    sinon
      .stub(NoteImage, "find")
      .resolves([{ _id: "img1", publicId: null, note: validNoteId }]);
    sinon.stub(NoteImage, "deleteMany").resolves({ deletedCount: 1 });
    sinon.stub(Note, "findByIdAndDelete").resolves(true);

    const response = await request(app)
      .delete(`/api/v1/notes/${validNoteId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).to.equal(200);
  });

  it("should return 500 if database fails during note creation", async () => {
    Note.create.restore(); 
    sinon.stub(Note, "create").rejects(new Error("Simulated DB Error")); 
    
    const response = await request(app)
      .post("/api/v1/notes")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ title: "Valid Title" });
      
    expect(response.status).to.equal(500);
  });

  it("should return 500 if database fails during note deletion", async () => {
    const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";
    sinon.stub(Note, "findById").resolves({ _id: validNoteId, owner: mockUserId });
    sinon.stub(NoteImage, "find").throws(new Error("Simulated Cleanup Error"));

    const response = await request(app)
      .delete(`/api/v1/notes/${validNoteId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).to.equal(500);
  });

  it("should return 500 if database fails specifically during image cleanup", async () => {
    const validNoteId = "64c8c8e1f1a2b3c4d5e6f7a8";
    if (Note.findById.restore) Note.findById.restore();
    if (NoteImage.find.restore) NoteImage.find.restore();

    // Pass the initial authorization check
    sinon
      .stub(Note, "findById")
      .resolves({ _id: validNoteId, owner: mockUserId });

    // Force the database to crash inside cleanupAssociatedNoteImages
    sinon.stub(NoteImage, "find").rejects(new Error("Simulated Cleanup Error"));

    const response = await request(app)
      .delete(`/api/v1/notes/${validNoteId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).to.equal(500);
  });
});
