export type RiskLevel = "none" | "low" | "medium" | "high" | "very_high";
export type SeverityLevel = "none" | "low" | "medium" | "high" | "very_high";

export interface HibpBreach {
  Name: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  PwnCount: number;
  Description: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsSensitive: boolean;
}

export interface RiskFactors {
  dpc: number;
  ei: number;
  cb: number;
  enisaSeverity: number;
  normalizedScore: number;
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  riskScore: number;
  riskExplanation: string;
  recommendations: string[];
  factors?: RiskFactors;
}

export interface BreachSeverity {
  score: number;
  level: SeverityLevel;
  factors: RiskFactors;
}

const ZERO_FACTORS: RiskFactors = {
  dpc: 0,
  ei: 0,
  cb: 0,
  enisaSeverity: 0,
  normalizedScore: 0,
};

const CREDENTIAL_OR_SENSITIVE_CLASSES = new Set([
  "Passwords",
  "Password hashes",
  "Password hints",
  "Security questions and answers",
  "Security questions",
  "Social security numbers",
  "Government issued IDs",
  "Passport numbers",
  "National IDs",
  "Health & fitness data",
  "Medical records",
  "Personal health data",
]);

const FINANCIAL_CLASSES = new Set([
  "Credit cards",
  "Credit card CVV",
  "Banking details",
  "Payment histories",
  "Financial data",
  "Bank account numbers",
  "Transactions",
]);

const BEHAVIOURAL_OR_PROFILE_CLASSES = new Set([
  "IP addresses",
  "Geographic locations",
  "Location data",
  "Browsing histories",
  "Social media profiles",
  "Online identifiers",
  "Dates of birth",
  "Phone numbers",
  "Physical addresses",
]);

function normalizedClassText(dataClasses: string[]): string {
  return dataClasses.join(" ").toLowerCase();
}

