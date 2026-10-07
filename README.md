# HealthLink --- Digital Health Interoperability Prototype

A working portfolio prototype demonstrating authenticated exchange of
**synthetic diagnostic results** between independently deployed
healthcare systems.

The project models a realistic interoperability workflow: an external
diagnostic center sends a FHIR-style result bundle to an
interoperability layer, which authenticates and audits the transaction
before routing it to a hospital EMR for patient matching, terminology
validation, and persistence.

> **Demo only:** Uses synthetic patient data. This is not a production
> FHIR implementation and is not connected to any real healthcare
> facility.

## Live Demo

  ------------------------------------------------------------------------------------------------------
  System                  Live deployment                                        Role
  ----------------------- ------------------------------------------------------ -----------------------
  Diagnostic Center       https://healthlink-diagnostic-center.vercel.app        Creates and sends
                                                                                 diagnostic results

  Interoperability Layer  https://healthlink-interoperability-layer.vercel.app   Authenticates, audits,
                                                                                 and routes exchanges

  Hospital EMR            https://healthlink-hospital-emr.vercel.app             Matches patients,
                                                                                 validates results, and
                                                                                 stores accepted data
  ------------------------------------------------------------------------------------------------------

## Architecture

``` mermaid
flowchart LR
    A["Diagnostic Center"] -->|"FHIR-style Bundle<br/>HTTPS + API key"| B["Interoperability Layer"]
    B -->|"Authenticated HTTPS"| C["Hospital EMR"]
    B --> D[("Exchange Audit DB")]
    C --> E["Client Registry"]
    C --> F["Terminology Validation"]
    C --> G[("Hospital PostgreSQL")]
```

The live portfolio deployment uses **three independent Vercel
applications** built from the same codebase. The Diagnostic Center does
not connect directly to the Hospital database.

## End-to-End Workflow

1.  A diagnostic user enters a synthetic laboratory result.
2.  The Diagnostic Center constructs a FHIR-style `Bundle` containing
    `DiagnosticReport` and `Observation` resources.
3.  The bundle is sent server-to-server to the Interoperability Layer
    over HTTPS with an API key.
4.  The Interoperability Layer authenticates the sender and records the
    exchange in its audit database.
5.  The bundle is forwarded to the Hospital EMR.
6.  The Hospital maps the diagnostic center's external patient
    identifier to its internal patient identifier.
7.  The Hospital validates the observation code and measurement unit
    against the prototype terminology catalogue.
8.  Valid results are persisted in the Hospital PostgreSQL database.
9.  The outcome is returned through the Interoperability Layer to the
    Diagnostic Center.

## Interoperability Concepts Demonstrated

### FHIR-style exchange

Diagnostic results are represented using a FHIR-style `Bundle` with
`DiagnosticReport` and `Observation` resources. The project
intentionally describes this as **FHIR-style** rather than claiming full
FHIR conformance.

### LOINC

Laboratory observations use standardized LOINC identifiers.

  Observation                          LOINC       UCUM unit
  ------------------------------------ ----------- -----------
  Left ventricular ejection fraction   `10230-1`   `%`
  Hemoglobin                           `718-7`     `g/dL`
  Creatinine                           `2160-0`    `mg/dL`
  Glucose                              `2345-7`    `mg/dL`

### UCUM

Measurement units are validated using UCUM-style standardized units such
as `g/dL` and `mg/dL`.

### Patient identity matching

The diagnostic center and hospital do not need to use the same patient
identifier.

Synthetic examples:

  Diagnostic Center ID   Hospital ID   Synthetic patient
  ---------------------- ------------- -------------------
  `DC-8472`              `DEMO-001`    Abebe Kebede
  `DC-3915`              `DEMO-002`    Hana Tesfaye

This demonstrates the role of a client/patient registry when exchanging
information between independent systems.

### Authentication and system boundaries

The browser never receives the shared server API key. Authentication
occurs between backend services, and the Hospital rejects results that
do not arrive through the expected authenticated exchange path.

### Audit logging

