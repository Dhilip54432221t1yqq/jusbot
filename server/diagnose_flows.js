import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function diagnoseFlows() {
    console.log('--- flows Table Diagnosis ---');
    try {
        // Try to fetch one row to see columns
        const { data: rowData, error: rowError } = await supabase
            .from('flows')
            .select('*')
            .limit(1);

        if (rowError) {
            console.error('Error fetching data from flows:', rowError);
            console.log('\nHint: If the error mentions missing column, it means PostgREST schema cache is stale or column is truly missing.');
        } else {
            console.log('Successfully fetched rows. Count:', rowData.length);
            if (rowData.length > 0) {
                console.log('Columns found:', Object.keys(rowData[0]));
            } else {
                console.log('No rows found in flows. Checking schema directly...');
            }
        }

        // Try to explicitly select flow_data
        const { data: fdData, error: fdError } = await supabase
            .from('flows')
            .select('flow_data')
            .limit(1);

        if (fdError) {
            console.error('\nExplicit flow_data select failed:', fdError);
        } else {
            console.log('\nExplicit flow_data select: OK');
        }
    } catch (err) {
        console.error('\nUNEXPECTED EXCEPTION:', err);
    }
}

diagnoseFlows();
