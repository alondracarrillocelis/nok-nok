-- Seed materias de ejemplo para la academia
INSERT INTO subjects (name, code, description, credits, status) VALUES
  ('Matemáticas Básicas', 'MAT-101', 'Operaciones básicas, fracciones y geometría elemental', 3, 'activo'),
  ('Español y Lectura', 'ESP-101', 'Comprensión lectora, redacción y ortografía', 3, 'activo'),
  ('Ciencias Naturales', 'CIE-101', 'Introducción a biología, física y química', 3, 'activo'),
  ('Historia de México', 'HIS-101', 'Historia nacional y cultura cívica', 3, 'activo'),
  ('Inglés Básico', 'ING-101', 'Vocabulario, gramática y conversación nivel inicial', 3, 'activo'),
  ('Educación Física', 'EDF-101', 'Actividad física y hábitos saludables', 2, 'activo'),
  ('Arte y Creatividad', 'ART-101', 'Expresión plástica y apreciación artística', 2, 'activo'),
  ('Computación', 'COM-101', 'Uso de computadora e internet básico', 2, 'activo')
ON CONFLICT (code) DO NOTHING;
