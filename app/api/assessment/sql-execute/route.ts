import { NextResponse } from "next/server";
import { auth } from "@/auth";
import path from "path";

// sql.js gives us a throwaway in-memory SQLite database per request — student queries
// never touch the platform's real database.
let sqlModulePromise: Promise<any> | null = null;

async function getSqlModule() {
    if (!sqlModulePromise) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const initSqlJs = require("sql.js");
        sqlModulePromise = initSqlJs({
            locateFile: (file: string) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
        });
    }
    return sqlModulePromise;
}

// Serialize a query result the same way the generator formats expectedOutput:
// one row per line, cell values joined with " | ".
function serializeResult(result: { columns: string[]; values: any[][] } | undefined): string {
    if (!result || !result.values) return "";
    return result.values
        .map(row => row.map(cell => (cell === null || cell === undefined ? "NULL" : String(cell))).join(" | "))
        .join("\n");
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { setupSql, query } = await req.json();
        if (typeof setupSql !== "string" || typeof query !== "string" || !query.trim()) {
            return NextResponse.json({ error: "Missing setupSql or query" }, { status: 400 });
        }

        const SQL = await getSqlModule();
        const db = new SQL.Database();
        try {
            try {
                db.run(setupSql);
            } catch (err: any) {
                return NextResponse.json({ error: `Test case setup failed: ${err.message}` });
            }

            let output = "";
            try {
                const results = db.exec(query);
                // db.exec returns one result set per SELECT; graders use the last one
                output = serializeResult(results[results.length - 1]);
            } catch (err: any) {
                return NextResponse.json({ error: err.message || "SQL error" });
            }

            return NextResponse.json({ output });
        } finally {
            db.close();
        }
    } catch (error: any) {
        console.error("SQL execution failed", error);
        return NextResponse.json({ error: error.message || "Failed to execute SQL" }, { status: 500 });
    }
}
