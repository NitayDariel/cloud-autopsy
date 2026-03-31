import React, { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Grid, BarChart3, Upload, X, FileJson } from "lucide-react";

import FilterBar from "@/components/breach/FilterBar";
import StatsBar from "@/components/breach/StatsBar";
import BreachCard from "@/components/breach/BreachCard";
import BreachDetailDrawer from "@/components/breach/BreachDetailDrawer";
import AttackIntelligence from "@/components/breach/AttackIntelligence";
import AboutDataset from "@/components/breach/AboutDataset";

// ── Embedded dataset v1.2 (15 breaches) ──────────────────────────────────────
const EMBEDDED_BREACHES = [{"id":"capital-one-2019","company":"Capital One","year":2019,"month":7,"sector":"Finance","cloud_provider":"AWS","records_affected":106000000,"mitre_techniques":[{"id":"T1190","name":"Exploit Public-Facing Application","tactic":"Initial Access"},{"id":"T1552.005","name":"Unsecured Credentials: Cloud Instance Metadata API","tactic":"Credential Access"},{"id":"T1078","name":"Valid Accounts","tactic":"Defense Evasion"},{"id":"T1530","name":"Data from Cloud Storage","tactic":"Collection"}],"attack_techniques":["SSRF","IMDSv1 Abuse","IAM Credential Theft","S3 Data Exfiltration"],"services_involved":["EC2","IAM","S3","WAF"],"attack_path":["Attacker identified SSRF vulnerability in misconfigured WAF application","Queried EC2 Instance Metadata Service v1 at 169.254.169.254","Retrieved IAM role name from metadata endpoint","Retrieved temporary IAM credentials (AccessKeyId, SecretAccessKey, SessionToken)","Used credentials to list and download S3 buckets containing customer data"],"what_would_have_caught_it":["IMDSv2 enforcement (requires PUT token before GET — breaks SSRF chain)","Least privilege IAM (role should not have had S3 access)","GuardDuty: UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS","CloudTrail anomaly: GetCallerIdentity from unusual IP with EC2 role"],"detection_gap":"No monitoring on metadata service access; IAM role had excessive S3 permissions; IMDSv1 allowed unauthenticated metadata queries","severity":"critical","financial_impact":"~$80M settlement","reference":"https://www.justice.gov/usao-wdwa/press-release/file/1188626/download","reference_type":"US DOJ Criminal Complaint","summary":"A single SSRF vulnerability in a WAF application let an attacker query EC2 instance metadata unauthenticated, retrieve IAM credentials, and download 100M+ customer records from S3.","root_cause":"SSRF vulnerability in WAF application combined with IMDSv1 enabled on EC2 and overpermissioned IAM role"},{"id":"toyota-github-2023","company":"Toyota","year":2023,"month":10,"sector":"Automotive","cloud_provider":"AWS","records_affected":2000000,"mitre_techniques":[{"id":"T1552.001","name":"Unsecured Credentials: Credentials In Files","tactic":"Credential Access"},{"id":"T1530","name":"Data from Cloud Storage","tactic":"Collection"}],"attack_techniques":["Exposed Credentials","S3 Data Access","Long-Term Key Abuse"],"services_involved":["S3","IAM"],"attack_path":["Developer committed AWS access key hardcoded in source code to public GitHub repository (2017)","Repository remained public for approximately 5 years","Anyone who cloned or viewed the repo had valid AWS credentials","Credentials granted access to S3 bucket containing vehicle location data","Toyota discovered the exposure after a security researcher's report in 2023"],"what_would_have_caught_it":["AWS Secrets Manager or environment variables instead of hardcoded keys","GitHub secret scanning (now available natively — would have flagged AKIA... pattern)","AWS Access Advisor: alert on long-unused or widely-used access keys","IAM: enforce key rotation policy (90 days max)","CloudTrail: unusual geographic access patterns on S3 over 5 years"],"detection_gap":"No secret scanning on git commits; no key rotation enforcement; no alerting on S3 access from unusual sources over 5-year period","severity":"high","financial_impact":"Undisclosed; regulatory investigation","reference":"https://www.bleepingcomputer.com/news/security/toyota-says-data-of-2-million-customers-was-exposed-for-10-years/","reference_type":"Company disclosure + journalism","summary":"A hardcoded AWS access key in a public GitHub repository gave anyone read access to 2 million customers' vehicle location data for 5 years before Toyota discovered it.","root_cause":"Access key hardcoded in source code committed to a public GitHub repository. Key remained valid and undetected for 5 years."},{"id":"twitch-2021","company":"Twitch","year":2021,"month":10,"sector":"Media / Gaming","cloud_provider":"AWS","records_affected":0,"mitre_techniques":[{"id":"T1210","name":"Exploitation of Remote Services","tactic":"Lateral Movement"},{"id":"T1048","name":"Exfiltration Over Alternative Protocol","tactic":"Exfiltration"}],"attack_techniques":["Server Misconfiguration","Lateral Movement","Data Exfiltration"],"services_involved":["S3","EC2","Internal Git"],"attack_path":["Attacker gained access to Twitch internal systems via misconfigured server (vector unconfirmed publicly)","Moved laterally through internal network","Accessed internal git repositories containing source code","Exfiltrated 125GB including: full source code, internal tools, creator payout data, security credentials"],"what_would_have_caught_it":["Network segmentation between public-facing and internal systems","Data Loss Prevention (DLP) on large S3 or git exfiltration","GuardDuty: S3 exfiltration finding on unusual volume","Principle of least privilege on internal system access"],"detection_gap":"Internal systems insufficiently segmented from external access; no alerting on large-volume data exfiltration","severity":"critical","financial_impact":"Reputational; competitor intelligence exposure","reference":"https://www.theverge.com/2021/10/6/22711362/twitch-hack-data-leak-source-code-creators-revenue","reference_type":"Journalism with confirmed company response","summary":"125GB of Twitch's internal data including full source code and creator revenue data was exfiltrated via misconfigured internal systems. The full attack path was never publicly disclosed.","root_cause":"Server misconfiguration exposing internal systems; exact initial vector not fully disclosed publicly"},{"id":"uber-2016","company":"Uber","year":2016,"month":11,"sector":"Transportation","cloud_provider":"AWS","records_affected":57000000,"mitre_techniques":[{"id":"T1552.001","name":"Unsecured Credentials: Credentials In Files","tactic":"Credential Access"},{"id":"T1530","name":"Data from Cloud Storage","tactic":"Collection"}],"attack_techniques":["Exposed Credentials in Git","S3 Data Access","Extortion"],"services_involved":["S3","IAM"],"attack_path":["Attackers discovered AWS credentials hardcoded in Uber's private GitHub repository","Used credentials to access AWS account","Found S3 bucket containing backup of rider and driver database","Downloaded 57M records","Contacted Uber demanding $100,000 ransom to delete the data","Uber paid the ransom and concealed the breach for a year"],"what_would_have_caught_it":["Never store credentials in source code — use IAM roles or Secrets Manager","S3 bucket-level CloudTrail logging to detect unusual bulk downloads","Git secret scanning on private repositories","Mandatory breach disclosure (Uber concealed this for 1 year — illegal)"],"detection_gap":"Credentials in source code; no monitoring on S3 bulk access; concealment prevented timely mitigation","severity":"critical","financial_impact":"$148M FTC settlement for concealing the breach","reference":"https://www.ftc.gov/news-events/news/press-releases/2018/09/uber-agrees-expanded-settlement-ftc-related-privacy-violations","reference_type":"FTC Settlement","summary":"Hardcoded AWS credentials in a private GitHub repo gave attackers access to 57M records. Uber paid $100K ransom and concealed the breach for a year, resulting in a $148M FTC settlement.","root_cause":"AWS credentials hardcoded in private GitHub repository. Attackers found credentials, accessed S3 backup bucket, extorted Uber for $100K to delete the data."},{"id":"lastpass-2022","company":"LastPass","year":2022,"month":12,"sector":"Security / SaaS","cloud_provider":"AWS","records_affected":33000000,"mitre_techniques":[{"id":"T1189","name":"Drive-by Compromise","tactic":"Initial Access"},{"id":"T1056.001","name":"Input Capture: Keylogging","tactic":"Credential Access"},{"id":"T1530","name":"Data from Cloud Storage","tactic":"Collection"}],"attack_techniques":["Endpoint Compromise","Credential Theft","Cloud Backup Access","Supply Chain"],"services_involved":["S3","IAM","Backup Storage"],"attack_path":["Attacker compromised a senior developer's personal home computer via unpatched Plex media server vulnerability","Keylogged developer's master password and MFA codes","Used credentials to access LastPass cloud backup environment (AWS S3)","Exfiltrated encrypted customer password vaults and metadata","Attack went undetected during initial phase"],"what_would_have_caught_it":["Enforce corporate device policy for accessing production cloud credentials","Hardware MFA (FIDO2/YubiKey) for privileged cloud access — not TOTP","Privileged Access Management (PAM) with session recording","CloudTrail anomaly: unusual time/location for privileged access","Zero-trust: developer endpoints should not have direct cloud access"],"detection_gap":"Personal device used for privileged cloud access; software TOTP MFA bypassable via keylogger; no privileged access controls on developer credentials","severity":"critical","financial_impact":"Ongoing; multiple class action lawsuits","reference":"https://blog.lastpass.com/2023/03/security-incident-update-recommended-actions/","reference_type":"Company post-mortem","summary":"A developer's personal computer compromised via an unpatched home media server gave attackers access to LastPass's cloud backup environment and 33M encrypted customer vaults.","root_cause":"Developer's personal home computer compromised via unpatched media software. Used developer's privileged cloud credentials to access backup storage environment."},{"id":"microsoft-power-apps-2021","company":"Microsoft / 47 Orgs","year":2021,"month":8,"sector":"Technology / Multi-sector","cloud_provider":"Azure","records_affected":38000000,"mitre_techniques":[{"id":"T1190","name":"Exploit Public-Facing Application","tactic":"Initial Access"},{"id":"T1083","name":"File and Directory Discovery","tactic":"Discovery"}],"attack_techniques":["Insecure Default Configuration","Unauthenticated API Access"],"services_involved":["Azure Power Apps","OData API"],"attack_path":["Microsoft Power Apps portal tables defaulted to public-read in API","47 organizations built portals with sensitive data","UpGuard researchers discovered data accessible via unauthenticated OData API endpoint","No exploitation required — data was simply publicly readable"],"what_would_have_caught_it":["Explicit secure-by-default table permissions (Microsoft later changed this)","Third-party attack surface monitoring","Regular penetration testing of public-facing APIs","Data classification: any portal with PII should require authenticated access"],"detection_gap":"Platform vendor defaulted to insecure configuration; organizations assumed platform was secure by default; no API inventory or monitoring","severity":"high","financial_impact":"Multiple regulatory investigations","reference":"https://www.upguard.com/breaches/power-apps","reference_type":"Security researcher report (UpGuard)","summary":"38M records across 47 organizations were publicly accessible via Microsoft Power Apps' default insecure configuration — no exploitation required, just the default API endpoint.","root_cause":"Microsoft Power Apps portals defaulted to public data access. Organizations using the platform were unaware their data was publicly accessible without authentication."},{"id":"codecov-2021","company":"Codecov","year":2021,"month":4,"sector":"DevOps / CI-CD","cloud_provider":"GCP","records_affected":29000,"mitre_techniques":[{"id":"T1195.001","name":"Supply Chain Compromise: Compromise Software Dependencies","tactic":"Initial Access"},{"id":"T1552.004","name":"Unsecured Credentials: Private Keys","tactic":"Credential Access"},{"id":"T1048","name":"Exfiltration Over Alternative Protocol","tactic":"Exfiltration"}],"attack_techniques":["Supply Chain Compromise","CI/CD Pipeline Injection","Secret Exfiltration"],"services_involved":["GCP Storage","Docker","CI/CD Pipeline"],"attack_path":["Attacker gained access to Codecov's GCP storage via credential extracted from Docker image creation process","Modified Codecov's bash uploader script to include exfiltration command","Script ran in CI pipelines of all Codecov customers for ~2 months","Every environment variable in every customer CI run sent to attacker server","Customers included Twilio, HashiCorp, Rapid7, and thousands of others"],"what_would_have_caught_it":["Hash verification of third-party scripts before execution","Pin third-party CI integrations to specific versions/hashes","Rotate CI secrets after any third-party integration update","Audit: what environment variables are accessible in CI pipelines?","SLSA supply chain security framework"],"detection_gap":"No integrity verification on third-party script; broad secret exposure in CI environment; no monitoring on outbound connections during CI runs","severity":"critical","financial_impact":"Undisclosed; downstream incidents at customer companies","reference":"https://about.codecov.io/security-update/","reference_type":"Company security advisory","summary":"A compromised Docker image creation process let attackers inject exfiltration code into Codecov's bash uploader, silently stealing CI/CD secrets from 29,000+ customer pipelines for 2 months.","root_cause":"Attacker gained write access to Codecov's Docker image creation process. Modified bash uploader script to exfiltrate environment variables (including secrets) to attacker-controlled server."},{"id":"mailchimp-2022","company":"Mailchimp","year":2022,"month":8,"sector":"Email / Marketing SaaS","cloud_provider":"AWS","records_affected":214,"mitre_techniques":[{"id":"T1566","name":"Phishing","tactic":"Initial Access"},{"id":"T1078","name":"Valid Accounts","tactic":"Defense Evasion"},{"id":"T1530","name":"Data from Cloud Storage","tactic":"Collection"}],"attack_techniques":["Social Engineering","Internal Tool Abuse","Targeted Data Export"],"services_involved":["Internal Admin Tools","IAM equivalent (SaaS RBAC)"],"attack_path":["Attacker socially engineered a Mailchimp customer-facing employee","Gained access to internal Mailchimp admin tooling","Used tooling to export customer audience data (email lists) from 214 accounts","Specifically targeted cryptocurrency-related accounts","Exported data used for phishing campaigns against crypto users"],"what_would_have_caught_it":["Just-in-time (JIT) access for internal admin tools — require approval for bulk exports","Anomaly detection: one employee accessing 214 accounts in a short window","Admin action logging with alerting on bulk data exports","Separation of duties: customer support should not have bulk export capability"],"detection_gap":"Internal tooling with excessive permissions; no alerting on anomalous bulk exports; insufficient separation of duties in employee tooling","severity":"high","financial_impact":"Undisclosed; downstream phishing campaigns caused financial losses","reference":"https://mailchimp.com/newsroom/action-to-protect-mailchimp-accounts/","reference_type":"Company statement","summary":"Social engineering of a single Mailchimp employee gave attackers access to internal tooling and email lists of 214 accounts — all targeting cryptocurrency companies for follow-on phishing.","root_cause":"Social engineering attack on Mailchimp employee. Compromised internal tooling used to export audience data from 214 accounts, targeting crypto companies."},{"id":"accenture-s3-2017","company":"Accenture","year":2017,"month":9,"sector":"Consulting","cloud_provider":"AWS","records_affected":0,"mitre_techniques":[{"id":"T1530","name":"Data from Cloud Storage","tactic":"Collection"},{"id":"T1552.001","name":"Unsecured Credentials: Credentials In Files","tactic":"Credential Access"}],"attack_techniques":["S3 Misconfiguration","Public Bucket Exposure","Credential Exposure"],"services_involved":["S3","IAM"],"attack_path":["UpGuard researcher discovered four publicly-readable Accenture S3 buckets","Buckets contained: AWS private keys, authentication data, decryption keys, customer data","Access required no authentication — standard S3 URL","Data was from Accenture's Cloud Platform (used by enterprise clients)"],"what_would_have_caught_it":["S3 Block Public Access (enable account-wide — prevents this class of mistake)","AWS Config rule: s3-bucket-public-read-prohibited","Periodic S3 ACL audit with AWS Trusted Advisor","Data classification: secrets and keys must never be in S3 without encryption and private ACL"],"detection_gap":"No account-wide S3 public access prevention; no monitoring on S3 ACL settings; secrets stored in S3 without access controls","severity":"critical","financial_impact":"Reputational; no fine disclosed","reference":"https://www.upguard.com/breaches/cloud-leak-accenture","reference_type":"Security researcher report (UpGuard)","summary":"Four publicly-readable S3 buckets exposed Accenture's own cloud platform credentials, decryption keys, and customer data — accessible to anyone who found the bucket URL.","root_cause":"Four AWS S3 buckets left publicly readable. Contained Accenture's own secret keys, credentials, and decryption tools used by internal cloud platform (Accenture Cloud Platform)."},{"id":"twilio-2022","company":"Twilio","year":2022,"month":8,"sector":"Communications SaaS","cloud_provider":"AWS","records_affected":1900,"mitre_techniques":[{"id":"T1566.004","name":"Phishing: Spearphishing via SMS","tactic":"Initial Access"},{"id":"T1621","name":"Multi-Factor Authentication Request Generation","tactic":"Credential Access"},{"id":"T1078","name":"Valid Accounts","tactic":"Defense Evasion"}],"attack_techniques":["Smishing","Credential Phishing","MFA Bypass","Internal Tool Abuse"],"services_involved":["Internal Admin Portal","IAM equivalent (SaaS RBAC)"],"attack_path":["Attackers sent SMS messages to Twilio employees impersonating IT department","Directed employees to phishing page capturing username, password, and TOTP code","Used stolen credentials (including fresh TOTP) to log into Twilio internal admin portal","Accessed customer account data for ~1,900 customers and ~93 Authy users","Same attacker group (0ktapus) hit 130+ companies in the same campaign"],"what_would_have_caught_it":["Hardware security keys (FIDO2) for employee authentication — phishing-resistant","TOTP is not phishing-resistant; it can be relayed in real-time","Admin portal geo-restriction or IP allowlisting","Anomaly detection: login from unusual device/IP with fresh TOTP after SMS campaign","Employee security awareness: IT departments don't ask for TOTP via SMS"],"detection_gap":"TOTP-based MFA is phishable in real time; no phishing-resistant MFA for critical internal tools; no anomaly detection on admin portal access","severity":"high","financial_impact":"Undisclosed; downstream impact on Signal and other Twilio customers","reference":"https://www.twilio.com/blog/august-2022-social-engineering-attack","reference_type":"Company post-mortem","summary":"SMS phishing of Twilio employees captured TOTP codes in real-time, bypassing MFA on internal admin portals and exposing 1,900 customer accounts — demonstrating TOTP is not phishing-resistant.","root_cause":"SMS phishing (smishing) attack on Twilio employees. Employee credentials used to access internal customer administration portal."},{"id":"circleci-2023","company":"CircleCI","year":2023,"month":1,"sector":"DevOps / CI-CD","cloud_provider":"AWS","records_affected":0,"mitre_techniques":[{"id":"T1539","name":"Steal Web Session Cookie","tactic":"Credential Access"},{"id":"T1078","name":"Valid Accounts","tactic":"Defense Evasion"},{"id":"T1552.004","name":"Unsecured Credentials: Private Keys","tactic":"Credential Access"}],"attack_techniques":["Endpoint Malware","Session Cookie Theft","MFA Bypass via Session","Secret Exfiltration"],"services_involved":["Production Database","S3 (secret storage)","IAM"],"attack_path":["Malware installed on a CircleCI engineer's laptop","Malware exfiltrated an active SSO session cookie","Session cookie bypassed 2FA — attacker had valid authenticated session","Accessed CircleCI production environment","Exfiltrated customer secrets database (all env variables, tokens, keys stored in CircleCI)"],"what_would_have_caught_it":["Device trust / managed endpoint requirement for production access","Session binding to device fingerprint (session cookies not usable from different device/IP)","Privileged access from hardened jump hosts only — not developer laptops","Regular secret rotation: even if stolen, short-lived secrets limit blast radius","EDR (Endpoint Detection and Response) on engineer devices"],"detection_gap":"Session cookies can bypass MFA when reused; engineer laptop treated as trusted; no device trust policy; no session anomaly detection on IP/device change","severity":"critical","financial_impact":"Undisclosed; required all customers to rotate all secrets immediately","reference":"https://circleci.com/blog/jan-4-2023-incident-report/","reference_type":"Company incident report","summary":"Malware on a single engineer's laptop stole an SSO session cookie that bypassed MFA, giving attackers access to CircleCI's production secrets database containing all customer environment variables.","root_cause":"Malware on a CircleCI engineer's laptop stole session cookie, bypassing SSO and MFA. Attacker accessed production systems and exfiltrated all customer secrets stored in CI environment."},{"id":"att-2024","company":"AT&T","year":2024,"month":7,"sector":"Telecommunications","cloud_provider":"Snowflake","records_affected":109000000,"mitre_techniques":[{"id":"T1552.001","name":"Unsecured Credentials: Credentials In Files","tactic":"Credential Access"},{"id":"T1078","name":"Valid Accounts","tactic":"Defense Evasion"},{"id":"T1530","name":"Data from Cloud Storage","tactic":"Collection"}],"attack_techniques":["Stolen Credentials","Snowflake Account Takeover","Call Record Exfiltration"],"services_involved":["Snowflake","Cloud Storage"],"attack_path":["Threat actor obtained AT&T employee credentials via infostealer malware on contractor device","MFA was not enforced on AT&T's Snowflake environment","Used credentials to authenticate directly to Snowflake tenant","Exfiltrated call and text metadata records for 109M customers covering May–October 2022","AT&T disclosed breach to SEC in July 2024 — 6 months after initial discovery"],"what_would_have_caught_it":["MFA enforcement on all Snowflake accounts (Snowflake does not enforce MFA by default)","Network policy: restrict Snowflake access to known corporate IP ranges","EDR on contractor/third-party devices accessing production data","Anomaly detection: bulk SELECT queries exfiltrating hundreds of millions of rows","Audit: which users are accessing Snowflake without MFA?"],"detection_gap":"Snowflake does not enforce MFA by default; AT&T did not enforce it; no IP restriction on Snowflake tenant; contractor device not managed/monitored","severity":"critical","financial_impact":"$13M settlement with DOJ; ongoing regulatory investigations","reference":"https://www.sec.gov/Archives/edgar/data/732717/000073271724000062/t-20240709.htm","reference_type":"SEC 8-K Filing","summary":"Infostealer malware on a contractor's device stole credentials to AT&T's Snowflake environment — which had no MFA enforced — enabling exfiltration of call metadata for 109 million customers.","root_cause":"Credentials harvested by infostealer malware on a third-party contractor device. AT&T's Snowflake tenant had no MFA and no IP network policy, allowing direct authentication with stolen credentials."},{"id":"ticketmaster-2024","company":"Ticketmaster","year":2024,"month":5,"sector":"Entertainment / Ticketing","cloud_provider":"Snowflake","records_affected":560000000,"mitre_techniques":[{"id":"T1552.001","name":"Unsecured Credentials: Credentials In Files","tactic":"Credential Access"},{"id":"T1078","name":"Valid Accounts","tactic":"Defense Evasion"},{"id":"T1530","name":"Data from Cloud Storage","tactic":"Collection"}],"attack_techniques":["Infostealer Credential Theft","Snowflake Account Takeover","Bulk Data Exfiltration"],"services_involved":["Snowflake","Cloud Storage"],"attack_path":["Infostealer malware infected a contractor/employee device used to access Ticketmaster's Snowflake environment","Credentials harvested by ShinyHunters threat group","No MFA on Snowflake account","Authenticated to Snowflake tenant and exfiltrated customer data","ShinyHunters listed 1.3TB of data for sale on BreachForums for $500,000"],"what_would_have_caught_it":["MFA on all Snowflake accounts — same root cause as AT&T, Santander, and 160+ other orgs in the same campaign","Network policy restricting Snowflake access to known IP ranges","EDR and device management on all devices accessing production data warehouses","Snowflake audit logs: monitor for bulk SELECT queries from unusual IPs"],"detection_gap":"No MFA on Snowflake; no IP restriction; part of a mass credential theft campaign targeting Snowflake customers; same actor, same TTPs as AT&T breach","severity":"critical","financial_impact":"$0 disclosed; class action lawsuits filed; regulatory investigation in Australia","reference":"https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-170a","reference_type":"CISA Advisory","summary":"Part of a 160+ organization Snowflake credential theft campaign: infostealer malware on a contractor device + no MFA on Snowflake = 560M customer records listed for sale on BreachForums.","root_cause":"Infostealer malware harvested credentials for Ticketmaster's Snowflake environment. No MFA and no network policy on the Snowflake account enabled direct authentication with stolen credentials."},{"id":"microsoft-midnight-blizzard-2024","company":"Microsoft","year":2024,"month":1,"sector":"Technology","cloud_provider":"Azure","records_affected":0,"mitre_techniques":[{"id":"T1110.001","name":"Password Spraying","tactic":"Credential Access"},{"id":"T1078","name":"Valid Accounts","tactic":"Defense Evasion"},{"id":"T1534","name":"Internal Spearphishing","tactic":"Lateral Movement"},{"id":"T1114","name":"Email Collection","tactic":"Collection"}],"attack_techniques":["Password Spraying","OAuth App Abuse","Legacy Protocol Exploitation","Email Exfiltration"],"services_involved":["Azure AD (Entra ID)","Exchange Online","OAuth Applications"],"attack_path":["Midnight Blizzard (SVR/Cozy Bear) conducted password spray attack against a legacy non-production test tenant","Test tenant account had no MFA and legacy authentication protocols enabled","Gained access to legacy OAuth test application with elevated permissions","Used OAuth app to pivot to production Microsoft corporate email environment","Accessed and exfiltrated emails of senior Microsoft leadership, cybersecurity staff, and legal teams","Attack detected January 2024 — initial access was November 2023"],"what_would_have_caught_it":["MFA on all accounts including non-production and test tenants — no exceptions","Disable legacy authentication protocols (Basic Auth) across all tenants","OAuth application permission auditing: test apps should not have production access","Conditional Access policies restricting access to compliant managed devices","Privileged Identity Management (PIM) for production-level OAuth permissions"],"detection_gap":"Legacy test tenant treated as low-risk; no MFA enforced; legacy auth protocols enabled; OAuth app had cross-tenant production access","severity":"critical","financial_impact":"Undisclosed; ongoing; Microsoft disclosed to SEC under new mandatory disclosure rules","reference":"https://msrc.microsoft.com/blog/2024/01/microsoft-actions-following-attack-by-nation-state-actor-midnight-blizzard/","reference_type":"Company security advisory","summary":"Russian state actor Midnight Blizzard password-sprayed a legacy test tenant with no MFA, then pivoted via OAuth app permissions to exfiltrate emails from Microsoft's senior leadership and security teams.","root_cause":"Legacy non-production test tenant had no MFA and legacy authentication enabled. A misconfigured OAuth application with elevated permissions allowed lateral movement into Microsoft's production corporate email environment."},{"id":"github-actions-2025","company":"tj-actions / reviewdog","year":2025,"month":3,"sector":"DevOps / Open Source","cloud_provider":"GitHub","records_affected":0,"mitre_techniques":[{"id":"T1195.001","name":"Supply Chain Compromise: Compromise Software Dependencies","tactic":"Initial Access"},{"id":"T1552.004","name":"Unsecured Credentials: Private Keys","tactic":"Credential Access"},{"id":"T1048","name":"Exfiltration Over Alternative Protocol","tactic":"Exfiltration"}],"attack_techniques":["Supply Chain Compromise","GitHub Actions Injection","CI Secret Exfiltration","OIDC Token Abuse"],"services_involved":["GitHub Actions","GitHub Packages","CI/CD Runner Environment"],"attack_path":["Attacker compromised reviewdog/action-setup GitHub Action (widely used)","Injected malicious code that exfiltrated CI runner environment variables","tj-actions/changed-files (used by 23,000+ repos) was updated to reference the compromised reviewdog action","Any repo running tj-actions/changed-files had its CI secrets printed to runner logs","Secrets included: AWS credentials, npm tokens, GitHub PATs, PyPI tokens"],"what_would_have_caught_it":["Pin GitHub Actions to specific commit SHAs — not mutable version tags (e.g., @v1)","Use OIDC for cloud credentials — short-lived tokens with no long-lived secrets in env vars","Audit: which workflows use third-party actions and what secrets are exposed","Supply chain monitoring: detect when pinned actions change their commit target","Restrict secret exposure: use GITHUB_TOKEN with minimal permissions instead of long-lived credentials"],"detection_gap":"Actions pinned to mutable tags (e.g., v1) not commit SHAs; long-lived credentials in CI environment; no supply chain monitoring on third-party action updates","severity":"high","financial_impact":"Undisclosed; widespread secret rotation required across thousands of repositories","reference":"https://github.blog/security/supply-chain-security/security-alert-tj-actions-changed-files/","reference_type":"GitHub Security Advisory","summary":"A compromised third-party GitHub Action used by 23,000+ repositories injected secret-exfiltrating code into CI pipelines — demonstrating that mutable action tags without SHA pinning are a systemic supply chain risk.","root_cause":"Attacker compromised the reviewdog/action-setup GitHub Action and injected code to print CI environment variables (including secrets) to runner logs. tj-actions/changed-files referenced the compromised action via mutable tag, propagating the compromise to 23,000+ dependent repositories."}];

