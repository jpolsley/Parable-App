import React from 'react';
import { Part, PrintScope, Section, Series, SeriesColor, Service } from '../../types';
import { PART_TYPES } from '../../lib/partTypes';
import { aggregateSupplies, supplyTotal } from '../../lib/supplies';
import { buildSchedule, formatClock, formatDate, formatDuration, sectionMinutes, serviceMinutes, visibleParts } from '../../lib/time';
import { weeksOf } from '../../lib/series';
import { cueSegments, listItems, looksLikeList, paragraphs } from '../../lib/text';
import { qrPath } from '../../lib/qr';
import { useStore } from '../../store/StoreContext';
import { partReady } from '../../lib/readiness';
import './print.css';

const PALETTE: Record<SeriesColor, [string, string, string, string]> = {
  // base, deep, soft, line
  indigo: ['#4F46E5', '#1E1B4B', '#EEF2FF', '#C7D2FE'],
  sky: ['#0284C7', '#082F49', '#E0F2FE', '#BAE6FD'],
  emerald: ['#059669', '#022C22', '#D1FAE5', '#A7F3D0'],
  amber: ['#D97706', '#451A03', '#FEF3C7', '#FDE68A'],
  rose: ['#E11D48', '#4C0519', '#FFE4E6', '#FECDD3'],
  violet: ['#7C3AED', '#2E1065', '#EDE9FE', '#DDD6FE'],
  slate: ['#475569', '#0F172A', '#F1F5F9', '#CBD5E1'],
};

const vars = (color: SeriesColor = 'indigo') => {
  const [c, deep, soft, line] = PALETTE[color];
  return { '--c': c, '--c-deep': deep, '--c-soft': soft, '--c-line': line } as React.CSSProperties;
};

const cssString = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;

// Page size, margins, and a running footer ("Series · Leader guide ........ 3") in the page margin.
const PageStyle: React.FC<{ footer: string }> = ({ footer }) => (
  <style>{`
    @page {
      size: letter;
      margin: 0.6in 0.65in 0.7in;
      @bottom-left { content: ${cssString(footer)}; font: 600 7.5pt 'Inter Variable', sans-serif; color: #94A3B8; letter-spacing: 0.04em; }
      @bottom-right { content: counter(page); font: 700 8pt 'Inter Variable', sans-serif; color: #64748B; }
    }
    @page cover { margin: 0; @bottom-left { content: none; } @bottom-right { content: none; } }
  `}</style>
);

const pad2 = (n: number) => String(n).padStart(2, '0');
const clockRange = (service: Service) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(service.startTime);
  if (!m) return '';
  const start = Number(m[1]) * 60 + Number(m[2]);
  return `${formatClock(start)} – ${formatClock(start + serviceMinutes(service))}`;
};

export const PrintRoot: React.FC = () => {
  const { printJob, db } = useStore();
  if (!printJob) return null;
  const { scope } = printJob;

  if (scope.kind === 'series-book' || scope.kind === 'series' || scope.kind === 'series-takehome') {
    const series = db.series.find((s) => s.id === scope.seriesId);
    if (!series) return null;
    const weeks = weeksOf(db, series.id);
    return (
      <div className="pr-root pr" style={vars(series.color)}>
        <PageStyle footer={`${series.title} · Leader guide`} />
        {scope.kind !== 'series-takehome' && <SeriesCover series={series} weeks={weeks} />}
        {scope.kind !== 'series-takehome' && <SeriesGlance series={series} weeks={weeks} />}
        {scope.kind === 'series-book' && weeks.map((w) => <WeekGuide key={w.id} service={w} series={series} takeHome />)}
        {scope.kind === 'series-takehome' && weeks.map((w) => <TakeHome key={w.id} service={w} series={series} />)}
      </div>
    );
  }

  const service = db.services.find((s) => s.id === printJob.serviceId);
  if (!service) return null;
  const series = service.seriesId ? db.series.find((s) => s.id === service.seriesId) : undefined;
  const footer = [series?.title, series && service.week ? `Week ${service.week}` : '', service.title].filter(Boolean).join(' · ');
  return (
    <div className="pr-root pr" style={vars(series?.color)}>
      <PageStyle footer={footer} />
      <ServiceScope scope={scope} service={service} series={series} />
    </div>
  );
};

