import Link from "next/link";
import { ArrowLeft, BookOpen, Database, Lock, ScrollText, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Methodology() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 w-full">
      <header className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to checker
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-sans">
              Methodology
            </h1>
            <p className="text-muted-foreground mt-1">
              How ENISA-based exposure severity and password compromise status are calculated.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Need help or want to report an issue?{" "}
          <Link
            href="/contact"
            className="text-primary hover:underline underline-offset-2"
            data-testid="methodology-contact-link"
          >
            Contact us
          </Link>
          .
        </p>
      </header>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            ENISA Email Risk Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>
            Email breach exposure is assessed with the ENISA Personal Data Breach
            Severity Assessment Methodology. Each breach receives a severity
            estimate using:
          </p>
          <pre className="rounded-md bg-muted px-4 py-3 overflow-x-auto text-xs font-mono">
{`SE = (DPC x EI) + CB
RiskScore = min(100, round((SE / 4) x 100))`}
          </pre>
          <p>
            DPC is Data Processing Context, EI is Ease of Identification, and CB
            is Circumstances of Breach. If an email appears in multiple breaches,
            the overall email risk is the highest normalized breach score. The
            breach count remains visible as supporting context but is not added
            into the ENISA score.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <Bucket label="None" range="0" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" />
            <Bucket label="Low" range="1-49" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20" />
            <Bucket label="Medium" range="50-74" className="bg-orange-500/10 text-orange-600 border-orange-500/20" />
            <Bucket label="High" range="75-99" className="bg-red-500/10 text-red-600 border-red-500/20" />
            <Bucket label="Very High" range="100" className="bg-red-700/10 text-red-700 dark:text-red-400 border-red-700/20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            ENISA Factor Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <FactorTable
            title="Data Processing Context (DPC)"
            rows={[
              ["Email address, username, name", "1"],
              ["IP address, location, browsing behaviour, online identifiers", "2"],
              ["Payment, bank, transaction, or financial data", "3"],
              ["Passwords, security questions, government ID, health, or medical data", "4"],
            ]}
          />
          <FactorTable
            title="Ease of Identification (EI)"
            rows={[
              ["Weak or indirect identifier only", "0.25"],
              ["Username only", "0.50"],
              ["Email address", "0.75"],
              ["Email plus name, phone, address, username, or multiple identifiers", "1.00"],
            ]}
          />
          <FactorTable
            title="Circumstances of Breach (CB)"
            rows={[
              ["Unknown breach circumstances", "0"],
              ["Verified, public, leaked, exposed, or dumped breach data", "+0.50"],
              ["Sensitive, hacked, stolen, credential-related, malicious, or compromised data", "+0.50"],
            ]}
          />
          <p className="text-xs text-muted-foreground">
            CB is capped at 1.00 because available public breach metadata is an
            estimate, not a full legal breach-impact investigation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Password Exposure Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            Password exposure is evaluated separately from ENISA because HIBP
            Pwned Passwords reports compromised-secret status, not full personal
            data breach context. The project uses binary scoring:
          </p>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">HIBP result</th>
                  <th className="text-left px-3 py-2 font-semibold">Score</th>
                  <th className="text-left px-3 py-2 font-semibold">Level</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-t border-border"><td className="px-3 py-2">Not found</td><td className="px-3 py-2">0</td><td className="px-3 py-2">None</td></tr>
                <tr className="border-t border-border"><td className="px-3 py-2">Found</td><td className="px-3 py-2">100</td><td className="px-3 py-2">Very High</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            The occurrence count is still shown as context, but any known
            compromised password should be replaced immediately.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            k-Anonymity for Password Checks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            Password lookups never transmit the raw password or full hash to any
            external service. The server computes SHA-1 locally, sends only the
            first five hash characters to the HIBP range API, receives all
            matching suffixes for that prefix, and compares the suffix locally.
          </p>
          <pre className="rounded-md bg-muted px-4 py-3 overflow-x-auto text-xs font-mono">
{`password -> SHA-1 hash -> send first 5 chars -> compare returned suffixes locally`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>HIBP Public Breach List</strong>: metadata for known
              breaches, including names, dates, account counts, and exposed data
              classes.
            </li>
            <li>
              <strong>XposedOrNot</strong>: email lookup source used to identify
              breach names for an email address.
            </li>
            <li>
              <strong>HIBP Pwned Passwords</strong>: k-anonymity password range
              lookup for compromised password screening.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Limitations and References
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>
            ENISA-based scoring improves academic validity, but the result is
            still an estimated exposure severity. Public breach metadata can be
            incomplete, especially for exact circumstances and malicious intent.
            Password exposure is handled separately because compromised password
            datasets do not provide enough context for full ENISA assessment.
          </p>
          <ol className="space-y-3 list-decimal list-inside">
            <li>
              European Union Agency for Cybersecurity. (2013).{" "}
              <em>Recommendations for a methodology of the assessment of severity of personal data breaches.</em>{" "}
              <a
                href="https://www.enisa.europa.eu/sites/default/files/publications/Data%20breach%20severity%20methodology_1.0.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                ENISA PDF
              </a>
            </li>
            <li>
              Have I Been Pwned. <em>API documentation.</em>{" "}
              <a
                href="https://haveibeenpwned.com/API/v3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                haveibeenpwned.com/API/v3
              </a>
            </li>
            <li>
              National Institute of Standards and Technology.{" "}
              <em>Digital Identity Guidelines: Authentication and Lifecycle Management (SP 800-63B).</em>{" "}
              <a
                href="https://pages.nist.gov/800-63-3/sp800-63b.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                pages.nist.gov/800-63-3/sp800-63b.html
              </a>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Bucket({
  label,
  range,
  className,
}: {
  label: string;
  range: string;
  className: string;
}) {
  return (
    <div className={`rounded-md border px-3 py-2 ${className}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs font-mono opacity-80 mt-0.5">{range}</div>
    </div>
  );
}

function FactorTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex items-center justify-between bg-muted/50 px-3 py-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge variant="outline" className="font-mono text-xs">ENISA</Badge>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([condition, value]) => (
            <tr key={condition} className="border-t border-border">
              <td className="px-3 py-2">{condition}</td>
              <td className="px-3 py-2 font-mono text-right whitespace-nowrap">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
