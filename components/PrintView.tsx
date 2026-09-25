import React from 'react';
import { Part, Section, Service } from '../types';
import { PART_TYPES } from '../lib/partTypes';
import { aggregateSupplies, PER_LABELS, supplyTotal } from '../lib/supplies';
import { buildSchedule, formatDate, formatDuration, sectionMinutes, serviceMinutes, visibleParts } from '../lib/time';
import { useStore } from '../store/StoreContext';

// Rendered only while printing; the app shell is hidden with print:hidden.
export const PrintRoot: React.FC = () => {
  const { printJob, db } = useStore();
  const service = printJob && db.services.find((s) => s.id === printJob.serviceId);
  if (!printJob || !service) return null;
  const schedule = buildSchedule(service);
  const { scope } = printJob;

  let body: React.ReactNode;
  if (scope.kind === 'run-sheet') body = <RunSheet service={service} schedule={schedule} />;
  else if (scope.kind === 'supplies') body = <SupplyList service={service} />;
  else if (scope.kind === 'section') {
    const section = service.sections.find((s) => s.id === scope.sectionId);
    body = section && <SectionBlock service={service} section={section} schedule={schedule} />;
  } else if (scope.kind === 'part') {
    const section = service.sections.find((s) => s.id === scope.sectionId);
    const part = section?.parts.find((p) => p.id === scope.partId);
    body = part && <PartBlock service={service} part={part} time={schedule[part.id]} />;
  } else {
    body = (
      <>
        {service.sections.filter((s) => !s.hidden).map((section) => (
          <SectionBlock key={section.id} service={service} section={section} schedule={schedule} />
        ))}
        {aggregateSupplies(service).length > 0 && (
          <div className="break-before-page">
            <SupplyList service={service} />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="hidden print:block text-black bg-white text-[11pt] leading-snug">
      <header className="border-b-4 border-black pb-3 mb-5">
        <p className="text-[9pt] uppercase tracking-widest text-gray-600">
          {[service.series, service.week && `Week ${service.week}`, service.audience].filter(Boolean).join(' · ')}
        </p>
        <h1 className="font-serif text-[24pt] leading-tight">{service.title}</h1>
        <p className="text-[10pt] text-gray-700 mt-1">
          {formatDate(service.date)} · {formatDuration(serviceMinutes(service))} · {service.classSize} kids
        </p>
        {(service.bigIdea || service.keyVerse || service.scripture) && (
          <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10pt]">
            {service.bigIdea && <><b>Big idea</b><span>{service.bigIdea}</span></>}
            {service.scripture && <><b>Scripture</b><span>{service.scripture}</span></>}
            {service.keyVerse && <><b>Key verse</b><span className="italic">{service.keyVerse}</span></>}
          </div>
        )}
      </header>
      {body}
    </div>
  );
};

const SectionBlock: React.FC<{ service: Service; section: Section; schedule: Record<string, string> }> = ({ service, section, schedule }) => (
  <section className={`mb-6 ${section.pageBreak ? 'break-after-page' : ''}`}>
    <h2 className="font-serif text-[16pt] border-b-2 border-black pb-1 mb-3 flex justify-between break-after-avoid">
      <span>{section.title}</span>
      <span className="font-sans text-[10pt] font-semibold self-end">
        {schedule[section.id] && `${schedule[section.id]} · `}{formatDuration(sectionMinutes(section))}
      </span>
    </h2>
    {visibleParts(section).map((part) => <PartBlock key={part.id} service={service} part={part} time={schedule[part.id]} />)}
  </section>
);

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-2">
    <h4 className="text-[8pt] font-bold uppercase tracking-widest text-gray-600">{title}</h4>
    <div className="whitespace-pre-line">{children}</div>
  </div>
);

const PartBlock: React.FC<{ service: Service; part: Part; time?: string }> = ({ service, part, time }) => {
  const links = [...part.media, ...part.resources].filter((l) => l.url);
  return (
    <article className={`mb-4 ${part.pageBreak ? 'break-after-page' : ''}`}>
      <h3 className="font-bold text-[12pt] flex justify-between gap-4 break-after-avoid">
        <span>{part.title} <span className="font-normal text-[9pt] text-gray-600">({PART_TYPES[part.type].label})</span></span>
        <span className="font-normal text-[9pt] whitespace-nowrap">{time && `${time} · `}{part.minutes} min</span>
      </h3>
      {part.supplies.length > 0 && (
        <Block title="Supplies">
          {part.supplies.filter((s) => s.name).map((s) => `${s.name} (${supplyTotal(s, service)}${s.per !== 'total' ? `, ${s.qty} ${PER_LABELS[s.per]}` : ''})`).join(' · ')}
        </Block>
      )}
      {part.instructions && <Block title="Instructions">{part.instructions}</Block>}
      {part.script && <Block title="Script">{part.script}</Block>}
      {part.inclusionTips && <Block title="Inclusion tips">{part.inclusionTips}</Block>}
      {part.leaderNotes && <Block title="Leader notes">{part.leaderNotes}</Block>}
      {links.length > 0 && <Block title="Media & resources">{links.map((l) => `${l.label || 'Link'}: ${l.url}`).join('\n')}</Block>}
    </article>
  );
};

const RunSheet: React.FC<{ service: Service; schedule: Record<string, string> }> = ({ service, schedule }) => (
  <table className="w-full text-[10.5pt] border-collapse">
    <thead>
      <tr className="border-b-2 border-black text-left">
        <th className="py-1 w-24">Time</th><th>Part</th><th className="w-40">Type</th><th className="w-16 text-right">Min</th>
      </tr>
    </thead>
    <tbody>
      {service.sections.filter((s) => !s.hidden).map((section) => (
        <React.Fragment key={section.id}>
          <tr className="border-b border-gray-400 bg-gray-100">
            <td className="py-1 font-mono">{schedule[section.id]}</td>
            <td colSpan={2} className="font-bold">{section.title}</td>
            <td className="text-right font-bold">{sectionMinutes(section)}</td>
          </tr>
          {visibleParts(section).map((p) => (
            <tr key={p.id} className="border-b border-gray-200">
              <td className="py-1 font-mono">{schedule[p.id]}</td>
              <td className="pl-4">{p.title}</td>
              <td>{PART_TYPES[p.type].label}</td>
              <td className="text-right">{p.minutes}</td>
            </tr>
          ))}
        </React.Fragment>
      ))}
    </tbody>
  </table>
);

const SupplyList: React.FC<{ service: Service }> = ({ service }) => (
  <div>
    <h2 className="font-serif text-[16pt] border-b-2 border-black pb-1 mb-3">Supplies for {service.classSize} kids, {service.groupCount} groups</h2>
    <ul className="columns-2 gap-8 text-[10.5pt]">
      {aggregateSupplies(service).map((l) => (
        <li key={l.key} className="break-inside-avoid flex gap-2 py-0.5">
          <span className="inline-block w-3.5 h-3.5 border border-black mt-0.5 shrink-0" />
          <span><b>{Number.isInteger(l.total) ? l.total : l.total.toFixed(1)}</b> {l.name} <span className="text-gray-600 text-[9pt]">({l.sources.join(', ')})</span></span>
        </li>
      ))}
    </ul>
  </div>
);
