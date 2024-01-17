import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { OPEN_AI_KEY, QDRANT_API_KEY, QDRANT_URL } from "./config";

export const openai = new OpenAI({ apiKey: OPEN_AI_KEY });

export const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});
