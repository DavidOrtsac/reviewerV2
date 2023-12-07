import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage } from "langchain/schema";

export default async function handler(req, res) {
  const { prompt } = req.body;

  const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo-16k', // specify the model name, use gpt-3.5-turbo-16k for testing
    maxTokens: 1400, // set the max tokens
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token) {
          res.write(token);
        },
      },
    ],
  });

  await model.call([new HumanChatMessage(prompt)]);

  res.end();
}
