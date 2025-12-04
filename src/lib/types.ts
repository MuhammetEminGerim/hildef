export type Student = {
    id: string; // Firestore ID
    name: string;
    birth_date: string;
    date_of_birth?: string; // Alias for compatibility
    parent_name: string;
    phone: string;
    address: string;
    notes?: string;
    photo_url?: string | null;
    photo_path?: string | null; // Deprecated
    class_id?: string | null;
    gender?: 'M' | 'F' | null;
    tc_identity_no?: string | null;
    blood_type?: string | null;
    birth_place?: string | null;
    emergency_contact?: string | null;
    enrollment_date?: string;
    graduation_date?: string | null;
    monthly_fee?: number;
    status?: 'active' | 'graduated' | 'transferred' | 'suspended';
    tags?: string | null;
    is_active: boolean;
    created_at?: any;
};

export type StudentParent = {
    id: string; // Firestore ID
    student_id: string;
    name: string;
    relationship: 'mother' | 'father' | 'guardian';
    phone: string;
    email?: string;
    is_primary: boolean;
    created_at?: any;
};

export type StudentHealth = {
    id: string; // Firestore ID
    student_id: string;
    chronic_diseases?: string;
    allergies?: string;
    medications?: string;
    doctor_name?: string;
    doctor_phone?: string;
    insurance_info?: string;
    notes?: string;
    created_at?: any;
    updated_at?: any;
};

export type StudentVaccination = {
    id: string; // Firestore ID
    student_id: string;
    vaccine_name: string;
    vaccine_date: string;
    next_dose_date?: string;
    notes?: string;
    created_at?: any;
};

export type StudentFile = {
    id: string; // Firestore ID
    student_id: string;
    file_name: string;
    file_url: string; // Cloudinary URL
    file_type: 'health_report' | 'identity' | 'contract' | 'other';
    file_size?: number;
    upload_date: string;
    created_at?: any;
};

export type User = {
    id: string; // Firestore ID (same as Firebase Auth UID)
    uid: string; // Firebase Auth UID
    email: string;
    username: string;
    role: 'admin' | 'staff';
    created_at?: any;
};

export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial' | 'Cancelled';

export type Payment = {
    id: string; // Changed from number to string to match Firestore ID
    student_id: string; // Changed from number to string to match Firestore ID
    payment_plan_id?: string | null; // Changed from number to string
    amount: number;
    original_amount: number;
    discount_amount?: number | null;
    partial_amount?: number | null;
    due_date: string;
    paid_date?: string | null;
    payment_date: string; // Added: Transaction/Entry date
    payment_method: 'cash' | 'bank_transfer' | 'credit_card'; // Made specific
    month: string; // Added: YYYY-MM format for grouping
    status: PaymentStatus;
    note?: string | null;
    notes?: string; // Added alias for compatibility
    created_at?: any;
};

export type Expense = {
    id: number;
    category: string;
    description: string | null;
    amount: number;
    expense_date: string;
};

export type PaymentPlan = {
    id: number;
    student_id: number;
    plan_name: string;
    plan_type: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
    start_date: string;
    end_date?: string | null;
    monthly_amount: number;
    total_amount?: number | null;
    discount_amount?: number | null;
    discount_percent?: number | null;
    is_active?: number;
};
