import { supabase } from '../utils/supabase.js';
import crypto from 'crypto';

async function generateCustomId(workspaceId, prefix, table) {
    const match = workspaceId.match(/\d+/);
    const numPart = match ? match[0] : workspaceId;
    const prefixStr = `${numPart}${prefix}`;

    // Improved query: 
    // 1. Filter by prefix to ensure we find the latest item in the current sequence
    // 2. Order by ID descending to find the highest sequence number
    const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq('workspace_id', workspaceId)
        .like('id', `${prefixStr}%`)
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error(`[ID Generator] Error fetching last ID for ${table}:`, error);
        throw error;
    }

    let nextNum = 1;
    if (data && data.length > 0 && data[0].id) {
        const lastId = data[0].id;
        if (lastId.startsWith(prefixStr)) {
            const seqStr = lastId.substring(prefixStr.length);
            const seqNum = parseInt(seqStr, 10);
            if (!isNaN(seqNum)) {
                nextNum = seqNum + 1;
            }
        }
    }

    const paddedNum = (table === 'products' ? nextNum.toString().padStart(3, '0') : nextNum.toString().padStart(2, '0'));
    const finalId = `${prefixStr}${paddedNum}`;
    console.log(`[ID Generator] Generated new ID for ${table}: ${finalId} (Last ID: ${data?.[0]?.id || 'none'})`);
    return finalId;
}export const ecommerceService = {
    // Product Management
    async getProducts(workspaceId) {
        const { data, error } = await supabase
            .from('products')
            .select('*, product_variants(*), ecommerce_collection_products(collection_id)')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createProduct(workspaceId, productData) {
        const { variants, collectionIds, ...productBase } = productData;
        const newId = await generateCustomId(workspaceId, '1', 'products');
        
        console.log(`[Ecommerce] Creating product ${newId} in workspace ${workspaceId}`);
        
        const { data, error } = await supabase
            .from('products')
            .insert([{ ...productBase, id: newId, workspace_id: workspaceId }])
            .select()
            .single();
        
        if (error) {
            console.error(`[Ecommerce] Error creating product ${newId}:`, error);
            throw error;
        }

        if (productBase.has_variants && variants && variants.length > 0) {
            const variantsToInsert = variants.map((v, i) => ({ ...v, id: `${data.id}-var-${i+1}`, product_id: data.id }));
            const { error: varError } = await supabase.from('product_variants').insert(variantsToInsert);
            if (varError) {
                console.error(`[Ecommerce] Error creating variants for product ${newId}:`, varError);
                throw varError;
            }
        }

        if (collectionIds && collectionIds.length > 0) {
            const collectionsToInsert = collectionIds.map(cid => ({ collection_id: cid, product_id: data.id }));
            await supabase.from('ecommerce_collection_products').insert(collectionsToInsert);
        }
        
        return data;
    },

    async updateProduct(id, productData) {
        const { 
            variants, 
            collectionIds, 
            product_variants, 
            ecommerce_collection_products,
            created_at,
            updated_at,
            workspace_id,
            id: productId,
            ...productBase 
        } = productData;

        const { data, error } = await supabase
            .from('products')
            .update({ ...productBase, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        if (productBase.has_variants) {
            // Delete old variants and insert new ones
            await supabase.from('product_variants').delete().eq('product_id', id);
            if (variants && variants.length > 0) {
                const variantsToInsert = variants.map((v, i) => ({ ...v, id: `${id}-var-${i+1}`, product_id: id }));
                const { error: varError } = await supabase.from('product_variants').insert(variantsToInsert);
                if (varError) throw varError;
            }
        } else {
            await supabase.from('product_variants').delete().eq('product_id', id);
        }

        if (collectionIds !== undefined) {
            await supabase.from('ecommerce_collection_products').delete().eq('product_id', id);
            if (collectionIds.length > 0) {
                const collectionsToInsert = collectionIds.map(cid => ({ collection_id: cid, product_id: id }));
                await supabase.from('ecommerce_collection_products').insert(collectionsToInsert);
            }
        }

        return data;
    },

    async deleteProduct(id) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // --- Settings ---
    async getSettings(workspaceId) {
        const { data, error } = await supabase
            .from('ecommerce_settings')
            .select('*')
            .eq('workspace_id', workspaceId)
            .single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'not found'
        return data || null;
    },

    async upsertSettings(workspaceId, settingsData) {
        // Check if exists
        const { data: existing } = await supabase
            .from('ecommerce_settings')
            .select('id')
            .eq('workspace_id', workspaceId)
            .single();

        if (existing) {
            const { data, error } = await supabase
                .from('ecommerce_settings')
                .update({ ...settingsData, updated_at: new Date() })
                .eq('workspace_id', workspaceId)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('ecommerce_settings')
                .insert([{ ...settingsData, workspace_id: workspaceId }])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },

    // --- Tags ---
    async getTags(workspaceId) {
        const { data, error } = await supabase
            .from('ecommerce_tags')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('name', { ascending: true });
        if (error) throw error;
        return data;
    },

    async createTag(workspaceId, tagData) {
        const newId = await generateCustomId(workspaceId, 'tag', 'ecommerce_tags');
        const { data, error } = await supabase
            .from('ecommerce_tags')
            .insert([{ ...tagData, id: newId, workspace_id: workspaceId }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateTag(id, tagData) {
        const { data, error } = await supabase
            .from('ecommerce_tags')
            .update(tagData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteTag(id) {
        const { error } = await supabase.from('ecommerce_tags').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // --- Vendors ---
    async getVendors(workspaceId) {
        const { data, error } = await supabase
            .from('ecommerce_vendors')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('name', { ascending: true });
        if (error) throw error;
        return data;
    },

    async createVendor(workspaceId, vendorData) {
        const newId = await generateCustomId(workspaceId, 'v', 'ecommerce_vendors');
        const { data, error } = await supabase
            .from('ecommerce_vendors')
            .insert([{ ...vendorData, id: newId, workspace_id: workspaceId }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateVendor(id, vendorData) {
        const { data, error } = await supabase
            .from('ecommerce_vendors')
            .update(vendorData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteVendor(id) {
        const { error } = await supabase.from('ecommerce_vendors').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // --- Types ---
    async getTypes(workspaceId) {
        const { data, error } = await supabase
            .from('ecommerce_types')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('name', { ascending: true });
        if (error) throw error;
        return data;
    },

    async createType(workspaceId, typeData) {
        const newId = await generateCustomId(workspaceId, 'type', 'ecommerce_types');
        const { data, error } = await supabase
            .from('ecommerce_types')
            .insert([{ ...typeData, id: newId, workspace_id: workspaceId }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateType(id, typeData) {
        const { data, error } = await supabase
            .from('ecommerce_types')
            .update(typeData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteType(id) {
        const { error } = await supabase.from('ecommerce_types').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // Order Management
    async getOrders(workspaceId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, contacts(name, email)')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getOrderById(id) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, contacts(*), order_items(*, products(*))')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async updateOrderStatus(id, status) {
        const { data, error } = await supabase
            .from('orders')
            .update({ status, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updatePaymentStatus(id, payment_status) {
        const { data, error } = await supabase
            .from('orders')
            .update({ payment_status, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // If paid, reduce inventory
        if (payment_status === 'paid') {
            await this.decrementInventory(id);
        }

        return data;
    },

    async decrementInventory(orderId) {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();
        
        if (orderError || !order.order_items) return;

        for (const item of order.order_items) {
            // 1. Handle Variant-wise reduction
            if (item.variant_id) {
                const { data: variant } = await supabase
                    .from('product_variants')
                    .select('quantity, product_id')
                    .eq('id', item.variant_id)
                    .single();
                
                if (variant) {
                    const { data: product } = await supabase
                        .from('products')
                        .select('track_quantity')
                        .eq('id', variant.product_id)
                        .single();

                    if (product?.track_quantity) {
                        const newQty = Math.max(0, (variant.quantity || 0) - item.quantity);
                        await supabase
                            .from('product_variants')
                            .update({ quantity: newQty })
                            .eq('id', item.variant_id);
                        console.log(`[Inventory] Reduced variant ${item.variant_id} to ${newQty}`);
                    }
                }
            } 
            // 2. Handle Simple Product reduction
            else if (item.product_id) {
                const { data: product } = await supabase
                    .from('products')
                    .select('stock_quantity, track_quantity')
                    .eq('id', item.product_id)
                    .single();

                if (product && product.track_quantity) {
                    const newQty = Math.max(0, (product.stock_quantity || 0) - item.quantity);
                    await supabase
                        .from('products')
                        .update({ stock_quantity: newQty })
                        .eq('id', item.product_id);
                    console.log(`[Inventory] Reduced product ${item.product_id} to ${newQty}`);
                }
            }
        }
    },

    // Collections
    async getCollections(workspaceId) {
        const { data, error } = await supabase
            .from('ecommerce_collections')
            .select('*, ecommerce_collection_conditions(*), ecommerce_collection_products(product_id)')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createCollection(workspaceId, collectionData) {
        const { conditions, productIds, ...base } = collectionData;
        const newId = await generateCustomId(workspaceId, 'col', 'ecommerce_collections');
        const { data, error } = await supabase
            .from('ecommerce_collections')
            .insert([{ ...base, id: newId, workspace_id: workspaceId }])
            .select()
            .single();
        if (error) throw error;

        if (base.type === 'auto' && conditions && conditions.length > 0) {
            const condsToInsert = conditions.map((c, i) => ({ ...c, id: `${data.id}-cond-${i+1}`, collection_id: data.id }));
            await supabase.from('ecommerce_collection_conditions').insert(condsToInsert);
        } else if (base.type === 'manual' && productIds && productIds.length > 0) {
            const productsToInsert = productIds.map(pid => ({ collection_id: data.id, product_id: pid }));
            await supabase.from('ecommerce_collection_products').insert(productsToInsert);
        }
        return data;
    },

    async updateCollection(id, collectionData) {
        const { 
            conditions, 
            productIds, 
            ecommerce_collection_conditions,
            ecommerce_collection_products,
            created_at,
            updated_at,
            workspace_id,
            id: colId,
            ...base 
        } = collectionData;

        const { data, error } = await supabase
            .from('ecommerce_collections')
            .update({ ...base, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // Reset conditions & products
        await supabase.from('ecommerce_collection_conditions').delete().eq('collection_id', id);
        await supabase.from('ecommerce_collection_products').delete().eq('collection_id', id);
        
        if (base.type === 'auto' && conditions && conditions.length > 0) {
            const condsToInsert = conditions.map((c, i) => ({ ...c, id: `${id}-cond-${i+1}`, collection_id: id }));
            await supabase.from('ecommerce_collection_conditions').insert(condsToInsert);
        } else if (base.type === 'manual' && productIds && productIds.length > 0) {
            const productsToInsert = productIds.map(pid => ({ collection_id: id, product_id: pid }));
            await supabase.from('ecommerce_collection_products').insert(productsToInsert);
        }
        return data;
    },

    async deleteCollection(id) {
        const { error } = await supabase.from('ecommerce_collections').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // Discounts
    async getDiscounts(workspaceId) {
        const { data, error } = await supabase
            .from('ecommerce_discounts')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createDiscount(workspaceId, discountData) {
        const { data, error } = await supabase
            .from('ecommerce_discounts')
            .insert([{ ...discountData, workspace_id: workspaceId }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteDiscount(id) {
        const { error } = await supabase.from('ecommerce_discounts').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};
