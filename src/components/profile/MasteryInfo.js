export default function MasteryInfo({ points, rank, nextRank, progress }) {
  return (
    <div className="w-72 font-body">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="font-body text-[11px] uppercase tracking-wider text-mist-dim">Guild Standing</span>
          <h2 className="font-display text-xl text-ember-bright">{points} <span className="text-xs text-mist-dim">MP</span></h2>
        </div>
        <div className="rounded-full border border-blood/30 bg-blood/20 px-3 py-1 font-display text-[11px] uppercase tracking-wider text-blood-bright">{rank}</div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-mist-dim">
          <span>Mastery Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-void">
          <div className="h-full rounded-full bg-ember" style={{ width: `${progress}%` }} />
        </div>
        {nextRank && (
          <p className="mt-1.5 text-xs text-mist-dim">{nextRank.minPoints - points} MP to {nextRank.title}</p>
        )}
      </div>

      <div className="my-3 h-px bg-white/10" />

      <div>
        <h4 className="font-display text-xs uppercase tracking-wider text-mist">Mastery Record Guide</h4>
        <ul className="mt-2 flex flex-col gap-1.5 text-xs text-mist-dim">
          <li><span className="text-ember-bright">+10 MP</span> Small or Large Crown Collected</li>
          <li><span className="text-ember-bright">+30 MP</span> Both Crowns Collected (S + L)</li>
          <li><span className="text-ember-bright">+25 MP</span> Guild Archive (First Discovery)</li>
        </ul>
      </div>
    </div>
  );
}
