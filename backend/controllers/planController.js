const BarricadePlan = require('../models/BarricadePlan');

exports.getPlans = async (req, res) => {
  try {
    const plans = await BarricadePlan.getAll();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const plan = await BarricadePlan.getById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const newPlan = await BarricadePlan.create(req.body);
    if (global.broadcast) {
      global.broadcast({
        type: 'PLAN_CREATED',
        data: newPlan
      });
    }
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const updated = await BarricadePlan.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Plan not found' });
    if (global.broadcast) {
      global.broadcast({
        type: 'PLAN_UPDATED',
        data: updated
      });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
