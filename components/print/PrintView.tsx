import React from 'react';
import { Part, PrintScope, Section, Series, SeriesColor, Service } from '../../types';
import { PART_TYPES } from '../../lib/partTypes';
import { aggregateSupplies, supplyTotal } from '../../lib/supplies';
import { buildSchedule, formatClock, formatDate, formatDuration, sectionMinutes, serviceMinutes, visibleParts } from '../../lib/time';
import { weeksOf } from '../../lib/series';
import { cueSegments, listItems, looksLikeList, paragraphs } from '../../lib/text';
import { qrPath } from '../../lib/qr';
import { useStore } from '../../store/StoreContext';
import { Accessibility, Car, Layers, Compass, HelpCircle, ListChecks, MessageSquareQuote, Monitor, Moon, Package, Pointer, Quote, Sparkles, StickyNote, Sunrise, Target, Timer, Users, Utensils } from 'lucide-react';
import { engagement, FAMILY_LABELS, familyCues, sectionsFor, smallGroupGuide } from '../../lib/roles';
import { FamilyCues } from '../../types';
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

  if ('seriesId' in scope && scope.kind.startsWith('series')) {
    const series = db.series.find((s) => s.id === scope.seriesId);
    if (!series) return null;
    const weeks = weeksOf(db, series.id);
    const footer: Record<string, string> = { 'series-small': 'Small group guides', 'series-family': 'Family pages', 'series-takehome': 'Take-home cards' };
    return (
      <div className="pr-root pr" style={vars(series.color)}>
        <PageStyle footer={`${series.title} · ${footer[scope.kind] ?? 'Leader guide'}`} />
        {(scope.kind === 'series-book' || scope.kind === 'series') && (
          <>
            <SeriesCover series={series} weeks={weeks} />
            <Divider icon={Compass} kicker="Start here" title="Leader guide" sub={`${weeks.length} weeks · ${series.audience}`} />
            <LeaderGuide series={series} weeks={weeks} />
          </>
        )}
        {scope.kind === 'series-book' && weeks.map((w) => <FullWeek key={w.id} service={w} series={series} divider />)}
        {scope.kind === 'series-small' && weeks.map((w) => <SmallGroupPage key={w.id} service={w} series={series} />)}
        {scope.kind === 'series-family' && weeks.map((w) => <FamilyPage key={w.id} service={w} series={series} />)}
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
    case 'week':
      return <FullWeek service={service} series={series} />;
    case 'lesson':
      return <Lesson service={service} series={series} />;
    case 'small':
      return <SmallGroupPage service={service} series={series} />;
    case 'family':
      return <FamilyPage service={service} series={series} />;
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

// Full-bleed section opener, like a chapter page.
const Divider: React.FC<{ icon: React.ElementType; kicker: string; title: string; sub?: string; idea?: string }> = ({ icon: Icon, kicker, title, sub, idea }) => (
  <section className="pr-divider">
    <svg className="pr-divider-art" viewBox="0 0 850 1100" preserveAspectRatio="none" aria-hidden="true">
      <circle cx="425" cy="550" r="330" fill="var(--c)" opacity="0.32" />
      <circle cx="425" cy="550" r="430" fill="none" stroke="white" strokeOpacity="0.14" strokeWidth="2" />
      <circle cx="700" cy="170" r="40" fill="white" opacity="0.08" />
    </svg>
    <div className="pr-divider-body">
      <span className="pr-divider-icon"><Icon /></span>
      <p className="pr-eyebrow">{kicker}</p>
      <h2>{title}</h2>
      {sub && <p className="pr-divider-sub">{sub}</p>}
      {idea && <p className="pr-divider-idea pr-serif">{idea}</p>}
    </div>
  </section>
);

const LEGEND: [React.ElementType, string, string][] = [
  [Target, 'Session aim', 'the one idea everything points to'],
  [Timer, 'Time', 'approximate minutes for each part'],
  [Pointer, 'Instructions', 'what the leader does'],
  [MessageSquareQuote, 'Say', 'a script to read or put in your own words'],
  [HelpCircle, 'Questions', 'to ask the group'],
  [Monitor, 'Show on screen', 'scan the code to open the song or video'],
  [Accessibility, 'Every kid can join', 'ways to adapt for different needs'],
  [Layers, 'Going deeper', 'optional extras if you have time'],
];

const LeaderGuide: React.FC<{ series: Series; weeks: Service[] }> = ({ series, weeks }) => (
  <section className="pr-leader pr-page">
    <header className="pr-head">
      <p className="pr-eyebrow">Start here</p>
      <h1>Welcome, leader</h1>
    </header>
    {(series.leaderGuide || series.description) && <p className="pr-letter pr-serif">{series.leaderGuide || series.description}</p>}
    <p className="pr-label" style={{ marginTop: '18pt' }}>Inside each week</p>
    <div className="pr-roles">
      <div><span className="pr-role-icon"><Sparkles /></span><b>Large group lesson</b><p>A session plan and overview, then the hook, teaching, and everything on stage, part by part.</p></div>
      <div><span className="pr-role-icon"><Users /></span><b>Small group guide</b><p>One page for each small group leader: an icebreaker, discussion questions, and a prayer focus.</p></div>
      <div><span className="pr-role-icon"><Sunrise /></span><b>Family page</b><p>Four everyday moments for parents to carry the lesson home. Copy one for each family.</p></div>
    </div>
    <p className="pr-label" style={{ marginTop: '20pt' }}>Symbols in use</p>
    <div className="pr-legend">
      {LEGEND.map(([Icon, name, text]) => (
        <div key={name}><span className="pr-ico"><Icon /></span><p><b>{name}</b> {text}</p></div>
      ))}
    </div>
    <p className="pr-label" style={{ marginTop: '20pt' }}>The series at a glance</p>
    <ol className="pr-weeks">
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

// ---------- One week: lesson, small group guide, family page ----------

const FullWeek: React.FC<{ service: Service; series?: Series; divider?: boolean }> = ({ service, series, divider }) => (
  <>
    {divider && (
      <Divider
        icon={Compass}
        kicker={series ? `${series.title} · ${formatDate(service.date)}` : formatDate(service.date)}
        title={service.week ? `Week ${service.week}` : service.title}
        sub={service.week ? service.title : service.scripture}
        idea={service.bigIdea}
      />
    )}
    <Lesson service={service} series={series} />
    <SmallGroupPage service={service} series={series} />
    <FamilyPage service={service} series={series} />
  </>
);

const PageHead: React.FC<{ service: Service; series?: Series; kicker: string; title: string; right?: React.ReactNode }> = ({ service, series, kicker, title, right }) => (
  <header className="pr-head pr-head-split">
    <div>
      <p className="pr-eyebrow">{series && service.week ? `Week ${service.week} · ` : ''}{kicker}</p>
      <h1>{title}</h1>
    </div>
    {right}
  </header>
);

// A labeled row with an icon in the left gutter, used across the lesson pages.
const Row: React.FC<{ icon: React.ElementType; label: string; tone?: string; children: React.ReactNode }> = ({ icon: Icon, label, tone, children }) => (
  <div className={`pr-row ${tone ?? ''}`}>
    <span className="pr-ico"><Icon /></span>
    <div className="pr-row-body">
      <h4>{label}</h4>
      {children}
    </div>
  </div>
);

const Lesson: React.FC<{ service: Service; series?: Series }> = ({ service, series }) => {
  const schedule = buildSchedule(service);
  const main = sectionsFor(service, ['large', 'other']);
  return (
    <>
      <SessionPlan service={service} series={series} />
      <SessionOverview service={service} series={series} schedule={schedule} />
      <div className="pr-page pr-flow">
        {main.map((section) => <SectionBlock key={section.id} service={service} section={section} schedule={schedule} />)}
      </div>
    </>
  );
};

const SessionPlan: React.FC<{ service: Service; series?: Series }> = ({ service, series }) => {
  const { activities, challenge } = engagement(service);
  const supplies = aggregateSupplies(service);
  const all = service.sections.filter((s) => !s.hidden).flatMap(visibleParts);
  const media = all.flatMap((p) => p.media.filter((l) => l.url));
  const objectives = listItems(service.objectives);
  const notReady = all.filter((p) => !partReady(p)).length;
  const prep = [
    service.scripture ? `Read ${service.scripture} twice` : "Read this week's passage",
    'Read every script out loud once',
    supplies.length ? `Gather ${supplies.length} supply item${supplies.length === 1 ? '' : 's'}` : '',
    media.length ? `Queue ${media.length} song${media.length === 1 ? '' : 's'} / video${media.length === 1 ? '' : 's'}` : '',
    notReady ? `Finish ${notReady} part${notReady === 1 ? '' : 's'} that still need content` : '',
    `Brief your ${service.groupCount} small group leader${service.groupCount === 1 ? '' : 's'}`,
  ].filter(Boolean);
  return (
    <section className="pr-plan pr-page">
      <PageHead
        service={service}
        series={series}
        kicker="Session plan"
        title={service.title}
        right={service.scripture && <div className="pr-head-right"><span>Scripture</span><b className="pr-serif">{service.scripture}</b></div>}
      />
      <div className="pr-plan-grid">
        <div>
          {service.bigIdea && <Row icon={Target} label="Session aim"><p className="pr-serif pr-aim">{service.bigIdea}</p></Row>}
          {objectives.length > 0 && (
            <Row icon={ListChecks} label="Objectives">
              <p className="pr-row-lead">By the end of this session, {/kid|child|preschool/i.test(service.audience) ? 'kids' : 'students'} will:</p>
              <ul className="pr-bullets">{objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
            </Row>
          )}
          <Row icon={Package} label="What you will need">
            {supplies.length === 0 && media.length === 0 ? <p className="pr-row-lead">No supplies listed yet.</p> : (
              <ul className="pr-checklist">
                {supplies.map((l) => <li key={l.key}><span className="pr-box" /><span>{l.name}</span><span className="qty">{fmtQty(l.total)}</span></li>)}
                {media.map((m) => <li key={m.id}><span className="pr-box" /><span>{m.label || 'Media'} <em className="pr-dim">(on screen)</em></span><span /></li>)}
              </ul>
            )}
          </Row>
        </div>
        <aside>
          {service.keyVerse && (
            <div className="pr-side-verse">
              <p className="pr-label">Key verse</p>
              <p className="pr-serif">{service.keyVerse}</p>
            </div>
          )}
          {(activities.length > 0 || challenge) && (
            <div className="pr-engage">
              <p className="pr-label">Engagement</p>
              {activities.slice(0, 3).map((a) => (
                <div key={a.id} className="pr-engage-item">
                  <b>{a.title}</b>
                  <p>{clip(a.instructions.trim() ? listItems(a.instructions).join(' ') : a.script, 150)}</p>
                </div>
              ))}
              {challenge && <div className="pr-engage-item challenge"><b>Challenge</b><p>{clip(challenge, 180)}</p></div>}
            </div>
          )}
          <p className="pr-label">Before you teach</p>
          <ul className="pr-prep">{prep.map((item, i) => <li key={i}><span className="pr-box" /><span>{item}</span></li>)}</ul>
          <div className="pr-notes">
            <p className="pr-label">Notes</p>
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="ln" />)}
          </div>
        </aside>
      </div>
    </section>
  );
};

// Every part at a glance with a blank column for the leader's own timing.
const SessionOverview: React.FC<{ service: Service; series?: Series; schedule: Record<string, string> }> = ({ service, series, schedule }) => {
  const sections = service.sections.filter((s) => !s.hidden && visibleParts(s).length > 0);
  return (
    <section className="pr-overview pr-page">
      <PageHead service={service} series={series} kicker="Session overview" title={service.title} right={<div className="pr-head-right"><span>Total</span><b className="pr-serif">{formatDuration(serviceMinutes(service))}{clockRange(service) && ` · ${clockRange(service)}`}</b></div>} />
      <table className="pr-ov">
        <thead>
          <tr><th /><th /><th>Part</th><th>Starts</th><th className="r">Approx.</th><th className="r">My time</th></tr>
        </thead>
        {sections.map((section) => {
          const parts = visibleParts(section);
          return (
            <tbody key={section.id} className="pr-ov-group">
              {parts.map((p, i) => {
                const Icon = PART_TYPES[p.type].icon;
                return (
                  <tr key={p.id} className={p.optional ? 'opt' : ''}>
                    {i === 0 && (
                      <td rowSpan={parts.length} className="pr-ov-sec">
                        <span>{section.title}</span>
                      </td>
                    )}
                    <td className="box"><span className="pr-box" /></td>
                    <td>
                      <b>{p.optional && '⊕ '}{p.title}</b>
                      <span className="pr-ov-type"><Icon /> {p.optional ? 'Going deeper' : PART_TYPES[p.type].label}</span>
                    </td>
                    <td className="t">{schedule[p.id] ?? '—'}</td>
                    <td className="r"><Timer className="pr-ov-clock" /> {p.minutes} min</td>
                    <td className="r"><span className="line" /></td>
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
      <p className="pr-ov-foot">⊕ Going deeper parts are optional extras if you have time. They aren't counted in the run time.</p>
    </section>
  );
};

const SmallGroupPage: React.FC<{ service: Service; series?: Series }> = ({ service, series }) => {
  const g = smallGroupGuide(service);
  if (!g.has) return null;
  return (
    <section className="pr-sg pr-page">
      <PageHead
        service={service}
        series={series}
        kicker={series ? series.title : service.audience}
        title="Small group guide"
        right={<span className="pr-tag">{service.title}</span>}
      />
      {(service.bigIdea || service.keyVerse) && (
        <div className="pr-sg-recap">
          {service.bigIdea && <div><p className="pr-label">Today's big idea</p><p className="pr-serif">{service.bigIdea}</p></div>}
          {service.keyVerse && <div><p className="pr-label">Key verse</p><p className="pr-serif">{service.keyVerse}</p></div>}
        </div>
      )}
      <div className="pr-sg-grid">
        <div>
          {g.icebreaker && (
            <div className="pr-sg-block">
              <p className="pr-sg-kicker warm">Icebreaker</p>
              <p className="pr-serif pr-sg-big">{g.icebreaker}</p>
            </div>
          )}
          {g.prayer && (
            <div className="pr-sg-block">
              <p className="pr-sg-kicker">Prayer focus</p>
              <p className="pr-serif pr-sg-big muted">{g.prayer}</p>
            </div>
          )}
          {g.challenge && (
            <div className="pr-sg-block">
              <p className="pr-sg-kicker">This week's challenge</p>
              <p className="pr-sg-small">{g.challenge}</p>
            </div>
          )}
        </div>
        {g.questions.length > 0 && (
          <div className="pr-sg-questions">
            <p className="pr-label">Discussion questions</p>
            <ol>
              {g.questions.map((q, i) => <li key={i}><span>{i + 1}</span><p>{q}</p></li>)}
            </ol>
          </div>
        )}
      </div>
      {g.activities.map((a) => <PartBlock key={a.id} service={service} part={a} />)}
    </section>
  );
};

const FAMILY_ICONS: Record<keyof FamilyCues, React.ElementType> = { morning: Sunrise, onTheGo: Car, meal: Utensils, bedtime: Moon };

const FamilyPage: React.FC<{ service: Service; series?: Series }> = ({ service, series }) => {
  const cues = familyCues(service, series);
  const keys = (Object.keys(FAMILY_LABELS) as (keyof FamilyCues)[]).filter((k) => cues[k]);
  if (!keys.length) return null;
  const verse = service.keyVerse || series?.memoryVerse;
  return (
    <section className="pr-family pr-page">
      <header className="pr-family-head">
        <p className="pr-eyebrow">{series ? `${series.title} · Week ${service.week}` : service.audience} · For families</p>
        <h1>Everyday moments</h1>
        <p className="pr-family-sub">This week your {/kid|child|preschool|k–5|k-5/i.test(service.audience) ? 'child' : 'student'} learned: <b>{service.title}</b></p>
      </header>
      {(service.bigIdea || verse) && (
        <div className="pr-family-strip">
          {service.bigIdea && <p className="pr-serif">{service.bigIdea}</p>}
          {verse && <p className="pr-family-verse pr-serif">{verse}</p>}
        </div>
      )}
      <div className="pr-family-grid">
        {keys.map((k) => {
          const Icon = FAMILY_ICONS[k];
          return (
            <div key={k} className={`pr-family-card ${k}`}>
              <div className="pr-family-card-head"><span><Icon /></span><b>{FAMILY_LABELS[k].title}</b></div>
              <p className="pr-serif">{cues[k]}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const SectionBlock: React.FC<{ service: Service; section: Section; schedule: Record<string, string> }> = ({ service, section, schedule }) => (
  <section className={`pr-sec ${section.pageBreak ? 'pr-break-after' : ''}`}>
    <header className="pr-sec-head">
      <span className="rule" />
      <h2>{section.title}</h2>
      <span className="rule" />
      <span className="pr-sec-time"><Timer /> {sectionMinutes(section)} minutes</span>
    </header>
    {schedule[section.id] && <p className="pr-sec-sub">Starts {schedule[section.id]}</p>}
    {visibleParts(section).map((part) => <PartBlock key={part.id} service={service} part={part} time={schedule[part.id]} />)}
  </section>
);

const Script: React.FC<{ text: string }> = ({ text }) => (
  <div className="pr-script">
    <p className="pr-script-tag">« Script »</p>
    {paragraphs(text).map((para, i) => (
      <p key={i} className="pr-serif">
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
  const isQuestions = (part.type === 'discussion' && listItems(part.script).length > 1) || (part.type === 'discussion' && part.script.trim().endsWith('?'));
  const isVerse = part.type === 'bible-verse' && part.script.trim() && part.script.length < 400;
  return (
    <article className={`pr-p ${part.optional ? 'deeper' : ''} ${part.pageBreak ? 'pr-break-after' : ''}`}>
      {part.optional && <p className="pr-deeper-tag">Going deeper · optional</p>}
      <div className="pr-p-head">
        <h3>{part.title}</h3>
        <span className="pr-type"><Icon /> {label}</span>
        <span className="t"><Timer /> {time ? `${time} · ` : ''}{part.minutes} min</span>
      </div>
      {supplies.length > 0 && (
        <Row icon={Package} label="What you need">
          <div className="pr-supplies">{supplies.map((s) => <span key={s.id}><b>{fmtQty(supplyTotal(s, service))}</b> {s.name}</span>)}</div>
        </Row>
      )}
      {part.instructions.trim() && <Row icon={Pointer} label="Instructions"><Steps text={part.instructions} /></Row>}
      {part.script.trim() && (
        isQuestions ? (
          <Row icon={HelpCircle} label="Questions">
            <ol className="pr-questions">
              {listItems(part.script).map((q, i) => <li key={i}><span className="n">{i + 1}</span><p className="pr-serif">{q}</p></li>)}
            </ol>
          </Row>
        ) : isVerse ? (
          <Row icon={Quote} label="Read together"><div className="pr-bigverse pr-serif"><p>{part.script}</p></div></Row>
        ) : (
          <Row icon={MessageSquareQuote} label="Say"><Script text={part.script} /></Row>
        )
      )}
      {links.length > 0 && (
        <Row icon={Monitor} label="Show on screen">
          <div className="pr-links">
            {links.map((l) => (
              <div key={l.id} className="pr-link">
                <QR url={l.url} />
                <div><b>{l.label || 'Scan to open'}</b><span>{l.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}</span></div>
              </div>
            ))}
          </div>
        </Row>
      )}
      {part.inclusionTips.trim() && <Row icon={Accessibility} label="Every kid can join" tone="inclusion"><Steps text={part.inclusionTips} /></Row>}
      {part.leaderNotes.trim() && <Row icon={StickyNote} label="Leader note" tone="note"><Steps text={part.leaderNotes} /></Row>}
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
