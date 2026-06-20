exports.simulateScenario = (req, res) => {
  try {
    const {
      expected_crowd_size = 5000,
      event_duration_hours = 4,
      is_barricade_deployed = false,
      is_green_wave_active = false,
      weather_severity = 1.0 // 1.0 = clear, 2.0 = heavy rain
    } = req.body;

    // Mathematically grounded simulator formula
    let rawCis = (expected_crowd_size * 0.006) + (event_duration_hours * 10) + (weather_severity * 12);
    
    // Apply mitigations
    let barricadeSavings = is_barricade_deployed ? rawCis * 0.25 : 0;
    let greenWaveSavings = is_green_wave_active ? rawCis * 0.15 : 0;
    
    let simulatedCis = Math.min(100, Math.max(0, Math.round(rawCis - barricadeSavings - greenWaveSavings)));
    let delayIncreaseMinutes = Math.round((simulatedCis * 1.5) * (weather_severity));

    res.json({
      success: true,
      simulation: {
        raw_cis: Math.round(rawCis),
        simulated_cis: simulatedCis,
        delay_increase_minutes: delayIncreaseMinutes,
        manpower_recommended: Math.ceil(expected_crowd_size / 800),
        mitigations: {
          barricade_savings_score: Math.round(barricadeSavings),
          green_wave_savings_score: Math.round(greenWaveSavings)
        },
        bottleneck_junctions: [
          { name: 'Tin Factory Junction', current_level: 'High', simulated_level: simulatedCis > 70 ? 'Severe' : 'High' },
          { name: 'Hebbal Circle', current_level: 'Medium', simulated_level: simulatedCis > 50 ? 'High' : 'Medium' }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
