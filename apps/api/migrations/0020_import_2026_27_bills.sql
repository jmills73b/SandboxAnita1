-- Follow-up to 0018: imports the current, still-open 2026/27 tax
-- year's invoices from the spreadsheet's "Bills" sheet (21 rows) --
-- deliberately excluded from 0018 because that year risked overlapping
-- with invoices entered live in the app. Confirmed with Anita that the
-- app has no 2026/27 invoices yet, so this is safe to bring in too.
--
-- Two rows carry the spreadsheet's "Settled by client" status --
-- mapped here to this schema's equivalent, 'Paid to Newmans' (see
-- migration 0003), with date_settled_firm left NULL: the client has
-- paid Newmans, Newmans hasn't paid Anita yet -- genuinely in
-- progress, not missing data.
--
-- Same idempotent pattern as 0018: clients dedupe on exact name,
-- invoices dedupe on client + date + both amounts.

INSERT INTO clients (name) SELECT 'Banham' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Banham');
INSERT INTO clients (name) SELECT 'Blowfield' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Blowfield');
INSERT INTO clients (name) SELECT 'Brady' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Brady');
INSERT INTO clients (name) SELECT 'Clements' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Clements');
INSERT INTO clients (name) SELECT 'Dickson' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Dickson');
INSERT INTO clients (name) SELECT 'Edwards' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Edwards');
INSERT INTO clients (name) SELECT 'Evans' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Evans');
INSERT INTO clients (name) SELECT 'Keith-Jopp' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Keith-Jopp');
INSERT INTO clients (name) SELECT 'Lillywhite' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Lillywhite');
INSERT INTO clients (name) SELECT 'Love' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Love');
INSERT INTO clients (name) SELECT 'Mayes' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Mayes');
INSERT INTO clients (name) SELECT 'Osborn' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Osborn');
INSERT INTO clients (name) SELECT 'Pelham' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Pelham');
INSERT INTO clients (name) SELECT 'Ryan' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Ryan');
INSERT INTO clients (name) SELECT 'Sanderson' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Sanderson');
INSERT INTO clients (name) SELECT 'Smith' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Smith');
INSERT INTO clients (name) SELECT 'Standen' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Standen');

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Keith-Jopp'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-04-01', 1681.5, 1261.12, 'Complete', NULL, '2026-03-19', '2026-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Keith-Jopp')
    AND invoice_date = '2026-04-01'
    AND total_amount = 1681.5
    AND anita_income = 1261.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-04-09', 142.5, 106.88, 'Complete', NULL, '2026-04-09', '2026-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2026-04-09'
    AND total_amount = 142.5
    AND anita_income = 106.88
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Brady'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-04-09', 1054.5, 790.88, 'Complete', NULL, '2026-04-13', '2026-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Brady')
    AND invoice_date = '2026-04-09'
    AND total_amount = 1054.5
    AND anita_income = 790.88
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Standen'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-04-09', 741.0, 555.75, 'Complete', NULL, '2026-04-10', '2026-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Standen')
    AND invoice_date = '2026-04-09'
    AND total_amount = 741.0
    AND anita_income = 555.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Ryan'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-04-14', 570.0, 427.5, 'Complete', NULL, '2026-04-14', '2026-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Ryan')
    AND invoice_date = '2026-04-14'
    AND total_amount = 570.0
    AND anita_income = 427.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Edwards'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-05-05', 344.5, 258.38, 'Complete', NULL, '2026-05-06', '2026-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Edwards')
    AND invoice_date = '2026-05-05'
    AND total_amount = 344.5
    AND anita_income = 258.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mayes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-05-13', 940.5, 705.38, 'Complete', NULL, '2026-05-13', '2026-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mayes')
    AND invoice_date = '2026-05-13'
    AND total_amount = 940.5
    AND anita_income = 705.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Sanderson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-05-14', 2308.5, 1731.38, 'Complete', NULL, '2026-05-15', '2026-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Sanderson')
    AND invoice_date = '2026-05-14'
    AND total_amount = 2308.5
    AND anita_income = 1731.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Standen'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-05-15', 399.0, 299.25, 'Complete', NULL, '2026-05-19', '2026-06-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Standen')
    AND invoice_date = '2026-05-15'
    AND total_amount = 399.0
    AND anita_income = 299.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Blowfield'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-05-26', 285.0, 213.75, 'Complete', NULL, '2026-05-26', '2026-06-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Blowfield')
    AND invoice_date = '2026-05-26'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Clements'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-06-09', 6156.0, 4617.0, 'Complete', NULL, '2026-06-22', '2026-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Clements')
    AND invoice_date = '2026-06-09'
    AND total_amount = 6156.0
    AND anita_income = 4617.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-06-09', 285.0, 213.75, 'Complete', NULL, '2026-06-09', '2026-06-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2026-06-09'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Ryan'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-06-10', 570.0, 427.5, 'Complete', NULL, '2026-06-10', '2026-06-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Ryan')
    AND invoice_date = '2026-06-10'
    AND total_amount = 570.0
    AND anita_income = 427.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Pelham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-06-15', 1510.5, 1132.88, 'Complete', NULL, '2026-06-16', '2026-06-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Pelham')
    AND invoice_date = '2026-06-15'
    AND total_amount = 1510.5
    AND anita_income = 1132.88
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Love'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-06-17', 570.0, 427.5, 'Complete', NULL, '2026-06-17', '2026-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Love')
    AND invoice_date = '2026-06-17'
    AND total_amount = 570.0
    AND anita_income = 427.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Dickson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-07-01', 2935.5, 2201.62, 'Complete', NULL, '2026-07-08', '2026-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Dickson')
    AND invoice_date = '2026-07-01'
    AND total_amount = 2935.5
    AND anita_income = 2201.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Evans'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-07-13', 1026.0, 769.5, 'Complete', NULL, '2026-07-13', '2026-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Evans')
    AND invoice_date = '2026-07-13'
    AND total_amount = 1026.0
    AND anita_income = 769.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Osborn'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-07-13', 285.0, 213.75, 'Complete', NULL, '2026-07-13', '2026-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Osborn')
    AND invoice_date = '2026-07-13'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Lillywhite'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-07-13', 1083.0, 812.25, 'Paid to Newmans', NULL, '2026-07-27', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Lillywhite')
    AND invoice_date = '2026-07-13'
    AND total_amount = 1083.0
    AND anita_income = 812.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mayes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-07-13', 655.5, 491.62, 'Complete', NULL, '2026-07-14', '2026-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mayes')
    AND invoice_date = '2026-07-13'
    AND total_amount = 655.5
    AND anita_income = 491.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Lillywhite'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-07-31', 769.5, 577.12, 'Paid to Newmans', NULL, '2026-07-31', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Lillywhite')
    AND invoice_date = '2026-07-31'
    AND total_amount = 769.5
    AND anita_income = 577.12
);
