-- Employees
INSERT INTO employee (id, name) VALUES (1, 'Mario Rossi');
INSERT INTO employee (id, name) VALUES (2, 'Luca Bianchi');

-- Projects
INSERT INTO project (id, name) VALUES (1, 'CRM Upgrade');
INSERT INTO project (id, name) VALUES (2, 'ERP Migration');

-- Commesse
INSERT INTO commessa (id, code,  project_id) VALUES (1, 'CRM001', 1);
INSERT INTO commessa (id, code,  project_id) VALUES (2, 'ERP001', 2);

-- TimesheetDay
INSERT INTO timesheet_day (id, date, status, employee_id) VALUES (1, '2025-09-01', 'APPROVED', 2);

-- TimesheetItem
INSERT INTO timesheet_item (id, description, hours, timesheet_day_id, commessa_id)
VALUES (1, 'Analisi funzionale', 8, 1, 1);
