import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Menu } from './screens/Menu';

// The inline view in the feed: the owner's menu art with one PLAY button. Its
// size is not known, so the menu fits itself to the frame it is given. The pet
// is not shown here, because this view does not know whose pet it is.
export function Splash() {
  return (
    <Menu
      buttons={[
        {
          art: '/art/menu-play.png',
          label: 'Play',
          onClick: (e) => requestExpandedMode(e, 'game'),
        },
      ]}
    />
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Splash />
    </StrictMode>
  );
}
