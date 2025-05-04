// test-setup.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// async function testSupabaseConnection() {
//   try {
//     console.log('🔍 Testing Supabase connection...');
    
//     // Check existence of expected tables 
//     const tableChecks = ['users', 'departments', 'faculties', 'courses'];

//     for (const table of tableChecks) {
//       const { error } = await supabase.from(table).select('*').limit(1);
//       if (error) {
//         console.error(`❌ Could not access table "${table}":`, error.message);
//         return false;
//       } else {
//         console.log(`✅ Table "${table}" is accessible.`);
//       }
//     }

      
//     if (error) {
//       console.error('❌ Supabase connection test failed:', error.message);
//       return false;
//     }
    
//     if (!tables || tables.length === 0) {
//       console.error('❌ Required tables not found in database. Make sure you have created all necessary tables.');
//       return false;
//     }
    
//     const foundTables = tables.map(t => t.tablename);
//     console.log('✅ Connected to Supabase successfully!');
//     console.log('📋 Found tables:', foundTables.join(', '));
    
//     // Test RLS Policies
//     console.log('🔍 Checking RLS policies...');
//     const { data: policies, error: policiesError } = await supabase
//       .rpc('get_policies');
      
//     if (policiesError) {
//       console.error('❌ Could not verify RLS policies:', policiesError.message);
//       return false;
//     }
    
//     if (!policies || policies.length === 0) {
//       console.warn('⚠️ No RLS policies found. Make sure RLS is properly configured.');
//     } else {
//       console.log('✅ RLS policies are configured.');
//     }
    
//     return true;
//   } catch (error) {
//     console.error('❌ Test failed with an unexpected error:', error);
//     return false;
//   }
// }

async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // List of required tables to check
    const tableChecks = ['users', 'departments', 'faculties', 'courses'];
    
    for (const table of tableChecks) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Could not access table "${table}":`, error.message);
        return false;
      } else {
        console.log(`✅ Table "${table}" is accessible.`);
      }
    }

    // // Test RLS Policies
    // console.log('🔍 Checking RLS policies...');
    // const { data: policies, error: policiesError } = await supabase.rpc('get_policies');
    
    // if (policiesError) {
    //   console.error('❌ Could not verify RLS policies:', policiesError.message);
    //   return false;
    // }

    // if (!policies || policies.length === 0) {
    //   console.warn('⚠️ No RLS policies found. Make sure RLS is properly configured.');
    // } else {
    //   console.log('✅ RLS policies are configured.');
    // }

    return true;
  } catch (err) {
    console.error('❌ Test failed with an unexpected error:', err);
    return false;
  }
}



// Create a test user to verify auth
async function testUserCreation() {
  try {
    console.log('🔍 Testing user creation...');
    
    // Check if faculties and departments exist
    const { data: faculties } = await supabase
      .from('faculties')
      .select('*')
      .limit(1);
      
    if (!faculties || faculties.length === 0) {
      console.log('⚠️ No faculties found. Creating a test faculty...');
      
      const { data: newFaculty, error: facultyError } = await supabase
        .from('faculties')
        .insert([{ name: 'Test Faculty', code: 'TEST-FAC' }])
        .select();
        
      if (facultyError) {
        console.error('❌ Could not create test faculty:', facultyError.message);
        return false;
      }
      
      console.log('✅ Created test faculty with ID:', newFaculty[0].id);
    }
    
    // Get or create department
    const { data: departments } = await supabase
      .from('departments')
      .select('*')
      .limit(1);
      
    let departmentId;
    
    if (!departments || departments.length === 0) {
      console.log('⚠️ No departments found. Creating a test department...');
      
      const { data: faculties } = await supabase
        .from('faculties')
        .select('id')
        .limit(1);
        
      const facultyId = faculties[0].id;
      
      const { data: newDepartment, error: deptError } = await supabase
        .from('departments')
        .insert([{ name: 'Test Department', code: 'TEST-DEPT', faculty_id: facultyId }])
        .select();
        
      if (deptError) {
        console.error('❌ Could not create test department:', deptError.message);
        return false;
      }
      
      departmentId = newDepartment[0].id;
      console.log('✅ Created test department with ID:', departmentId);
    } else {
      departmentId = departments[0].id;
    }
    
    // Create a test admin user
    const testEmail = `test.admin${Math.floor(Math.random() * 1000)}@gmail.com`;
    const testPassword = 'Password123!';
    
    console.log(`🔍 Creating test admin user: ${testEmail}`);
    
    // Register user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.error('❌ Could not create test user auth:', authError.message);
      return false;
    }
    
    // Create user profile
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email: testEmail,
        first_name: 'Test',
        last_name: 'Admin',
        user_role: 'admin',
        department_id: departmentId
      }]);
      
    if (userError) {
      console.error('❌ Could not create test user profile:', userError.message);
      return false;
    }
    
    console.log('✅ Created test admin user successfully!');
    console.log('📝 Test user credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   User ID: ${authData.user.id}`);
    
    return true;
  } catch (error) {
    console.error('❌ User creation test failed with an unexpected error:', error);
    return false;
  }
}