function hasAnyExact(dataClasses: string[], values: Set<string>): boolean {
  return dataClasses.some((dataClass) => values.has(dataClass));
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function calculateDpc(dataClasses: string[]): number {
  const text = normalizedClassText(dataClasses);
  let dpc = 1;

  if (
    hasAnyExact(dataClasses, BEHAVIOURAL_OR_PROFILE_CLASSES) ||
    hasAnyKeyword(text, ["ip address", "location", "browsing", "profile", "online identifier"])
  ) {
    dpc = Math.max(dpc, 2);
  }

  if (
    hasAnyExact(dataClasses, FINANCIAL_CLASSES) ||
    hasAnyKeyword(text, ["payment", "credit", "bank", "transaction", "financial"])
  ) {
    dpc = Math.max(dpc, 3);
  }

  if (
    hasAnyExact(dataClasses, CREDENTIAL_OR_SENSITIVE_CLASSES) ||
    hasAnyKeyword(text, [
      "password",
      "security question",
      "government",
      "passport",
      "national id",
      "health",
      "medical",
      "social security",
    ])
  ) {
    dpc = Math.max(dpc, 4);
  }

  return dpc;
}

function calculateEi(dataClasses: string[]): number {
  const text = normalizedClassText(dataClasses);
  if (
    hasAnyKeyword(text, ["email"]) &&
    hasAnyKeyword(text, ["name", "phone", "address", "username"])
  ) {
    return 1;
  }
  if (hasAnyKeyword(text, ["email"])) return 0.75;
  if (hasAnyKeyword(text, ["username"])) return 0.5;
  return 0.25;
}

function calculateCb(breach: HibpBreach): number {
  const text = `${breach.Name} ${breach.Description}`.toLowerCase();
  let cb = 0;

  if (breach.IsVerified || hasAnyKeyword(text, ["public", "leak", "exposed", "dump"])) {
    cb += 0.5;
  }

  if (
    breach.IsSensitive ||
    hasAnyKeyword(text, [
      "hack",
      "hacked",
      "malicious",
      "stolen",
      "credential",
      "ransomware",
      "compromised",
      "unauthorised",
      "unauthorized",
    ])
  ) {
    cb += 0.5;
  }

  return Math.min(cb, 1);
}

function levelFromScore(score: number): RiskLevel {
  if (score === 0) return "none";
  if (score < 50) return "low";
  if (score < 75) return "medium";
  if (score < 100) return "high";
  return "very_high";
}

export function assessBreachSeverity(breach: HibpBreach): BreachSeverity {
  const dpc = calculateDpc(breach.DataClasses);
  const ei = calculateEi(breach.DataClasses);
  const cb = calculateCb(breach);
  const enisaSeverity = Number(((dpc * ei) + cb).toFixed(2));
  const normalizedScore = Math.min(100, Math.round((enisaSeverity / 4) * 100));
  return {
    score: normalizedScore,
    level: levelFromScore(normalizedScore),
    factors: {
      dpc,
      ei,
      cb,
      enisaSeverity,
      normalizedScore,
    },
  };
}

export function assessEmailRisk(breaches: HibpBreach[]): RiskAssessment {
  if (breaches.length === 0) {
    return {
      riskLevel: "none",
      riskScore: 0,
      riskExplanation:
        "No breaches were found for this email address in the checked breach datasets. This does not guarantee your data has never been exposed, but there is no recorded exposure.",
      recommendations: [
        "Continue using a unique, strong password for every account.",
        "Enable two-factor authentication (2FA) on all important accounts.",
        "Be alert to phishing emails even if your address has not been found in known breaches.",
        "Check back periodically - new breaches are discovered regularly.",
      ],
      factors: ZERO_FACTORS,
    };
  }
  const severities = breaches.map(assessBreachSeverity);
  const highestSeverity = severities.reduce((highest, current) =>
    current.score > highest.score ? current : highest,
  );
  const riskScore = highestSeverity.score;
  const riskLevel = levelFromScore(riskScore);
  const hasPasswordExposure = breaches.some((b) =>
    b.DataClasses.some((c) => c.toLowerCase().includes("password")),
  );
  const hasCreditCardExposure = breaches.some((b) => b.DataClasses.some((c) => c.toLowerCase().includes("credit")));

  let riskExplanation = "";
  if (riskLevel === "low") {
    riskExplanation = `Your email was found in ${breaches.length} breach${breaches.length > 1 ? "es" : ""}. The highest ENISA-normalized breach severity is low, but you should still take precautions.`;
  } else if (riskLevel === "medium") {
    riskExplanation = `Your email appeared in ${breaches.length} breach${breaches.length > 1 ? "es" : ""}. At least one breach has medium ENISA-normalized severity based on exposed data context, identifiability, and breach circumstances.`;
  } else if (riskLevel === "high") {
    riskExplanation = `Your email was found in ${breaches.length} breach${breaches.length > 1 ? "es" : ""}. At least one breach has high ENISA-normalized severity${hasCreditCardExposure ? " involving financial information" : hasPasswordExposure ? " involving credentials" : ""}. Prompt action is recommended.`;
  } else if (riskLevel === "very_high") {
    riskExplanation = `Your email was found in ${breaches.length} breach${breaches.length > 1 ? "es" : ""}. At least one breach reaches very high ENISA-normalized severity${hasCreditCardExposure ? " involving financial information" : hasPasswordExposure ? " involving credentials" : ""}. Immediate action is recommended.`;
  }

  const recommendations: string[] = [];
  if (hasPasswordExposure) recommendations.push("Change your password on every site that uses this email address immediately.");
  recommendations.push("Enable two-factor authentication (2FA) on all accounts linked to this email.");
  if (hasCreditCardExposure) recommendations.push("Monitor your bank and credit card statements for unauthorized transactions.");
  recommendations.push("Be extra vigilant against phishing emails targeting this address.");
  recommendations.push("Consider using a password manager to maintain unique, strong passwords per site.");
  if (breaches.length > 3) recommendations.push("Consider creating a new email address for sensitive accounts, since this one has appeared in multiple breaches.");

  return {
    riskLevel,
    riskScore,
    riskExplanation,
    recommendations: recommendations.slice(0, 5),
    factors: highestSeverity.factors,
  };
}

export function assessPasswordRisk(found: boolean, count: number): RiskAssessment {
  if (!found) {
    return {
      riskLevel: "none",
      riskScore: 0,
      riskExplanation:
        "This password has not been found in any known breach dataset checked by Have I Been Pwned. It is safe to continue using it for now, but always prefer long, unique passwords.",
      recommendations: [
        "Use a unique password for every account - never reuse passwords.",
        "Consider a password manager to generate and store strong passwords.",
        "Enable two-factor authentication wherever possible.",
        "Change this password if you suspect it may have been compromised in any way.",
      ],
      factors: ZERO_FACTORS,
    };
  }
  const formattedCount = count.toLocaleString();
  return {
    riskLevel: "very_high",
    riskScore: 100,
    riskExplanation: `This password appears in the HIBP Pwned Passwords corpus ${formattedCount} time${count !== 1 ? "s" : ""}. Under the project methodology, any known compromised password is treated as maximum risk and should be replaced immediately.`,
    recommendations: [
      "Stop using this password on all accounts immediately.",
      "Replace it with a long, randomly generated password (at least 16 characters).",
      "Enable two-factor authentication to protect accounts even if credentials are stolen.",
      "Use a password manager to avoid reusing passwords across sites.",
      "Check all accounts that share this password and change them as a priority.",
    ],
    factors: ZERO_FACTORS,
  };
}
