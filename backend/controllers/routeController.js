exports.getDiversionRoute = (req, res) => {
  try {
    const { start_lat, start_lon, end_lat, end_lon } = req.body;

    if (!start_lat || !start_lon) {
      return res.status(400).json({ error: 'Missing start_lat or start_lon' });
    }

    // Generate simulated diversion path coordinates around the incident
    const lat = parseFloat(start_lat);
    const lon = parseFloat(start_lon);

    const routes = [
      {
        name: 'Primary Diversion Route A',
        travel_time_increase_minutes: 8,
        total_distance_km: 3.4,
        waypoints: [
          [lat, lon],
          [lat + 0.003, lon - 0.005],
          [lat + 0.008, lon - 0.002],
          [lat + 0.005, lon + 0.006],
          [end_lat || lat, end_lon || lon]
        ]
      },
      {
        name: 'Secondary Bypass Route B',
        travel_time_increase_minutes: 14,
        total_distance_km: 5.1,
        waypoints: [
          [lat, lon],
          [lat - 0.004, lon + 0.004],
          [lat - 0.007, lon + 0.009],
          [lat + 0.001, lon + 0.012],
          [end_lat || lat, end_lon || lon]
        ]
      }
    ];

    res.json({
      success: true,
      routes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
