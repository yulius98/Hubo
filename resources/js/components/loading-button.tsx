import { LoaderCircle } from 'lucide-react';
import type * as React from 'react';
import { Button } from '@/components/ui/button';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { cn } from '@/lib/utils';

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
    loading?: boolean;
    loadingText?: string;
};

export default function LoadingButton({
    loading,
    loadingText,
    disabled,
    children,
    className,
    ...props
}: Readonly<LoadingButtonProps>) {
    const isNavigating = useInertiaLoading();
    const isLoading = loading ?? isNavigating;

    return (
        <Button
            disabled={disabled || isLoading}
            aria-busy={isLoading}
            className={cn(isLoading && 'pointer-events-none', className)}
            {...props}
        >
            {isLoading && <LoaderCircle className="size-4 animate-spin" />}
            {isLoading && loadingText ? loadingText : children}
        </Button>
    );
}