The Interoperability Layer maintains its own transaction history,
including successful deliveries and rejected exchanges.

## Independent Deployments

### Diagnostic Center

Environment:

``` text
APP_ROLE=diagnostic
DIAGNOSTIC_API_KEY=<shared secret>
EXCHANGE_BASE_URL=https://healthlink-interoperability-layer.vercel.app
```

The Diagnostic Center has no Hospital database credentials.

### Interoperability Layer

Environment:

``` text
APP_ROLE=exchange
DIAGNOSTIC_API_KEY=<shared secret>
HOSPITAL_BASE_URL=https://healthlink-hospital-emr.vercel.app
DATABASE_URL=<exchange audit database>
```

Its database is used for interoperability audit records.

### Hospital EMR

Environment:

``` text
APP_ROLE=hospital
DIAGNOSTIC_API_KEY=<shared secret>
DATABASE_URL=<hospital database>
```

The Hospital owns persistence of accepted clinical results.

## Technology Stack

-   **Next.js 16**
-   **React 19**
-   **Node.js**
-   **PostgreSQL**
-   **Neon Serverless Postgres**
-   **Vercel**
-   Server-to-server REST/HTTPS APIs
-   FHIR-style healthcare resources
-   LOINC and UCUM terminology concepts

## Test the Live Workflow

A simple synthetic test:

``` text
External Patient ID: DC-8472
Result Type: Hemoglobin
Result Value: 13.5
Conclusion: Synthetic external diagnostic result.
```

Submit it from the Diagnostic Center.

A successful exchange should:

-   return an accepted response to the Diagnostic Center;
-   create a `delivered / 201` audit entry in the Interoperability
    Layer;
-   map `DC-8472` to Hospital patient `DEMO-001`;
-   validate Hemoglobin as LOINC `718-7` with unit `g/dL`;
-   store the result in the Hospital database.

## Expected Failure Behaviour

  Condition                                      Expected result
  ---------------------------------------------- -----------------
  Missing or incorrect sender API key            `401`
  Request bypasses authenticated exchange path   `401`
  Unknown external patient identifier            `404`
  Unsupported LOINC/unit combination             `422`
  Database unavailable or misconfigured          `503`
  Valid authenticated result                     `201`

Rejected exchanges can remain visible in the Exchange audit history,
demonstrating that unsuccessful interoperability transactions are also
recorded.

## Local Development

Requirements:

-   Node.js 20.9+
-   PostgreSQL database

Install dependencies:

``` bash
npm install
```

Create `.env.local` and configure the required environment variables.
Then run:

``` bash
npm test
npm run dev
```

The required database tables are created automatically on first use.

The codebase also supports a local/all-in-one fallback mode for
development, while the public portfolio demonstration uses the
independent three-deployment architecture.

## Security Notes

This prototype demonstrates basic system-to-system authentication and
separation of responsibilities, but it is **not production healthcare
security**.

A production implementation would require controls such as OAuth
2.0/OIDC or equivalent service authentication, robust secrets
management, authorization/RBAC, consent and privacy controls, encryption
and key-management policies, comprehensive audit governance, rate
limiting, message retry/queue infrastructure, monitoring, high
availability, and organizational security processes.

## Limitations

HealthLink is an educational and portfolio proof of concept.

It does **not** claim:

-   full HL7 FHIR conformance;
-   integration with Ethiopia's national health infrastructure;
-   production-grade patient matching or Master Patient Index
    capabilities;
-   a complete terminology server;
-   clinical validation or certification;
-   use with real patient information.

The patient registry and terminology catalogue are intentionally small
and deterministic so the interoperability workflow can be demonstrated
safely with synthetic data.

## Purpose

HealthLink was built to explore the engineering behind health
information exchange: how independently operated healthcare systems can
authenticate one another, exchange structured clinical information,
reconcile different patient identifiers, use standardized terminology,
maintain audit trails, and preserve clear data-ownership boundaries.

It is intended as a practical demonstration of digital-health
interoperability concepts rather than a production clinical system.
