-- Adds the third UK income tax band (additional rate, currently 45% above
-- ~£125,140) alongside the existing basic/higher rate columns, so the Tax
-- & NI Estimate feature can cover the full band structure. No new
-- threshold column is needed for it: bands are contiguous, so the
-- additional rate simply applies to everything above higher_rate_threshold
-- — the same way higher_rate already applies above basic_rate_threshold.

ALTER TABLE tax_year_settings ADD COLUMN additional_rate REAL;
