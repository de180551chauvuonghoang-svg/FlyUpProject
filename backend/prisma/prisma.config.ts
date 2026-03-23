import path from "path";
import "dotenv/config";

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
