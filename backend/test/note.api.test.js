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
  const mockUserId = "64c8c8e1f1a2b3c4d5e6f7a8";

  before(() => {
    testToken = jwt.sign(
      { _id: mockUserId },
      process.env.ACCESS_TOKEN_SECRET || "fallback_secret",
      { expiresIn: "1h" },
    );
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
});
