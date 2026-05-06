
import axios from 'axios';
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function testApiEndpoint() {
    console.log('--- Testing API Endpoint: POST /api/workspaces ---');
    try {
        // 1. Get a valid user ID
        const { data: workspaces } = await supabase.from('workspaces').select('user_id').limit(1);
        const validUserId = workspaces[0].user_id;

        console.log('Using User ID:', validUserId);

        // 2. Mock the request
        const res = await axios.post('http://localhost:3000/api/workspaces', 
            { name: 'API Test Workspace' },
            { headers: { 'x-user-id': validUserId } }
        );

        console.log('API RESPONSE SUCCESS:', res.status);
        console.log('Data:', res.data);
    } catch (err) {
        console.log('API RESPONSE FAILED:', err.response ? err.response.status : err.message);
        if (err.response) {
            console.log('Error Data:', err.response.data);
        }
    }
}

testApiEndpoint();
