const express = require('express');
const router  = express.Router();
const Dashboard = require('../models/Dashboard');

router.get('/', async (req, res) => {
  try {
    const doc = await Dashboard.findOne({});
    res.json(doc ? doc.widgets : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { widgets } = req.body;
    let doc = await Dashboard.findOne({});
    if (doc) {
      doc.widgets = widgets;
      await doc.save();
    } else {
      doc = await Dashboard.create({ widgets });
    }
    res.json(doc.widgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;