const EventDna = require('../models/EventDna');

exports.getEventProfiles = async (req, res) => {
  try {
    const profiles = await EventDna.getAll();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEventProfileById = async (req, res) => {
  try {
    const profile = await EventDna.getById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEventProfile = async (req, res) => {
  try {
    const newProfile = await EventDna.create(req.body);
    res.status(201).json(newProfile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
