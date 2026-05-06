import express from 'express';
import { ecommerceService } from '../services/ecommerceService.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';

const router = express.Router();

// --- Products ---

// Get all products
router.get('/products', requireWorkspaceAccess(), async (req, res) => {
    try {
        const products = await ecommerceService.getProducts(req.workspaceId);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product
router.post('/products', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const product = await ecommerceService.createProduct(req.workspaceId, req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product
router.patch('/products/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const product = await ecommerceService.updateProduct(req.params.id, req.body);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
router.delete('/products/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        await ecommerceService.deleteProduct(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Orders ---

// Get all orders
router.get('/orders', requireWorkspaceAccess(), async (req, res) => {
    try {
        const orders = await ecommerceService.getOrders(req.workspaceId);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order details
router.get('/orders/:id', requireWorkspaceAccess(), async (req, res) => {
    try {
        const order = await ecommerceService.getOrderById(req.params.id);
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status
router.patch('/orders/:id/status', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const { status } = req.body;
        const order = await ecommerceService.updateOrderStatus(req.params.id, status);
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Settings ---
router.get('/settings', requireWorkspaceAccess(), async (req, res) => {
    try {
        const settings = await ecommerceService.getSettings(req.workspaceId);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/settings', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const settings = await ecommerceService.upsertSettings(req.workspaceId, req.body);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Tags ---
router.get('/tags', requireWorkspaceAccess(), async (req, res) => {
    try {
        const tags = await ecommerceService.getTags(req.workspaceId);
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/tags', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const tag = await ecommerceService.createTag(req.workspaceId, req.body);
        res.status(201).json(tag);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/tags/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const tag = await ecommerceService.updateTag(req.params.id, req.body);
        res.json(tag);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/tags/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        await ecommerceService.deleteTag(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Vendors ---
router.get('/vendors', requireWorkspaceAccess(), async (req, res) => {
    try {
        const vendors = await ecommerceService.getVendors(req.workspaceId);
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/vendors', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const vendor = await ecommerceService.createVendor(req.workspaceId, req.body);
        res.status(201).json(vendor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/vendors/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const vendor = await ecommerceService.updateVendor(req.params.id, req.body);
        res.json(vendor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/vendors/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        await ecommerceService.deleteVendor(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Types ---
router.get('/types', requireWorkspaceAccess(), async (req, res) => {
    try {
        const types = await ecommerceService.getTypes(req.workspaceId);
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/types', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const type = await ecommerceService.createType(req.workspaceId, req.body);
        res.status(201).json(type);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/types/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const type = await ecommerceService.updateType(req.params.id, req.body);
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/types/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        await ecommerceService.deleteType(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Collections ---
router.get('/collections', requireWorkspaceAccess(), async (req, res) => {
    try {
        const collections = await ecommerceService.getCollections(req.workspaceId);
        res.json(collections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/collections', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const collection = await ecommerceService.createCollection(req.workspaceId, req.body);
        res.status(201).json(collection);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/collections/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const collection = await ecommerceService.updateCollection(req.params.id, req.body);
        res.json(collection);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/collections/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        await ecommerceService.deleteCollection(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Discounts ---
router.get('/discounts', requireWorkspaceAccess(), async (req, res) => {
    try {
        const discounts = await ecommerceService.getDiscounts(req.workspaceId);
        res.json(discounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/discounts', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        const discount = await ecommerceService.createDiscount(req.workspaceId, req.body);
        res.status(201).json(discount);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/discounts/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    try {
        await ecommerceService.deleteDiscount(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
