import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const getAutocompleteSuggestion = async (req, res) => {
  try {
    const { title, previousText } = req.body;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "user",
          content: `You are an inline text autocomplete engine. 
          The user is writing a note titled: "${title}".
          Here is what they have written so far: "${previousText}".
          Complete their final sentence naturally. 
          Respond ONLY with the exact text that should follow their last word. Do not include introductory phrases or quotation marks.`,
        },
      ],
      max_completion_tokens: 300,
      reasoning_format: "hidden",
      temperature: 0.5,
    });

    const suggestion = response.choices[0]?.message?.content?.trim() || "";

    return res.status(200).json({ suggestion });
  } catch (error) {
    console.error("Groq Autocomplete API Error:", error);
    return res.status(500).json({ error: "Failed to generate suggestion" });
  }
};
