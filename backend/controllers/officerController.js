const Officer = require('../models/Officer');

exports.getOfficers = async (req, res) => {
  try {
    const officers = await Officer.getAll();
    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOfficerById = async (req, res) => {
  try {
    const officer = await Officer.getById(req.params.id);
    if (!officer) return res.status(404).json({ error: 'Officer not found' });
    res.json(officer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOfficer = async (req, res) => {
  try {
    const updated = await Officer.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Officer not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
