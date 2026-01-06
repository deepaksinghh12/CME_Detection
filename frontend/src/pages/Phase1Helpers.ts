/**
 * Helper functions for Phase1 - Dynamic parameter info and effects
 */

export interface ParameterData {
  name: string;
  fullForm: string;
  value: number | null;
  unit: string;
  range: { min: number; max: number };
  average: number;
  limit: { normal: number; warning: number; danger: number };
  definition: string;
  detailedInfo: string;
  graphData: Array<{ time: string; value: number }>;
  effects: string[];
  causes: string[];
  safe: string[];
  notSafe: string[];
  alerts: Array<{ level: string; message: string }>;
  color: string;
  animationType: 'wind' | 'geomagnetic' | 'particle' | 'field' | 'image';
  lon?: number;
  lat?: number;
  bz?: number;
  bt?: number;
  bx?: number;
  by?: number;
  kp?: number;
  dst?: number;
  density?: number;
  temperature?: number;
  imageType?: 'lasco' | 'suvi' | 'flare';
}

export interface DynamicParameterInfo {
  effects: string[];
  safe: string[];
  notSafe: string[];
  status: 'safe' | 'warning' | 'danger';
  statusMessage: string;
  scientificDetails: string[];
}

/**
 * Get dynamic parameter info based on CURRENT VALUE
 * This provides scientist-grade detailed analysis
 */
