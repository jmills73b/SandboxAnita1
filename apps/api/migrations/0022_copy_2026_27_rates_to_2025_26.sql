-- 2025/26 was left blank in Admin & Settings -> Billing -> Tax year rates
-- (either no row, or a row with only a monthly target set and every rate
-- field null). Anita asked to copy everything currently configured for
-- 2026/27 across, the same "start from an adjacent year" approach used by
-- 0019 -- but unlike 0019's WHERE NOT EXISTS guard, this one always
-- overwrites 2025/26 with whatever 2026/27 holds right now, since the ask
-- was an explicit copy rather than a one-time backfill of untouched years.
-- No-op if 2026/27 itself has no row.

INSERT INTO tax_year_settings (
  tax_year, start_date, monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate,
  rates_confirmed_at
)
SELECT
  '2025/26', '2025-04-06', monthly_target, split_percentage, personal_allowance,
  basic_rate, basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate,
  ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate,
  rates_confirmed_at
FROM tax_year_settings
WHERE tax_year = '2026/27'
ON CONFLICT(tax_year) DO UPDATE SET
  monthly_target = excluded.monthly_target,
  split_percentage = excluded.split_percentage,
  personal_allowance = excluded.personal_allowance,
  basic_rate = excluded.basic_rate,
  basic_rate_threshold = excluded.basic_rate_threshold,
  higher_rate = excluded.higher_rate,
  higher_rate_threshold = excluded.higher_rate_threshold,
  additional_rate = excluded.additional_rate,
  ni_lower_threshold = excluded.ni_lower_threshold,
  ni_upper_threshold = excluded.ni_upper_threshold,
  ni_lower_rate = excluded.ni_lower_rate,
  ni_upper_rate = excluded.ni_upper_rate,
  class2_flat_rate = excluded.class2_flat_rate,
  rates_confirmed_at = excluded.rates_confirmed_at;
