import { describe, expect, it } from "vitest";
import { messages } from "./messages";
import { createTranslator, detectLocale, parseRichText } from "./translate";

describe("detectLocale", () => {
  it("picks the first supported browser language", () => {
    expect(detectLocale(["es-CL", "en-US"])).toBe("es");
    expect(detectLocale(["fr-FR", "en"])).toBe("en");
  });

  it("falls back to English", () => {
    expect(detectLocale(["fr-FR", "de"])).toBe("en");
    expect(detectLocale([])).toBe("en");
  });
});

describe("createTranslator", () => {
  it("fills placeholders and formats numbers for the locale", () => {
    expect(createTranslator("en")("showing", { shown: 1234, total: 5000 })).toBe("Showing 1,234 of 5,000 Prime sets");
    expect(createTranslator("es")("showing", { shown: 1234, total: 5000 })).toBe("Mostrando 1234 de 5000 sets Prime");
  });

  it("chooses the plural form from count", () => {
    const t = createTranslator("es");
    expect(t("partsMissing", { count: 1, percent: 50 })).toBe("50% · falta 1 parte");
    expect(t("partsMissing", { count: 3, percent: 25 })).toBe("25% · faltan 3 partes");
  });

  it("falls back to English, then to the key", () => {
    expect(createTranslator("xx")("build")).toBe("Build");
    expect(createTranslator("es")("no.such.key")).toBe("no.such.key");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(createTranslator("en")("built", {})).toBe("Built {name}");
  });
});

describe("messages", () => {
  it("Spanish has every English key, with the same plural forms and placeholders", () => {
    const placeholders = (value) =>
      JSON.stringify(value)
        .match(/\{\w+\}/g)
        ?.sort()
        .join() ?? "";
    for (const [key, value] of Object.entries(messages.en)) {
      expect(messages.es, key).toHaveProperty([key]);
      expect(typeof messages.es[key], key).toBe(typeof value);
      expect(placeholders(messages.es[key]), key).toBe(placeholders(value));
    }
  });
});

describe("parseRichText", () => {
  it("splits tagged segments", () => {
    expect(parseRichText("You need <b>3 parts</b> and <em>2</em>.")).toEqual([
      "You need ",
      { tag: "b", text: "3 parts" },
      " and ",
      { tag: "em", text: "2" },
      ".",
    ]);
  });
});
