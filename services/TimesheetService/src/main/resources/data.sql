-- Employees
INSERT INTO employee (id, name, role) VALUES (1, 'Mario Rossi', 'ADMIN');
INSERT INTO employee (id, name, role) VALUES (2, 'Luca Bianchi', 'EMPLOYEE');

-- Projects
INSERT INTO project (id, name) VALUES (1, 'CRM Upgrade');
INSERT INTO project (id, name) VALUES (2, 'ERP Migration');

-- Commesse
INSERT INTO commessa (id, code, description, project_id) VALUES (1, 'CRM001', 'Analisi requisiti', 1);
INSERT INTO commessa (id, code, description, project_id) VALUES (2, 'ERP001', 'Sviluppo moduli', 2);

-- TimesheetDay
INSERT INTO timesheet_day (id, date, status, employee_id) VALUES (1, '2025-09-01', 'APPROVED', 2);

-- TimesheetItem
INSERT INTO timesheet_item (id, description, hours, timesheet_day_id, commessa_id)
VALUES (1, 'Analisi funzionale', 8, 1, 1);
