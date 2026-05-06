import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/content';
const workspace_id = '88f01c7a-514d-4c3e-868d-11309b2edbdd'; // Example ID from previous context if available, otherwise I'll need a real one.
// Let me check if I can find a real workspace ID.

async function testMediaAPI() {
    try {
        console.log('--- Testing Media API ---');
        
        // 1. List Media (should be empty initially)
        const listRes = await axios.get(`${BASE_URL}/media?workspace_id=${workspace_id}`);
        console.log('List Media:', listRes.data);

        // 2. Create Media
        const createRes = await axios.post(`${BASE_URL}/media?workspace_id=${workspace_id}`, {
            name: 'Test Image',
            type: 'image',
            url: 'https://test.com/img.png',
            workspace_id: workspace_id
        });
        console.log('Created Media:', createRes.data);
        const mediaId = createRes.data.id;

        // 3. List again
        const listRes2 = await axios.get(`${BASE_URL}/media?workspace_id=${workspace_id}`);
        console.log('List Media after create:', listRes2.data);

        // 4. Delete
        await axios.delete(`${BASE_URL}/media/${mediaId}?workspace_id=${workspace_id}`);
        console.log('Deleted Media');

        // 5. Final list
        const listRes3 = await axios.get(`${BASE_URL}/media?workspace_id=${workspace_id}`);
        console.log('List Media after delete:', listRes3.data);

        console.log('--- Test Complete ---');
    } catch (err) {
        console.error('Test failed:', err.response?.data || err.message);
    }
}

testMediaAPI();
