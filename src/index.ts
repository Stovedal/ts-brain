import sourceMapSupport from "source-map-support";

import { ChatCompletionMessage } from "openai/resources/chat";
import {
  COLLECTION_NAME,
  SMART_OPENAI_MODEL,
  FAST_OPENAI_MODEL,
} from "./config";
import { qdrantClient, openai } from "./clients";

sourceMapSupport.install();

const OPENAI_MODEL =
  process.argv[2] == "fast" ? FAST_OPENAI_MODEL : SMART_OPENAI_MODEL;

const main = async () => {
  const readline = require("readline");

  console.log(`Welcome to brain! Running on: ${OPENAI_MODEL}.\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  promptNextQuestion(rl);
};

const promptNextQuestion = async (rl: any) => {
  rl.question("\nAsk me something: ", async (question: string) => {
    const documentation = await findRelevantDocumentation(question);

    const answer = await askOpenAI(question, documentation);

    console.log("\nBrain:\n\n", answer);

    promptNextQuestion(rl);
  });
};

const findRelevantDocumentation = async (question: string) => {
  const {
    data: [{ embedding: questionVector }],
  } = await openai.embeddings.create({
    input: question,
    model: "text-embedding-ada-002",
  });

  const documentationEmbeddings = await qdrantClient.search(COLLECTION_NAME, {
    vector: questionVector,
    limit: 10,
  });

  return documentationEmbeddings
    .filter(({ score }) => score > 0.68)
    .map(({ payload }) => payload?.content)
    .join(". ")
    .substring(0, 3500);
};

const askOpenAI = async (question: string, documentation: string) => {
  const messages: ChatCompletionMessage[] = [
    {
      role: "system",
      content:
        "You are Brain. You're here to help a developer nagivate the world.",
    },
  ];

  messages.push({
    role: "user",
    content: writePrompt(question, documentation),
  });

  const {
    choices: [{ message }],
  } = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
  });

  return message.content;
};

const writePrompt = (question: string, documentation: string) => {
  return `Write an aswer to this question: "${question}", based on this knowledge: "${documentation}". If you can't find the answer in the provided knowledge, just answer "I don't know.".`;
};

main();
