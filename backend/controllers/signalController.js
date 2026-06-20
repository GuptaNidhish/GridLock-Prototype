exports.optimizeSignal = (req, res) => {
  try {
    const {
      junction_id = 'PeenyaJunc',
      approach_flows = [600, 450, 500, 350], // vehicles/hour
      saturation_flow = 1800, // vehicles/hour
      lost_time_per_phase = 4 // seconds
    } = req.body;

    const numPhases = approach_flows.length;
    const totalLostTime = numPhases * lost_time_per_phase; // L

    // Calculate critical flow ratios (y = flow / saturation)
    const yRatios = approach_flows.map(f => f / saturation_flow);
    const sumY = yRatios.reduce((acc, val) => acc + val, 0); // Y

    let optimalCycleTime = 120; // fallback default
    if (sumY < 1 && sumY > 0) {
      optimalCycleTime = Math.round((1.5 * totalLostTime + 5) / (1 - sumY));
    }

    // Cap optimal cycle time to reasonable limits (45s to 180s)
    optimalCycleTime = Math.min(180, Math.max(45, optimalCycleTime));

    // Distribute green time in proportion to flow ratios
    const totalGreenTime = optimalCycleTime - totalLostTime;
    const phaseGreenTimes = yRatios.map(y => {
      return Math.round((y / sumY) * totalGreenTime);
    });

    res.json({
      success: true,
      junction_id,
      calculation: {
        total_lost_time_seconds: totalLostTime,
        sum_flow_ratios: parseFloat(sumY.toFixed(4)),
        optimal_cycle_time_seconds: optimalCycleTime,
        allocated_green_times_seconds: phaseGreenTimes,
        phases: phaseGreenTimes.map((green, idx) => ({
          phase_index: idx + 1,
          green_seconds: green,
          amber_seconds: 4,
          red_seconds: optimalCycleTime - green - 4
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
