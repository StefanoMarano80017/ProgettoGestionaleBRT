-- Employees
INSERT INTO public.employees (id, name) VALUES (1, 'Mario Rossi');
INSERT INTO public.employees (id, name) VALUES (2, 'Luca Bianchi');

-- Projects
INSERT INTO public.progetti (id, nome, codice) VALUES (1, 'CRM Upgrade', 'AA123');
INSERT INTO public.progetti (id, nome, codice) VALUES (2, 'ERP Migration', 'BB456');

-- Commesse
INSERT INTO public.commesse (id, code, progetto_id) VALUES (1, 'CRM001', 1);
INSERT INTO public.commesse (id, code, progetto_id) VALUES (2, 'ERP001', 2);

-- TimesheetDay
INSERT INTO public.timesheet_days (id, date, status, employee_id, absence_type) 
VALUES (1, '2025-09-01', 'COMPLETE', 1, 'NONE');

INSERT INTO public.timesheet_days (id, date, status, employee_id, absence_type) 
VALUES (2, '2025-10-01', 'INCOMPLETE', 2, 'NONE');

-- TimesheetItem
INSERT INTO public.timesheet_items (id, description, hours, timesheet_day_id, commessa_id)
VALUES (1, 'Analisi funzionale 1', 4, 1, 1);

INSERT INTO public.timesheet_items (id, description, hours, timesheet_day_id, commessa_id)
VALUES (2, 'Analisi funzionale 2', 4, 1, 2);

INSERT INTO public.timesheet_items (id, description, hours, timesheet_day_id, commessa_id)
VALUES (3, 'Analisi funzionale', 6, 2, 1);