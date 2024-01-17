import { v4 as uuidV4 } from "uuid";
import chunks from "./chunks.json";
import { COLLECTION_NAME } from "./config";
import { openai, qdrantClient } from "./clients";

const main = async () => {
  await regenerateCollection();
  await populateCollection();
};

const regenerateCollection = async () => {
  await qdrantClient.deleteCollection(COLLECTION_NAME);
  await qdrantClient.recreateCollection(COLLECTION_NAME, {
    vectors: {
      distance: "Cosine",
      size: 1536,
    },
  });
};

const populateCollection = async () => {
  await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points: await generateKnowledgeEmbeddings(),
  });
};

const generateKnowledgeEmbeddings = () => {
  return Promise.all(
    chunks.map(async (file) => {
      const [type, ...content] = file.split(":");
      const contentString = content.join(":");
      const {
        data: [{ embedding }],
      } = await openai.embeddings.create({
        input: contentString ? contentString : type,
        model: "text-embedding-ada-002",
      });

      return {
        id: uuidV4(),
        vector: embedding,
        payload: {
          content: contentString ? contentString : type,
          type: contentString ? type : "unknown",
        },
      };
    })
  );
};

main();
