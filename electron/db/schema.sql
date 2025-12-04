CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- admin, staff
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  photo_path TEXT,
  date_of_birth TEXT NOT NULL,
  gender TEXT, -- M, F
  tc_identity_no TEXT,
  blood_type TEXT, -- A+, A-, B+, B-, AB+, AB-, O+, O-
  birth_place TEXT,
  parent_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  emergency_contact TEXT,
  class_id INTEGER,
  enrollment_date TEXT NOT NULL,
  graduation_date TEXT,
  monthly_fee REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, graduated, transferred, suspended
  notes TEXT,
  tags TEXT, -- JSON array of tags
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- mother, father, guardian
  phone TEXT NOT NULL,
  email TEXT,
  photo_path TEXT,
  contact_preference TEXT, -- sms, email, phone
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  chronic_diseases TEXT, -- JSON array
  allergies TEXT, -- JSON array
  medications TEXT, -- JSON array with name, dosage, frequency
  doctor_name TEXT,
  doctor_phone TEXT,
  insurance_info TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_vaccinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  vaccine_name TEXT NOT NULL,
  vaccine_date TEXT NOT NULL,
  next_dose_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- health_report, identity, contract, other
  file_size INTEGER,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL, -- monthly, quarterly, semi_annual, annual, custom
  start_date TEXT NOT NULL,
  end_date TEXT,
  monthly_amount REAL NOT NULL,
  total_amount REAL,
  discount_amount REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  payment_plan_id INTEGER,
  amount REAL NOT NULL,
  original_amount REAL NOT NULL, -- İndirim öncesi tutar
  discount_amount REAL DEFAULT 0,
  due_date TEXT NOT NULL,
  paid_date TEXT,
  payment_method TEXT, -- cash, credit_card, bank_transfer, check
  status TEXT NOT NULL CHECK (status IN ('Paid','Pending','Overdue','Partial','Cancelled')),
  partial_amount REAL DEFAULT 0, -- Kısmi ödeme tutarı
  note TEXT,
  receipt_path TEXT, -- PDF makbuz yolu
  requires_approval INTEGER DEFAULT 0, -- Admin onayı gerekiyor mu
  approved_by INTEGER,
  approved_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payment_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  reminder_type TEXT NOT NULL, -- sms, email, in_app
  reminder_date TEXT NOT NULL,
  days_before_due INTEGER NOT NULL, -- Vade tarihinden kaç gün önce
  sent_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_discounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  payment_id INTEGER,
  discount_type TEXT NOT NULL, -- percentage, fixed
  discount_value REAL NOT NULL,
  reason TEXT,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- created, updated, status_changed, partial_payment, cancelled, refunded
  old_value TEXT,
  new_value TEXT,
  changed_by INTEGER,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  expense_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Sınıflar tablosu
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age_group TEXT NOT NULL, -- Örn: "3-4 Yaş Grubu"
  teacher_id INTEGER, -- Sınıf öğretmeni (users tablosundan)
  capacity INTEGER, -- Maksimum öğrenci sayısı
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Öğrenci-Sınıf ilişkisi (Many-to-Many)
CREATE TABLE IF NOT EXISTS class_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  enrollment_date TEXT NOT NULL DEFAULT (date('now')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(class_id, student_id) -- Bir öğrenci aynı anda bir sınıfta olabilir
);

-- Devamsızlık kayıtları
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD formatında
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'early_leave')),
  reason TEXT, -- absent durumunda: 'illness', 'permission', 'other'
  notes TEXT, -- Ek notlar
  marked_by INTEGER, -- Kim işaretledi (users tablosundan)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(student_id, class_id, date) -- Bir öğrenci için bir günde bir kayıt
);

-- Etkinlikler tablosu
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL, -- YYYY-MM-DD
  event_time TEXT, -- HH:MM formatında
  location TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Personel tablosu
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- Görev/Unvan
  department TEXT, -- Departman
  phone TEXT,
  email TEXT,
  photo_path TEXT, -- Fotoğraf yolu
  hire_date TEXT, -- İşe başlama tarihi
  salary REAL, -- Maaş
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT, -- Notlar
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);