function parseBreachFile(json) {
  // Support both { breaches: [...] } and plain array
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.breaches)) return json.breaches;
  throw new Error("Unrecognized JSON format. Expected { breaches: [...] } or an array.");
}

export default function Home() {
  const [activeView, setActiveView] = useState("grid");
  const [selectedBreach, setSelectedBreach] = useState(null);
  const [breaches, setBreaches] = useState(EMBEDDED_BREACHES);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const yearRange = useMemo(() => {
    if (!breaches.length) return { min: 2016, max: 2023 };
    const years = breaches.map((b) => b.year).filter(Boolean);
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [breaches]);

  const [filters, setFilters] = useState({
    cloudProvider: "all",
    yearRange: [2016, 2023],
    severity: "all"
  });

  // Sync filter year range when data changes
  const prevYearRange = useRef(null);
  useMemo(() => {
    if (
      !prevYearRange.current ||
      prevYearRange.current.min !== yearRange.min ||
      prevYearRange.current.max !== yearRange.max
    ) {
      prevYearRange.current = yearRange;
      setFilters((prev) => ({ ...prev, yearRange: [yearRange.min, yearRange.max] }));
    }
  }, [yearRange]);

  const filteredBreaches = useMemo(() => {
    return [...breaches]
      .sort((a, b) => b.year - a.year)
      .filter((breach) => {
        if (filters.cloudProvider !== "all" && breach.cloud_provider !== filters.cloudProvider) return false;
        if (breach.year < filters.yearRange[0] || breach.year > filters.yearRange[1]) return false;
        if (filters.severity !== "all" && breach.severity !== filters.severity) return false;
        return true;
      });
  }, [breaches, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadFile = useCallback((file) => {
    setUploadError(null);
    if (!file || !file.name.endsWith(".json")) {
      setUploadError("Please upload a .json file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContents = e.target?.result;
        if (typeof fileContents !== "string") {
          throw new Error("Invalid file content.");
        }
        const parsed = JSON.parse(fileContents);
        const items = parseBreachFile(parsed);
        setBreaches(items);
      } catch (err) {
        setUploadError(err.message || "Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  return (
    <div
      className="min-h-screen bg-[#0d1117]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0d1117]/90 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="border-2 border-dashed border-[#58a6ff] rounded-2xl p-16 text-center">
              <FileJson className="w-16 h-16 text-[#58a6ff] mx-auto mb-4" />
              <p className="text-2xl font-bold text-[#e6edf3]">Drop JSON file to load</p>
              <p className="text-[#8b949e] mt-2">breaches.json</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#0d1117]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-[#f85149]/20">
                  <Shield className="w-5 h-5 text-[#f85149]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#e6edf3]">
                  CloudAutopsy
                </h1>
              </div>
              <p className="text-[#8b949e] text-xs sm:text-sm pl-11">
                Forensic analysis of real-world cloud security breaches
              </p>
              <p className="text-[#8b949e] text-[11px] sm:text-xs pl-11 mt-1">
                Attack paths. Root causes. Detection gaps.
              </p>
              <p className="text-[#8b949e] text-[11px] sm:text-xs pl-11 mt-1">
                {breaches.length} verified incidents
              </p>
            </div>

            {/* Upload button */}
            <div className="flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileInput}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#484f58] rounded-lg text-[#8b949e] hover:text-[#e6edf3] text-sm transition-all"
                title="Upload breaches.json"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Load JSON</span>
              </button>
            </div>
          </div>

          {uploadError && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/30 rounded px-3 py-2 pl-11">
              <X className="w-3 h-3 flex-shrink-0" />
              {uploadError}
              <button onClick={() => setUploadError(null)} className="ml-auto hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} yearRange={yearRange} />

        {/* Stats Bar */}
        <StatsBar breaches={filteredBreaches} />

        {/* View Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveView("grid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === "grid"
                ? "bg-[#e6edf3] text-[#0d1117]"
                : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]"
            }`}
          >
            <Grid className="w-4 h-4" />
            Timeline
          </button>
          <button
            onClick={() => setActiveView("intelligence")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === "intelligence"
                ? "bg-[#e6edf3] text-[#0d1117]"
                : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Attack Intelligence
          </button>
          <button
            onClick={() => setActiveView("about")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === "about"
                ? "bg-[#e6edf3] text-[#0d1117]"
                : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]"
            }`}
          >
            About
          </button>
        </div>

        {/* Cards Grid */}
        {activeView === "grid" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredBreaches.map((breach) => (
                <BreachCard
                  key={breach.id || breach.company}
                  breach={breach}
                  onClick={() => setSelectedBreach(breach)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : activeView === "intelligence" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="intelligence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AttackIntelligence breaches={filteredBreaches} />
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AboutDataset />
            </motion.div>
          </AnimatePresence>
        )}

        {filteredBreaches.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#8b949e]">No breaches match your current filters</p>
          </div>
        )}
      </main>

      {/* Detail Drawer */}
      <BreachDetailDrawer breach={selectedBreach} onClose={() => setSelectedBreach(null)} />
    </div>
  );
}