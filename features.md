# Feature Development Plan: Print Calculation & Lead Capture

## Executive Summary
Dealers need a single action that both produces a customer-ready financing calculation PDF and captures the interaction as a lead. This initiative adds customer contact fields to the calculator, generates a branded printable PDF, and pushes a detailed event to the Google Sheets `Leads` worksheet for downstream tracking.

## Objectives & Success Metrics
- **Streamline dealer workflow** – printing a calculation must require no more than one additional click after completing the form.
- **Data completeness** – 100% of printed calculations append a row to the `Leads` sheet with all mandatory columns populated.
- **Reliability** – API responds within 5 seconds and surfaces actionable error messages when PDF or Sheets operations fail.
- **Security** – customer data is transmitted over HTTPS and persisted only in the Google Sheet; no long-term storage in the app.

## User Stories
1. *As a dealer*, I can enter a customer's email and phone while preparing a financing calculation.
2. *As a dealer*, I can press "Print Calculation" to immediately receive a PDF that contains dealer details, vehicle specs, and the financial offer.
3. *As an operations analyst*, I can see a new row in the `Leads` worksheet containing customer contact information, vehicle data, and payment details every time a calculation is printed.

## Functional Scope
### 1. State Management Enhancements
- Extend `app/store/calculator-store.ts` with customer contact fields (`customerEmail`, `customerPhone`) and dealer metadata (name, address, contact, financing partner).
- Provide validation helpers/selectors so UI components can surface inline feedback prior to submission.

### 2. UI & UX Updates
- Update `app/components/parameter-form.tsx` to render email/phone inputs with masks and validation states.
- Surface a primary "Print Calculation" button in `results-panel` (or equivalent control cluster) with loading/disabled states based on validation and asynchronous calls.
- Display toast or inline banners for success and failure, ensuring the form remains editable during async operations.

### 3. Payload Composition
- Implement `app/lib/serialization/calc-payload.ts` (or similar) to collect:
  - Dealer/company metadata (from env/config).
  - Customer contact details (from store).
  - Selected vehicle catalog data (make, model, trim, prices).
  - Financing calculation outputs (product type, term, payments).
- Normalize currency/number formats and ensure all required sheet columns are present.

### 4. Server API: `/api/print-calculation`
- Accepts the payload above, validates it (Zod schema).
- Generates a PDF using `pdfkit` or `@react-pdf/renderer` with:
  - Dealer header (logo, address, contact info).
  - Customer contact block and timestamp.
  - Vehicle description table (make/model/trim/prices).
  - Financing summary table (product type, months, first payment, last payment, monthly installment).
- Streams the PDF back with `Content-Type: application/pdf` and triggers download/print on the client.

### 5. Google Sheets Lead Logging
- Uses service account credentials stored in environment variables to append rows to the `Leads` worksheet.
- Ensures atomicity: only append after successful PDF generation; if Sheets append fails, return an error and avoid downloading the PDF.
- Log structured data aligning with the headings listed below.

### 6. Configuration & Secrets
- Document required environment variables in `README.md` (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_ID`, `DEALER_*`).
- Provide instructions for sharing the sheet with the service account and for storing dealer metadata.

## Technical Considerations
- **Error Handling**: Provide specific error codes/messages for validation errors vs. downstream API failures; log server errors with request IDs for observability.
- **Performance**: Cache static assets (logos) used in PDF generation; reuse authenticated Google client across requests when possible.
- **Testing Strategy**:
  - Unit tests for payload builder and validation schemas.
  - Integration tests for API route using mocked PDF and Google Sheets clients.
  - Manual QA checklist covering PDF layout and sheet append.
- **Accessibility**: Ensure the new inputs are keyboard accessible and screen-reader friendly, with clear error messaging.

## Delivery Plan
| Milestone | Tasks | Owner | Estimate |
|-----------|-------|-------|----------|
| M1 – Data Model | Extend store, add selectors, write unit tests | FE | 1 day |
| M2 – UI Controls | Render inputs/button, validation UX, design review | FE | 1.5 days |
| M3 – Payload & API | Implement serializer, API route, PDF template, Sheets integration | Full-stack | 3 days |
| M4 – QA & Docs | Update README/config docs, manual QA, fix bugs | FE + QA | 1.5 days |

Total estimate: **7 days** including buffer for review and deployment.

## Deployment & Monitoring Checklist
- [ ] Configure environment variables (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_ID`, `DEALER_*`) in staging and production.
- [ ] Provision Google Sheets access for the service account and validate append permissions.
- [ ] Upload and version control dealer branding assets used in the PDF template.
- [ ] Set up logging/alerting (e.g., Sentry, Logflare) for API route failures and Sheets append errors.
- [ ] Smoke test PDF generation and Sheet logging in production after deployment.

## Risks & Mitigations
- **Google API throttling** – implement exponential backoff and retries for Sheets writes.
- **PDF layout regressions** – keep template modular and add visual regression snapshots where feasible.
- **Sensitive data exposure** – ensure logs do not contain customer emails/phones; scrub on error paths.
- **International formatting** – use locale-aware formatting for currency and phone numbers.

## Proposed Google Sheets Column Headings (`Leads` Worksheet)
1. Timestamp (ISO 8601)
2. Dealer Name
3. Dealer Email
4. Dealer Phone
5. Dealer Address
6. Financing Company
7. Dealer Representative (optional)
8. Client Email
9. Client Phone
10. Vehicle Make
11. Vehicle Model
12. Vehicle Trim
13. Catalog Price (gross)
14. Selling Price (gross)
15. Financial Product Type
16. Term (Months)
17. First Payment Amount
18. Last Payment Amount
19. Monthly Installment Amount
20. Additional Notes

## Open Questions
- Should the PDF include legal disclaimers or signature blocks?
- Do we need localization for multiple languages/currencies?
- How should we handle partial data (e.g., missing phone number) when appending to the sheet?
- Is there a requirement to email the PDF automatically after generation?

