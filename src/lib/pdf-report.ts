import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  BreachEntry,
  ExposureResult,
  RiskLevel,
} from "@workspace/api-client-react";

const RISK_LABEL: Record<RiskLevel, string> = {
  none: "Secure",
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  very_high: "Very High Risk",
};

const RISK_ACCENT_RGB: Record<RiskLevel, [number, number, number]> = {
  none: [16, 185, 129],
  low: [234, 179, 8],
  medium: [249, 115, 22],
  high: [239, 68, 68],
  very_high: [185, 28, 28],
};

const SEVERITY_RGB: Record<string, [number, number, number]> = {
  none: [16, 185, 129],
  low: [234, 179, 8],
  medium: [249, 115, 22],
  high: [239, 68, 68],
  very_high: [185, 28, 28],
};

interface BuildOptions {
  result: ExposureResult;
  /**
   * Display identifier. For email checks this should be the actual email
   * address. For password checks this MUST be the literal string
   * "a password" because the plaintext password is never written to the report.
   */
  identifier: string;
  /**
   * Origin used to build the methodology page link. Defaults to the current
   * window origin when called in the browser.
   */
  origin?: string;
}

const PAGE_W = 595.28;
const MARGIN_X = 48;
const TEXT_WIDTH = PAGE_W - MARGIN_X * 2;

export function buildExposureReport({
  result,
  identifier,
  origin,
}: BuildOptions): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const isPasswordReport = identifier === "a password";
  const generatedAt = new Date();
  const accent = RISK_ACCENT_RGB[result.riskLevel] ?? [100, 100, 100];

  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, PAGE_W, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text("Personal Data Exposure Report", MARGIN_X, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Generated: ${generatedAt.toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    })}`,
    MARGIN_X,
    66,
  );
  doc.text(
    `Checked: ${identifier}${isPasswordReport ? " (plaintext intentionally omitted)" : ""}`,
    MARGIN_X,
    80,
  );

  let cursorY = 108;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const explanationLines = doc.splitTextToSize(
    result.riskExplanation,
    TEXT_WIDTH - 32,
  );
  const summaryBoxHeight = Math.max(
    96,
    58 + explanationLines.length * 12 + 16,
  );

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN_X, cursorY, TEXT_WIDTH, summaryBoxHeight, 6, 6, "FD");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(
    result.exposed ? "Breaches Detected" : "No Breaches Found",
    MARGIN_X + 16,
    cursorY + 22,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(
    `${RISK_LABEL[result.riskLevel]} - Score ${result.riskScore}/100`,
    MARGIN_X + 16,
    cursorY + 40,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(explanationLines, MARGIN_X + 16, cursorY + 58);

  cursorY += summaryBoxHeight + 18;

  if (!isPasswordReport && result.factors) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("ENISA score breakdown", MARGIN_X, cursorY);
    cursorY += 8;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN_X, right: MARGIN_X },
      theme: "grid",
      head: [["Factor", "Value", "Meaning"]],
      body: [
        ["DPC", String(result.factors.dpc), "Data Processing Context (max 4)"],
        ["EI", String(result.factors.ei), "Ease of Identification (max 1)"],
        ["CB", String(result.factors.cb), "Circumstances of Breach (max 1)"],
        [
          { content: "ENISA SE", styles: { fontStyle: "bold" } },
          {
            content: String(result.factors.enisaSeverity),
            styles: { fontStyle: "bold" },
          },
          { content: "(DPC x EI) + CB", styles: { fontStyle: "bold" } },
        ],
        [
          { content: "Normalized score", styles: { fontStyle: "bold" } },
          {
            content: `${result.factors.normalizedScore}/100`,
            styles: { fontStyle: "bold" },
          },
          { content: "min(100, (SE / 4) x 100)", styles: { fontStyle: "bold" } },
        ],
      ],
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [20, 20, 20],
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 6 },
    });
    cursorY = lastTableY(doc) + 18;
  }

  if (result.breaches.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(`Breach details (${result.breachCount})`, MARGIN_X, cursorY);
    cursorY += 8;

    const body = result.breaches.map((b: BreachEntry) => [
      b.name,
      formatDate(b.breachDate),
      b.dataClasses.join(", "),
      b.severityLevel
        ? `${b.severityScore} (${formatLevel(b.severityLevel)})`
        : `${b.severityScore}`,
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN_X, right: MARGIN_X },
      theme: "striped",
      head: [["Service", "Breach date", "Data exposed", "Severity"]],
      body,
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [20, 20, 20],
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 5, valign: "top" },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: "bold" },
        1: { cellWidth: 70 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 82, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const breach = result.breaches[data.row.index];
          const rgb = breach?.severityLevel
            ? SEVERITY_RGB[breach.severityLevel]
            : undefined;
          if (rgb) {
            data.cell.styles.textColor = rgb;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
    cursorY = lastTableY(doc) + 18;
  }

  if (result.recommendations.length > 0) {
    cursorY = ensureSpace(doc, cursorY, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Recommendations", MARGIN_X, cursorY);
    cursorY += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    for (const rec of result.recommendations) {
      const lines = doc.splitTextToSize(rec, TEXT_WIDTH - 16);
      cursorY = ensureSpace(doc, cursorY, lines.length * 12 + 8);
      doc.setFont("helvetica", "bold");
      doc.text("-", MARGIN_X, cursorY);
      doc.setFont("helvetica", "normal");
      doc.text(lines, MARGIN_X + 12, cursorY);
      cursorY += lines.length * 12 + 6;
    }
    cursorY += 8;
  }

  cursorY = ensureSpace(doc, cursorY, 90);
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN_X, cursorY, PAGE_W - MARGIN_X, cursorY);
  cursorY += 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("How is this calculated?", MARGIN_X, cursorY);
  cursorY += 12;

  const methodologyText = isPasswordReport
    ? "Password risk is binary: if the password appears in HIBP's Pwned Passwords corpus, it receives a 100/100 compromised status. The check uses k-anonymity: only the first 5 characters of the SHA-1 hash are sent, never the password itself."
    : "The 0-100 risk score is based on the highest ENISA-normalized breach severity across the email's breaches. Each breach uses SE = (DPC x EI) + CB, then normalizes with min(100, (SE / 4) x 100). Breach count is supporting context and is not added into the ENISA score.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const methodologyLines = doc.splitTextToSize(methodologyText, TEXT_WIDTH);
  doc.text(methodologyLines, MARGIN_X, cursorY);
  cursorY += methodologyLines.length * 11 + 6;

  const methodologyUrl = buildMethodologyUrl(origin);
  doc.setTextColor(37, 99, 235);
  doc.textWithLink(`Full methodology: ${methodologyUrl}`, MARGIN_X, cursorY, {
    url: methodologyUrl,
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Personal Data Exposure Checker - Page ${i} of ${pageCount}`,
      PAGE_W / 2,
      820,
      { align: "center" },
    );
  }

  return doc;
}

export function downloadExposureReport(opts: BuildOptions): string {
  const doc = buildExposureReport(opts);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `pdec-report-${stamp}.pdf`;
  doc.save(filename);
  return filename;
}

function lastTableY(doc: jsPDF): number {
  const anyDoc = doc as unknown as { lastAutoTable?: { finalY?: number } };
  return anyDoc.lastAutoTable?.finalY ?? 0;
}

function ensureSpace(doc: jsPDF, cursorY: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (cursorY + needed > pageHeight - 60) {
    doc.addPage();
    return 60;
  }
  return cursorY;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLevel(level: string): string {
  return level
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMethodologyUrl(origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "https://pdec");
  return `${base}/methodology`;
}
