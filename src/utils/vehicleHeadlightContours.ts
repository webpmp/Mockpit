export interface HeadlightGeometry {
  path: string;
  bulbX: number;
  bulbY: number;
}

export interface VehicleHeadlightContour {
  left: HeadlightGeometry;
  right: HeadlightGeometry;
}

interface RawHeadlightDef {
  inner: [number, number];
  outerCtrl: [number, number];
  apex: [number, number];
  fenderCtrl: [number, number];
  trail: [number, number];
  innerCtrl: [number, number];
  bulb: [number, number];
}

interface VehicleHeadlightPreset {
  left: RawHeadlightDef;
  right: RawHeadlightDef;
}

/**
 * Per-vehicle contoured headlight definitions derived from each vehicle's
 * actual silhouette and corner curvature.
 * Coordinates are specified as [x, dy] where:
 * - x is in SVG coordinate space (center = 0, halfW = 36)
 * - dy is the distance down from the vehicle's front boundary (-halfH).
 */
export const ODV_HEADLIGHT_PRESETS: Record<string, VehicleHeadlightPreset> = {
  corvette: {
    left: {
      inner: [-17.0, 7.8],
      outerCtrl: [-20.0, 6.8],
      apex: [-22.5, 9.8],
      fenderCtrl: [-23.6, 11.8],
      trail: [-23.2, 13.5],
      innerCtrl: [-18.5, 11.5],
      bulb: [-20.5, 10.2],
    },
    right: {
      inner: [17.0, 7.8],
      outerCtrl: [20.0, 6.8],
      apex: [22.5, 9.8],
      fenderCtrl: [23.6, 11.8],
      trail: [23.2, 13.5],
      innerCtrl: [18.5, 11.5],
      bulb: [20.5, 10.2],
    },
  },
  coupe: {
    left: {
      inner: [-16.8, 8.0],
      outerCtrl: [-20.0, 7.0],
      apex: [-22.4, 10.0],
      fenderCtrl: [-23.5, 11.8],
      trail: [-23.0, 13.5],
      innerCtrl: [-18.5, 11.6],
      bulb: [-20.5, 10.3],
    },
    right: {
      inner: [16.8, 8.0],
      outerCtrl: [20.0, 7.0],
      apex: [22.4, 10.0],
      fenderCtrl: [23.5, 11.8],
      trail: [23.0, 13.5],
      innerCtrl: [18.5, 11.6],
      bulb: [20.5, 10.3],
    },
  },
  'crossover-glass': {
    left: {
      inner: [-17.5, 8.2],
      outerCtrl: [-20.5, 7.2],
      apex: [-23.0, 10.2],
      fenderCtrl: [-24.2, 12.0],
      trail: [-23.6, 13.8],
      innerCtrl: [-19.0, 11.8],
      bulb: [-21.0, 10.5],
    },
    right: {
      inner: [17.5, 8.2],
      outerCtrl: [20.5, 7.2],
      apex: [23.0, 10.2],
      fenderCtrl: [24.2, 12.0],
      trail: [23.6, 13.8],
      innerCtrl: [19.0, 11.8],
      bulb: [21.0, 10.5],
    },
  },
  crossover: {
    left: {
      inner: [-17.5, 8.2],
      outerCtrl: [-20.5, 7.2],
      apex: [-23.0, 10.2],
      fenderCtrl: [-24.2, 12.0],
      trail: [-23.6, 13.8],
      innerCtrl: [-19.0, 11.8],
      bulb: [-21.0, 10.5],
    },
    right: {
      inner: [17.5, 8.2],
      outerCtrl: [20.5, 7.2],
      apex: [23.0, 10.2],
      fenderCtrl: [24.2, 12.0],
      trail: [23.6, 13.8],
      innerCtrl: [19.0, 11.8],
      bulb: [21.0, 10.5],
    },
  },
  cybercab: {
    left: {
      inner: [-17.5, 8.5],
      outerCtrl: [-21.0, 7.5],
      apex: [-23.8, 10.5],
      fenderCtrl: [-25.2, 12.2],
      trail: [-24.6, 14.0],
      innerCtrl: [-19.2, 12.0],
      bulb: [-21.5, 10.8],
    },
    right: {
      inner: [17.5, 8.5],
      outerCtrl: [20.5, 7.5],
      apex: [22.8, 10.5],
      fenderCtrl: [24.0, 12.2],
      trail: [23.5, 14.0],
      innerCtrl: [19.0, 12.0],
      bulb: [21.0, 10.8],
    },
  },
  modely: {
    left: {
      inner: [-16.8, 8.0],
      outerCtrl: [-20.0, 7.0],
      apex: [-22.5, 10.0],
      fenderCtrl: [-23.6, 11.8],
      trail: [-23.0, 13.5],
      innerCtrl: [-18.5, 11.5],
      bulb: [-20.5, 10.2],
    },
    right: {
      inner: [15.5, 8.0],
      outerCtrl: [17.5, 7.0],
      apex: [19.8, 10.0],
      fenderCtrl: [20.8, 11.8],
      trail: [20.2, 13.5],
      innerCtrl: [16.8, 11.5],
      bulb: [18.5, 10.2],
    },
  },
  roadster: {
    left: {
      inner: [-16.5, 8.0],
      outerCtrl: [-19.5, 7.0],
      apex: [-22.0, 10.0],
      fenderCtrl: [-23.2, 11.8],
      trail: [-22.8, 13.5],
      innerCtrl: [-18.2, 11.5],
      bulb: [-20.2, 10.2],
    },
    right: {
      inner: [16.5, 8.0],
      outerCtrl: [19.5, 7.0],
      apex: [22.0, 10.0],
      fenderCtrl: [23.2, 11.8],
      trail: [22.8, 13.5],
      innerCtrl: [18.2, 11.5],
      bulb: [20.2, 10.2],
    },
  },
  sedan: {
    left: {
      inner: [-17.2, 8.2],
      outerCtrl: [-20.5, 7.2],
      apex: [-23.0, 10.2],
      fenderCtrl: [-24.0, 12.0],
      trail: [-23.5, 13.8],
      innerCtrl: [-18.8, 11.8],
      bulb: [-21.0, 10.5],
    },
    right: {
      inner: [17.2, 8.2],
      outerCtrl: [20.5, 7.2],
      apex: [23.0, 10.2],
      fenderCtrl: [24.0, 12.0],
      trail: [23.5, 13.8],
      innerCtrl: [18.8, 11.8],
      bulb: [21.0, 10.5],
    },
  },
  semi: {
    left: {
      inner: [-15.8, 8.2],
      outerCtrl: [-18.8, 7.2],
      apex: [-21.0, 10.2],
      fenderCtrl: [-22.0, 12.0],
      trail: [-21.5, 13.5],
      innerCtrl: [-17.5, 11.6],
      bulb: [-19.2, 10.4],
    },
    right: {
      inner: [15.8, 8.2],
      outerCtrl: [18.8, 7.2],
      apex: [21.0, 10.2],
      fenderCtrl: [22.0, 12.0],
      trail: [21.5, 13.5],
      innerCtrl: [17.5, 11.6],
      bulb: [19.2, 10.4],
    },
  },
  sportswagon: {
    left: {
      inner: [-17.2, 8.2],
      outerCtrl: [-20.5, 7.2],
      apex: [-23.0, 10.2],
      fenderCtrl: [-24.0, 12.0],
      trail: [-23.5, 13.8],
      innerCtrl: [-18.8, 11.8],
      bulb: [-21.0, 10.5],
    },
    right: {
      inner: [17.2, 8.2],
      outerCtrl: [20.5, 7.2],
      apex: [23.0, 10.2],
      fenderCtrl: [24.0, 12.0],
      trail: [23.5, 13.8],
      innerCtrl: [18.8, 11.8],
      bulb: [21.0, 10.5],
    },
  },
  spyder: {
    left: {
      inner: [-16.8, 8.0],
      outerCtrl: [-20.0, 7.0],
      apex: [-22.5, 10.0],
      fenderCtrl: [-23.6, 11.8],
      trail: [-23.0, 13.5],
      innerCtrl: [-18.5, 11.5],
      bulb: [-20.5, 10.2],
    },
    right: {
      inner: [16.8, 8.0],
      outerCtrl: [20.0, 7.0],
      apex: [22.5, 10.0],
      fenderCtrl: [23.6, 11.8],
      trail: [23.0, 13.5],
      innerCtrl: [18.5, 11.5],
      bulb: [20.5, 10.2],
    },
  },
  'suv-blue': {
    left: {
      inner: [-17.2, 8.2],
      outerCtrl: [-20.5, 7.2],
      apex: [-23.0, 10.2],
      fenderCtrl: [-24.0, 12.0],
      trail: [-23.5, 13.8],
      innerCtrl: [-18.8, 11.8],
      bulb: [-21.0, 10.5],
    },
    right: {
      inner: [17.2, 8.2],
      outerCtrl: [20.5, 7.2],
      apex: [23.0, 10.2],
      fenderCtrl: [24.0, 12.0],
      trail: [23.5, 13.8],
      innerCtrl: [18.8, 11.8],
      bulb: [21.0, 10.5],
    },
  },
  suv: {
    left: {
      inner: [-17.2, 8.2],
      outerCtrl: [-20.5, 7.2],
      apex: [-23.0, 10.2],
      fenderCtrl: [-24.0, 12.0],
      trail: [-23.5, 13.8],
      innerCtrl: [-18.8, 11.8],
      bulb: [-21.0, 10.5],
    },
    right: {
      inner: [17.2, 8.2],
      outerCtrl: [20.5, 7.2],
      apex: [23.0, 10.2],
      fenderCtrl: [24.0, 12.0],
      trail: [23.5, 13.8],
      innerCtrl: [18.8, 11.8],
      bulb: [21.0, 10.5],
    },
  },
  truck: {
    left: {
      inner: [-17.2, 8.2],
      outerCtrl: [-20.5, 7.2],
      apex: [-22.8, 10.2],
      fenderCtrl: [-23.8, 12.0],
      trail: [-23.2, 13.8],
      innerCtrl: [-18.6, 11.8],
      bulb: [-20.8, 10.5],
    },
    right: {
      inner: [17.2, 8.2],
      outerCtrl: [20.5, 7.2],
      apex: [22.8, 10.2],
      fenderCtrl: [23.8, 12.0],
      trail: [23.2, 13.8],
      innerCtrl: [18.6, 11.8],
      bulb: [20.8, 10.5],
    },
  },
};

