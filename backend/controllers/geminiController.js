const geminiService = require('../services/geminiService');

exports.getRecommendations = async (req, res) => {
  try {
    const { weather, incidentId } = req.query;
    const recommendations = await geminiService.getTrafficRecommendations(weather, incidentId);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
