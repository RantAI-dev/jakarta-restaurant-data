import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-6 place-items-center rounded-[5px] bg-fd-primary font-display text-[13px] font-semibold text-white"
          >
            S
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            {appName}
          </span>
        </span>
      ),
    },
    links: [
      {
        text: 'Daftar isi',
        url: '/docs',
      },
      {
        text: 'PDF',
        url: '/pdf',
      },
    ],
  };
}
