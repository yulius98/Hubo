import LoadingOverlay from '@/components/loading-overlay';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';

export default function GlobalPageLoading() {
    const loading = useInertiaLoading();

    return <LoadingOverlay show={loading} />;
}
