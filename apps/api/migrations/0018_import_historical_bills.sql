-- One-off historical import: five tax years (2021/22-2025/26) of
-- settled invoices from the original spreadsheet ledger this app
-- replaced (story 7.1). The current, still-open tax year (2026/27,
-- the spreadsheet's "Bills" sheet) is deliberately excluded --
-- that year has been entered live in the app already, and importing
-- it too would risk duplicating those entries.
--
-- One row from 202223 bills ("Hutchins & Co", 14 Dec 2022) is left
-- out: its gross Total Income and split % are blank in the source
-- spreadsheet, only Anita's £250 share is recorded, and total_amount
-- is NOT NULL here -- a guessed total would misstate the ledger, so
-- it's better recorded manually once the real figure is known.
--
-- Every INSERT is a WHERE NOT EXISTS: clients dedupe on exact name,
-- invoices dedupe on (client, date, total, Anita's share) -- so this
-- file is safe to re-run and never double-imports.

INSERT INTO clients (name) SELECT 'Akhtar' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Akhtar');
INSERT INTO clients (name) SELECT 'Arnold' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Arnold');
INSERT INTO clients (name) SELECT 'Atherley' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Atherley');
INSERT INTO clients (name) SELECT 'Banham' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Banham');
INSERT INTO clients (name) SELECT 'Barrs' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Barrs');
INSERT INTO clients (name) SELECT 'Belton' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Belton');
INSERT INTO clients (name) SELECT 'Brady' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Brady');
INSERT INTO clients (name) SELECT 'Bray' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Bray');
INSERT INTO clients (name) SELECT 'Brazhda' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Brazhda');
INSERT INTO clients (name) SELECT 'Brown' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Brown');
INSERT INTO clients (name) SELECT 'Carter' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Carter');
INSERT INTO clients (name) SELECT 'Champion' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Champion');
INSERT INTO clients (name) SELECT 'Clarke' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Clarke');
INSERT INTO clients (name) SELECT 'Clements' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Clements');
INSERT INTO clients (name) SELECT 'Collins' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Collins');
INSERT INTO clients (name) SELECT 'Cook' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Cook');
INSERT INTO clients (name) SELECT 'Copeland' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Copeland');
INSERT INTO clients (name) SELECT 'Crone' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Crone');
INSERT INTO clients (name) SELECT 'Davis' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Davis');
INSERT INTO clients (name) SELECT 'Delany' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Delany');
INSERT INTO clients (name) SELECT 'Demichele' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Demichele');
INSERT INTO clients (name) SELECT 'Dewar-Creighton' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Dewar-Creighton');
INSERT INTO clients (name) SELECT 'Dias' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Dias');
INSERT INTO clients (name) SELECT 'Dickson' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Dickson');
INSERT INTO clients (name) SELECT 'Edge' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Edge');
INSERT INTO clients (name) SELECT 'Edwards' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Edwards');
INSERT INTO clients (name) SELECT 'Evans' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Evans');
INSERT INTO clients (name) SELECT 'Farooq' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Farooq');
INSERT INTO clients (name) SELECT 'Fladgate' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Fladgate');
INSERT INTO clients (name) SELECT 'Formosa' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Formosa');
INSERT INTO clients (name) SELECT 'Fox' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Fox');
INSERT INTO clients (name) SELECT 'Freeman' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Freeman');
INSERT INTO clients (name) SELECT 'George' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'George');
INSERT INTO clients (name) SELECT 'Govind' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Govind');
INSERT INTO clients (name) SELECT 'Hager' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Hager');
INSERT INTO clients (name) SELECT 'Hughes' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Hughes');
INSERT INTO clients (name) SELECT 'Kariolis' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Kariolis');
INSERT INTO clients (name) SELECT 'Keen' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Keen');
INSERT INTO clients (name) SELECT 'Keith-Jopp' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Keith-Jopp');
INSERT INTO clients (name) SELECT 'Kemp' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Kemp');
INSERT INTO clients (name) SELECT 'Lazarus' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Lazarus');
INSERT INTO clients (name) SELECT 'Lillywhite' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Lillywhite');
INSERT INTO clients (name) SELECT 'Long' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Long');
INSERT INTO clients (name) SELECT 'Love' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Love');
INSERT INTO clients (name) SELECT 'Lowes' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Lowes');
INSERT INTO clients (name) SELECT 'Mallett' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Mallett');
INSERT INTO clients (name) SELECT 'Matas' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Matas');
INSERT INTO clients (name) SELECT 'May' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'May');
INSERT INTO clients (name) SELECT 'McGagh' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'McGagh');
INSERT INTO clients (name) SELECT 'McGuire' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'McGuire');
INSERT INTO clients (name) SELECT 'Mewes' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Mewes');
INSERT INTO clients (name) SELECT 'Mitkova' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Mitkova');
INSERT INTO clients (name) SELECT 'Monger' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Monger');
INSERT INTO clients (name) SELECT 'Morgan' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Morgan');
INSERT INTO clients (name) SELECT 'Narasamian Sriramulu' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Narasamian Sriramulu');
INSERT INTO clients (name) SELECT 'Naylor' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Naylor');
INSERT INTO clients (name) SELECT 'Noblett' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Noblett');
INSERT INTO clients (name) SELECT 'Offen' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Offen');
INSERT INTO clients (name) SELECT 'Osborn' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Osborn');
INSERT INTO clients (name) SELECT 'Oxley' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Oxley');
INSERT INTO clients (name) SELECT 'Payn' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Payn');
INSERT INTO clients (name) SELECT 'Pelham' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Pelham');
INSERT INTO clients (name) SELECT 'Potter' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Potter');
INSERT INTO clients (name) SELECT 'Prince' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Prince');
INSERT INTO clients (name) SELECT 'Purcell' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Purcell');
INSERT INTO clients (name) SELECT 'Quinton' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Quinton');
INSERT INTO clients (name) SELECT 'Ramachandran Makwana' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Ramachandran Makwana');
INSERT INTO clients (name) SELECT 'Richens' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Richens');
INSERT INTO clients (name) SELECT 'Richmond' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Richmond');
INSERT INTO clients (name) SELECT 'Robinson' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Robinson');
INSERT INTO clients (name) SELECT 'Roffey' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Roffey');
INSERT INTO clients (name) SELECT 'Sanderson' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Sanderson');
INSERT INTO clients (name) SELECT 'Scott' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Scott');
INSERT INTO clients (name) SELECT 'Shipham' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Shipham');
INSERT INTO clients (name) SELECT 'Smith' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Smith');
INSERT INTO clients (name) SELECT 'Staar' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Staar');
INSERT INTO clients (name) SELECT 'Stafford' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Stafford');
INSERT INTO clients (name) SELECT 'Standen' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Standen');
INSERT INTO clients (name) SELECT 'Still' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Still');
INSERT INTO clients (name) SELECT 'Stone' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Stone');
INSERT INTO clients (name) SELECT 'Taylor' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Taylor');
INSERT INTO clients (name) SELECT 'Tomlinson' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Tomlinson');
INSERT INTO clients (name) SELECT 'Tunnicliffe' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Tunnicliffe');
INSERT INTO clients (name) SELECT 'Turpie' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Turpie');
INSERT INTO clients (name) SELECT 'Vaughey' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Vaughey');
INSERT INTO clients (name) SELECT 'Vieco' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Vieco');
INSERT INTO clients (name) SELECT 'Voak' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Voak');
INSERT INTO clients (name) SELECT 'Way' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Way');
INSERT INTO clients (name) SELECT 'Webster-Smith' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Webster-Smith');
INSERT INTO clients (name) SELECT 'Wyciechowski' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Wyciechowski');
INSERT INTO clients (name) SELECT 'Yang' WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Yang');

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Still'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-04-01', 741.0, 555.75, 'Complete', NULL, '2025-04-01', '2025-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Still')
    AND invoice_date = '2025-04-01'
    AND total_amount = 741.0
    AND anita_income = 555.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Payn'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-04-01', 503.5, 377.62, 'Complete', NULL, '2025-04-08', '2025-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Payn')
    AND invoice_date = '2025-04-01'
    AND total_amount = 503.5
    AND anita_income = 377.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Atherley'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-04-01', 1219.0, 914.25, 'Complete', NULL, '2025-04-07', '2025-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Atherley')
    AND invoice_date = '2025-04-01'
    AND total_amount = 1219.0
    AND anita_income = 914.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Lillywhite'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-04-10', 798.0, 598.5, 'Complete', NULL, '2025-04-10', '2025-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Lillywhite')
    AND invoice_date = '2025-04-10'
    AND total_amount = 798.0
    AND anita_income = 598.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Offen'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-04-11', 570.0, 427.5, 'Complete', NULL, '2025-04-11', '2025-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Offen')
    AND invoice_date = '2025-04-11'
    AND total_amount = 570.0
    AND anita_income = 427.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Dickson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-04-24', 826.5, 619.88, 'Complete', NULL, '2025-04-28', '2025-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Dickson')
    AND invoice_date = '2025-04-24'
    AND total_amount = 826.5
    AND anita_income = 619.88
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Still'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-05-15', 997.5, 748.12, 'Complete', NULL, '2025-05-15', '2025-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Still')
    AND invoice_date = '2025-05-15'
    AND total_amount = 997.5
    AND anita_income = 748.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Sanderson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-05-16', 285.0, 213.75, 'Complete', NULL, '2025-05-16', '2025-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Sanderson')
    AND invoice_date = '2025-05-16'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Dickson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-06-05', 912.0, 684.0, 'Complete', NULL, '2025-06-05', '2025-06-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Dickson')
    AND invoice_date = '2025-06-05'
    AND total_amount = 912.0
    AND anita_income = 684.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Clements'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-06-12', 1140.0, 855.0, 'Complete', NULL, '2025-06-12', '2025-06-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Clements')
    AND invoice_date = '2025-06-12'
    AND total_amount = 1140.0
    AND anita_income = 855.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Potter'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-06-13', 1254.0, 940.5, 'Complete', NULL, '2025-06-18', '2025-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Potter')
    AND invoice_date = '2025-06-13'
    AND total_amount = 1254.0
    AND anita_income = 940.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Lillywhite'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-06-17', 513.0, 384.75, 'Complete', NULL, '2025-06-17', '2025-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Lillywhite')
    AND invoice_date = '2025-06-17'
    AND total_amount = 513.0
    AND anita_income = 384.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Payn'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-06-19', 450.5, 337.88, 'Complete', NULL, '2025-06-20', '2025-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Payn')
    AND invoice_date = '2025-06-19'
    AND total_amount = 450.5
    AND anita_income = 337.88
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Keen'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-06-20', 712.5, 534.38, 'Complete', NULL, '2025-06-20', '2025-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Keen')
    AND invoice_date = '2025-06-20'
    AND total_amount = 712.5
    AND anita_income = 534.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Atherley'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-06-22', 821.5, 616.12, 'Complete', NULL, '2025-06-23', '2025-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Atherley')
    AND invoice_date = '2025-06-22'
    AND total_amount = 821.5
    AND anita_income = 616.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-06-22', 900.0, 675.0, 'Complete', NULL, '2025-07-18', '2025-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2025-06-22'
    AND total_amount = 900.0
    AND anita_income = 675.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-06-26', 1060.0, 795.0, 'Complete', NULL, '2025-06-27', '2025-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2025-06-26'
    AND total_amount = 1060.0
    AND anita_income = 795.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Sanderson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-07-12', 1396.5, 1047.38, 'Complete', NULL, '2025-07-15', '2025-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Sanderson')
    AND invoice_date = '2025-07-12'
    AND total_amount = 1396.5
    AND anita_income = 1047.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Keith-Jopp'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-08-08', 541.5, 406.12, 'Complete', NULL, '2025-08-08', '2025-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Keith-Jopp')
    AND invoice_date = '2025-08-08'
    AND total_amount = 541.5
    AND anita_income = 406.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Sanderson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-08-12', 826.5, 619.88, 'Complete', NULL, '2025-08-12', '2025-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Sanderson')
    AND invoice_date = '2025-08-12'
    AND total_amount = 826.5
    AND anita_income = 619.88
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Edwards'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-08-12', 424.0, 318.0, 'Complete', NULL, '2025-08-12', '2025-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Edwards')
    AND invoice_date = '2025-08-12'
    AND total_amount = 424.0
    AND anita_income = 318.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Keen'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-08-12', 1311.0, 983.25, 'Complete', NULL, '2025-08-18', '2025-09-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Keen')
    AND invoice_date = '2025-08-12'
    AND total_amount = 1311.0
    AND anita_income = 983.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Carter'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-08-13', 1140.0, 855.0, 'Complete', NULL, '2025-08-13', '2025-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Carter')
    AND invoice_date = '2025-08-13'
    AND total_amount = 1140.0
    AND anita_income = 855.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Pelham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-09-04', 627.0, 470.25, 'Complete', NULL, '2025-09-04', '2025-09-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Pelham')
    AND invoice_date = '2025-09-04'
    AND total_amount = 627.0
    AND anita_income = 470.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-09-05', 1113.0, 834.75, 'Complete', NULL, '2025-09-08', '2025-09-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2025-09-05'
    AND total_amount = 1113.0
    AND anita_income = 834.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Wyciechowski'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-09-05', 798.0, 598.5, 'Complete', NULL, '2025-09-08', '2025-09-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Wyciechowski')
    AND invoice_date = '2025-09-05'
    AND total_amount = 798.0
    AND anita_income = 598.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Evans'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-10-16', 285.0, 213.75, 'Complete', NULL, '2025-10-16', '2025-10-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Evans')
    AND invoice_date = '2025-10-16'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Clements'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-11-03', 4560.0, 3420.0, 'Complete', NULL, '2025-11-04', '2025-11-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Clements')
    AND invoice_date = '2025-11-03'
    AND total_amount = 4560.0
    AND anita_income = 3420.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Edwards'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-11-03', 132.5, 99.38, 'Complete', NULL, '2025-11-03', '2025-11-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Edwards')
    AND invoice_date = '2025-11-03'
    AND total_amount = 132.5
    AND anita_income = 99.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Keith-Jopp'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-11-03', 1938.0, 1453.5, 'Complete', NULL, '2025-11-24', '2025-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Keith-Jopp')
    AND invoice_date = '2025-11-03'
    AND total_amount = 1938.0
    AND anita_income = 1453.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Sanderson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-11-04', 2129.5, 1597.12, 'Complete', NULL, '2025-11-04', '2025-11-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Sanderson')
    AND invoice_date = '2025-11-04'
    AND total_amount = 2129.5
    AND anita_income = 1597.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Payn'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-11-06', 742.0, 556.5, 'Complete', NULL, '2025-11-07', '2025-11-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Payn')
    AND invoice_date = '2025-11-06'
    AND total_amount = 742.0
    AND anita_income = 556.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Keen'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-11-14', 1396.5, 1047.38, 'Complete', NULL, '2025-11-21', '2025-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Keen')
    AND invoice_date = '2025-11-14'
    AND total_amount = 1396.5
    AND anita_income = 1047.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Lillywhite'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-11-14', 1966.5, 1474.88, 'Complete', NULL, '2025-11-14', '2025-11-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Lillywhite')
    AND invoice_date = '2025-11-14'
    AND total_amount = 1966.5
    AND anita_income = 1474.88
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Osborn'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-11-27', 285.0, 213.75, 'Complete', NULL, '2025-11-27', '2025-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Osborn')
    AND invoice_date = '2025-11-27'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-12-03', 477.0, 357.75, 'Complete', NULL, '2025-12-04', '2025-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2025-12-03'
    AND total_amount = 477.0
    AND anita_income = 357.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-12-11', 285.0, 213.75, 'Complete', NULL, '2025-12-11', '2025-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2025-12-11'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Carter'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-12-17', 399.0, 299.25, 'Complete', NULL, '2026-02-02', '2026-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Carter')
    AND invoice_date = '2025-12-17'
    AND total_amount = 399.0
    AND anita_income = 299.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-12-17', 0.0, 0.0, 'Complete', NULL, '2025-12-17', '2025-12-17'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2025-12-17'
    AND total_amount = 0.0
    AND anita_income = 0.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Brady'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-12-18', 684.0, 513.0, 'Complete', NULL, '2025-12-18', '2026-01-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Brady')
    AND invoice_date = '2025-12-18'
    AND total_amount = 684.0
    AND anita_income = 513.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Copeland'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-01-06', 1368.0, 1026.0, 'Complete', NULL, '2026-01-07', '2026-01-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Copeland')
    AND invoice_date = '2026-01-06'
    AND total_amount = 1368.0
    AND anita_income = 1026.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Love'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-01-07', 798.0, 598.5, 'Complete', NULL, '2026-01-07', '2026-01-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Love')
    AND invoice_date = '2026-01-07'
    AND total_amount = 798.0
    AND anita_income = 598.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Pelham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-01-08', 541.5, 406.12, 'Complete', NULL, '2026-01-08', '2026-01-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Pelham')
    AND invoice_date = '2026-01-08'
    AND total_amount = 541.5
    AND anita_income = 406.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Dickson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-01-15', 1624.5, 1218.38, 'Complete', NULL, '2026-01-19', '2026-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Dickson')
    AND invoice_date = '2026-01-15'
    AND total_amount = 1624.5
    AND anita_income = 1218.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Evans'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-01-19', 2280.0, 1710.0, 'Complete', NULL, '2026-01-22', '2026-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Evans')
    AND invoice_date = '2026-01-19'
    AND total_amount = 2280.0
    AND anita_income = 1710.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Clements'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-01-20', 1111.5, 833.62, 'Complete', NULL, '2026-02-20', '2026-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Clements')
    AND invoice_date = '2026-01-20'
    AND total_amount = 1111.5
    AND anita_income = 833.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Standen'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-01-29', 285.0, 213.75, 'Complete', NULL, '2026-01-29', '2026-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Standen')
    AND invoice_date = '2026-01-29'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Evans'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-02-16', 199.5, 149.62, 'Complete', NULL, '2026-02-16', '2026-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Evans')
    AND invoice_date = '2026-02-16'
    AND total_amount = 199.5
    AND anita_income = 149.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Keen'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-02-20', 883.5, 662.62, 'Complete', NULL, '2026-03-02', '2026-03-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Keen')
    AND invoice_date = '2026-02-20'
    AND total_amount = 883.5
    AND anita_income = 662.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Payn'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-02-24', 212.0, 159.0, 'Complete', NULL, '2026-02-25', '2026-03-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Payn')
    AND invoice_date = '2026-02-24'
    AND total_amount = 212.0
    AND anita_income = 159.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Lillywhite'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2026-02-24', 912.0, 684.0, 'Complete', NULL, '2026-02-24', '2026-03-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Lillywhite')
    AND invoice_date = '2026-02-24'
    AND total_amount = 912.0
    AND anita_income = 684.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Way'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-04-01', 1272.0, 954.0, 'Complete', NULL, '2024-03-14', '2024-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Way')
    AND invoice_date = '2024-04-01'
    AND total_amount = 1272.0
    AND anita_income = 954.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Fladgate'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-04-01', 1404.5, 1053.38, 'Complete', NULL, '2024-03-21', '2024-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Fladgate')
    AND invoice_date = '2024-04-01'
    AND total_amount = 1404.5
    AND anita_income = 1053.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Webster-Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-04-01', 291.5, 218.62, 'Complete', NULL, '2024-03-25', '2024-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Webster-Smith')
    AND invoice_date = '2024-04-01'
    AND total_amount = 291.5
    AND anita_income = 218.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-04-01', 1500.0, 675.0, 'Complete', NULL, '2024-04-02', '2024-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2024-04-01'
    AND total_amount = 1500.0
    AND anita_income = 675.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-04-15', 325.0, 243.75, 'Complete', NULL, '2024-04-15', '2024-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2024-04-15'
    AND total_amount = 325.0
    AND anita_income = 243.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-04-16', 1749.0, 1311.75, 'Complete', NULL, '2024-04-22', '2024-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2024-04-16'
    AND total_amount = 1749.0
    AND anita_income = 1311.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Narasamian Sriramulu'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-04-16', 106.0, 79.5, 'Complete', NULL, '2024-04-19', '2024-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Narasamian Sriramulu')
    AND invoice_date = '2024-04-16'
    AND total_amount = 106.0
    AND anita_income = 79.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-04-23', 1125.0, 506.25, 'Complete', NULL, '2024-05-03', '2024-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2024-04-23'
    AND total_amount = 1125.0
    AND anita_income = 506.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Formosa'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-04-24', 500.0, 375.0, 'Complete', NULL, '2024-05-07', '2024-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Formosa')
    AND invoice_date = '2024-04-24'
    AND total_amount = 500.0
    AND anita_income = 375.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Edwards'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-05-02', 265.0, 198.75, 'Complete', NULL, '2024-05-02', '2024-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Edwards')
    AND invoice_date = '2024-05-02'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Lazarus'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-05-14', 265.0, 198.75, 'Complete', NULL, '2024-05-14', '2024-05-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Lazarus')
    AND invoice_date = '2024-05-14'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Way'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-06-10', 265.0, 198.75, 'Complete', NULL, '2024-06-24', '2024-07-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Way')
    AND invoice_date = '2024-06-10'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-06-11', 1475.0, 663.75, 'Complete', NULL, '2024-06-24', '2024-07-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2024-06-11'
    AND total_amount = 1475.0
    AND anita_income = 663.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Robinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-06-13', 2279.0, 1709.25, 'Complete', NULL, '2024-06-18', '2024-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Robinson')
    AND invoice_date = '2024-06-13'
    AND total_amount = 2279.0
    AND anita_income = 1709.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Formosa'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-06-26', 1850.0, 1387.5, 'Complete', NULL, '2024-07-01', '2024-07-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Formosa')
    AND invoice_date = '2024-06-26'
    AND total_amount = 1850.0
    AND anita_income = 1387.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-07-08', 1425.0, 1068.75, 'Complete', NULL, '2024-07-11', '2024-07-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2024-07-08'
    AND total_amount = 1425.0
    AND anita_income = 1068.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mallett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-07-08', 1275.0, 573.75, 'Complete', NULL, '2024-07-11', '2024-07-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mallett')
    AND invoice_date = '2024-07-08'
    AND total_amount = 1275.0
    AND anita_income = 573.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-07-09', 475.0, 356.25, 'Complete', NULL, '2024-07-25', '2024-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2024-07-09'
    AND total_amount = 475.0
    AND anita_income = 356.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Govind'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-07-09', 265.0, 198.75, 'Complete', NULL, '2024-07-09', '2024-07-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Govind')
    AND invoice_date = '2024-07-09'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Dickson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-07-22', 768.5, 576.38, 'Complete', NULL, '2024-07-22', '2024-08-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Dickson')
    AND invoice_date = '2024-07-22'
    AND total_amount = 768.5
    AND anita_income = 576.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Payn'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-08-13', 689.0, 516.75, 'Complete', NULL, '2024-08-13', '2024-08-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Payn')
    AND invoice_date = '2024-08-13'
    AND total_amount = 689.0
    AND anita_income = 516.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Stafford'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-08-15', 250.0, 187.5, 'Complete', NULL, '2024-08-15', '2024-08-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Stafford')
    AND invoice_date = '2024-08-15'
    AND total_amount = 250.0
    AND anita_income = 187.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Edwards'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-08-15', 424.0, 318.0, 'Complete', NULL, '2024-08-15', '2024-08-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Edwards')
    AND invoice_date = '2024-08-15'
    AND total_amount = 424.0
    AND anita_income = 318.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-08-22', 821.5, 616.12, 'Complete', NULL, '2024-08-22', '2024-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2024-08-22'
    AND total_amount = 821.5
    AND anita_income = 616.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-08-27', 800.0, 360.0, 'Complete', NULL, '2024-09-12', '2024-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2024-08-27'
    AND total_amount = 800.0
    AND anita_income = 360.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Formosa'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-08-29', 950.0, 712.5, 'Complete', NULL, '2024-09-09', '2024-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Formosa')
    AND invoice_date = '2024-08-29'
    AND total_amount = 950.0
    AND anita_income = 712.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Voak'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-09-09', 927.5, 695.62, 'Complete', NULL, '2024-09-09', '2024-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Voak')
    AND invoice_date = '2024-09-09'
    AND total_amount = 927.5
    AND anita_income = 695.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Turpie'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-09-11', 265.0, 198.75, 'Complete', NULL, '2024-09-11', '2024-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Turpie')
    AND invoice_date = '2024-09-11'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Lazarus'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-09-12', 265.0, 198.75, 'Complete', NULL, '2024-09-12', '2024-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Lazarus')
    AND invoice_date = '2024-09-12'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-10-02', 2014.0, 1510.5, 'Complete', NULL, '2024-10-07', '2024-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2024-10-02'
    AND total_amount = 2014.0
    AND anita_income = 1510.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Clements'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-10-07', 166.67, 125.0, 'Complete', NULL, '2024-10-07', '2024-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Clements')
    AND invoice_date = '2024-10-07'
    AND total_amount = 166.67
    AND anita_income = 125.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Belton'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-10-11', 265.0, 198.75, 'Complete', NULL, '2024-10-11', '2024-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Belton')
    AND invoice_date = '2024-10-11'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-10-15', 1550.0, 697.5, 'Complete', NULL, '2024-10-31', '2024-11-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2024-10-15'
    AND total_amount = 1550.0
    AND anita_income = 697.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-10-15', 1325.0, 993.75, 'Complete', NULL, '2024-10-15', '2024-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2024-10-15'
    AND total_amount = 1325.0
    AND anita_income = 993.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Robinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-10-17', 450.5, 337.88, 'Complete', NULL, '2024-10-29', '2024-11-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Robinson')
    AND invoice_date = '2024-10-17'
    AND total_amount = 450.5
    AND anita_income = 337.88
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Fladgate'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-11-06', 2809.0, 2106.75, 'Complete', NULL, '2024-11-08', '2024-11-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Fladgate')
    AND invoice_date = '2024-11-06'
    AND total_amount = 2809.0
    AND anita_income = 2106.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Payn'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-11-15', 1722.5, 1291.88, 'Complete', NULL, '2024-11-18', '2024-12-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Payn')
    AND invoice_date = '2024-11-15'
    AND total_amount = 1722.5
    AND anita_income = 1291.88
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-12-03', 1537.0, 1152.75, 'Complete', NULL, '2024-12-17', '2025-01-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2024-12-03'
    AND total_amount = 1537.0
    AND anita_income = 1152.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Fladgate'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-12-12', 1378.0, 1033.5, 'Complete', NULL, '2024-12-12', '2024-12-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Fladgate')
    AND invoice_date = '2024-12-12'
    AND total_amount = 1378.0
    AND anita_income = 1033.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-12-12', 575.0, 431.25, 'Complete', NULL, '2025-02-21', '2025-03-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2024-12-12'
    AND total_amount = 575.0
    AND anita_income = 431.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Prince'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-01-14', 265.0, 198.75, 'Complete', NULL, '2025-01-14', '2025-01-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Prince')
    AND invoice_date = '2025-01-14'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Kemp'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-01-14', 285.0, 213.75, 'Complete', NULL, '2025-01-14', '2025-01-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Kemp')
    AND invoice_date = '2025-01-14'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Payn'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-01-22', 530.0, 397.5, 'Complete', NULL, '2025-01-22', '2025-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Payn')
    AND invoice_date = '2025-01-22'
    AND total_amount = 530.0
    AND anita_income = 397.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Clements'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-02-06', 285.0, 213.75, 'Complete', NULL, '2025-02-06', '2025-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Clements')
    AND invoice_date = '2025-02-06'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Lowes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-02-10', 1033.5, 775.12, 'Complete', NULL, '2025-02-12', '2025-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Lowes')
    AND invoice_date = '2025-02-10'
    AND total_amount = 1033.5
    AND anita_income = 775.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Potter'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-02-10', 285.0, 213.75, 'Complete', NULL, '2025-02-10', '2025-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Potter')
    AND invoice_date = '2025-02-10'
    AND total_amount = 285.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Dickson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-03-11', 1140.0, 855.0, 'Complete', NULL, '2025-03-11', '2025-03-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Dickson')
    AND invoice_date = '2025-03-11'
    AND total_amount = 1140.0
    AND anita_income = 855.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Matas'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2025-03-11', 503.5, 377.62, 'Complete', NULL, '2025-03-14', '2025-03-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Matas')
    AND invoice_date = '2025-03-11'
    AND total_amount = 503.5
    AND anita_income = 377.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Champion'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-04-01', 700.0, 525.0, 'Complete', 'AMILLS0023', '2023-04-01', '2023-04-24'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Champion')
    AND invoice_date = '2023-04-01'
    AND total_amount = 700.0
    AND anita_income = 525.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-04-01', 475.0, 356.25, 'Complete', 'AMILLS0023', '2023-04-01', '2023-04-24'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2023-04-01'
    AND total_amount = 475.0
    AND anita_income = 356.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Noblett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-04-01', 2375.0, 1068.75, 'Complete', 'AMILLS0023', '2023-04-06', '2023-04-24'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Noblett')
    AND invoice_date = '2023-04-01'
    AND total_amount = 2375.0
    AND anita_income = 1068.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-04-04', 1150.0, 862.5, 'Complete', 'AMILLS0024', '2023-04-20', '2023-05-17'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2023-04-04'
    AND total_amount = 1150.0
    AND anita_income = 862.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-04-26', 800.0, 600.0, 'Complete', 'AMILLS0024', '2023-04-27', '2023-05-17'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2023-04-26'
    AND total_amount = 800.0
    AND anita_income = 600.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-05-04', 475.0, 213.75, 'Complete', 'AMILLS0025', '2023-05-17', '2023-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2023-05-04'
    AND total_amount = 475.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-05-11', 1166.0, 874.5, 'Complete', 'AMILLS0024', '2023-05-11', '2023-05-17'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2023-05-11'
    AND total_amount = 1166.0
    AND anita_income = 874.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mallett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-05-16', 450.0, 202.5, 'Complete', 'AMILLS0025', '2023-05-17', '2023-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mallett')
    AND invoice_date = '2023-05-16'
    AND total_amount = 450.0
    AND anita_income = 202.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-05-17', 250.0, 187.5, 'Complete', 'AMILLS0025', '2023-05-17', '2023-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2023-05-17'
    AND total_amount = 250.0
    AND anita_income = 187.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-05-23', 1425.0, 1068.75, 'Complete', 'AMILLS0025', '2023-05-24', '2023-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2023-05-23'
    AND total_amount = 1425.0
    AND anita_income = 1068.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Davis'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-06-09', 344.5, 258.38, 'Complete', 'AMILLS0026', '2023-06-12', '2023-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Davis')
    AND invoice_date = '2023-06-09'
    AND total_amount = 344.5
    AND anita_income = 258.38
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Brown'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-06-09', 265.0, 198.75, 'Complete', 'AMILLS0025', '2023-06-09', '2023-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Brown')
    AND invoice_date = '2023-06-09'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Long'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-06-14', 200.0, 150.0, 'Complete', 'AMILLS0025', '2023-06-14', '2023-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Long')
    AND invoice_date = '2023-06-14'
    AND total_amount = 200.0
    AND anita_income = 150.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Formosa'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-06-14', 650.0, 487.5, 'Complete', 'AMILLS0025', '2023-06-15', '2023-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Formosa')
    AND invoice_date = '2023-06-14'
    AND total_amount = 650.0
    AND anita_income = 487.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-06-15', 2517.5, 1888.12, 'Complete', 'AMILLS0025', '2023-06-15', '2023-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2023-06-15'
    AND total_amount = 2517.5
    AND anita_income = 1888.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Ramachandran Makwana'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-06-15', 609.5, 457.12, 'Complete', 'AMILLS0025', '2023-06-15', '2023-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Ramachandran Makwana')
    AND invoice_date = '2023-06-15'
    AND total_amount = 609.5
    AND anita_income = 457.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Narasamian Sriramulu'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-06-30', 200.0, 150.0, 'Complete', 'AMILLS0026', '2023-06-30', '2023-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Narasamian Sriramulu')
    AND invoice_date = '2023-06-30'
    AND total_amount = 200.0
    AND anita_income = 150.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-06-30', 175.0, 131.25, 'Complete', 'AMILLS0030', '2023-11-03', '2023-11-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2023-06-30'
    AND total_amount = 175.0
    AND anita_income = 131.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Noblett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-06-30', 300.0, 135.0, 'Complete', 'AMILLS0027', '2023-08-01', '2023-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Noblett')
    AND invoice_date = '2023-06-30'
    AND total_amount = 300.0
    AND anita_income = 135.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Staar'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-07-04', 742.0, 556.5, 'Complete', 'AMILLS0026', '2023-07-04', '2023-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Staar')
    AND invoice_date = '2023-07-04'
    AND total_amount = 742.0
    AND anita_income = 556.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Formosa'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-07-25', 475.0, 356.25, 'Complete', 'AMILLS0027', '2023-07-27', '2023-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Formosa')
    AND invoice_date = '2023-07-25'
    AND total_amount = 475.0
    AND anita_income = 356.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-08-01', 1375.0, 618.75, 'Complete', 'AMILLS0027', '2023-08-04', '2023-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2023-08-01'
    AND total_amount = 1375.0
    AND anita_income = 618.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-08-01', 775.0, 581.25, 'Complete', 'AMILLS0027', '2023-08-01', '2023-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2023-08-01'
    AND total_amount = 775.0
    AND anita_income = 581.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-08-24', 150.0, 112.5, 'Complete', 'AMILLS0028', '2023-08-30', '2023-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2023-08-24'
    AND total_amount = 150.0
    AND anita_income = 112.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Monger'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-09-12', 609.5, 457.12, 'Complete', 'AMILLS0029', '2023-09-15', '2023-10-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Monger')
    AND invoice_date = '2023-09-12'
    AND total_amount = 609.5
    AND anita_income = 457.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-09-12', 925.0, 693.75, 'Complete', 'AMILLS0028', '2023-09-12', '2023-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2023-09-12'
    AND total_amount = 925.0
    AND anita_income = 693.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Robinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-09-14', 397.5, 298.12, 'Complete', 'AMILLS0028', '2023-09-14', '2023-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Robinson')
    AND invoice_date = '2023-09-14'
    AND total_amount = 397.5
    AND anita_income = 298.12
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Staar'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-09-14', 159.0, 119.25, 'Complete', 'AMILLS0029', '2023-09-29', '2023-10-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Staar')
    AND invoice_date = '2023-09-14'
    AND total_amount = 159.0
    AND anita_income = 119.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Formosa'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-09-14', 825.0, 618.75, 'Complete', 'AMILLS0028', '2023-09-14', '2023-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Formosa')
    AND invoice_date = '2023-09-14'
    AND total_amount = 825.0
    AND anita_income = 618.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Way'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-09-15', 583.0, 437.25, 'Complete', 'AMILLS0028', '2023-09-15', '2023-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Way')
    AND invoice_date = '2023-09-15'
    AND total_amount = 583.0
    AND anita_income = 437.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Vieco'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-10-02', 530.0, 397.5, 'Complete', 'AMILLS0029', '2023-10-09', '2023-10-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Vieco')
    AND invoice_date = '2023-10-02'
    AND total_amount = 530.0
    AND anita_income = 397.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-10-16', 1125.0, 843.75, 'Complete', 'AMILLS0029', '2023-10-16', '2023-10-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2023-10-16'
    AND total_amount = 1125.0
    AND anita_income = 843.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hager'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-11-07', 1643.0, 1232.25, 'Complete', 'AMILLS0030', '2023-11-11', '2023-11-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hager')
    AND invoice_date = '2023-11-07'
    AND total_amount = 1643.0
    AND anita_income = 1232.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Formosa'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-11-14', 1100.0, 825.0, 'Complete', 'AMILLS0030', '2023-11-14', '2023-11-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Formosa')
    AND invoice_date = '2023-11-14'
    AND total_amount = 1100.0
    AND anita_income = 825.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-11-14', 1250.0, 562.5, 'Complete', 'AMILLS0030', '2023-11-14', '2023-11-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2023-11-14'
    AND total_amount = 1250.0
    AND anita_income = 562.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Bray'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-11-14', 265.0, 198.75, 'Complete', 'AMILLS0030', '2023-11-14', '2023-11-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Bray')
    AND invoice_date = '2023-11-14'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-11-30', 1643.0, 1232.25, 'Complete', 'AMILLS0031', '2023-12-11', '2023-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2023-11-30'
    AND total_amount = 1643.0
    AND anita_income = 1232.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Webster-Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-11-30', 265.0, 198.75, 'Complete', 'AMILLS0031', '2023-11-30', '2023-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Webster-Smith')
    AND invoice_date = '2023-11-30'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-12-05', 725.0, 543.75, 'Complete', 'AMILLS0031', '2023-12-05', '2023-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2023-12-05'
    AND total_amount = 725.0
    AND anita_income = 543.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Freeman'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-12-05', 950.0, 712.5, 'Complete', 'AMILLS0031', '2023-12-12', '2023-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Freeman')
    AND invoice_date = '2023-12-05'
    AND total_amount = 950.0
    AND anita_income = 712.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Belton'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-12-12', 265.0, 198.75, 'Complete', 'AMILLS0031', '2023-12-12', '2023-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Belton')
    AND invoice_date = '2023-12-12'
    AND total_amount = 265.0
    AND anita_income = 198.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Fladgate'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-12-20', 1590.0, 1192.5, 'Complete', 'AMILLS0032', '2023-12-20', '2024-01-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Fladgate')
    AND invoice_date = '2023-12-20'
    AND total_amount = 1590.0
    AND anita_income = 1192.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Robinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-01-30', 1537.0, 1152.75, 'Complete', 'AMILLS0033', '2024-01-31', '2024-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Robinson')
    AND invoice_date = '2024-01-30'
    AND total_amount = 1537.0
    AND anita_income = 1152.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Webster-Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-02-13', 477.0, 357.75, 'Complete', 'AMILLS0033', '2024-02-13', '2024-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Webster-Smith')
    AND invoice_date = '2024-02-13'
    AND total_amount = 477.0
    AND anita_income = 357.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Robinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-02-13', 715.5, 536.62, 'Complete', 'AMILLS0033', '2024-02-13', '2024-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Robinson')
    AND invoice_date = '2024-02-13'
    AND total_amount = 715.5
    AND anita_income = 536.62
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-02-14', 750.0, 562.5, 'Complete', 'AMILLS0033', '2024-02-14', '2024-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2024-02-14'
    AND total_amount = 750.0
    AND anita_income = 562.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Ramachandran Makwana'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-03-05', 530.0, 397.5, 'Complete', 'AMILLS0034', '2024-03-05', '2024-03-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Ramachandran Makwana')
    AND invoice_date = '2024-03-05'
    AND total_amount = 530.0
    AND anita_income = 397.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-03-07', 600.0, 450.0, 'Complete', 'AMILLS0034', '2024-03-07', '2024-03-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2024-03-07'
    AND total_amount = 600.0
    AND anita_income = 450.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Dickson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-03-14', 848.0, 636.0, 'Complete', 'AMILLS0034', '2024-03-14', '2024-03-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Dickson')
    AND invoice_date = '2024-03-14'
    AND total_amount = 848.0
    AND anita_income = 636.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Narasamian Sriramulu'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2024-03-14', 954.0, 715.5, 'Complete', 'AMILLS0034', '2024-03-14', '2024-03-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Narasamian Sriramulu')
    AND invoice_date = '2024-03-14'
    AND total_amount = 954.0
    AND anita_income = 715.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-01', 1225.0, 918.75, 'Complete', 'AMILLS0012', '2022-05-03', '2022-05-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2022-04-01'
    AND total_amount = 1225.0
    AND anita_income = 918.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Quinton'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-01', 200.0, 150.0, 'Complete', 'AMILLS0011', '2022-03-28', '2022-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Quinton')
    AND invoice_date = '2022-04-01'
    AND total_amount = 200.0
    AND anita_income = 150.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Shipham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-01', 1550.0, 1162.5, 'Complete', 'AMILLS0011', '2022-03-29', '2022-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Shipham')
    AND invoice_date = '2022-04-01'
    AND total_amount = 1550.0
    AND anita_income = 1162.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Edge'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-05', 166.67, 125.0, 'Complete', 'AMILLS0011', '2022-04-05', '2022-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Edge')
    AND invoice_date = '2022-04-05'
    AND total_amount = 166.67
    AND anita_income = 125.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Naylor'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-12', 350.0, 262.5, 'Complete', 'AMILLS0011', '2022-04-12', '2022-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Naylor')
    AND invoice_date = '2022-04-12'
    AND total_amount = 350.0
    AND anita_income = 262.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Barrs'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-13', 650.0, 487.5, 'Complete', 'AMILLS0012', '2022-04-19', '2022-05-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Barrs')
    AND invoice_date = '2022-04-13'
    AND total_amount = 650.0
    AND anita_income = 487.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Yang'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-14', 250.0, 187.5, 'Complete', 'AMILLS0011', '2022-04-14', '2022-04-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Yang')
    AND invoice_date = '2022-04-14'
    AND total_amount = 250.0
    AND anita_income = 187.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'George'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-20', 625.0, 468.75, 'Complete', 'AMILLS0016', '2022-09-02', '2022-09-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'George')
    AND invoice_date = '2022-04-20'
    AND total_amount = 625.0
    AND anita_income = 468.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Vaughey'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-27', 750.0, 562.5, 'Complete', 'AMILLS0012', '2022-05-05', '2022-05-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Vaughey')
    AND invoice_date = '2022-04-27'
    AND total_amount = 750.0
    AND anita_income = 562.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Noblett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-04-29', 4975.0, 2238.75, 'Complete', 'AMILLS0015', '2022-07-25', '2022-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Noblett')
    AND invoice_date = '2022-04-29'
    AND total_amount = 4975.0
    AND anita_income = 2238.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Shipham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-06-07', 1100.0, 825.0, 'Complete', 'AMILLS0013', '2022-06-07', '2022-06-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Shipham')
    AND invoice_date = '2022-06-07'
    AND total_amount = 1100.0
    AND anita_income = 825.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Richmond'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-06-15', 500.0, 375.0, 'Complete', 'AMILLS0013', '2022-06-15', '2022-06-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Richmond')
    AND invoice_date = '2022-06-15'
    AND total_amount = 500.0
    AND anita_income = 375.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Morgan'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-06-28', 625.0, 281.25, 'Complete', 'AMILLS0017', '2022-09-26', '2022-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Morgan')
    AND invoice_date = '2022-06-28'
    AND total_amount = 625.0
    AND anita_income = 281.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Brazhda'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-06-29', 1775.0, 1331.25, 'Complete', 'AMILLS0015', '2022-07-25', '2022-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Brazhda')
    AND invoice_date = '2022-06-29'
    AND total_amount = 1775.0
    AND anita_income = 1331.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'May'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-06-29', 1925.0, 866.25, 'Complete', 'AMILLS0016', '2022-09-09', '2022-09-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'May')
    AND invoice_date = '2022-06-29'
    AND total_amount = 1925.0
    AND anita_income = 866.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Taylor'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-07-12', 1650.0, 1237.5, 'Complete', 'AMILLS0014', '2022-07-12', '2022-07-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Taylor')
    AND invoice_date = '2022-07-12'
    AND total_amount = 1650.0
    AND anita_income = 1237.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'May'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-09-09', 1050.0, 472.5, 'Complete', 'AMILLS0016', '2022-09-09', '2022-09-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'May')
    AND invoice_date = '2022-09-09'
    AND total_amount = 1050.0
    AND anita_income = 472.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-09-13', 750.0, 562.5, 'Complete', 'AMILLS0016', '2022-09-13', '2022-09-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2022-09-13'
    AND total_amount = 750.0
    AND anita_income = 562.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Richens'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-09-20', 500.0, 225.0, 'Complete', 'AMILLS0017', '2022-09-20', '2022-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Richens')
    AND invoice_date = '2022-09-20'
    AND total_amount = 500.0
    AND anita_income = 225.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Akhtar'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-09-28', 750.0, 562.5, 'Complete', 'AMILLS0017', '2022-09-28', '2022-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Akhtar')
    AND invoice_date = '2022-09-28'
    AND total_amount = 750.0
    AND anita_income = 562.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-10-11', 325.0, 146.25, 'Complete', 'AMILLS0017', '2022-10-11', '2022-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2022-10-11'
    AND total_amount = 325.0
    AND anita_income = 146.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'McGagh'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-10-12', 800.0, 600.0, 'Complete', 'AMILLS0017', '2022-10-12', '2022-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'McGagh')
    AND invoice_date = '2022-10-12'
    AND total_amount = 800.0
    AND anita_income = 600.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Brazhda'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-10-12', 1950.0, 1462.5, 'Complete', 'AMILLS0020', '2022-12-05', '2023-01-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Brazhda')
    AND invoice_date = '2022-10-12'
    AND total_amount = 1950.0
    AND anita_income = 1462.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'May'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-10-13', 250.0, 112.5, 'Complete', 'AMILLS0017', '2022-10-13', '2022-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'May')
    AND invoice_date = '2022-10-13'
    AND total_amount = 250.0
    AND anita_income = 112.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-10-14', 1125.0, 843.75, 'Complete', 'AMILLS0019', '2022-11-18', '2022-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2022-10-14'
    AND total_amount = 1125.0
    AND anita_income = 843.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Noblett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-10-18', 1250.0, 562.5, 'Complete', 'AMILLS0020', '2022-12-13', '2023-01-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Noblett')
    AND invoice_date = '2022-10-18'
    AND total_amount = 1250.0
    AND anita_income = 562.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Cook'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-11-14', 125.0, 93.75, 'Complete', 'AMILLS0018', '2022-11-14', '2022-11-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Cook')
    AND invoice_date = '2022-11-14'
    AND total_amount = 125.0
    AND anita_income = 93.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Dewar-Creighton'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-11-14', 925.0, 693.75, 'Complete', 'AMILLS0018', '2022-11-15', '2022-11-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Dewar-Creighton')
    AND invoice_date = '2022-11-14'
    AND total_amount = 925.0
    AND anita_income = 693.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Freeman'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-11-21', 2850.0, 2137.5, 'Complete', 'AMILLS0019', '2022-11-22', '2022-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Freeman')
    AND invoice_date = '2022-11-21'
    AND total_amount = 2850.0
    AND anita_income = 2137.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-11-22', 250.0, 187.5, 'Complete', 'AMILLS0019', '2022-11-22', '2022-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2022-11-22'
    AND total_amount = 250.0
    AND anita_income = 187.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Dias'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-11-29', 166.67, 125.0, 'Complete', 'AMILLS0019', '2022-11-29', '2022-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Dias')
    AND invoice_date = '2022-11-29'
    AND total_amount = 166.67
    AND anita_income = 125.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-12-08', 1100.0, 825.0, 'Complete', 'AMILLS0019', '2022-12-08', '2022-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2022-12-08'
    AND total_amount = 1100.0
    AND anita_income = 825.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Roffey'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-12-08', 750.0, 562.5, 'Complete', 'AMILLS0019', '2022-12-08', '2022-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Roffey')
    AND invoice_date = '2022-12-08'
    AND total_amount = 750.0
    AND anita_income = 562.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Purcell'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-12-09', 225.0, 168.75, 'Complete', 'AMILLS0019', '2022-12-09', '2022-12-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Purcell')
    AND invoice_date = '2022-12-09'
    AND total_amount = 225.0
    AND anita_income = 168.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Freeman'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-01-13', 1900.0, 1425.0, 'Complete', 'AMILLS0020', '2023-01-14', '2023-01-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Freeman')
    AND invoice_date = '2023-01-13'
    AND total_amount = 1900.0
    AND anita_income = 1425.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hughes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-01-17', 250.0, 187.5, 'Complete', 'AMILLS0021', '2023-01-17', '2023-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hughes')
    AND invoice_date = '2023-01-17'
    AND total_amount = 250.0
    AND anita_income = 187.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Shipham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-01-20', 750.0, 562.5, 'Complete', 'AMILLS0021', '2023-01-20', '2023-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Shipham')
    AND invoice_date = '2023-01-20'
    AND total_amount = 750.0
    AND anita_income = 562.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Noblett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-01-24', 1950.0, 877.5, 'Complete', 'AMILLS0021', '2023-02-01', '2023-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Noblett')
    AND invoice_date = '2023-01-24'
    AND total_amount = 1950.0
    AND anita_income = 877.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Formosa'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-01-26', 1425.0, 1068.75, 'Complete', 'AMILLS0021', '2023-01-27', '2023-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Formosa')
    AND invoice_date = '2023-01-26'
    AND total_amount = 1425.0
    AND anita_income = 1068.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-02-01', 1575.0, 1181.25, 'Complete', 'AMILLS0021', '2023-02-01', '2023-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2023-02-01'
    AND total_amount = 1575.0
    AND anita_income = 1181.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-02-14', 250.0, 187.5, 'Complete', 'AMILLS0021', '2023-02-14', '2023-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2023-02-14'
    AND total_amount = 250.0
    AND anita_income = 187.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'McGagh'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-02-15', 450.0, 337.5, 'Complete', 'AMILLS0022', '2023-02-16', '2023-03-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'McGagh')
    AND invoice_date = '2023-02-15'
    AND total_amount = 450.0
    AND anita_income = 337.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mallett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-02-15', 600.0, 270.0, 'Complete', 'AMILLS0022', '2023-02-15', '2023-03-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mallett')
    AND invoice_date = '2023-02-15'
    AND total_amount = 600.0
    AND anita_income = 270.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Freeman'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2023-03-09', 1700.0, 1275.0, 'Complete', 'AMILLS0022', '2023-03-09', '2023-03-20'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Freeman')
    AND invoice_date = '2023-03-09'
    AND total_amount = 1700.0
    AND anita_income = 1275.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Noblett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-04-16', 1150.0, 517.5, 'Complete', 'MILLS0001', '2021-05-21', '2021-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Noblett')
    AND invoice_date = '2021-04-16'
    AND total_amount = 1150.0
    AND anita_income = 517.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Oxley'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-02', 925.0, 416.25, 'Complete', 'MILLS0001', '2021-06-02', '2021-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Oxley')
    AND invoice_date = '2021-06-02'
    AND total_amount = 925.0
    AND anita_income = 416.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-05-06', 500.0, 225.0, 'Complete', 'MILLS0002', '2021-07-05', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2021-05-06'
    AND total_amount = 500.0
    AND anita_income = 225.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'May'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-09', 975.0, 438.75, 'Complete', 'MILLS0002', '2021-07-06', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'May')
    AND invoice_date = '2021-06-09'
    AND total_amount = 975.0
    AND anita_income = 438.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Hughes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-10', 2575.0, 1931.25, 'Complete', 'MILLS0002', '2021-06-25', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Hughes')
    AND invoice_date = '2021-06-10'
    AND total_amount = 2575.0
    AND anita_income = 1931.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Scott'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-05-19', 225.0, 168.75, 'Complete', 'MILLS0001', '2021-05-19', '2021-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Scott')
    AND invoice_date = '2021-05-19'
    AND total_amount = 225.0
    AND anita_income = 168.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Collins'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-05-06', 625.0, 468.75, 'Complete', 'MILLS0001', '2021-05-07', '2021-06-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Collins')
    AND invoice_date = '2021-05-06'
    AND total_amount = 625.0
    AND anita_income = 468.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-15', 975.0, 731.25, 'Complete', 'MILLS0002', '2021-06-15', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2021-06-15'
    AND total_amount = 975.0
    AND anita_income = 731.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Kariolis'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-16', 250.0, 112.5, 'Complete', 'MILLS0002', '2021-06-16', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Kariolis')
    AND invoice_date = '2021-06-16'
    AND total_amount = 250.0
    AND anita_income = 112.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tomlinson'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-17', 1200.0, 900.0, 'Complete', 'MILLS0003', '2021-07-30', '2021-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tomlinson')
    AND invoice_date = '2021-06-17'
    AND total_amount = 1200.0
    AND anita_income = 900.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Fox'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-17', 500.0, 375.0, 'Complete', 'MILLS0002', '2021-06-21', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Fox')
    AND invoice_date = '2021-06-17'
    AND total_amount = 500.0
    AND anita_income = 375.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Clarke'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-17', 625.0, 468.75, 'Complete', 'MILLS0002', '2021-06-21', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Clarke')
    AND invoice_date = '2021-06-17'
    AND total_amount = 625.0
    AND anita_income = 468.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Arnold'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-17', 425.0, 191.25, 'Complete', 'MILLS0002', '2021-06-21', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Arnold')
    AND invoice_date = '2021-06-17'
    AND total_amount = 425.0
    AND anita_income = 191.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Demichele'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-22', 925.0, 416.25, 'Complete', 'MILLS0002', '2021-06-30', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Demichele')
    AND invoice_date = '2021-06-22'
    AND total_amount = 925.0
    AND anita_income = 416.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mitkova'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-22', 650.0, 292.5, 'Complete', 'MILLS0002', '2021-06-23', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mitkova')
    AND invoice_date = '2021-06-22'
    AND total_amount = 650.0
    AND anita_income = 292.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-29', 166.67, 125.0, 'Complete', 'MILLS0002', '2021-06-16', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2021-06-29'
    AND total_amount = 166.67
    AND anita_income = 125.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Stone'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-06-29', 166.67, 125.0, 'Complete', 'MILLS0002', '2021-06-23', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Stone')
    AND invoice_date = '2021-06-29'
    AND total_amount = 166.67
    AND anita_income = 125.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'McGuire'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-07-09', 525.0, 236.25, 'Complete', 'MILLS0002', '2021-06-15', '2021-07-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'McGuire')
    AND invoice_date = '2021-07-09'
    AND total_amount = 525.0
    AND anita_income = 236.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Clarke'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-07-20', 375.0, 281.25, 'Complete', 'MILLS0003', '2021-07-21', '2021-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Clarke')
    AND invoice_date = '2021-07-20'
    AND total_amount = 375.0
    AND anita_income = 281.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'May'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-07-22', 1900.0, 855.0, 'Complete', 'MILLS0004', '2021-09-02', '2021-09-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'May')
    AND invoice_date = '2021-07-22'
    AND total_amount = 1900.0
    AND anita_income = 855.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Noblett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-07-22', 2250.0, 1012.5, 'Complete', 'MILLS0003', '2021-07-22', '2021-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Noblett')
    AND invoice_date = '2021-07-22'
    AND total_amount = 2250.0
    AND anita_income = 1012.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Demichele'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-08-03', 175.0, 78.75, 'Complete', 'MILLS0003', '2021-08-05', '2021-08-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Demichele')
    AND invoice_date = '2021-08-03'
    AND total_amount = 175.0
    AND anita_income = 78.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-08-26', 475.0, 213.75, 'Complete', 'MILLS0004', '2021-08-26', '2021-09-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2021-08-26'
    AND total_amount = 475.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-08-26', 775.0, 581.25, 'Complete', 'MILLS0004', '2021-08-31', '2021-09-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2021-08-26'
    AND total_amount = 775.0
    AND anita_income = 581.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'May'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-09-01', 525.0, 236.25, 'Complete', 'MILLS0004', '2021-09-02', '2021-09-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'May')
    AND invoice_date = '2021-09-01'
    AND total_amount = 525.0
    AND anita_income = 236.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Noblett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-09-16', 1825.0, 821.25, 'Complete', 'MILLS0004', '2021-09-16', '2021-09-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Noblett')
    AND invoice_date = '2021-09-16'
    AND total_amount = 1825.0
    AND anita_income = 821.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Delany'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-10-07', 250.0, 187.5, 'Complete', 'MILLS005', '2021-09-28', '2021-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Delany')
    AND invoice_date = '2021-10-07'
    AND total_amount = 250.0
    AND anita_income = 187.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Noblett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-10-11', 1925.0, 866.25, 'Complete', 'MILLS005', '2021-10-11', '2021-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Noblett')
    AND invoice_date = '2021-10-11'
    AND total_amount = 1925.0
    AND anita_income = 866.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Taylor'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-10-14', 916.67, 687.5, 'Complete', 'MILLS005', '2021-10-14', '2021-10-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Taylor')
    AND invoice_date = '2021-10-14'
    AND total_amount = 916.67
    AND anita_income = 687.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Barrs'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-10-19', 1350.0, 1012.5, 'Complete', 'MILLS0006', '2021-10-19', '2021-11-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Barrs')
    AND invoice_date = '2021-10-19'
    AND total_amount = 1350.0
    AND anita_income = 1012.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Brazhda'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-10-21', 4075.0, 3056.25, 'Complete', 'MILLS0006', '2021-11-02', '2021-11-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Brazhda')
    AND invoice_date = '2021-10-21'
    AND total_amount = 4075.0
    AND anita_income = 3056.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Farooq'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-10-21', 625.0, 281.25, 'Complete', 'MILLS0006', '2021-10-21', '2021-11-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Farooq')
    AND invoice_date = '2021-10-21'
    AND total_amount = 625.0
    AND anita_income = 281.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mallett'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-10-21', 625.0, 281.25, 'Complete', 'MILLS0006', '2021-10-25', '2021-11-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mallett')
    AND invoice_date = '2021-10-21'
    AND total_amount = 625.0
    AND anita_income = 281.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Clarke'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-10-24', 900.0, 675.0, 'Complete', 'MILLS0006', '2021-11-09', '2021-11-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Clarke')
    AND invoice_date = '2021-10-24'
    AND total_amount = 900.0
    AND anita_income = 675.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-11-04', 575.0, 431.25, 'Complete', 'MILLS0006', '2021-11-04', '2021-11-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2021-11-04'
    AND total_amount = 575.0
    AND anita_income = 431.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Banham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-11-04', 475.0, 213.75, 'Complete', 'MILLS0008', '2022-01-11', '2022-01-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Banham')
    AND invoice_date = '2021-11-04'
    AND total_amount = 475.0
    AND anita_income = 213.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Smith'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-11-11', 150.0, 112.5, 'Complete', 'MILLS0006', '2021-11-11', '2021-11-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Smith')
    AND invoice_date = '2021-11-11'
    AND total_amount = 150.0
    AND anita_income = 112.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Tunnicliffe'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-12-02', 166.67, 125.0, 'Complete', 'MILLS0007', '2021-12-02', '2021-12-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Tunnicliffe')
    AND invoice_date = '2021-12-02'
    AND total_amount = 166.67
    AND anita_income = 125.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Mewes'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-12-09', 775.0, 581.25, 'Complete', 'MILLS0007', '2021-12-09', '2021-12-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Mewes')
    AND invoice_date = '2021-12-09'
    AND total_amount = 775.0
    AND anita_income = 581.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Shipham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2021-12-20', 2200.0, 1650.0, 'Complete', 'MILLS0008', '2021-12-20', '2022-01-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Shipham')
    AND invoice_date = '2021-12-20'
    AND total_amount = 2200.0
    AND anita_income = 1650.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Brazhda'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-01-10', 2075.0, 1556.25, 'Complete', 'MILLS0008', '2022-01-14', '2022-01-22'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Brazhda')
    AND invoice_date = '2022-01-10'
    AND total_amount = 2075.0
    AND anita_income = 1556.25
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Shipham'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-01-19', 950.0, 712.5, 'Complete', 'MILLS0009', '2022-01-19', '2022-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Shipham')
    AND invoice_date = '2022-01-19'
    AND total_amount = 950.0
    AND anita_income = 712.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Crone'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-01-20', 300.0, 135.0, 'Complete', 'MILLS0009', '2022-01-27', '2022-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Crone')
    AND invoice_date = '2022-01-20'
    AND total_amount = 300.0
    AND anita_income = 135.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Vaughey'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-01-27', 650.0, 487.5, 'Complete', 'MILLS0009', '2022-01-27', '2022-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Vaughey')
    AND invoice_date = '2022-01-27'
    AND total_amount = 650.0
    AND anita_income = 487.5
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Stafford'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-01-27', 1000.0, 750.0, 'Complete', 'MILLS0009', '2022-01-27', '2022-02-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Stafford')
    AND invoice_date = '2022-01-27'
    AND total_amount = 1000.0
    AND anita_income = 750.0
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'Quinton'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-03-01', 625.0, 468.75, 'Complete', 'MILLS0010', '2022-03-16', '2022-03-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Quinton')
    AND invoice_date = '2022-03-01'
    AND total_amount = 625.0
    AND anita_income = 468.75
);

INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, status, reference, date_settled_client, date_settled_firm)
SELECT (SELECT id FROM clients WHERE name = 'May'), (SELECT id FROM intermediary_firms WHERE name = 'Newmans'), '2022-03-03', 1350.0, 607.5, 'Complete', 'MILLS0010', '2022-03-16', '2022-03-21'
WHERE NOT EXISTS (
  SELECT 1 FROM invoices
  WHERE client_id = (SELECT id FROM clients WHERE name = 'May')
    AND invoice_date = '2022-03-03'
    AND total_amount = 1350.0
    AND anita_income = 607.5
);
