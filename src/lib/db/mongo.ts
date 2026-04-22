import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB ?? 'travel-tracker';

// Avoid multiple clients in development hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

client = new MongoClient(MONGODB_URI);
clientPromise = globalThis.__mongoClientPromise__ ?? client.connect();
if (!globalThis.__mongoClientPromise__) globalThis.__mongoClientPromise__ = clientPromise;

export async function getClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const c = await getClient();
  return c.db(DB_NAME);
}

export default getDb;

