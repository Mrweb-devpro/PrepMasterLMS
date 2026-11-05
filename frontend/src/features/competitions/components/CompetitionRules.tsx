export function CompetitionRules() {
  return <div className="space-y-3 text-sm leading-relaxed text-text-secondary">
    <p><strong className="text-foreground">One chance per question.</strong> Your first choice is final. You can move forward quickly, but you cannot go back. Skipping a question gives zero points.</p>
    <p><strong className="text-foreground">Speed and accuracy count.</strong> A correct answer earns 100 points plus 2 points for each full second left on the original scoring clock when the server receives it. Wrong or skipped answers earn zero.</p>
    <p><strong className="text-foreground">One shared deadline.</strong> Joining late does not give you extra time. If the organiser extends the contest, the speed bonus still uses the original deadline; correct answers after that earn 100 points.</p>
    <p><strong className="text-foreground">Keep your connection on.</strong> Answers save in the background. If you lose connection, keep this page open and reconnect before the contest ends. Only answers received by the server before closing count.</p>
    <p><strong className="text-foreground">The highest score wins.</strong> Ties favour students who participated, then the shorter time taken. An exact tie uses a fixed account order. Results remain provisional until closing.</p>
  </div>;
}
