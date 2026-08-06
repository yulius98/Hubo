import { cn } from '@/lib/utils';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo({
    subtitleClassName,
}: Readonly<{ subtitleClassName?: string }>) {
    return (
        <>
            <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-lg ring-1 shadow-indigo-500/30 ring-white/25">
                <AppLogoIcon className="size-5 fill-current text-white" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/25 to-transparent" />
            </div>
            <div className="ml-2 grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 bg-clip-text text-sm font-bold tracking-[0.25em] text-transparent dark:from-indigo-300 dark:via-cyan-200 dark:to-indigo-300">
                    HUBO
                </span>
                <span
                    className={cn(
                        'text-[10px] font-medium tracking-wider text-muted-foreground uppercase',
                        subtitleClassName,
                    )}
                >
                    Outlet Management
                </span>
            </div>
        </>
    );
}