function buildCurvedPath(def: RawHeadlightDef, halfH: number): string {
  const [inX, inDy] = def.inner;
  const [outCtrlX, outCtrlDy] = def.outerCtrl;
  const [apX, apDy] = def.apex;
  const [fenCtrlX, fenCtrlDy] = def.fenderCtrl;
  const [trX, trDy] = def.trail;
  const [inCtrlX, inCtrlDy] = def.innerCtrl;

  const y0 = (-halfH + inDy).toFixed(2);
  const outCtrlY = (-halfH + outCtrlDy).toFixed(2);
  const apY = (-halfH + apDy).toFixed(2);
  const fenCtrlY = (-halfH + fenCtrlDy).toFixed(2);
  const trY = (-halfH + trDy).toFixed(2);
  const inCtrlY = (-halfH + inCtrlDy).toFixed(2);

  return `M ${inX},${y0} Q ${outCtrlX},${outCtrlY} ${apX},${apY} Q ${fenCtrlX},${fenCtrlY} ${trX},${trY} Q ${inCtrlX},${inCtrlY} ${inX},${y0} Z`;
}

/**
 * Resolves the curved, vehicle-contour-following headlight geometry
 * for any ODV vehicle model.
 *
 * @param vehicleId - The ID of the ODV vehicle model (e.g. 'spyder', 'modely', 'truck')
 * @param halfW - Half-width of the rendered vehicle (default 36)
 * @param halfH - Half-height of the rendered vehicle (default ~70.6)
 */
export function getVehicleHeadlightContour(
  vehicleId?: string | null,
  halfW: number = 36,
  halfH: number = 70.6
): VehicleHeadlightContour {
  const cleanId = (vehicleId || 'spyder')
    .split('/')
    .pop()!
    .replace(/\.png$/i, '')
    .replace(/^odv-/i, '')
    .toLowerCase();

  const preset = ODV_HEADLIGHT_PRESETS[cleanId] || ODV_HEADLIGHT_PRESETS.spyder;

  return {
    left: {
      path: buildCurvedPath(preset.left, halfH),
      bulbX: preset.left.bulb[0],
      bulbY: -halfH + preset.left.bulb[1],
    },
    right: {
      path: buildCurvedPath(preset.right, halfH),
      bulbX: preset.right.bulb[0],
      bulbY: -halfH + preset.right.bulb[1],
    },
  };
}
