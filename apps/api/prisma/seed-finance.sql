-- Seed Clinic
INSERT INTO "Clinic" (id, name, created_at, updated_at) 
VALUES ('da60155b-f736-4191-897b-839537632616', 'Noble Dental Care', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Seed Patient
INSERT INTO "Patient" (id, user_id, clinic_id, gender, dob, healthflo_id, created_at, updated_at)
VALUES ('3369d7ca-768a-4469-828e-595305988e40', 'c6375005-950c-4ec7-9941-764720619580', 'da60155b-f736-4191-897b-839537632616', 'Male', '1990-01-01', 'HF-12345', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Seed Inventory
INSERT INTO "Inventory" (id, clinic_id, name, stock_quantity, unit, cost_per_unit, updated_at)
VALUES 
('inv-1', 'da60155b-f736-4191-897b-839537632616', 'Local Anesthesia', 100, 'ml', 50, NOW()),
('inv-2', 'da60155b-f736-4191-897b-839537632616', 'Zirconia Block', 50, 'unit', 2000, NOW()),
('inv-3', 'da60155b-f736-4191-897b-839537632616', 'Sutures 3-0', 200, 'pack', 150, NOW())
ON CONFLICT (id) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity;

-- Seed Tariff Master
INSERT INTO "TariffMaster" (id, clinic_id, procedure_name, procedure_code, category, base_cost, gst_percent, updated_at)
VALUES 
('t-1', 'da60155b-f736-4191-897b-839537632616', 'Consultation', 'PROC-001', 'General', 500, 0, NOW()),
('t-2', 'da60155b-f736-4191-897b-839537632616', 'Scaling & Polishing', 'PROC-002', 'Cleaning', 1500, 18, NOW()),
('t-3', 'da60155b-f736-4191-897b-839537632616', 'Zirconia Crown', 'PROC-003', 'Prostho', 8000, 12, NOW())
ON CONFLICT (procedure_code) DO UPDATE SET base_cost = EXCLUDED.base_cost;

-- Seed Bundle for Zirconia Crown
INSERT INTO "Bundle" (id, clinic_id, name, tariff_id, updated_at)
VALUES ('b-3', 'da60155b-f736-4191-897b-839537632616', 'Premium Crown Pack', 't-3', NOW())
ON CONFLICT (tariff_id) DO NOTHING;

INSERT INTO "BundleItem" (id, bundle_id, inventory_id, quantity_needed)
VALUES 
('bi-1', 'b-3', 'inv-2', 1),
('bi-2', 'b-3', 'inv-1', 2)
ON CONFLICT DO NOTHING;
