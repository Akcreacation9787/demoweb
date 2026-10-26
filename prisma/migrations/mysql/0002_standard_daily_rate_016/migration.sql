-- Update the existing approved standard daily calculation rate in place.
-- Existing investment and referral records are not modified.
UPDATE calculation_configs
SET name = 'Standard Daily 0.16%',
    rate_percent = '0.16',
    version = version + 1
WHERE name = 'Standard Daily 1.6%'
  AND rate_period = 'daily';
