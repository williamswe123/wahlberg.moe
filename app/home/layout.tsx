import SideNav from '@/app/ui/dashboard/sidenav';
import { FloatingMailButton } from '../ui/dashboard/mail-button';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row md:overflow-hidden">
        <div className="w-full flex-none border-b border-slate-200 bg-white md:h-screen md:w-72 md:border-b-0 md:border-r">
          <SideNav />
        </div>

        <div className="flex-grow p-6 md:overflow-y-auto md:p-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-12">{children}</div>
        </div>
      </div>

      {/* Sticks to viewport; shows on every page under this layout */}
      <FloatingMailButton />
    </>
  );
}