const ServiceScope: React.FC<{ scope: PrintScope; service: Service; series?: Series }> = ({ scope, service, series }) => {
  const schedule = buildSchedule(service);
  switch (scope.kind) {
    case 'guide':
      return <WeekGuide service={service} series={series} takeHome={scope.takeHome} />;
    case 'takehome':
      return <TakeHome service={service} series={series} />;
    case 'run-sheet':
      return <RunSheet service={service} series={series} schedule={schedule} />;
    case 'supplies':
      return <SupplyList service={service} series={series} />;
    case 'section': {
      const section = service.sections.find((s) => s.id === scope.sectionId);
      return section ? <><MiniHeader service={service} series={series} title={section.title} /><SectionBlock service={service} section={section} schedule={schedule} /></> : null;
    }
    case 'part': {
      const part = service.sections.find((s) => s.id === scope.sectionId)?.parts.find((p) => p.id === scope.partId);
      return part ? <><MiniHeader service={service} series={series} title={part.title} /><PartBlock service={service} part={part} time={schedule[part.id]} /></> : null;
    }
    default:
      return null;
  }
};

// ---------- Series ----------

const SeriesCover: React.FC<{ series: Series; weeks: Service[] }> = ({ series, weeks }) => (
  <section className="pr-cover">
    <span className="pr-cover-orb a" />
    <span className="pr-cover-orb b" />
    <span className="pr-cover-orb c" />
    <div className="pr-wordmark"><i /> Parable</div>
    <div className="pr-cover-num"><b>{pad2(weeks.length)}</b><span>Weeks</span></div>
    <p className="pr-eyebrow">{weeks.length}-week series · {series.audience}</p>
    <h1 className="pr-cover-title">{series.title}</h1>
    {(series.bigIdea || series.description) && <p className="pr-cover-theme pr-serif">{series.bigIdea || series.description}</p>}
    <div className="pr-cover-foot">
      <div className="pr-cover-meta">
        {weeks.length > 0 && <div><span>Dates</span><b>{formatDate(weeks[0].date)} – {formatDate(weeks[weeks.length - 1].date)}</b></div>}
        <div><span>Leader guide</span><b>{series.audience}</b></div>
      </div>
      {series.memoryVerse && <div className="pr-cover-verse pr-serif"><span>Memory verse</span>{series.memoryVerse}</div>}
    </div>
  </section>
);

const SeriesGlance: React.FC<{ series: Series; weeks: Service[] }> = ({ series, weeks }) => (
  <section className="pr-glance pr-page">
    <p className="pr-eyebrow">Series at a glance</p>
    <h1>{series.title}</h1>
    {series.description && <p className="pr-glance-intro pr-serif">{series.description}</p>}
    {(series.bigIdea || series.memoryVerse) && (
      <div className="pr-glance-cards">
        {series.bigIdea && <div className="pr-glance-card"><p className="pr-label">Theme</p><p className="pr-serif">{series.bigIdea}</p></div>}
        {series.memoryVerse && <div className="pr-glance-card"><p className="pr-label">Memory verse</p><p className="pr-serif">{series.memoryVerse}</p></div>}
      </div>
    )}
    <ol className="pr-weeks" style={{ marginTop: series.bigIdea || series.memoryVerse ? 0 : '18pt' }}>
      {weeks.map((w) => (
        <li key={w.id}>
          <span className="n">{pad2(w.week ?? 0)}</span>
          <div>
            <h3>{w.title}</h3>
            {w.bigIdea && <p className="idea pr-serif">{w.bigIdea}</p>}
          </div>
          <div className="when"><b>{formatDate(w.date)}</b>{w.scripture}</div>
        </li>
      ))}
    </ol>
  </section>
);

// ---------- One week ----------

const WeekGuide: React.FC<{ service: Service; series?: Series; takeHome?: boolean }> = ({ service, series, takeHome }) => {
  const schedule = buildSchedule(service);
  const sections = service.sections.filter((s) => !s.hidden && visibleParts(s).length > 0);
  return (
    <>
      <WeekOpener service={service} series={series} schedule={schedule} />
      <div className="pr-page">
        {sections.map((section) => <SectionBlock key={section.id} service={service} section={section} schedule={schedule} />)}
      </div>
      {takeHome && <TakeHome service={service} series={series} />}
    </>
  );
};

