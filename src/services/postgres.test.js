import { describe, expect, it } from "vitest";
import { toQuery, usesNeonDriver } from "./postgres";

const sql = (strings, ...values) => toQuery(strings, values);

describe("usesNeonDriver", () => {
  it("picks Neon's driver for Neon addresses only", () => {
    expect(usesNeonDriver("postgresql://u:p@ep-cool-name-123-pooler.us-east-1.aws.neon.tech/db?sslmode=require", undefined)).toBe(true);
    expect(usesNeonDriver("postgresql://u:p@db.abcdefgh.supabase.co:5432/postgres", undefined)).toBe(false);
    expect(usesNeonDriver("postgresql://u:p@localhost:5432/prime", undefined)).toBe(false);
    expect(usesNeonDriver("postgresql://u:p@192.168.1.20/prime", undefined)).toBe(false);
    // A look-alike domain is not Neon.
    expect(usesNeonDriver("postgresql://u:p@neon.tech.example.com/db", undefined)).toBe(false);
  });

  it("falls back to the standard client for addresses it cannot read", () => {
    expect(usesNeonDriver("not a url", undefined)).toBe(false);
    expect(usesNeonDriver("", undefined)).toBe(false);
  });

  it("can be overridden", () => {
    expect(usesNeonDriver("postgresql://u:p@db.example.com/db", "neon")).toBe(true);
    expect(usesNeonDriver("postgresql://u:p@ep-x.aws.neon.tech/db", "pg")).toBe(false);
    // Left empty, as in .env.example, it does not override anything.
    expect(usesNeonDriver("postgresql://u:p@ep-x.aws.neon.tech/db", "")).toBe(true);
    expect(usesNeonDriver("postgresql://u:p@localhost/db", "")).toBe(false);
  });
});

describe("toQuery", () => {
  it("turns interpolations into numbered parameters", () => {
    const id = "abc";
    const version = 3;
    expect(sql`UPDATE t SET version = version + 1 WHERE id = ${id} AND version = ${version} RETURNING version`).toEqual({
      text: "UPDATE t SET version = version + 1 WHERE id = $1 AND version = $2 RETURNING version",
      values: ["abc", 3],
    });
  });

  it("never puts a value into the query text", () => {
    const { text, values } = sql`SELECT * FROM t WHERE id = ${"x'; DROP TABLE t; --"}`;
    expect(text).toBe("SELECT * FROM t WHERE id = $1");
    expect(values).toEqual(["x'; DROP TABLE t; --"]);
  });

  it("leaves a query without values as it is", () => {
    expect(sql`SELECT count(*)::int AS count FROM t`).toEqual({ text: "SELECT count(*)::int AS count FROM t", values: [] });
  });
});
