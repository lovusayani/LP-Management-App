const { MongoMemoryServer } = require("mongodb-memory-server");

async function main() {
  const mongo = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: "lp_management",
      ip: "127.0.0.1",
    },
  });

  console.log(mongo.getUri());

  const shutdown = async (signal) => {
    console.log(`Shutting down memory MongoDB from ${signal}...`);
    await mongo.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
