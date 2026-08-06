import { router } from '@inertiajs/react';
import { Store } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type OutletOption = {
    id: number;
    nama_outlet: string;
};

type SelectOutletDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    outlets: OutletOption[];
    menuName: string;
    buildUrl: (outletId: number) => string;
};

export default function SelectOutletDialog({
    open,
    onOpenChange,
    outlets,
    menuName,
    buildUrl,
}: Readonly<SelectOutletDialogProps>) {
    const handleSelect = (outletId: number) => {
        onOpenChange(false);

        router.post(
            '/select-outlet',
            { outlet_id: outletId },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => router.visit(buildUrl(outletId)),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pilih Outlet Terlebih Dahulu</DialogTitle>
                    <DialogDescription>
                        Untuk membuka menu {menuName}, silakan pilih outlet
                        aktif di bawah ini terlebih dahulu.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                    {outlets.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Anda belum memiliki outlet.
                        </p>
                    ) : (
                        outlets.map((outlet) => (
                            <button
                                key={outlet.id}
                                type="button"
                                onClick={() => handleSelect(outlet.id)}
                                className="flex items-center gap-3 rounded-lg border border-sidebar-border/60 bg-card px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                <Store className="size-4 shrink-0 text-muted-foreground" />
                                {outlet.nama_outlet}
                            </button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
