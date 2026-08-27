import request from "supertest";
import { expect } from "chai";
import nock from "nock";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

import { User } from "../src/models/user.model.js";

describe("AI Autocomplete API Tests", () => {


  let testToken;
  const mockUserId = "64c8c8e1f1a2b3c4d5e6f7a8";

  before(() => {
    nock.disableNetConnect();
    nock.enableNetConnect(/(127\.0\.0\.1|localhost)/);
    testToken = jwt.sign(
      { _id: mockUserId },
      process.env.ACCESS_TOKEN_SECRET || "fallback_secret",
      { expiresIn: "1h" },
    );
  });

  after(() => {
    nock.enableNetConnect();
  });

  beforeEach(() => {
    nock("https://api.groq.com")
      .post("/openai/v1/chat/completions")
      .reply(200, {
        choices: [{ message: { content: "mocked AI text." } }],
      });

    sinon.stub(User, "findById").returns({
      select: sinon.stub().resolves({
        _id: mockUserId,
        username: "testuser",
        email: "test@example.com",
      }),
    });
  });

  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  it("should return 200 and a suggestion for authenticated users", async () => {
    try {
      const response = await request(app)
        .post("/api/v1/ai/autocomplete")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ title: "Test", previousText: "Hello" });

      expect(response.status).to.equal(200);
      expect(response.body.suggestion).to.equal("mocked AI text.");
    } catch (error) {
      throw error;
    }
  });
});
