import type { Claim } from '../../shared/types';
import { DrawingArt } from '../draw/DrawingArt';
import { claimItemsShown, claimLines } from '../text';

/** What the player's pet got for the days that closed since they last played. */
export function ClaimCard(props: { claim: Claim; onDone: () => void }) {
  const { claim } = props;
  const { shown, more } = claimItemsShown(claim.items.length);
  return (
    <div className="px" style={{ left: 12, top: 24, width: 351 }}>
      <div style={{ display: 'grid', gap: 12, padding: 16 }}>
        <div className="t16" style={{ display: 'grid', gap: 2 }}>
          {claimLines(claim.days).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {shown > 0 && (
          <>
            <p className="t24 display">Your pet got:</p>
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              {claim.items.slice(0, shown).map((item, i) => (
                <li
                  key={item.id}
                  className="drop"
                  style={{
                    display: 'grid',
                    justifyItems: 'center',
                    gap: 8,
                    minWidth: 0,
                    animationDelay: `${200 + i * 160}ms`,
                  }}
                >
                  <span
                    className="art framed paper"
                    style={{ width: 80, height: 80 }}
                  >
                    <DrawingArt
                      entry={item.entry}
                      label={`${item.category} by u/${item.maker}`}
                    />
                  </span>
                  <span className="t12 clip">by u/{item.maker}</span>
                </li>
              ))}
            </ul>
            {more !== null && <p className="t16">{more}</p>}
          </>
        )}
        <button
          className="px in btn primary t32"
          style={{ height: 64 }}
          onClick={props.onDone}
        >
          Nice
        </button>
      </div>
    </div>
  );
}
