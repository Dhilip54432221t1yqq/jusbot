import express from 'express';
import { contactsService } from '../services/contactsService.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';
import { requireResourceOwnership } from '../middleware/requireResourceOwnership.js';

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
        console.error(err);
        res.status(500).json({ error: err?.message || 'Internal Server Error', details: err });
    });
};

// List & Filter Contacts
router.get('/', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id, ...filters } = req.query;
    const result = await contactsService.listContacts(workspace_id, filters);
    res.json(result);
}));

// Create/Update (External Hook usage)
router.post('/upsert', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id, ...contactData } = req.body;
    const contact = await contactsService.createOrUpdateContact(workspace_id, contactData);
    res.json(contact);
}));

// Segments
router.get('/segments', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const segments = await contactsService.listSegments(req.query.workspace_id);
    res.json(segments);
}));

router.post('/segments', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const segment = await contactsService.createSegment(req.body.workspace_id, req.body);
    res.json(segment);
}));

router.put('/segments/:id', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id, ...data } = req.body;
    const segment = await contactsService.updateSegment(workspace_id, req.params.id, data);
    res.json(segment);
}));

router.delete('/segments/:id', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    await contactsService.deleteSegment(req.query.workspace_id, req.params.id);
    res.json({ success: true });
}));

// Imports
router.get('/import-jobs', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const jobs = await contactsService.listImportJobs(req.query.workspace_id);
    res.json(jobs);
}));

router.post('/import', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id, filename, rows } = req.body;
    const job = await contactsService.startImport(workspace_id, filename, rows);
    res.json(job);
}));

// Contact Profile
router.get('/:id', requireResourceOwnership('id', 'contacts'), asyncHandler(async (req, res) => {
    const contact = await contactsService.getContactProfile(req.params.id);
    res.json(contact);
}));

// Tags Management
router.post('/:id/tags', requireResourceOwnership('id', 'contacts'), asyncHandler(async (req, res) => {
    const { contact_id } = req.params;
    const { tag_id } = req.body;
    // Implementation in service or directly here
    res.json({ success: true });
}));

// Custom Fields Management
router.post('/:id/fields', requireResourceOwnership('id', 'contacts'), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    const { field_name, value } = req.body;
    await contactsService.saveFieldValue(workspace_id, req.params.id, field_name, value);
    res.json({ success: true });
}));

// Notes
router.post('/:id/notes', requireResourceOwnership('id', 'contacts'), asyncHandler(async (req, res) => {
    const { agent_id, content } = req.body;
    const note = await contactsService.addNote(req.params.id, agent_id, content);
    res.json(note);
}));

export default router;
