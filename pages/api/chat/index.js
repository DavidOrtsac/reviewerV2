import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage } from "langchain/schema";
import { ChatGroq } from "@langchain/groq";

export default async function handler(req, res) {
  const { prompt } = req.body;

  const gpt4Model = new ChatOpenAI({
    modelName: 'gpt-4o-mini', // Assuming 'gpt-4' is the correct model name
    maxTokens: 2000,
    streaming: true, // Enable streaming for GPT-4 as well
  });

  // Initialize your GROQ models
  const groqModel = new ChatGroq({
    model: "llama3-8b-8192",
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
    await groqModel2.call([new HumanChatMessage(prompt)], {
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
