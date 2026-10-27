const express = require('express');
const router = express.Router();
const { processChatMessage } = require('../services/agentService');

/**
 * POST /api/chat
 * Main conversational agent endpoint.
 * Request body: { message: string, history: Array }
 */
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message field is required and must be a string.'
      });
    }

    const response = await processChatMessage({ message, history });

    return res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error processing chat message.'
    });
  }
});

module.exports = router;