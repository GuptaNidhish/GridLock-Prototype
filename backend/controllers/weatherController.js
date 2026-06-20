const FloodPoint = require('../models/FloodPoint');

exports.getWeatherAlerts = async (req, res) => {
  try {
    const { rain_intensity = 'moderate', lat = 12.99952, lon = 77.68275 } = req.query;

    const floodPointsNear = await FloodPoint.getNear(parseFloat(lat), parseFloat(lon), 2.5);

    let thresholdRain = 'moderate';
    if (rain_intensity === 'heavy' || rain_intensity === 'extreme') {
      thresholdRain = 'high';
    }

    const alerts = floodPointsNear.map(pt => {
      let risk = pt.risk_level;
      let status = 'monitoring';
      
      if (rain_intensity === 'heavy' && risk === 'High') {
        status = 'critical_risk';
      } else if (rain_intensity === 'extreme') {
        status = 'immediate_action';
      }

      return {
        id: pt.id,
        road_name: pt.road_name,
        locality: pt.locality,
        historical_risk_level: risk,
        current_status: status,
        recommended_action: status === 'immediate_action' || status === 'critical_risk'
          ? 'Deploy local water pump immediately. Setup diversions on approach roads.'
          : 'Monitor local drain level and keep police patrol active.',
        responsible_agency: pt.responsible_agency
      };
    });

    res.json({
      success: true,
      current_weather: {
        rain_intensity,
        precipitation_probability_percentage: rain_intensity === 'extreme' ? 95 : rain_intensity === 'heavy' ? 80 : 50
      },
      active_waterlogging_warnings: alerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
