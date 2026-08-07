import type { GlobalEvent } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export function useInertiaLoading(minDuration: number = 300): boolean {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let startedAt = 0;

        const isPrefetch = (event: GlobalEvent<'start' | 'finish'>) =>
            event.detail.visit.prefetch;

        const start = (event: GlobalEvent<'start'>) => {
            if (isPrefetch(event)) {
                return;
            }

            startedAt = Date.now();
            setLoading(true);
        };

        const finish = (event: GlobalEvent<'finish'>) => {
            if (isPrefetch(event)) {
                return;
            }

            const elapsed = Date.now() - startedAt;
            const delay = Math.max(0, minDuration - elapsed);

            clearTimeout(timer);
            timer = setTimeout(() => setLoading(false), delay);
        };

        const offStart = router.on('start', start);
        const offFinish = router.on('finish', finish);

        return () => {
            clearTimeout(timer);
            offStart();
            offFinish();
        };
    }, [minDuration]);

    return loading;
}
