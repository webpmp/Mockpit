import { ComponentInstance, ComponentType } from '../types';

export interface ReportEntry {
  componentId: string;
  componentType: ComponentType | string;
  label: string;
  statusCode?: string;
  statusMessage?: string;
  health?: string;
  extractedAt: string;
  details?: Record<string, any>;
}

export interface ServiceCenterReport {
  reportTitle: string;
  generatedAt: string;
  screenId?: string;
  totalReportedComponents: number;
  entries: ReportEntry[];
}

export type ReportExtractor = (component: ComponentInstance) => ReportEntry | null;

export const reportExtractors: Partial<Record<ComponentType, ReportExtractor>> = {
  vehicleStatusCallout: (comp: ComponentInstance): ReportEntry => {
    const props = comp.staticProps || {};
    return {
      componentId: comp.id,
      componentType: comp.type,
      label: props.label || props.title || 'Vehicle Status Callout',
      statusCode: props.statusCode || undefined,
      statusMessage: props.statusMessage || undefined,
      health: props.healthType === 'percent' 
        ? `${props.healthValue || 100}%` 
        : (props.healthType === 'rgy' ? (props.healthValue || 'green').toUpperCase() : undefined),
      extractedAt: new Date().toISOString(),
      details: {
        title: props.title,
        description: props.description,
        healthType: props.healthType || 'rgy',
        healthValue: props.healthValue || 'green',
      },
    };
  },

  tirePressure: (comp: ComponentInstance): ReportEntry => {
    const props = comp.staticProps || {};
    const fl = props.frontLeft || '35 PSI';
    const fr = props.frontRight || '35 PSI';
    const rl = props.rearLeft || '36 PSI';
    const rr = props.rearRight || '36 PSI';
    const warn = Number(props.warningThreshold) || 31;
    const crit = Number(props.criticalThreshold) || 27;

    const parsePsi = (val: string) => {
      const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 35 : num;
    };

    const psiVals = [
      { name: 'Front Left', psi: parsePsi(fl) },
      { name: 'Front Right', psi: parsePsi(fr) },
      { name: 'Rear Left', psi: parsePsi(rl) },
      { name: 'Rear Right', psi: parsePsi(rr) },
    ];

    const hasCritical = psiVals.some((t) => t.psi <= crit);
    const hasWarning = psiVals.some((t) => t.psi <= warn);
    const health = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'NORMAL';

    return {
      componentId: comp.id,
      componentType: comp.type,
      label: props.label || 'Tire Pressure Monitor',
      statusCode: hasCritical ? 'TPMS-CRIT' : hasWarning ? 'TPMS-WARN' : 'TPMS-OK',
      statusMessage: `FL: ${fl}, FR: ${fr}, RL: ${rl}, RR: ${rr}`,
      health,
      extractedAt: new Date().toISOString(),
      details: {
        frontLeft: fl,
        frontRight: fr,
        rearLeft: rl,
        rearRight: rr,
        warningThreshold: warn,
        criticalThreshold: crit,
      },
    };
  },

  battery: (comp: ComponentInstance): ReportEntry => {
    const props = comp.staticProps || {};
    return {
      componentId: comp.id,
      componentType: comp.type,
      label: props.label || 'Battery Indicator',
      statusCode: 'BATT-SYS',
      statusMessage: `Max Range: ${props.maxRange || 350} mi, Target Charge: ${props.targetChargePercent || 80}%, Rate: ${props.chargeRateKw || 350} kW`,
      health: 'NORMAL',
      extractedAt: new Date().toISOString(),
      details: {
        maxRange: props.maxRange || 350,
        targetChargePercent: props.targetChargePercent || 80,
        chargeRateKw: props.chargeRateKw || 350,
      },
    };
  },

  warning: (comp: ComponentInstance): ReportEntry => {
    const props = comp.staticProps || {};
    return {
      componentId: comp.id,
      componentType: comp.type,
      label: props.label || 'Warning Alert Overlay',
      statusCode: props.severity ? `ALERT-${props.severity.toUpperCase()}` : 'ALERT-WARN',
      statusMessage: props.message || 'Warning event detected',
      health: (props.severity || 'warning').toUpperCase(),
      extractedAt: new Date().toISOString(),
      details: {
        message: props.message,
        severity: props.severity,
        icon: props.icon,
      },
    };
  },
};

/**
 * Extracts data from components on the current active screen using registered extractors.
 */
export function extractScreenReport(
  components: ComponentInstance[],
  reportTitle: string = 'Vehicle Diagnostic Report',
  screenId?: string
): ServiceCenterReport {
  const entries: ReportEntry[] = [];

  components.forEach((comp) => {
    const extractor = reportExtractors[comp.type];
    if (extractor) {
      const entry = extractor(comp);
      if (entry) {
        entries.push(entry);
      }
    }
  });

  return {
    reportTitle,
    generatedAt: new Date().toISOString(),
    screenId,
    totalReportedComponents: entries.length,
    entries,
  };
}
