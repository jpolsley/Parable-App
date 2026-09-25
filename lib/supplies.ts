import { Service, Supply } from '../types';
import { visibleParts } from './time';

export const PER_LABELS: Record<Supply['per'], string> = {
  total: 'total',
  person: 'per kid',
  group: 'per group',
};

export const supplyTotal = (s: Supply, service: Service) =>
  s.per === 'person' ? s.qty * service.classSize : s.per === 'group' ? s.qty * service.groupCount : s.qty;

export interface SupplyLine {
  key: string;
  name: string;
  total: number;
  sources: string[];
}

// One line per distinct item across all visible parts, with quantities scaled to class size.
export const aggregateSupplies = (service: Service): SupplyLine[] => {
  const lines = new Map<string, SupplyLine>();
  for (const section of service.sections) {
    for (const part of visibleParts(section)) {
      for (const s of part.supplies) {
        const name = s.name.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        const line = lines.get(key) ?? { key, name, total: 0, sources: [] };
        line.total += supplyTotal(s, service);
        if (!line.sources.includes(part.title)) line.sources.push(part.title);
        lines.set(key, line);
      }
    }
  }
  return [...lines.values()].sort((a, b) => a.name.localeCompare(b.name));
};
