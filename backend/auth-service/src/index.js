// backend/auth-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'auth-service up', timestamp: new Date() });
});

// Sign up endpoint
app.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, departmentId } = req.body;
    
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      return res.status(400).json({ error: authError.message });
    }
    
    // Insert user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          user_role: role,
          department_id: departmentId || null
        }
      ]);
      
    if (userError) {
      console.error('Error creating user profile:', userError);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }
    
    res.status(201).json({ message: 'User created successfully', userId: authData.user.id });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in endpoint
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    
    // Update last login time
    await supabase
      .from('users')
      .update({ last_login: new Date() })
      .eq('id', data.user.id);
      
    res.status(200).json({
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign out endpoint
app.post('/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ message: 'Successfully signed out' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile endpoint
app.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id; // This comes from the auth middleware
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({ profile: data });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});