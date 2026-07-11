import { getDb } from './mongodb.js';

/**
 * Initializes MongoDB collections and optimizes them by setting up key indexes.
 * This is crucial for performance, multi-tenancy isolation, and avoiding duplicate entries.
 */
export async function initializeDatabase() {
  console.log('[MongoDB] ⚡ Starting database collection initialization and optimization...');
  try {
    const db = getDb();

    // Define collection names and their optimized index configurations
    const indexConfigs = {
      // 1. Workspace-related collections
      workspaces: [
        { spec: { user_id: 1 }, options: { name: 'idx_workspaces_user_id' } }
      ],
      workspace_members: [
        { spec: { workspace_id: 1, user_id: 1 }, options: { unique: true, name: 'uidx_members_workspace_user' } },
        { spec: { workspace_id: 1, email: 1 }, options: { unique: true, name: 'uidx_members_workspace_email' } },
        { spec: { user_id: 1 }, options: { name: 'idx_members_user_id' } },
        { spec: { workspace_id: 1 }, options: { name: 'idx_members_workspace_id' } }
      ],
      profiles: [
        { spec: { email: 1 }, options: { unique: true, name: 'uidx_profiles_email' } }
      ],

      // 2. Flow-related collections
      flows: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_flows_workspace_id' } },
        { spec: { folder_id: 1 }, options: { name: 'idx_flows_folder_id' } }
      ],
      flow_nodes: [
        { spec: { flow_id: 1, version: 1 }, options: { name: 'idx_flow_nodes_flow_version' } },
        { spec: { node_id: 1 }, options: { name: 'idx_flow_nodes_node_id' } }
      ],
      node_connections: [
        { spec: { flow_id: 1, version: 1 }, options: { name: 'idx_node_conns_flow_version' } }
      ],
      folders: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_folders_workspace_id' } }
      ],

      // 3. Security (Auth and Logs) collections
      members: [
        { spec: { id: 1 }, options: { unique: true, name: 'uidx_members_id' } },
        { spec: { email: 1 }, options: { unique: true, name: 'uidx_members_email' } },
        { spec: { auth: 1 }, options: { name: 'idx_members_auth_token' } }
      ],
      trigger_logs: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_trigger_logs_workspace_id' } },
        { spec: { created_at: -1 }, options: { name: 'idx_trigger_logs_created_at_desc' } }
      ],
      whatsapp_cloud_logs: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_wa_cloud_logs_workspace_id' } },
        { spec: { created_at: -1 }, options: { name: 'idx_wa_cloud_logs_created_at_desc' } }
      ],

      // 4. Connection and Integration collections
      integrations: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_integrations_workspace_id' } },
        { spec: { user_id: 1, workspace_id: 1, provider: 1 }, options: { unique: true, name: 'uidx_integrations_user_workspace_provider' } }
      ],
      channels: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_channels_workspace_id' } }
      ],
      instagram_tokens: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_ig_tokens_workspace_id' } }
      ],
      whatsapp_catalog_settings: [
        { spec: { workspace_id: 1 }, options: { unique: true, name: 'uidx_wa_catalog_settings_workspace_id' } }
      ],
      whatsapp_marketing_settings: [
        { spec: { workspace_id: 1 }, options: { unique: true, name: 'uidx_wa_marketing_settings_workspace_id' } }
      ],
      whatsapp_payments_settings: [
        { spec: { workspace_id: 1 }, options: { unique: true, name: 'uidx_wa_payments_settings_workspace_id' } }
      ],
      whatsapp_welcome_sequences: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_wa_welcome_seq_workspace_id' } },
        { spec: { sequence_id: 1 }, options: { name: 'idx_wa_welcome_seq_sequence_id' } }
      ],

      // 5. CRM & Chat collections
      contacts: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_contacts_workspace_id' } },
        { spec: { workspace_id: 1, email: 1 }, options: { name: 'idx_contacts_workspace_email' } },
        { spec: { phone: 1 }, options: { name: 'idx_contacts_phone' } }
      ],
      conversations: [
        { spec: { workspace_id: 1 }, options: { name: 'idx_conv_workspace_id' } },
        { spec: { contact_id: 1 }, options: { name: 'idx_conv_contact_id' } }
      ],
      messages: [
        { spec: { conversation_id: 1 }, options: { name: 'idx_msg_conversation_id' } },
        { spec: { created_at: -1 }, options: { name: 'idx_msg_created_at_desc' } }
      ]
    };

    // Iterate and apply indexes
    for (const [collectionName, indexes] of Object.entries(indexConfigs)) {
      console.log(`[MongoDB] 📁 Processing collection: "${collectionName}"`);
      const coll = db.collection(collectionName);

      for (const idx of indexes) {
        try {
          const indexName = await coll.createIndex(idx.spec, idx.options);
          console.log(`  └─ Index "${indexName}" checked/created successfully.`);
        } catch (idxError) {
          console.warn(`  └─ ⚠️ Warning creating index on "${collectionName}": ${idxError.message}`);
          // If index already exists with different options, we can drop and recreate it
          if (idxError.message.includes('already exists with different options')) {
            const indexNameToDrop = idx.options.name;
            if (indexNameToDrop) {
              console.log(`     Recreating index "${indexNameToDrop}"...`);
              await coll.dropIndex(indexNameToDrop);
              await coll.createIndex(idx.spec, idx.options);
              console.log(`     └─ Recreated index successfully.`);
            }
          }
        }
      }
    }

    console.log('[MongoDB] ✅ Database initialization and index optimization completed successfully.');
  } catch (error) {
    console.error('[MongoDB] ❌ Error during database collection initialization:', error.message);
    throw error;
  }
}

export default initializeDatabase;
