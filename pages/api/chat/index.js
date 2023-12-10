import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage } from "langchain/schema";

export default async function handler(req, res) {
  const { prompt } = req.body;

  // Initialize the model for GPT-4
  const gpt4Model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo-16k', // Assuming 'gpt-4' is the correct model name
    maxTokens: 1400,
    streaming: true, // Enable streaming for GPT-4 as well
  });

  // Initialize the model for GPT-3.5
  const gpt35Model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo-16k',
    maxTokens: 1400,
    streaming: true,
  });

  try {
    // Determine if the prompt is for quiz generation or HTML application
    if (prompt.startsWith("Convert the following passage into a quiz")) {
      // Handle quiz generation with GPT-4 and stream the response
      await gpt4Model.call([new HumanChatMessage(prompt)], {
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
    } else {
      // Handle HTML application with GPT-3.5 and stream the response
      await gpt35Model.call([new HumanChatMessage(prompt)], {
        callbacks: [
          {
            handleLLMNewToken(token) {
              // Streaming HTML response
              res.write(token);
            },
          },
        ],
      });
      res.end(); // End the response after streaming the HTML content
    }
  } catch (error) {
    console.error("Error in processing:", error);
    res.status(500).send("An error occurred while processing the request.");
  }
}