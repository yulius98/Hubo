import { router, usePage } from '@inertiajs/react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useEffect, useRef } from 'react';

const REFRESH_PROPS = ['pendingRequestCount', 'pendingRequestList', 'unreadNotificationCount'] as const;

/**
 * Subscribes to the tenant's private broadcast channel and refreshes the
 * notification/request badges without a full page reload.
 *
 * When broadcasting is not configured (enabled=false), this component does
 * nothing and the app keeps its existing polling behaviour.
 */
export default function RealtimeNotifications() {
    const { props } = usePage();
    const enabled = props.broadcast?.enabled === true;
    const key = props.broadcast?.key ?? null;
    const cluster = props.broadcast?.cluster ?? null;
    const tenantId = props.tenant?.id ?? null;
    const echoRef = useRef<Echo<'pusher'> | null>(null);

    useEffect(() => {
        if (!enabled || !key || !tenantId) {
            echoRef.current?.disconnect();
            echoRef.current = null;

            return;
        }

        if (echoRef.current) {
            return;
        }

        try {
            window.Pusher = Pusher;

            const echo = new Echo({
                broadcaster: 'pusher',
                key,
                cluster: cluster ?? undefined,
                forceTLS: true,
            });

            const channel = echo.private(`tenant.${tenantId}`);

            ['OrderCreated', 'LowStockAlert', 'StaffRequestUpdated'].forEach((event) => {
                channel.listen(event, () => {
                    router.reload({ only: [...REFRESH_PROPS] });
                });
            });

            echoRef.current = echo;
        } catch {
            echoRef.current = null;
        }

        return () => {
            echoRef.current?.disconnect();
            echoRef.current = null;
        };
    }, [enabled, key, cluster, tenantId]);

    return null;
}