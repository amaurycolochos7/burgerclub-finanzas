-- Create payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  days_worked INT,
  notes TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy: Admins can do everything, Cooks can view their own
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payroll" 
  ON payroll FOR ALL 
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Cooks can view own records" 
  ON payroll FOR SELECT 
  USING (auth.uid() = employee_id);
