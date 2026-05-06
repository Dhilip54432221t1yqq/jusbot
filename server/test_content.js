
import * as content from './src/services/content.js';

async function test() {
    console.log('Testing User Fields...');
    try {
        const field = await content.createUserField({
            name: 'Test Field ' + Date.now(),
            type: 'Text',
            description: 'Created by test script'
        });
        console.log('Created User Field:', field);

        const fields = await content.listUserFields();
        console.log('List User Fields:', fields.length, 'dates');

        if (fields.length > 0) {
            console.log('First field:', fields[0]);
        }
    } catch (e) {
        console.error('User Fields Error:', e);
    }
}

test();
