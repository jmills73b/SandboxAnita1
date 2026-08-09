-- Fee estimate vs. actual: what was quoted to the paying party for the
-- client's current engagement, to compare against what's actually been
-- billed. Nullable -- most clients won't have one set. Compared against
-- invoices.total_amount (the gross fee billed to the paying party), not
-- anita_income, since the estimate is what the client/firm was quoted,
-- not Anita's split of it. One estimate per client (not per matter) --
-- see docs/ARCHITECTURE.md for the scope tradeoff this accepts.
ALTER TABLE clients ADD COLUMN fee_estimate REAL;
ALTER TABLE clients ADD COLUMN fee_estimate_note TEXT;
