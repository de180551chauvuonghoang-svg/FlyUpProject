require("dotenv").config();

const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
  client: {
    adapter: new PrismaPg({ pool }),
  },
};
