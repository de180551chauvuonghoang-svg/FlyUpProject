import axios from 'axios';

const assignmentId = 'a198-f58c674c27cc'; // From screenshot
const baseUrl = 'http://localhost:5000/api';

async function test() {
    try {
        console.log(`Fetching detail for ${assignmentId}...`);
        const resp = await axios.get(`${baseUrl}/quiz/assignments/${assignmentId}/preview`, {
            headers: {
                // We need a token, but let's see if we get a 401 or the 400
                'Authorization': 'Bearer test-token' 
            }
        });
        console.log('Success:', resp.data);
    } catch (err) {
        console.log('Error Status:', err.response?.status);
        console.log('Error Data:', JSON.stringify(err.response?.data, null, 2));
    }
}

test();