export const getDynamicParameterInfo = (param: ParameterData): DynamicParameterInfo => {
  const value = param.value;
  if (value === null || value === undefined) {
    return {
      effects: ['No current data available'],
      safe: ['Waiting for data acquisition...'],
      notSafe: [],
      status: 'safe',
      statusMessage: 'No data',
      scientificDetails: ['Data acquisition in progress']
    };
  }

  // Kp Index - Detailed analysis
  if (param.name === 'Kp Index') {
    const kp = value;
    if (kp >= 7) {
      return {
        effects: [
          `Kp ${kp.toFixed(1)}: SEVERE geomagnetic storm (G3-G5)`,
          'Major power grid disruptions possible - voltage fluctuations up to ±10%',
          'Satellite operations at high risk - increased drag, orientation issues',
          'GPS accuracy severely degraded - errors up to 50 meters',
          'Aurora visible at very low latitudes (30-40°)',
          'Radio communications heavily affected - HF blackouts possible',
          'Spacecraft charging issues likely - increased risk of anomalies',
          'Ionospheric disturbances - TEC variations up to 30%'
        ],
        safe: [],
        notSafe: [
          `Kp ${kp.toFixed(1)}: CRITICAL - Immediate action required`,
          'Power grid operators: Implement voltage regulation protocols',
          'Satellite operators: Prepare for anomalies, activate safe mode if needed',
          'Aviation: High-frequency radio disruptions expected, backup navigation required',
          'Space missions: Increased radiation exposure, mission-critical operations paused',
          'Communication systems: Switch to backup frequencies, expect delays'
        ],
        status: 'danger',
        statusMessage: `SEVERE STORM - Kp ${kp.toFixed(1)} (G${Math.min(5, Math.floor(kp / 1.5))} level)`,
        scientificDetails: [
          `Planetary K-index: ${kp.toFixed(1)} (scale 0-9)`,
          `Equivalent to G${Math.min(5, Math.floor(kp / 1.5))} geomagnetic storm`,
          `Estimated ring current intensity: ${(Math.abs(kp - 2) * 15).toFixed(0)} nT`,
          `Magnetosphere compression: ${((kp / 9) * 100).toFixed(0)}%`,
          `Particle flux enhancement: ${((kp / 9) * 200).toFixed(0)}% above background`
        ]
      };
    } else if (kp >= 6) {
      return {
        effects: [
          `Kp ${kp.toFixed(1)}: Strong geomagnetic storm (G2)`,
          'Power grid voltage fluctuations (±5%)',
          'Satellite orientation issues possible',
          'GPS accuracy degraded (errors 10-30 meters)',
          'Aurora visible at mid-latitudes (40-50°)',
          'Radio communications affected'
        ],
        safe: [],
        notSafe: [
          `Kp ${kp.toFixed(1)}: Monitor all critical systems`,
          'Power grid: Voltage regulation required',
          'Satellite: Increased monitoring needed'
        ],
        status: 'danger',
        statusMessage: `STRONG STORM - Kp ${kp.toFixed(1)}`,
        scientificDetails: [
          `Planetary K-index: ${kp.toFixed(1)}`,
          `Ring current enhancement: Moderate`,
          `Magnetosphere compression: ${((kp / 9) * 80).toFixed(0)}%`
        ]
      };
    } else if (kp >= 5) {
      return {
        effects: [
          `Kp ${kp.toFixed(1)}: Moderate geomagnetic storm (G1)`,
          'Minor satellite impacts possible',
          'Aurora visible at high latitudes',
          'Slight radio interference'
        ],
        safe: [],
        notSafe: [
          `Kp ${kp.toFixed(1)}: Monitor satellite operations`,
          'Minor precautions recommended'
        ],
        status: 'warning',
        statusMessage: `MODERATE STORM - Kp ${kp.toFixed(1)}`,
        scientificDetails: [
          `Planetary K-index: ${kp.toFixed(1)}`,
          `Minor geomagnetic activity`
        ]
      };
    } else if (kp >= 4) {
      return {
        effects: [
          `Kp ${kp.toFixed(1)}: Minor geomagnetic activity`,
          'Aurora at very high latitudes',
          'Minimal impacts expected'
        ],
        safe: [
          `Kp ${kp.toFixed(1)}: Near normal conditions`,
          'All systems operational',
          'No special precautions needed'
        ],
        notSafe: [],
        status: 'safe',
        statusMessage: `MINOR ACTIVITY - Kp ${kp.toFixed(1)}`,
        scientificDetails: [
          `Planetary K-index: ${kp.toFixed(1)}`,
          `Quiet to unsettled conditions`
        ]
      };
    } else {
      return {
        effects: [
          `Kp ${kp.toFixed(1)}: Quiet geomagnetic conditions`,
          'No significant space weather impacts',
          'Normal operations'
        ],
        safe: [
          `Kp ${kp.toFixed(1)}: Excellent conditions`,
          'All systems normal',
          'No precautions needed'
        ],
        notSafe: [],
        status: 'safe',
        statusMessage: `QUIET - Kp ${kp.toFixed(1)}`,
        scientificDetails: [
          `Planetary K-index: ${kp.toFixed(1)}`,
          `Very quiet geomagnetic conditions`
        ]
      };
    }
  }

  // DST Index - Detailed analysis
  if (param.name === 'DST Index') {
    const dst = value;
    if (dst <= -200) {
      return {
        effects: [
          `Dst ${dst.toFixed(1)} nT: EXTREME geomagnetic storm`,
          'Widespread power outages possible - transformer failures risk',
          'Satellite failures likely - severe charging and drag effects',
          'GPS completely unreliable - errors >100 meters',
          'Radio blackouts across multiple bands',
          'Aurora visible at equator',
          'Critical infrastructure at severe risk',
          'Ionospheric storms - TEC variations >50%'
        ],
        safe: [],
        notSafe: [
          `Dst ${dst.toFixed(1)} nT: EXTREME EMERGENCY`,
          'Power grid: Emergency protocols activated',
          'Satellites: High risk of failure',
          'Aviation: Navigation systems compromised',
          'Space missions: Critical radiation exposure'
        ],
        status: 'danger',
        statusMessage: `EXTREME STORM - Dst ${dst.toFixed(1)} nT`,
        scientificDetails: [
          `Disturbance Storm Time: ${dst.toFixed(1)} nT`,
          `Ring current intensity: ${Math.abs(dst).toFixed(0)} nT`,
          `Equivalent to Carrington-level event`,
          `Magnetosphere compression: Extreme`
        ]
      };
    } else if (dst <= -100) {
      return {
        effects: [
          `Dst ${dst.toFixed(1)} nT: Severe geomagnetic storm`,
          'Severe power grid disruptions',
          'Satellite anomalies likely',
          'GPS accuracy severely degraded',
          'Radio blackouts possible',
          'Aurora at very low latitudes (20-30°)'
        ],
        safe: [],
        notSafe: [
          `Dst ${dst.toFixed(1)} nT: CRITICAL - Major impacts expected`,
          'Power systems: Voltage regulation critical',
          'Satellites: Anomaly monitoring required',
          'GPS: Backup navigation systems recommended'
        ],
        status: 'danger',
        statusMessage: `SEVERE STORM - Dst ${dst.toFixed(1)} nT`,
        scientificDetails: [
          `Disturbance Storm Time: ${dst.toFixed(1)} nT`,
          `Ring current intensity: ${Math.abs(dst).toFixed(0)} nT`,
          `G4-G5 level storm`
        ]
      };
    } else if (dst <= -50) {
      return {
        effects: [
          `Dst ${dst.toFixed(1)} nT: Moderate geomagnetic storm`,
          'Power grid voltage fluctuations',
          'Satellite orientation issues',
          'Aurora visible at lower latitudes (40-50°)',
          'Radio communication problems'
        ],
        safe: [],
        notSafe: [
          `Dst ${dst.toFixed(1)} nT: Monitor power systems`,
          'Satellite operators: Increased vigilance',
          'GPS: Expect accuracy degradation'
        ],
        status: 'warning',
        statusMessage: `MODERATE STORM - Dst ${dst.toFixed(1)} nT`,
        scientificDetails: [
          `Disturbance Storm Time: ${dst.toFixed(1)} nT`,
          `Ring current enhancement: Moderate`
        ]
      };
    } else if (dst <= -30) {
      return {
        effects: [
          `Dst ${dst.toFixed(1)} nT: Minor geomagnetic activity`,
          'Minor power grid effects',
          'Aurora at high latitudes'
        ],
        safe: [
          `Dst ${dst.toFixed(1)} nT: Near normal conditions`,
          'Minimal impacts expected'
        ],
        notSafe: [],
        status: 'safe',
        statusMessage: `MINOR ACTIVITY - Dst ${dst.toFixed(1)} nT`,
        scientificDetails: [
          `Disturbance Storm Time: ${dst.toFixed(1)} nT`,
          `Minor ring current enhancement`
        ]
      };
    } else {
      return {
        effects: [
          `Dst ${dst.toFixed(1)} nT: Quiet geomagnetic conditions`,
          'No significant impacts',
          'Stable magnetosphere'
        ],
        safe: [
          `Dst ${dst.toFixed(1)} nT: Excellent conditions`,
          'All systems normal',
          'No precautions needed'
        ],
        notSafe: [],
        status: 'safe',
        statusMessage: `QUIET - Dst ${dst.toFixed(1)} nT`,
        scientificDetails: [
          `Disturbance Storm Time: ${dst.toFixed(1)} nT`,
          `Quiet ring current conditions`
        ]
      };
    }
  }

  // Solar Wind Speed - Detailed analysis
  if (param.name === 'Solar Wind Speed') {
    const speed = value;
    if (speed >= 900) {
      return {
        effects: [
          `Speed ${speed.toFixed(0)} km/s: EXTREME high-speed stream`,
          'Very strong magnetosphere compression',
          'Major geomagnetic storm likely if Bz turns south',
          'Enhanced aurora activity',
          'Significant satellite drag increase',
          'CME-driven shock likely',
          'Dynamic pressure: ~15-20 nPa'
        ],
        safe: [],
        notSafe: [
          `Speed ${speed.toFixed(0)} km/s: EXTREME conditions`,
          'Monitor Bz component closely',
          'Prepare for potential major storm',
          'Satellite drag: Orbit adjustments may be needed'
        ],
        status: 'danger',
        statusMessage: `EXTREME SPEED - ${speed.toFixed(0)} km/s`,
        scientificDetails: [
          `Solar wind speed: ${speed.toFixed(0)} km/s`,
          `Dynamic pressure: ${((speed / 400) ** 2 * 2).toFixed(1)} nPa`,
          `Mach number: ${(speed / 50).toFixed(1)}`,
          `CME-driven flow likely`
        ]
      };
    } else if (speed >= 700) {
      return {
        effects: [
          `Speed ${speed.toFixed(0)} km/s: High-speed stream`,
          'Strong magnetosphere compression',
          'Enhanced geomagnetic storm potential',
          'Increased aurora activity',
          'Satellite drag increase'
        ],
        safe: [],
        notSafe: [
          `Speed ${speed.toFixed(0)} km/s: Monitor geomagnetic activity`,
          'Check Bz component - if southward, storm likely',
          'Satellite operators: Monitor drag'
        ],
        status: 'warning',
        statusMessage: `HIGH SPEED - ${speed.toFixed(0)} km/s`,
        scientificDetails: [
          `Solar wind speed: ${speed.toFixed(0)} km/s`,
          `High-speed stream from coronal hole`
        ]
      };
    } else if (speed >= 600) {
      return {
        effects: [
          `Speed ${speed.toFixed(0)} km/s: Elevated solar wind`,
          'Moderate magnetosphere compression',
          'Increased geomagnetic activity possible',
          'Aurora more visible'
        ],
        safe: [
          `Speed ${speed.toFixed(0)} km/s: Elevated but manageable`,
          'Monitor Bz for storm potential'
        ],
        notSafe: [],
        status: 'warning',
        statusMessage: `ELEVATED - ${speed.toFixed(0)} km/s`,
        scientificDetails: [
          `Solar wind speed: ${speed.toFixed(0)} km/s`,
          `Elevated flow`
        ]
      };
    } else if (speed >= 400) {
      return {
        effects: [
          `Speed ${speed.toFixed(0)} km/s: Normal solar wind`,
          'Stable magnetosphere',
          'Normal space weather conditions'
        ],
        safe: [
          `Speed ${speed.toFixed(0)} km/s: Normal conditions`,
          'No special precautions',
          'All systems operational'
        ],
        notSafe: [],
        status: 'safe',
        statusMessage: `NORMAL - ${speed.toFixed(0)} km/s`,
        scientificDetails: [
          `Solar wind speed: ${speed.toFixed(0)} km/s`,
          `Typical solar wind flow`
        ]
      };
    } else {
      return {
        effects: [
          `Speed ${speed.toFixed(0)} km/s: Slow solar wind`,
          'Quiet space weather',
          'Minimal geomagnetic activity'
        ],
        safe: [
          `Speed ${speed.toFixed(0)} km/s: Quiet conditions`,
          'Excellent space weather',
          'No concerns'
        ],
        notSafe: [],
        status: 'safe',
        statusMessage: `SLOW - ${speed.toFixed(0)} km/s`,
        scientificDetails: [
          `Solar wind speed: ${speed.toFixed(0)} km/s`,
          `Slow solar wind flow`
        ]
      };
    }
  }

  // Bz Component - Detailed analysis
  if (param.name === 'Bz Component') {
    const bz = value;
    if (bz <= -15) {
      return {
        effects: [
          `Bz ${bz.toFixed(1)} nT: STRONG southward field`,
          'Major geomagnetic storm VERY LIKELY',
          'Aurora at very low latitudes',
          'Power grid impacts possible',
          'Satellite charging issues',
          'Maximum energy transfer to magnetosphere',
          'Reconnection rate: High'
        ],
        safe: [],
        notSafe: [
          `Bz ${bz.toFixed(1)} nT: CRITICAL - Major storm imminent`,
          'Power grid: Prepare for voltage fluctuations',
          'Satellites: High risk of anomalies',
          'If combined with high speed: Extreme storm possible'
        ],
        status: 'danger',
        statusMessage: `STRONG SOUTHWARD - ${bz.toFixed(1)} nT`,
        scientificDetails: [
          `Bz GSM component: ${bz.toFixed(1)} nT`,
          `Strong southward orientation`,
          `Enhanced reconnection rate`,
          `Energy coupling efficiency: ${(-bz / 15 * 100).toFixed(0)}%`
        ]
      };
    } else if (bz <= -10) {
      return {
        effects: [
          `Bz ${bz.toFixed(1)} nT: Southward field`,
          'Moderate geomagnetic storm likely',
          'Aurora enhancement',
          'Radio communication issues',
          'Energy transfer to magnetosphere active'
        ],
        safe: [],
        notSafe: [
          `Bz ${bz.toFixed(1)} nT: Monitor closely`,
          'Storm development possible',
          'Check speed and density for storm intensity'
        ],
        status: 'warning',
        statusMessage: `SOUTHWARD - ${bz.toFixed(1)} nT`,
        scientificDetails: [
          `Bz GSM component: ${bz.toFixed(1)} nT`,
          `Southward orientation`,
          `Moderate reconnection`
        ]
      };
    } else if (bz <= -5) {
      return {
        effects: [
          `Bz ${bz.toFixed(1)} nT: Slight southward`,
          'Minor geomagnetic activity possible',
          'Aurora at high latitudes'
        ],
        safe: [
          `Bz ${bz.toFixed(1)} nT: Minor activity`,
          'Monitor but no immediate concerns'
        ],
        notSafe: [],
        status: 'safe',
        statusMessage: `SLIGHT SOUTHWARD - ${bz.toFixed(1)} nT`,
        scientificDetails: [
          `Bz GSM component: ${bz.toFixed(1)} nT`,
          `Slight southward tilt`
        ]
      };
    } else if (bz >= 5) {
      return {
        effects: [
          `Bz ${bz.toFixed(1)} nT: Northward field`,
          'Magnetosphere protected',
          'No energy transfer',
          'Stable conditions',
          'Aurora suppressed'
        ],
        safe: [
          `Bz ${bz.toFixed(1)} nT: Excellent conditions`,
          'Magnetosphere well protected',
          'No storm risk',
          'All systems safe'
        ],
        notSafe: [],
        status: 'safe',
        statusMessage: `NORTHWARD - ${bz.toFixed(1)} nT`,
        scientificDetails: [
          `Bz GSM component: ${bz.toFixed(1)} nT`,
          `Northward orientation`,
          `Magnetosphere shielded`
        ]
      };
    } else {
      return {
        effects: [
          `Bz ${bz.toFixed(1)} nT: Neutral field`,
          'Normal conditions',
          'Stable magnetosphere'
        ],
        safe: [
          `Bz ${bz.toFixed(1)} nT: Normal`,
          'No special precautions',
          'Stable conditions'
        ],
        notSafe: [],
        status: 'safe',
        statusMessage: `NEUTRAL - ${bz.toFixed(1)} nT`,
        scientificDetails: [
          `Bz GSM component: ${bz.toFixed(1)} nT`,
          `Neutral orientation`
        ]
      };
    }
  }

  // Bx Component - Detailed analysis
  if (param.name === 'Bx Component') {
    const bx = value;
    const absBx = Math.abs(bx);
    if (absBx >= 15) {
      return {
        effects: [
          `Bx ${bx.toFixed(1)} nT: Strong horizontal field component`,
          'Unusual magnetic field orientation',
          'May indicate CME structure or compressed region',
          'Can affect magnetosphere interaction angle'
        ],
        safe: [],
        notSafe: [
          `Bx ${bx.toFixed(1)} nT: Monitor for CME signatures`,
          'Unusual field orientation detected',
          'Check Bz and By components for complete picture'
        ],
        status: 'warning',
        statusMessage: `STRONG BX - ${bx.toFixed(1)} nT`,
        scientificDetails: [
          `Bx GSM component: ${bx.toFixed(1)} nT`,
          `Absolute value: ${absBx.toFixed(1)} nT`,
          'Horizontal field component in GSM coordinates',
          'Works with By and Bz to determine field structure'
        ]
      };
    }
    return {
      effects: ['Normal horizontal field', 'Typical orientation'],
      safe: ['Normal Bx values', 'Stable field'],
      notSafe: [],
      status: 'safe',
      statusMessage: `Normal - ${bx.toFixed(1)} nT`,
      scientificDetails: [
        `Bx GSM component: ${bx.toFixed(1)} nT`,
        'Normal horizontal field orientation',
        'Part of 3D magnetic field vector'
      ]
    };
  }

  // By Component - Detailed analysis
  if (param.name === 'By Component') {
    const by = value;
    const absBy = Math.abs(by);
    if (absBy >= 15) {
      return {
        effects: [
          `By ${by.toFixed(1)} nT: Strong vertical field component`,
          'Unusual magnetic field structure',
          'May indicate twisted CME field',
          'Can affect reconnection geometry'
        ],
        safe: [],
        notSafe: [
          `By ${by.toFixed(1)} nT: Monitor for CME signatures`,
          'Unusual field structure detected',
          'Check Bz component for storm potential'
        ],
        status: 'warning',
        statusMessage: `STRONG BY - ${by.toFixed(1)} nT`,
        scientificDetails: [
          `By GSM component: ${by.toFixed(1)} nT`,
          `Absolute value: ${absBy.toFixed(1)} nT`,
          'Vertical field component in GSM coordinates',
          'Works with Bx and Bz to determine field structure'
        ]
      };
    }
    return {
      effects: ['Normal vertical field', 'Typical orientation'],
      safe: ['Normal By values', 'Stable field'],
      notSafe: [],
      status: 'safe',
      statusMessage: `Normal - ${by.toFixed(1)} nT`,
      scientificDetails: [
        `By GSM component: ${by.toFixed(1)} nT`,
        'Normal vertical field orientation',
        'Part of 3D magnetic field vector'
      ]
    };
  }

  // Wind Longitude - Detailed analysis
  if (param.name === 'Wind Longitude') {
    const lon = value;
    const absLon = Math.abs(lon);
    if (absLon >= 90) {
      return {
        effects: [
          `Longitude ${lon.toFixed(1)}°: Side impact angle`,
          'Solar wind coming from side, not directly from Sun',
          'May reduce direct impact on magnetosphere',
          'Can affect aurora location and intensity'
        ],
        safe: ['Side impact reduces direct pressure'],
        notSafe: [
          `Longitude ${lon.toFixed(1)}°: Unusual impact angle`,
          'Monitor for changes in direction',
          'May indicate CME trajectory'
        ],
        status: 'warning',
        statusMessage: `SIDE IMPACT - ${lon.toFixed(1)}°`,
        scientificDetails: [
          `Solar wind longitude: ${lon.toFixed(1)}°`,
          `Impact angle: ${absLon.toFixed(1)}° from direct`,
          '0° = direct from Sun, ±180° = opposite direction',
          'Large angles indicate side impact'
        ]
      };
    }
    return {
      effects: ['Direct solar wind flow', 'Normal impact angle'],
      safe: ['Normal direction', 'Direct flow from Sun'],
      notSafe: [],
      status: 'safe',
      statusMessage: `Direct - ${lon.toFixed(1)}°`,
      scientificDetails: [
        `Solar wind longitude: ${lon.toFixed(1)}°`,
        'Direct flow from Sun (0° = straight)',
        'Normal impact geometry'
      ]
    };
  }

  // Wind Latitude - Detailed analysis
  if (param.name === 'Wind Latitude') {
    const lat = value;
    const absLat = Math.abs(lat);
    if (absLat >= 45) {
      return {
        effects: [
          `Latitude ${lat.toFixed(1)}°: High elevation angle`,
          `Solar wind coming from ${lat > 0 ? 'north' : 'south'}`,
          'Can affect aurora location (north/south)',
          'May indicate CME trajectory from high latitude'
        ],
        safe: ['High latitude flow detected'],
        notSafe: [
          `Latitude ${lat.toFixed(1)}°: Unusual elevation`,
          'Monitor for changes in direction',
          'May affect aurora visibility'
        ],
        status: 'warning',
        statusMessage: `HIGH LAT - ${lat.toFixed(1)}°`,
        scientificDetails: [
          `Solar wind latitude: ${lat.toFixed(1)}°`,
          `Elevation: ${absLat.toFixed(1)}° from equator`,
          '0° = equatorial, +90° = north pole, -90° = south pole',
          'High latitudes indicate off-equatorial source'
        ]
      };
    }
    return {
      effects: ['Equatorial solar wind flow', 'Normal elevation'],
      safe: ['Normal latitude', 'Equatorial flow'],
      notSafe: [],
      status: 'safe',
      statusMessage: `Equatorial - ${lat.toFixed(1)}°`,
      scientificDetails: [
        `Solar wind latitude: ${lat.toFixed(1)}°`,
        'Equatorial flow (0° = solar equator)',
        'Normal elevation angle'
      ]
    };
  }

  // Ap Index - Detailed analysis
  if (param.name === 'Ap Index') {
    const ap = value;
    if (ap >= 50) {
      return {
        effects: [
          `Ap ${ap.toFixed(0)}: Very active day`,
          'Strong geomagnetic activity throughout day',
          'Multiple storm periods likely',
          'Enhanced aurora activity',
          'Possible power grid impacts'
        ],
        safe: [],
        notSafe: [
          `Ap ${ap.toFixed(0)}: Very active conditions`,
          'Monitor for power grid fluctuations',
          'Satellite operations may be affected',
          'GPS accuracy may degrade'
        ],
        status: 'danger',
        statusMessage: `VERY ACTIVE - Ap ${ap.toFixed(0)}`,
        scientificDetails: [
          `Planetary Ap index: ${ap.toFixed(0)}`,
          'Daily average of geomagnetic activity',
          'Values above 50 indicate very active day',
          `Equivalent to Kp ~${(ap / 10).toFixed(1)}`
        ]
      };
    } else if (ap >= 30) {
      return {
        effects: [
          `Ap ${ap.toFixed(0)}: Active day`,
          'Moderate geomagnetic activity',
          'Some aurora activity possible',
          'Minor satellite drag increase'
        ],
        safe: ['Normal operations generally safe'],
        notSafe: [
          `Ap ${ap.toFixed(0)}: Active conditions`,
          'Monitor satellite operations',
          'Minor GPS accuracy issues possible'
        ],
        status: 'warning',
        statusMessage: `ACTIVE - Ap ${ap.toFixed(0)}`,
        scientificDetails: [
          `Planetary Ap index: ${ap.toFixed(0)}`,
          'Daily average of geomagnetic activity',
          'Values 30-50 indicate active day',
          `Equivalent to Kp ~${(ap / 10).toFixed(1)}`
        ]
      };
    }
    return {
      effects: ['Quiet day', 'Low geomagnetic activity'],
      safe: ['Quiet conditions', 'No precautions needed'],
      notSafe: [],
      status: 'safe',
      statusMessage: `Quiet - Ap ${ap.toFixed(0)}`,
      scientificDetails: [
        `Planetary Ap index: ${ap.toFixed(0)}`,
        'Daily average of geomagnetic activity',
        'Values below 30 indicate quiet day',
        `Equivalent to Kp ~${(ap / 10).toFixed(1)}`
      ]
    };
  }

  // Kp Forecast - Detailed analysis
  if (param.name === 'Kp Forecast') {
    const kpForecast = value;
    if (kpForecast >= 7) {
      return {
        effects: [
          `Forecast Kp ${kpForecast.toFixed(1)}: Severe storm expected`,
          'Prepare for major geomagnetic activity',
          'Power grid impacts possible',
          'Satellite operations at risk',
          'GPS accuracy will degrade',
          'Aurora visible at low latitudes'
        ],
        safe: [],
        notSafe: [
          `Forecast Kp ${kpForecast.toFixed(1)}: SEVERE STORM COMING`,
          'Power grid: Prepare for voltage fluctuations',
          'Satellites: Activate safe mode if needed',
          'Aviation: Expect radio disruptions',
          'Space missions: High radiation exposure'
        ],
        status: 'danger',
        statusMessage: `SEVERE STORM FORECAST - Kp ${kpForecast.toFixed(1)}`,
        scientificDetails: [
          `Forecast Kp index: ${kpForecast.toFixed(1)}`,
          `Equivalent to G${Math.min(5, Math.floor(kpForecast / 1.5))} geomagnetic storm`,
          'Based on current solar wind conditions',
          'Forecast period: Next 3-6 hours'
        ]
      };
    } else if (kpForecast >= 5) {
      return {
        effects: [
          `Forecast Kp ${kpForecast.toFixed(1)}: Moderate storm expected`,
          'Moderate geomagnetic activity likely',
          'Some aurora activity possible',
          'Minor satellite drag increase'
        ],
        safe: ['Normal operations should continue'],
        notSafe: [
          `Forecast Kp ${kpForecast.toFixed(1)}: Moderate storm coming`,
          'Monitor satellite operations',
          'GPS accuracy may slightly degrade'
        ],
        status: 'warning',
        statusMessage: `MODERATE STORM FORECAST - Kp ${kpForecast.toFixed(1)}`,
        scientificDetails: [
          `Forecast Kp index: ${kpForecast.toFixed(1)}`,
          `Equivalent to G${Math.min(3, Math.floor(kpForecast / 1.5))} geomagnetic storm`,
          'Based on current solar wind conditions',
          'Forecast period: Next 3-6 hours'
        ]
      };
    }
    return {
      effects: ['Low activity forecast', 'Quiet conditions expected'],
      safe: ['Quiet forecast', 'No precautions needed'],
      notSafe: [],
      status: 'safe',
      statusMessage: `Quiet Forecast - Kp ${kpForecast.toFixed(1)}`,
      scientificDetails: [
        `Forecast Kp index: ${kpForecast.toFixed(1)}`,
        'Low geomagnetic activity expected',
        'Based on current solar wind conditions',
        'Forecast period: Next 3-6 hours'
      ]
    };
  }

  // Solar Flares - Detailed analysis
  if (param.name === 'Solar Flares') {
    const flareCount = value;
    if (flareCount >= 10) {
      return {
        effects: [
          `${flareCount} recent flares: High solar activity`,
          'Increased radiation storm risk',
          'Radio blackouts possible',
          'CME production likely',
          'Enhanced particle flux',
          'Ionospheric disturbances'
        ],
        safe: [],
        notSafe: [
          `${flareCount} flares: HIGH ACTIVITY`,
          'Monitor for X-class flares',
          'Radio communications may be disrupted',
          'Aviation: Expect HF blackouts',
          'Space missions: Increased radiation'
        ],
        status: 'danger',
        statusMessage: `HIGH FLARE ACTIVITY - ${flareCount} events`,
        scientificDetails: [
          `Recent solar flares: ${flareCount} events`,
          'Flares classified by size: C (small), M (medium), X (large)',
          'X-class flares can cause severe radio blackouts',
          'Flares often produce CMEs'
        ]
      };
    } else if (flareCount >= 5) {
      return {
        effects: [
          `${flareCount} recent flares: Moderate activity`,
          'Some radiation storm risk',
          'Minor radio disruptions possible',
          'CME production possible'
        ],
        safe: ['Normal operations generally safe'],
        notSafe: [
          `${flareCount} flares: Monitor activity`,
          'Watch for larger flares',
          'Radio communications may be affected'
        ],
        status: 'warning',
        statusMessage: `MODERATE FLARE ACTIVITY - ${flareCount} events`,
        scientificDetails: [
          `Recent solar flares: ${flareCount} events`,
          'Moderate solar activity level',
          'Monitor for X-class flares'
        ]
      };
    }
    return {
      effects: ['Low flare activity', 'Quiet Sun'],
      safe: ['Low activity', 'No precautions needed'],
      notSafe: [],
      status: 'safe',
      statusMessage: `Low Activity - ${flareCount} events`,
      scientificDetails: [
        `Recent solar flares: ${flareCount} events`,
        'Low solar activity level',
        'Quiet Sun conditions'
      ]
    };
  }

  // LASCO C3 - Detailed analysis
  if (param.name === 'LASCO C3') {
    const imageCount = value;
    return {
      effects: [
        `${imageCount} LASCO C3 images available`,
        'Coronagraph images show Sun\'s outer atmosphere',
        'Can detect CMEs leaving the Sun',
        'Wide field of view (up to 30 solar radii)',
        'Real-time CME monitoring'
      ],
      safe: ['Images available for monitoring'],
      notSafe: imageCount === 0 ? ['No images available', 'Monitoring limited'] : [],
      status: imageCount > 0 ? 'safe' : 'warning',
      statusMessage: `${imageCount} images available`,
      scientificDetails: [
        `LASCO C3 images: ${imageCount} available`,
        'LASCO = Large Angle and Spectrometric Coronagraph',
        'Blocks bright Sun to see faint CMEs',
        'C3 has wide field of view (3.5-30 solar radii)',
        'Updated every few hours'
      ]
    };
  }

  // SUVI 094 - Detailed analysis
  if (param.name === 'SUVI 094') {
    const imageCount = value;
    return {
      effects: [
        `${imageCount} SUVI 094 images available`,
        'Extreme ultraviolet images of the Sun',
        'Shows hot plasma (6 million K)',
        'Active region monitoring',
        'Flare prediction capability'
      ],
      safe: ['Images available for monitoring'],
      notSafe: imageCount === 0 ? ['No images available', 'Monitoring limited'] : [],
      status: imageCount > 0 ? 'safe' : 'warning',
      statusMessage: `${imageCount} images available`,
      scientificDetails: [
        `SUVI 094 images: ${imageCount} available`,
        'SUVI = Solar Ultraviolet Imager',
        '94 Angstrom wavelength shows very hot plasma',
        'Temperature: ~6 million Kelvin',
        'Updated every few minutes'
      ]
    };
  }

  // Default: use existing param data with enhanced scientific details
  const status = value >= param.limit.danger ? 'danger' : value >= param.limit.warning ? 'warning' : 'safe';
  return {
    effects: param.effects,
    safe: param.safe,
    notSafe: param.notSafe,
    status,
    statusMessage: value !== null ? `Current: ${value.toFixed(param.unit === 'nT' ? 1 : param.unit === 'km/s' || param.unit === 'K' ? 0 : 2)} ${param.unit}` : 'No data',
    scientificDetails: [
      `Current value: ${value?.toFixed(2)} ${param.unit}`,
      `Range: ${param.range.min} - ${param.range.max} ${param.unit}`,
      `Average: ${param.average.toFixed(2)} ${param.unit}`,
      `Status: ${status.toUpperCase()}`
    ]
  };
};

