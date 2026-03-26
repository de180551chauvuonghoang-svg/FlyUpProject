import prisma from "../src/lib/prisma.js";

async function investigate() {
  try {
    console.log("[Test] Checking connectivity...");
    const one = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("[Success] Connectivity OK:", one);

    console.log("[Test] Listing tables...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("[Success] Tables found:", tables.map(t => t.table_name).join(", "));

    console.log("[Test] Checking Assignments table columns...");
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Assignments'
    `;
    if (columns.length === 0) {
        console.log("[Warning] No columns found for 'Assignments'. Trying lowercase 'assignments'...");
        const columnsLower = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assignments'
        `;
        console.log("[Success] 'assignments' columns:", columnsLower.map(c => `${c.column_name} (${c.data_type})`).join(", "));
    } else {
        console.log("[Success] 'Assignments' columns:", columns.map(c => `${c.column_name} (${c.data_type})`).join(", "));
    }

    process.exit(0);
  } catch (error) {
    console.error("[Error] Investigation failed:", error);
    process.exit(1);
  }
}

investigate();