// Test course creation
async function testCourseCreation() {
  try {
    console.log('🔍 Testing course creation...');
    
    // Get a department ID
    const { data: departments } = await supabase
      .from('departments')
      .select('id')
      .limit(1);
      
    if (!departments || departments.length === 0) {
      console.error('❌ No departments found. Cannot create test course.');
      return false;
    }
    
    const departmentId = departments[0].id;
    
    // Create a test course
    const testCourseCode = `COURSE-${Date.now()}`;
    const { data: newCourse, error: courseError } = await supabase
      .from('courses')
      .insert([{
        code: testCourseCode,
        title: 'Test Course',
        department_id: departmentId,
        // credits: 3,
        credit_hours: 60,
        description: 'Test course created during setup verification'
      }])
      .select();
      
    if (courseError) {
      console.error('❌ Could not create test course:', courseError.message);
      return false;
    }
    
    console.log('✅ Created test course successfully with code:', testCourseCode);
    return true;
  } catch (error) {
    console.error('❌ Course creation test failed with an unexpected error:', error);
    return false;
  }
}

// Test API endpoints if available
async function testApiEndpoints() {
  try {
    console.log('🔍 Testing API endpoints...');
    // This would typically be done with axios or fetch to test your API gateway
    console.log('ℹ️ API endpoint testing would be implemented here.');
    console.log('ℹ️ Consider adding tests for your auth, courses, and other endpoints.');
    
    // If you've implemented API testing, return true/false based on results
    return true;
  } catch (error) {
    console.error('❌ API endpoint test failed with an unexpected error:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting backend setup tests...');
  
  const dbConnectionSuccess = await testSupabaseConnection();
  if (!dbConnectionSuccess) {
    console.error('❌ Database connection test failed. Fix the issues before continuing.');
    process.exit(1);
  }
  
  const userCreationSuccess = await testUserCreation();
  if (!userCreationSuccess) {
    console.error('❌ User creation test failed. Fix the issues before continuing.');
    process.exit(1);
  }
  
  const courseCreationSuccess = await testCourseCreation();
  if (!courseCreationSuccess) {
    console.error('❌ Course creation test failed. Fix the issues before continuing.');
    process.exit(1);
  }
  
  // Uncomment when you're ready to test API endpoints
  // const apiTestSuccess = await testApiEndpoints();
  // if (!apiTestSuccess) {
  //   console.error('❌ API endpoint test failed. Fix the issues before continuing.');
  //   process.exit(1);
  // }
  
  console.log('✅ All tests passed successfully!');
  console.log('🎉 Your backend setup is verified and ready to use.');
}

// Run all tests
runTests().catch(error => {
  console.error('❌ Tests failed with an unexpected error:', error);
  process.exit(1);
});