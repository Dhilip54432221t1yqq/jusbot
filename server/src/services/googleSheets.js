import { google } from 'googleapis';
import { supabase } from '../utils/supabase.js';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = (userId, workspaceId) => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.readonly' // To list files
        ],
        state: JSON.stringify({ userId, workspaceId })
    });
};

const getAuthClient = async (userId, workspaceId) => {
    const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .eq('provider', 'google_sheets')
        .single();

    console.log(`[getAuthClient] Supabase query for userId: ${userId}, workspaceId: ${workspaceId} returned data:`, data ? 'FOUND' : 'NULL', 'error:', error);

    if (error || !data) {
        throw new Error('User/Workspace not connected to Google Sheets');
    }

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiry_date: data.expires_at
    });

    client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            await supabase.from('integrations').upsert({
                user_id: userId,
                workspace_id: workspaceId,
                provider: 'google_sheets',
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: tokens.expiry_date
            }, { onConflict: 'user_id, workspace_id, provider' });
        } else if (tokens.access_token) {
            await supabase.from('integrations').update({
                access_token: tokens.access_token,
                expires_at: tokens.expiry_date
            }).eq('user_id', userId).eq('workspace_id', workspaceId).eq('provider', 'google_sheets');
        }
    });

    return client;
};

export const saveTokens = async (userId, workspaceId, code) => {
    const { tokens } = await oauth2Client.getToken(code);

    const { error } = await supabase.from('integrations').upsert({
        user_id: userId,
        workspace_id: workspaceId,
        provider: 'google_sheets',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date,
        status: 'active'
    }, { onConflict: 'user_id, workspace_id, provider' });

    if (error) throw error;
    return tokens;
};

export const listSpreadsheets = async (userId, workspaceId) => {
    console.log(`[listSpreadsheets] calling getAuthClient for userId: ${userId}, workspaceId: ${workspaceId}`);
    const auth = await getAuthClient(userId, workspaceId);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name)',
        pageSize: 20
    });

    return response.data.files;
};

// CRUD Operations
export const appendRow = async (userId, spreadsheetId, range, values, workspaceId) => {
    const auth = await getAuthClient(userId, workspaceId);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] }
    });

    return response.data;
};

export const getRows = async (userId, spreadsheetId, range, workspaceId) => {
    const auth = await getAuthClient(userId, workspaceId);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
    });

    return response.data.values;
};

export const updateRow = async (userId, spreadsheetId, range, values, workspaceId) => {
    const auth = await getAuthClient(userId, workspaceId);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] }
    });

    return response.data;
};

export const getSpreadsheetDetails = async (userId, spreadsheetId, workspaceId) => {
    const auth = await getAuthClient(userId, workspaceId);
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.get({
        spreadsheetId
    });
    return response.data;
};
