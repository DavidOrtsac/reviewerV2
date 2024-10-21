// index.js

import { ChatGroq } from "@langchain/groq";
import { HumanChatMessage } from "langchain/schema";

export default async function handler(req, res) {
  const { prompt } = req.body;

  // Initialize your GROQ models
  const groqModel = new ChatGroq({
    model: "llama3-70b-8192",
    maxTokens: 2000,
    streaming: true,
  });

  const groqModel2 = new ChatGroq({
    model: "mixtral-8x7b-32768",
    maxTokens: 2000,
    streaming: true,
  });

  try {
    // Use your preferred GROQ model for quiz generation
    await groqModel.call([new HumanChatMessage(prompt)], {
      callbacks: [
        {
          handleLLMNewToken(token) {
            // Streaming quiz response
            res.write(token);
          },
        },
      ],
    });
    res.end(); // End the response after streaming the quiz content
  } catch (error) {
    console.error("Error in processing:", error);
    res.status(500).send("An error occurred while processing the request.");
  }
}
