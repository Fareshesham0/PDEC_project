import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assessBreachSeverity,
  assessEmailRisk,
  assessPasswordRisk,
  type HibpBreach,
} from "./risk-scoring";

function breach(overrides: Partial<HibpBreach>): HibpBreach {
  return {
    Name: "Example",
    Domain: "example.com",
    BreachDate: "2025-01-01",
    AddedDate: "2025-01-02T00:00:00.000Z",
    PwnCount: 1000,
    Description: "A verified public breach.",
    DataClasses: ["Email addresses"],
    IsVerified: true,
    IsSensitive: false,
    ...overrides,
  };
}

test("assessEmailRisk returns zero risk for no breaches", () => {
  const result = assessEmailRisk([]);
  assert.equal(result.riskScore, 0);
  assert.equal(result.riskLevel, "none");
  assert.deepEqual(result.factors, {
    dpc: 0,
    ei: 0,
    cb: 0,
    enisaSeverity: 0,
    normalizedScore: 0,
  });
});

test("email-only breach maps to low ENISA-normalized risk", () => {
  const result = assessEmailRisk([
    breach({ DataClasses: ["Email addresses"], Description: "Public leak." }),
  ]);
  assert.equal(result.riskLevel, "low");
  assert.equal(result.riskScore, 31);
});

test("password data class maps to very high ENISA-normalized severity", () => {
  const severity = assessBreachSeverity(
    breach({
      DataClasses: ["Email addresses", "Passwords"],
      Description: "Public credential leak.",
    }),
  );
  assert.equal(severity.score, 100);
  assert.equal(severity.level, "very_high");
});

test("multiple breaches use the maximum per-breach score instead of a sum", () => {
  const low = breach({ Name: "Low", DataClasses: ["Email addresses"] });
  const high = breach({
    Name: "High",
    DataClasses: ["Email addresses", "Passwords"],
    Description: "Public credential leak.",
  });
  const result = assessEmailRisk([low, high]);
  assert.equal(result.riskScore, 100);
  assert.equal(result.riskLevel, "very_high");
});

test("password risk is binary based on compromised status", () => {
  const notFound = assessPasswordRisk(false, 0);
  assert.equal(notFound.riskScore, 0);
  assert.equal(notFound.riskLevel, "none");

  const found = assessPasswordRisk(true, 1);
  assert.equal(found.riskScore, 100);
  assert.equal(found.riskLevel, "very_high");
});
