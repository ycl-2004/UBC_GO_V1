-- ============================================
-- UBC PathFinder Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Profiles Table
-- Stores user profile information
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  faculty TEXT,
  major TEXT,
  year_level TEXT,
  target_graduation_year TEXT,
  student_number TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Degree Plans Table
-- Stores user's degree plans and courses
-- ============================================
CREATE TABLE IF NOT EXISTS degree_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'My Degree Plan',
  faculty TEXT,
  major TEXT,
  course_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE degree_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own plans
CREATE POLICY "Users can view own plans"
  ON degree_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own plans
CREATE POLICY "Users can insert own plans"
  ON degree_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own plans
CREATE POLICY "Users can update own plans"
  ON degree_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own plans
CREATE POLICY "Users can delete own plans"
  ON degree_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Course Status Table (Optional)
-- Stores course completion status for curriculum tracking
-- ============================================
CREATE TABLE IF NOT EXISTS course_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  faculty TEXT NOT NULL,
  major TEXT NOT NULL,
  course_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not-started', 'in-progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, faculty, major, course_code)
);

-- Enable Row Level Security
ALTER TABLE course_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own course status
CREATE POLICY "Users can manage own course status"
  ON course_status
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- Trigger: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Trigger: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to degree_plans
DROP TRIGGER IF EXISTS update_degree_plans_updated_at ON degree_plans;
CREATE TRIGGER update_degree_plans_updated_at
  BEFORE UPDATE ON degree_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to course_status
DROP TRIGGER IF EXISTS update_course_status_updated_at ON course_status;
CREATE TRIGGER update_course_status_updated_at
  BEFORE UPDATE ON course_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

