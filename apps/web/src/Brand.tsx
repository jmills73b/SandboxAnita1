export function Brand({ onClick }: { onClick?: () => void }) {
  const inner = (
    <>
      <span className="brand-seal" aria-hidden="true">
        ACM
      </span>
      <span className="brand-name">Caseflow</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="brand" onClick={onClick}>
        {inner}
      </button>
    );
  }

  return <div className="brand">{inner}</div>;
}
