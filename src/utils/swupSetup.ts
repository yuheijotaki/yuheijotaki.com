export function setupSwup(customSetup: () => void) {
  const runSetup = () => {
    customSetup();
    if ((window as any).swup) {
      (window as any).swup.hooks.on('page:view', () => {
        customSetup();
      });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if ((window as any).swup) {
          (window as any).swup.hooks.on('page:view', () => {
            customSetup();
          });
        } else {
          document.addEventListener('swup:enable', () => {
            (window as any).swup.hooks.on('page:view', () => {
              customSetup();
            });
          });
        }
        customSetup();
      });
    }
  };

  runSetup();
}