const WeekOpener: React.FC<{ service: Service; series?: Series; schedule: Record<string, string> }> = ({ service, series, schedule }) => {
  const supplies = aggregateSupplies(service);
  const sections = service.sections.filter((s) => !s.hidden && visibleParts(s).length > 0);
  const parts = sections.reduce((n, s) => n + visibleParts(s).length, 0);
  const shown = supplies.slice(0, 12);
  const all = sections.flatMap(visibleParts);
  const media = all.reduce((n, p) => n + p.media.filter((l) => l.url).length, 0);
  const noScript = all.filter((p) => !partReady(p)).length;
  const prep = [
    service.scripture ? `Read ${service.scripture} twice` : 'Read this week\'s passage',
    'Read every script out loud once',
    supplies.length ? `Gather ${supplies.length} supply item${supplies.length === 1 ? '' : 's'}` : '',
    media ? `Queue ${media} song${media === 1 ? '' : 's'} / video${media === 1 ? '' : 's'}` : '',
    noScript ? `Finish ${noScript} part${noScript === 1 ? '' : 's'} without content` : '',
    `Confirm ${service.groupCount} small group leader${service.groupCount === 1 ? '' : 's'}`,
  ].filter(Boolean);
  return (
    <section className="pr-opener pr-page">
      <div className="pr-opener-top">
        <span className="pr-num">{service.week ? pad2(service.week) : '✦'}</span>
        <div>
          <p className="pr-eyebrow">{series ? `${series.title} · Week ${service.week}` : `${service.audience} · Leader guide`}</p>
          <h1>{service.title}</h1>
          <p className="pr-sub">
            <b>{formatDate(service.date)}</b>
            {clockRange(service) && ` · ${clockRange(service)}`}
            {service.scripture && <> · <b>{service.scripture}</b></>}
          </p>
        </div>
      </div>

      {service.bigIdea && (
        <div className="pr-bigidea">
          <p className="pr-label">Big idea</p>
          <p className="pr-serif">{service.bigIdea}</p>
        </div>
      )}

      <div className="pr-opener-grid" style={{ marginTop: service.bigIdea ? 0 : '18pt' }}>
        <div>
          {service.keyVerse && (
            <figure className="pr-verse">
              <span className="q">“</span>
              <p className="pr-label" style={{ marginLeft: '18pt' }}>Key verse</p>
              <blockquote className="pr-serif">{service.keyVerse}</blockquote>
            </figure>
          )}
          <p className="pr-label">Run of service</p>
          <ol className="pr-timeline">
            {sections.map((s) => (
              <li key={s.id}>
                <span className="t">{schedule[s.id] ?? ''}</span>
                <div className="b">
                  <strong>{s.title}</strong><em>{sectionMinutes(s)} min</em>
                  <p>{visibleParts(s).map((p) => p.title).join(' · ')}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="pr-notes">
            <p className="pr-label">Notes</p>
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="ln" />)}
          </div>
        </div>
        <aside>
          <div className="pr-stats">
            <div className="pr-stat"><b>{formatDuration(serviceMinutes(service))}</b><span>Length</span></div>
            <div className="pr-stat"><b>{parts}</b><span>Parts</span></div>
            <div className="pr-stat"><b>{service.classSize}</b><span>Kids</span></div>
            <div className="pr-stat"><b>{service.groupCount}</b><span>Groups</span></div>
          </div>
          <p className="pr-label">Before you teach</p>
          <ul className="pr-prep">
            {prep.map((item, i) => <li key={i}><span className="pr-box" /><span>{item}</span></li>)}
          </ul>
          {shown.length > 0 && (
            <>
              <p className="pr-label">Gather</p>
              <ul className="pr-checklist">
                {shown.map((l) => (
                  <li key={l.key}><span className="pr-box" /><span>{l.name}</span><span className="qty">{fmtQty(l.total)}</span></li>
                ))}
              </ul>
              {supplies.length > shown.length && <p className="pr-more">+ {supplies.length - shown.length} more on the supply list</p>}
            </>
          )}
        </aside>
      </div>
    </section>
  );
};

const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const SectionBlock: React.FC<{ service: Service; section: Section; schedule: Record<string, string> }> = ({ service, section, schedule }) => (
  <section className={`pr-section ${section.pageBreak ? 'pr-break-after' : ''}`}>
    <header className="pr-section-head">
      <h2>{section.title}</h2>
      {schedule[section.id] && <span className="t">{schedule[section.id]}</span>}
      <span className="pr-pill">{sectionMinutes(section)} min</span>
    </header>
    {visibleParts(section).map((part) => <PartBlock key={part.id} service={service} part={part} time={schedule[part.id]} />)}
  </section>
);

const Script: React.FC<{ text: string }> = ({ text }) => (
  <div className="pr-script pr-serif">
    {paragraphs(text).map((para, i) => (
      <p key={i}>
        {cueSegments(para).map((seg, j) => (seg.cue ? <span key={j} className="pr-cue">{seg.text}</span> : <React.Fragment key={j}>{seg.text}</React.Fragment>))}
      </p>
    ))}
  </div>
);

const Steps: React.FC<{ text: string }> = ({ text }) =>
  looksLikeList(text) ? (
    <ol className="pr-steps">{listItems(text).map((item, i) => <li key={i}>{item}</li>)}</ol>
  ) : (
    <div className="pr-prose">{paragraphs(text).map((p, i) => <p key={i} style={{ whiteSpace: 'pre-line' }}>{p}</p>)}</div>
  );

const QR: React.FC<{ url: string }> = ({ url }) => {
  const qr = qrPath(url);
  if (!qr) return null;
  return (
    <svg viewBox={`-1 -1 ${qr.size + 2} ${qr.size + 2}`} shapeRendering="crispEdges" aria-hidden="true">
      <rect x={-1} y={-1} width={qr.size + 2} height={qr.size + 2} fill="white" />
      <path d={qr.d} fill="#0F172A" />
    </svg>
  );
};

const PartBlock: React.FC<{ service: Service; part: Part; time?: string }> = ({ service, part, time }) => {
  const { label, icon: Icon } = PART_TYPES[part.type];
  const links = [...part.media, ...part.resources].filter((l) => /^https?:\/\//.test(l.url));
  const supplies = part.supplies.filter((s) => s.name.trim());
  const isQuestions = part.type === 'discussion' && part.script.trim() && listItems(part.script).length > 1;
  const isVerse = part.type === 'bible-verse' && part.script.trim() && part.script.length < 400;
  return (
    <article className={`pr-part ${part.pageBreak ? 'pr-break-after' : ''}`}>
      <div className="pr-part-head">
        <h3>{part.title}</h3>
        <span className="pr-type"><Icon /> {label}</span>
        <span className="t">{time ? `${time} · ` : ''}{part.minutes} min</span>
      </div>
      {supplies.length > 0 && (
        <div className="pr-supplies">
          {supplies.map((s) => <span key={s.id}><b>{fmtQty(supplyTotal(s, service))}</b> {s.name}</span>)}
        </div>
      )}
      {part.instructions.trim() && (
        <div className="pr-block">
          <p className="pr-label">How to lead it</p>
          <Steps text={part.instructions} />
        </div>
      )}
      {part.script.trim() && (
        isQuestions ? (
          <div className="pr-block">
            <p className="pr-label">Ask</p>
            <ol className="pr-questions">
              {listItems(part.script).map((q, i) => <li key={i}><span className="n">{i + 1}</span><p className="pr-serif">{q}</p></li>)}
            </ol>
          </div>
        ) : isVerse ? (
          <div className="pr-bigverse pr-serif"><p>{part.script}</p></div>
        ) : (
          <div className="pr-block">
            <p className="pr-label">Say</p>
            <Script text={part.script} />
          </div>
        )
      )}
      {(part.inclusionTips.trim() || part.leaderNotes.trim()) && (
        <div className="pr-callouts">
          {part.inclusionTips.trim() && <div className="pr-callout inclusion"><p className="pr-label">Every kid can join</p><Steps text={part.inclusionTips} /></div>}
          {part.leaderNotes.trim() && <div className="pr-callout note"><p className="pr-label">Leader note</p><Steps text={part.leaderNotes} /></div>}
        </div>
      )}
      {links.length > 0 && (
        <div className="pr-links">
          {links.map((l) => (
            <div key={l.id} className="pr-link">
              <QR url={l.url} />
              <div><b>{l.label || 'Scan to open'}</b><span>{l.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}</span></div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

// ---------- Take-home cards ----------

const TakeHome: React.FC<{ service: Service; series?: Series }> = ({ service, series }) => {
  const parts = service.sections.filter((s) => !s.hidden).flatMap(visibleParts);
  const questions = parts.filter((p) => p.type === 'discussion' && p.script.trim()).flatMap((p) => listItems(p.script)).slice(0, 3);
  const prayer = parts.find((p) => p.type === 'prayer' && p.script.trim())?.script.trim();
  const challenge = parts.find((p) => /challenge/i.test(p.title) && p.script.trim())?.script.trim();
  const verse = service.keyVerse || series?.memoryVerse;
  const card = (
    <div className="pr-card">
      <div>
        <p className="pr-eyebrow">Take it home{series && service.week ? ` · ${series.title}, week ${service.week}` : ''}</p>
        <h2>{service.title}</h2>
        {service.bigIdea && <p className="idea pr-serif">{service.bigIdea}</p>}
        {verse && <div className="verse pr-serif"><p className="pr-label">Memory verse</p>{verse}</div>}
      </div>
      <div className="right">
        {questions.length > 0 && <div><p className="pr-label">Talk about it</p><ol>{questions.map((q, i) => <li key={i}>{q}</li>)}</ol></div>}
        {challenge && <div><p className="pr-label">Try this week</p><p className="pray">{clip(challenge, 260)}</p></div>}
        {prayer && <div><p className="pr-label">Pray together</p><p className="pray pr-serif">{clip(prayer, 260)}</p></div>}
        {!questions.length && !challenge && !prayer && (
          <div><p className="pr-label">Talk about it</p><ol><li>What was your favorite part of today?</li><li>What did you learn about God?</li><li>How can we remember this together this week?</li></ol></div>
        )}
      </div>
    </div>
  );
  return (
    <section className="pr-takehome pr-page">
      {card}
      <div className="pr-cut">Cut here</div>
      {card}
    </section>
  );
};

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, '')}…` : s);

// ---------- Compact documents ----------

const MiniHeader: React.FC<{ service: Service; series?: Series; title: string; eyebrow?: string }> = ({ service, series, title, eyebrow }) => (
  <header className="pr-mini">
    <div>
      <p className="pr-eyebrow">{eyebrow ?? (series ? `${series.title} · Week ${service.week}` : service.title)}</p>
      <h1>{title}</h1>
    </div>
    <div className="r"><b>{formatDate(service.date)}</b>{clockRange(service) || formatDuration(serviceMinutes(service))}</div>
  </header>
);

const RunSheet: React.FC<{ service: Service; series?: Series; schedule: Record<string, string> }> = ({ service, series, schedule }) => (
  <>
    <MiniHeader service={service} series={series} title={`Run sheet: ${service.title}`} />
    <table className="pr-table">
      <tbody>
        {service.sections.filter((s) => !s.hidden).map((section) => (
          <React.Fragment key={section.id}>
            <tr className="sec">
              <td className="time">{schedule[section.id]}</td>
              <td colSpan={2}>{section.title}</td>
              <td className="who">Leader</td>
              <td className="min">{sectionMinutes(section)}′</td>
            </tr>
            {visibleParts(section).map((p) => (
              <tr key={p.id}>
                <td className="time">{schedule[p.id]}</td>
                <td>{p.title}</td>
                <td style={{ color: '#64748B', width: '1.2in' }}>{PART_TYPES[p.type].label}</td>
                <td className="who"><span className="line" /></td>
                <td className="min">{p.minutes}′</td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </>
);

const SupplyList: React.FC<{ service: Service; series?: Series }> = ({ service, series }) => (
  <>
    <MiniHeader service={service} series={series} title="Supply list" eyebrow={`${service.title} · ${service.classSize} kids · ${service.groupCount} groups`} />
    <ul className="pr-checklist pr-supply-grid">
      {aggregateSupplies(service).map((l) => (
        <li key={l.key}>
          <span className="pr-box" />
          <span>{l.name}<span className="src">{l.sources.join(', ')}</span></span>
          <span className="qty">{fmtQty(l.total)}</span>
        </li>
      ))}
    </ul>
  </>
);
