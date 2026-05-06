
import express from 'express';
import * as content from '../services/content.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';

const router = express.Router();

// Helper to handle async route errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Unified Fields
router.get('/fields', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id, scope } = req.query;
    const fields = await content.listFields(workspace_id, scope);
    res.json(fields);
}));

router.post('/fields', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const field = await content.createField(req.body);
    res.status(201).json(field);
}));

router.put('/fields/:id', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    const field = await content.updateField(req.params.id, req.body, workspace_id);
    res.json(field);
}));

router.delete('/fields/:id', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    await content.deleteField(req.params.id, workspace_id);
    res.sendStatus(204);
}));

// Tags
router.get('/tags', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    const tags = await content.listTags(workspace_id);
    res.json(tags);
}));

router.post('/tags', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const tag = await content.createTag(req.body);
    res.status(201).json(tag);
}));

router.delete('/tags/:id', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    await content.deleteTag(req.params.id, workspace_id);
    res.sendStatus(204);
}));

// Templates
router.get('/templates', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    const templates = await content.listTemplates(workspace_id);
    res.json(templates);
}));

router.post('/templates', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const template = await content.createTemplate(req.body);
    res.status(201).json(template);
}));

router.put('/templates/:id', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    const template = await content.updateTemplate(req.params.id, req.body, workspace_id);
    res.json(template);
}));

router.delete('/templates/:id', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    await content.deleteTemplate(req.params.id, workspace_id);
    res.sendStatus(204);
}));

// Media Assets
router.get('/media', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    const media = await content.listMedia(workspace_id);
    res.json(media);
}));

router.post('/media', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const media = await content.createMedia(req.body);
    res.status(201).json(media);
}));

router.delete('/media/:id', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const { workspace_id } = req.query;
    await content.deleteMedia(req.params.id, workspace_id);
    res.sendStatus(204);
}));

export default router;
