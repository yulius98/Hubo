import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Menu,
    X,
    Sun,
    Moon,
    Search,
    LogInIcon,
    LogOut,
    ChevronDown,
    UserCircle,
    PackageSearch,
    ShoppingCart,
    Languages,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import LoadingOverlay from '@/components/loading-overlay';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { t } from '@/i18n';
import { homepage, login, logout, myprofile, pesanan_saya } from '@/routes';
import type { User } from '@/types/auth';

type Section = 'home' | 'kategori' | 'produk';

type Props = {
    showSections?: boolean;
    activeSection?: Section;
    onSectionClick?: (section: Section) => void;
};

export default function StoreNavbar({
    showSections = true,
    activeSection,
    onSectionClick,
}: Readonly<Props>) {
    const { auth, locale, cartCount, flash } = usePage().props as unknown as {
        auth: { user: User | null };
        locale: string;
        cartCount: number;
        flash?: { success?: string; error?: string };
    };
    const user = auth?.user ?? null;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [profilLoading, setProfilLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const setLocale = useCallback((l: string) => {
        router.post('/set-locale', { locale: l }, { preserveScroll: true });
    }, []);

    const handleSectionClick = useCallback(
        (section: Section) => {
            setMobileMenuOpen(false);
            onSectionClick?.(section);
        },
        [onSectionClick],
    );

    const handleLoginClick = useCallback(() => {
        if (!loginLoading) {
            setLoginLoading(true);
            router.visit(login());
        }
    }, [loginLoading]);

    const handleProfilClick = useCallback(() => {
        if (!profilLoading) {
            setProfilLoading(true);
            router.visit(myprofile());
        }
    }, [profilLoading]);

    const handleOrdersClick = useCallback(() => {
        if (!ordersLoading) {
            setOrdersLoading(true);
            router.visit(pesanan_saya());
        }
    }, [ordersLoading]);

    const sectionClass = (section: Section) =>
        `cursor-pointer text-sm font-medium transition ${
            activeSection === section
                ? 'text-cyan-300'
                : 'text-blue-100 hover:text-white'
        }`;

    return (
        <nav className="sticky top-0 z-50 border-b border-blue-700/30 bg-blue-900/70 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between md:h-20">
                    <Link
                        href={homepage()}
                        className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-bold tracking-wider text-transparent md:text-3xl"
                    >
                        HUBO
                    </Link>

                    {showSections && (
                        <div className="hidden items-center gap-8 md:flex">
                            <button
                                type="button"
                                onClick={() => handleSectionClick('home')}
                                className={sectionClass('home')}
                            >
                                {t('nav.home', locale)}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSectionClick('kategori')}
                                className={sectionClass('kategori')}
                            >
                                {t('nav.kategori', locale)}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSectionClick('produk')}
                                className={sectionClass('produk')}
                            >
                                {t('nav.produk', locale)}
                            </button>
                        </div>
                    )}

                    <div className="hidden items-center gap-5 md:flex lg:gap-7">
                        <div className="relative">
                            <Search
                                className="absolute top-1/2 left-3 -translate-y-1/2 text-blue-300"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder={t('search.placeholder', locale)}
                                className="w-full rounded-full border border-blue-400/30 bg-white/10 py-2 pr-4 pl-9 text-sm text-white placeholder-blue-300/50 transition outline-none focus:border-cyan-400 focus:bg-white/20 lg:w-72"
                            />
                        </div>

                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex cursor-pointer items-center gap-2 rounded-full border border-cyan-400/40 p-1 pr-3 text-sm font-medium text-blue-100 transition hover:border-cyan-400"
                                    >
                                        <img
                                            src={
                                                user?.avatar ??
                                                '/images/default-avatar.png'
                                            }
                                            alt="Profile"
                                            className="h-8 w-8 rounded-full border-2 border-cyan-400/40 object-cover transition hover:border-cyan-400"
                                        />
                                        <span className="hidden max-w-32 truncate lg:inline">
                                            {user?.name ?? 'Guest'}
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            className="text-blue-300"
                                        />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56 rounded-xl border border-blue-200 bg-white/95 text-blue-950 backdrop-blur-xl dark:border-blue-700/40 dark:bg-blue-900/95 dark:text-white"
                                >
                                    <DropdownMenuLabel>
                                        <div className="flex items-center gap-2 px-1 py-1.5">
                                            <img
                                                src={
                                                    user?.avatar ??
                                                    '/images/default-avatar.png'
                                                }
                                                alt=""
                                                className="h-8 w-8 rounded-full object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold">
                                                    {user?.name ?? 'Guest'}
                                                </p>
                                                <p className="truncate text-xs text-blue-400 dark:text-blue-300">
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {(flash?.success || cartCount > 0) && (
                                        <div className="mx-1 mb-1 flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                                            <ShoppingCart size={14} className="shrink-0" />
                                            {flash?.success
                                                ? t('cart.added', locale)
                                                : t('cart.in_cart', locale, {
                                                      count: cartCount,
                                                  })}
                                            {cartCount > 0 && (
                                                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-white">
                                                    {cartCount}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <DropdownMenuItem
                                        onClick={handleProfilClick}
                                        className="cursor-pointer"
                                    >
                                        <UserCircle className="mr-2" size={18} />
                                        {t('nav.my_profile', locale)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleOrdersClick}
                                        className="cursor-pointer"
                                    >
                                        <PackageSearch
                                            className="mr-2"
                                            size={18}
                                        />
                                        {t('nav.my_orders', locale)}
                                        {cartCount > 0 && (
                                            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-white">
                                                {cartCount}
                                            </span>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={logout()}
                                            as="button"
                                            className="w-full cursor-pointer text-red-500 dark:text-red-400"
                                        >
                                            <LogOut className="mr-2" size={18} />
                                            {t('nav.logout', locale)}
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <button
                                type="button"
                                onClick={handleLoginClick}
                                disabled={loginLoading}
                                className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white"
                            >
                                <LogInIcon size={18} />
                                <span>{t('nav.login', locale)}</span>
                            </button>
                        )}

                        <div className="flex overflow-hidden rounded-full bg-blue-500/20">
                            <button
                                type="button"
                                onClick={() => setLocale('id')}
                                className={`px-3 py-1.5 text-xs font-semibold transition ${locale === 'id' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300 hover:text-white'}`}
                            >
                                ID
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocale('en')}
                                className={`px-3 py-1.5 text-xs font-semibold transition ${locale === 'en' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300 hover:text-white'}`}
                            >
                                EN
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                            className="rounded-full p-2 text-blue-100 transition hover:bg-blue-500/20 hover:text-white"
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        <div className="flex overflow-hidden rounded-full bg-blue-500/20">
                            <button
                                type="button"
                                onClick={() => setLocale('id')}
                                className={`px-2 py-1 text-xs font-semibold transition ${locale === 'id' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300'}`}
                            >
                                ID
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocale('en')}
                                className={`px-2 py-1 text-xs font-semibold transition ${locale === 'en' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300'}`}
                            >
                                EN
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                            className="p-2 text-blue-100"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-blue-100"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-blue-700/30 bg-blue-950/80 backdrop-blur-lg md:hidden"
                    >
                        <div className="flex flex-col gap-1 px-5 py-4">
                            {showSections && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleSectionClick('home')}
                                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white"
                                    >
                                        {t('nav.home', locale)}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSectionClick('kategori')
                                        }
                                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white"
                                    >
                                        {t('nav.kategori', locale)}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSectionClick('produk')
                                        }
                                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white"
                                    >
                                        {t('nav.produk', locale)}
                                    </button>
                                    <div className="my-2 border-t border-blue-700/30" />
                                </>
                            )}
                            <div className="flex items-center gap-3 rounded-lg px-4 py-3">
                                <Languages size={20} className="text-blue-100" />
                                <div className="flex overflow-hidden rounded-full bg-blue-700/40">
                                    <button
                                        type="button"
                                        onClick={() => setLocale('id')}
                                        className={`px-3 py-1.5 text-xs font-semibold transition ${locale === 'id' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300 hover:text-white'}`}
                                    >
                                        ID
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLocale('en')}
                                        className={`px-3 py-1.5 text-xs font-semibold transition ${locale === 'en' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300 hover:text-white'}`}
                                    >
                                        EN
                                    </button>
                                </div>
                            </div>
                            {user ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleProfilClick}
                                        disabled={profilLoading}
                                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white"
                                    >
                                        <img
                                            src={
                                                user?.avatar ??
                                                '/images/default-avatar.png'
                                            }
                                            alt=""
                                            className="h-7 w-7 rounded-full object-cover"
                                        />
                                        {t('nav.my_profile', locale)}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOrdersClick}
                                        disabled={ordersLoading}
                                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white"
                                    >
                                        <PackageSearch size={20} />
                                        {t('nav.my_orders', locale)}
                                    </button>
                                    <Link
                                        href={logout()}
                                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-red-300 transition hover:bg-blue-800/40 hover:text-red-200"
                                    >
                                        <LogOut size={20} />
                                        {t('nav.logout', locale)}
                                    </Link>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleLoginClick}
                                    disabled={loginLoading}
                                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white"
                                >
                                    <LogInIcon size={20} />
                                    {t('nav.login', locale)}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <LoadingOverlay show={loginLoading || profilLoading || ordersLoading} />
        </nav>
    );
}
