-- Seed Data for AI-HRMS
-- Run this after running supabase-schema.sql

-- Sample HR Users
-- Password for all users: "Admin@123"
-- Hash generated using bcrypt with 10 rounds

INSERT INTO hr_users (email, name, role, password_hash, is_active) VALUES
  -- Admin User
  ('admin@company.com', 'Admin User', 'admin', '$2b$10$5JD1GSQ3SClch8FSWCWVFuUufDjQ.nls0uwR7M7yv4181ToVODAWu', true),
  
  -- HR Users
  ('hr@company.com', 'HR Manager', 'hr', '$2b$10$5JD1GSQ3SClch8FSWCWVFuUufDjQ.nls0uwR7M7yv4181ToVODAWu', true),
  ('recruiter@company.com', 'Senior Recruiter', 'hr', '$2b$10$5JD1GSQ3SClch8FSWCWVFuUufDjQ.nls0uwR7M7yv4181ToVODAWu', true),
  ('talent@company.com', 'Talent Acquisition', 'hr', '$2b$10$5JD1GSQ3SClch8FSWCWVFuUufDjQ.nls0uwR7M7yv4181ToVODAWu', true)
ON CONFLICT (email) DO NOTHING;

-- Sample Jobs (optional - for demo purposes)
-- Note: You'll need to replace 'YOUR_HR_USER_ID' with actual UUID after inserting users

-- First, let's get the admin user ID for job creation
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM hr_users WHERE email = 'admin@company.com' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Insert sample jobs
    INSERT INTO jobs (
      title, 
      location, 
      experience_min, 
      experience_max, 
      skills, 
      salary_range, 
      jd_text, 
      ai_generated, 
      created_by, 
      status
    ) VALUES
    (
      'Senior Full Stack Developer',
      'Remote',
      3,
      7,
      ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
      '$80,000 - $120,000',
      E'We are seeking an experienced Full Stack Developer to join our growing team.\n\nResponsibilities:\n- Develop and maintain web applications using React and Node.js\n- Design and implement RESTful APIs\n- Work with PostgreSQL databases\n- Deploy applications on AWS\n- Collaborate with cross-functional teams\n\nRequirements:\n- 3+ years of full-stack development experience\n- Strong proficiency in JavaScript/TypeScript\n- Experience with React and Node.js\n- Knowledge of SQL databases\n- Excellent problem-solving skills',
      false,
      admin_id,
      'active'
    ),
    (
      'Frontend Developer',
      'New York, NY',
      2,
      5,
      ARRAY['React', 'JavaScript', 'CSS', 'HTML', 'Tailwind CSS'],
      '$60,000 - $90,000',
      E'Join our team as a Frontend Developer and help build beautiful user interfaces.\n\nResponsibilities:\n- Build responsive web applications\n- Implement pixel-perfect designs\n- Optimize performance\n- Write clean, maintainable code\n\nRequirements:\n- 2+ years of frontend development experience\n- Strong knowledge of React\n- Proficiency in CSS/Tailwind\n- Eye for design and UX',
      false,
      admin_id,
      'active'
    ),
    (
      'DevOps Engineer',
      'San Francisco, CA',
      4,
      8,
      ARRAY['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
      '$100,000 - $150,000',
      E'We\'re looking for a skilled DevOps Engineer to manage our infrastructure.\n\nResponsibilities:\n- Maintain and improve CI/CD pipelines\n- Manage AWS infrastructure\n- Implement Infrastructure as Code\n- Monitor system performance\n- Ensure high availability\n\nRequirements:\n- 4+ years of DevOps experience\n- Strong AWS knowledge\n- Experience with Docker and Kubernetes\n- Proficiency in scripting (Python, Bash)\n- Understanding of security best practices',
      false,
      admin_id,
      'active'
    );
  END IF;
END $$;

-- Display seeded credentials
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'SEED DATA INSERTED SUCCESSFULLY';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'LOGIN CREDENTIALS (for all users):';
  RAISE NOTICE '  Password: Admin@123';
  RAISE NOTICE '';
  RAISE NOTICE 'ADMIN ACCOUNT:';
  RAISE NOTICE '  Email: admin@company.com';
  RAISE NOTICE '  Role: admin';
  RAISE NOTICE '';
  RAISE NOTICE 'HR ACCOUNTS:';
  RAISE NOTICE '  Email: hr@company.com';
  RAISE NOTICE '  Email: recruiter@company.com';
  RAISE NOTICE '  Email: talent@company.com';
  RAISE NOTICE '  Role: hr';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
END $$;
