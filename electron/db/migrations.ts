import { getDb } from './connection';

/**
 * Veritabanı şemasını güncellemek için migration fonksiyonları
 * Mevcut tablolara eksik kolonları ekler
 */
export function runMigrations() {
  const db = getDb();

  try {
    // Students tablosu için yeni kolonları kontrol et ve ekle
    const studentsColumns = db
      .prepare("PRAGMA table_info(students)")
      .all() as Array<{ name: string; type: string }>;

    // Users tablosu için is_active kontrolü
    const usersColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    if (!usersColumns.map(c => c.name).includes('is_active')) {
      try {
        db.prepare("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run();
        console.log('Added is_active column to users table');
      } catch (e: any) {
        console.error('Error adding is_active column to users:', e.message);
      }
    }

    const columnNames = studentsColumns.map((c) => c.name);

    // Gender kolonu yoksa ekle
    if (!columnNames.includes('gender')) {
      db.prepare('ALTER TABLE students ADD COLUMN gender TEXT').run();
      console.log('Added gender column to students table');
    }

    // TC Identity No kolonu yoksa ekle
    if (!columnNames.includes('tc_identity_no')) {
      db.prepare('ALTER TABLE students ADD COLUMN tc_identity_no TEXT').run();
      console.log('Added tc_identity_no column to students table');
    }

    // Blood type kolonu yoksa ekle
    if (!columnNames.includes('blood_type')) {
      db.prepare('ALTER TABLE students ADD COLUMN blood_type TEXT').run();
      console.log('Added blood_type column to students table');
    }

    // Birth place kolonu yoksa ekle
    if (!columnNames.includes('birth_place')) {
      db.prepare('ALTER TABLE students ADD COLUMN birth_place TEXT').run();
      console.log('Added birth_place column to students table');
    }

    // Graduation date kolonu yoksa ekle
    if (!columnNames.includes('graduation_date')) {
      db.prepare('ALTER TABLE students ADD COLUMN graduation_date TEXT').run();
      console.log('Added graduation_date column to students table');
    }

    // Status kolonu yoksa ekle
    if (!columnNames.includes('status')) {
      db.prepare("ALTER TABLE students ADD COLUMN status TEXT NOT NULL DEFAULT 'active'").run();
      console.log('Added status column to students table');
    }

    // Tags kolonu yoksa ekle
    if (!columnNames.includes('tags')) {
      db.prepare('ALTER TABLE students ADD COLUMN tags TEXT').run();
      console.log('Added tags column to students table');
    }

    // Notes kolonu yoksa ekle (bazı eski şemalarda olmayabilir)
    if (!columnNames.includes('notes')) {
      db.prepare('ALTER TABLE students ADD COLUMN notes TEXT').run();
      console.log('Added notes column to students table');
    }

    // Allergies kolonu yoksa ekle (eski şemada olabilir, kontrol et)
    if (!columnNames.includes('allergies')) {
      db.prepare('ALTER TABLE students ADD COLUMN allergies TEXT').run();
      console.log('Added allergies column to students table');
    }

    // Medical conditions kolonu yoksa ekle
    if (!columnNames.includes('medical_conditions')) {
      db.prepare('ALTER TABLE students ADD COLUMN medical_conditions TEXT').run();
      console.log('Added medical_conditions column to students table');
    }

    // Class ID kolonu yoksa ekle (DAL'da kullanılıyor)
    if (!columnNames.includes('class_id')) {
      try {
        db.prepare('ALTER TABLE students ADD COLUMN class_id INTEGER').run();
        console.log('Added class_id column to students table');
      } catch (e: any) {
        console.error('Error adding class_id column to students:', e.message);
      }
    } else {
      console.log('class_id column already exists in students table');
    }

    // is_active kolonu yoksa ekle
    if (!columnNames.includes('is_active')) {
      try {
        db.prepare('ALTER TABLE students ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1').run();
        console.log('Added is_active column to students table');
      } catch (e: any) {
        console.error('Error adding is_active column to students:', e.message);
      }
    }

    // Payments tablosu için yeni kolonları kontrol et ve ekle
    const paymentsColumns = db
      .prepare("PRAGMA table_info(payments)")
      .all() as Array<{ name: string; type: string }>;

    const paymentColumnNames = paymentsColumns.map((c) => c.name);

    // Payment plan ID kolonu yoksa ekle
    if (!paymentColumnNames.includes('payment_plan_id')) {
      try {
        db.prepare('ALTER TABLE payments ADD COLUMN payment_plan_id INTEGER').run();
        console.log('Added payment_plan_id column to payments table');
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error('Error adding payment_plan_id column:', e.message);
        }
      }
    }

    // Original amount kolonu yoksa ekle
    if (!paymentColumnNames.includes('original_amount')) {
      try {
        db.prepare('ALTER TABLE payments ADD COLUMN original_amount REAL NOT NULL DEFAULT 0').run();
        console.log('Added original_amount column to payments table');
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error('Error adding original_amount column:', e.message);
        }
      }
    }

    // Discount amount kolonu yoksa ekle
    if (!paymentColumnNames.includes('discount_amount')) {
      try {
        db.prepare('ALTER TABLE payments ADD COLUMN discount_amount REAL DEFAULT 0').run();
        console.log('Added discount_amount column to payments table');
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error('Error adding discount_amount column:', e.message);
        }
      }
    }

    // Requires approval kolonu yoksa ekle
    if (!paymentColumnNames.includes('requires_approval')) {
      try {
        db.prepare('ALTER TABLE payments ADD COLUMN requires_approval INTEGER DEFAULT 0').run();
        console.log('Added requires_approval column to payments table');
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error('Error adding requires_approval column:', e.message);
        }
      }
    }

    // Approved by kolonu yoksa ekle
    if (!paymentColumnNames.includes('approved_by')) {
      try {
        db.prepare('ALTER TABLE payments ADD COLUMN approved_by INTEGER').run();
        console.log('Added approved_by column to payments table');
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error('Error adding approved_by column:', e.message);
        }
      }
    }

    // Approved at kolonu yoksa ekle
    if (!paymentColumnNames.includes('approved_at')) {
      try {
        db.prepare('ALTER TABLE payments ADD COLUMN approved_at TEXT').run();
        console.log('Added approved_at column to payments table');
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error('Error adding approved_at column:', e.message);
        }
      }
    }

    // Payment method kolonu yoksa ekle
    if (!paymentColumnNames.includes('payment_method')) {
      try {
        db.prepare('ALTER TABLE payments ADD COLUMN payment_method TEXT').run();
        console.log('Added payment_method column to payments table');
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error('Error adding payment_method column:', e.message);
        }
      }
    }

    // Partial amount kolonu yoksa ekle
    if (!paymentColumnNames.includes('partial_amount')) {
      try {
        db.prepare('ALTER TABLE payments ADD COLUMN partial_amount REAL DEFAULT 0').run();
        console.log('Added partial_amount column to payments table');
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error('Error adding partial_amount column:', e.message);
        }
      }
    }

    // Receipt path kolonu yoksa ekle
    if (!paymentColumnNames.includes('receipt_path')) {
      try {
        db.prepare('ALTER TABLE payments ADD COLUMN receipt_path TEXT').run();
        console.log('Added receipt_path column to payments table');
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error('Error adding receipt_path column:', e.message);
        }
      }
    }

    // CHECK constraint'i güncelle (Partial ve Cancelled durumlarını ekle)
    try {
      // Mevcut tablo yapısını kontrol et
      const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='payments'").get() as { sql: string } | undefined;

      if (tableInfo && tableInfo.sql) {
        const sql = tableInfo.sql;
        // Eğer CHECK constraint'te 'Partial' veya 'Cancelled' yoksa, tabloyu yeniden oluştur
        if (!sql.includes("'Partial'") || !sql.includes("'Cancelled'")) {
          console.log('Updating payments table CHECK constraint to include Partial and Cancelled statuses...');

          // Yeni tablo oluştur
          db.prepare(`
            CREATE TABLE IF NOT EXISTS payments_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              student_id INTEGER NOT NULL,
              payment_plan_id INTEGER,
              amount REAL NOT NULL,
              original_amount REAL NOT NULL,
              discount_amount REAL DEFAULT 0,
              due_date TEXT NOT NULL,
              paid_date TEXT,
              payment_method TEXT,
              status TEXT NOT NULL CHECK (status IN ('Paid','Pending','Overdue','Partial','Cancelled')),
              partial_amount REAL DEFAULT 0,
              note TEXT,
              receipt_path TEXT,
              requires_approval INTEGER DEFAULT 0,
              approved_by INTEGER,
              approved_at TEXT,
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
              FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id) ON DELETE SET NULL,
              FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
            )
          `).run();

          // Verileri kopyala (eksik kolonlar için varsayılan değerler kullan)
          const oldColumns = db.prepare("PRAGMA table_info(payments)").all() as Array<{ name: string }>;
          const oldColumnNames = oldColumns.map(c => c.name);

          // Kolon listesini oluştur
          const columnsToSelect = [
            'id', 'student_id',
            oldColumnNames.includes('payment_plan_id') ? 'payment_plan_id' : 'NULL as payment_plan_id',
            'amount',
            oldColumnNames.includes('original_amount') ? 'original_amount' : 'amount as original_amount',
            oldColumnNames.includes('discount_amount') ? 'discount_amount' : '0 as discount_amount',
            'due_date',
            'paid_date',
            oldColumnNames.includes('payment_method') ? 'payment_method' : 'NULL as payment_method',
            'status',
            oldColumnNames.includes('partial_amount') ? 'partial_amount' : '0 as partial_amount',
            oldColumnNames.includes('note') ? 'note' : 'NULL as note',
            oldColumnNames.includes('receipt_path') ? 'receipt_path' : 'NULL as receipt_path',
            oldColumnNames.includes('requires_approval') ? 'requires_approval' : '0 as requires_approval',
            oldColumnNames.includes('approved_by') ? 'approved_by' : 'NULL as approved_by',
            oldColumnNames.includes('approved_at') ? 'approved_at' : 'NULL as approved_at',
            oldColumnNames.includes('created_at') ? 'created_at' : 'datetime(\'now\') as created_at',
          ].join(', ');

          db.prepare(`
            INSERT INTO payments_new 
            SELECT ${columnsToSelect} FROM payments
          `).run();

          // Eski tabloyu sil
          db.prepare('DROP TABLE payments').run();

          // Yeni tabloyu yeniden adlandır
          db.prepare('ALTER TABLE payments_new RENAME TO payments').run();

          console.log('Updated payments table CHECK constraint successfully');
        }
      }
    } catch (e: any) {
      // Eğer hata varsa, muhtemelen constraint zaten güncel
      if (!e.message.includes('no such table') && !e.message.includes('duplicate')) {
        console.error('Error updating payments CHECK constraint:', e.message);
      }
    }

    // Sınıflar ve devamsızlık tablolarını oluştur
    try {
      // Classes tablosu
      const classesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='classes'").get();
      if (!classesTable) {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age_group TEXT NOT NULL,
            teacher_id INTEGER,
            capacity INTEGER,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
          )
        `).run();
        console.log('Created classes table');
      }

      // Class_students tablosu
      const classStudentsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='class_students'").get();
      if (!classStudentsTable) {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS class_students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            enrollment_date TEXT NOT NULL DEFAULT (date('now')),
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE(class_id, student_id)
          )
        `).run();
        console.log('Created class_students table');
      }

      // Attendance tablosu
      const attendanceTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'").get();
      if (!attendanceTable) {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'early_leave')),
            reason TEXT,
            notes TEXT,
            marked_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(student_id, class_id, date)
          )
        `).run();
        console.log('Created attendance table');
      }

      // Events tablosu
      const eventsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'").get();
      if (!eventsTable) {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            event_date TEXT NOT NULL,
            event_time TEXT,
            location TEXT,
            status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
          )
        `).run();
        console.log('Created events table');
      }

      // Staff tablosu
      const staffTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='staff'").get();
      if (!staffTable) {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            department TEXT,
            phone TEXT,
            email TEXT,
            photo_path TEXT,
            hire_date TEXT,
            salary REAL,
            is_active INTEGER NOT NULL DEFAULT 1,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          )
        `).run();
        console.log('Created staff table');
      }
    } catch (e: any) {
      console.error('Error creating classes/attendance/events/staff tables:', e.message);
    }

    // Payments tablosuna is_active kolonu ekle
    if (!paymentColumnNames.includes('is_active')) {
      try {
        db.prepare("ALTER TABLE payments ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run();
        console.log('Added is_active column to payments table');
      } catch (e: any) {
        console.error('Error adding is_active column to payments:', e.message);
      }
    }

    // Expenses tablosu için is_active kontrolü
    const expensesColumns = db
      .prepare("PRAGMA table_info(expenses)")
      .all() as Array<{ name: string }>;
    const expenseColumnNames = expensesColumns.map((c) => c.name);

    if (!expenseColumnNames.includes('is_active')) {
      try {
        db.prepare("ALTER TABLE expenses ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run();
        console.log('Added is_active column to expenses table');
      } catch (e: any) {
        console.error('Error adding is_active column to expenses:', e.message);
      }
    }

    // Events tablosu için is_active kontrolü
    const eventsColumns = db.prepare("PRAGMA table_info(events)").all() as Array<{ name: string }>;
    if (!eventsColumns.map(c => c.name).includes('is_active')) {
      try {
        db.prepare("ALTER TABLE events ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run();
        console.log('Added is_active column to events table');
      } catch (e: any) {
        console.error('Error adding is_active column to events:', e.message);
      }
    }

    // Payment Plans tablosu için is_active kontrolü
    const planColumns = db.prepare("PRAGMA table_info(payment_plans)").all() as Array<{ name: string }>;
    if (!planColumns.map(c => c.name).includes('is_active')) {
      try {
        db.prepare("ALTER TABLE payment_plans ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run();
        console.log('Added is_active column to payment_plans table');
      } catch (e: any) {
        console.error('Error adding is_active column to payment_plans:', e.message);
      }
    }

    // Classes tablosu için is_active kontrolü
    const classColumns = db.prepare("PRAGMA table_info(classes)").all() as Array<{ name: string }>;
    if (!classColumns.map(c => c.name).includes('is_active')) {
      try {
        db.prepare("ALTER TABLE classes ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run();
        console.log('Added is_active column to classes table');
      } catch (e: any) {
        console.error('Error adding is_active column to classes:', e.message);
      }
    }

    // Staff tablosu için is_active kontrolü
    const staffColumns = db.prepare("PRAGMA table_info(staff)").all() as Array<{ name: string }>;
    if (!staffColumns.map(c => c.name).includes('is_active')) {
      try {
        db.prepare("ALTER TABLE staff ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run();
        console.log('Added is_active column to staff table');
      } catch (e: any) {
        console.error('Error adding is_active column to staff:', e.message);
      }
    }

    // Class Students tablosu için is_active kontrolü
    const csColumns = db.prepare("PRAGMA table_info(class_students)").all() as Array<{ name: string }>;
    if (!csColumns.map(c => c.name).includes('is_active')) {
      try {
        db.prepare("ALTER TABLE class_students ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run();
        console.log('Added is_active column to class_students table');
      } catch (e: any) {
        console.error('Error adding is_active column to class_students:', e.message);
      }
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

