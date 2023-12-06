import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage } from "langchain/schema";

export default async function handler(req, res) {
  const { prompt } = req.body;

  const model = new ChatOpenAI({
    modelName: 'gpt-4-1106-preview', // specify the model name
    maxTokens: 1000, // set the max tokens
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
