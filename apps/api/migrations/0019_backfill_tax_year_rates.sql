-- Admin & Settings -> Billing -> Tax year rates already lets you pick any
-- of the past 5 tax years (see TaxRatesManager's 6-year picker), but only
-- 2026/27 has ever had rates entered -- picking an earlier year shows a
-- blank form. Rather than re-typing every field five times, seed those
-- years from whatever's actually configured for 2026/27 right now: this
-- session has no visibility into production, so the values are copied via
-- SQL from the live 2026/27 row itself rather than hardcoded here. UK
-- Income Tax personal allowance and thresholds have in fact been frozen
-- since 2021/22, so that part is accurate as a starting point; NI rates
-- did change more than once across these years (this table only ever
-- holds one blended rate per year), so treat these five backfilled years
-- as a starting point to correct via the same admin screen, not as
-- verified historical fact.
--
-- Idempotent (WHERE NOT EXISTS per year) and a no-op if 2026/27 itself
-- has no row yet.

INSERT INTO tax_year_settings (
  tax_year, start_date, monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
)
SELECT
  '2025/26', '2025-04-06', monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
FROM tax_year_settings
WHERE tax_year = '2026/27' AND NOT EXISTS (SELECT 1 FROM tax_year_settings WHERE tax_year = '2025/26');

INSERT INTO tax_year_settings (
  tax_year, start_date, monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
)
SELECT
  '2024/25', '2024-04-06', monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
FROM tax_year_settings
WHERE tax_year = '2026/27' AND NOT EXISTS (SELECT 1 FROM tax_year_settings WHERE tax_year = '2024/25');

INSERT INTO tax_year_settings (
  tax_year, start_date, monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
)
SELECT
  '2023/24', '2023-04-06', monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
FROM tax_year_settings
WHERE tax_year = '2026/27' AND NOT EXISTS (SELECT 1 FROM tax_year_settings WHERE tax_year = '2023/24');

INSERT INTO tax_year_settings (
  tax_year, start_date, monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
)
SELECT
  '2022/23', '2022-04-06', monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
FROM tax_year_settings
WHERE tax_year = '2026/27' AND NOT EXISTS (SELECT 1 FROM tax_year_settings WHERE tax_year = '2022/23');

INSERT INTO tax_year_settings (
  tax_year, start_date, monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
)
SELECT
  '2021/22', '2021-04-06', monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate
FROM tax_year_settings
WHERE tax_year = '2026/27' AND NOT EXISTS (SELECT 1 FROM tax_year_settings WHERE tax_year = '2021/22');
