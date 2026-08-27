<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class FinancialReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    public function __construct(
        private array $data,
    ) {}

    public function collection(): Collection
    {
        $rows = collect();

        foreach ($this->data['monthlyBreakdown'] as $row) {
            $profit = $row->revenue - $row->cogs - ($this->data['totalExpenses'] / max($this->data['monthlyBreakdown']->count(), 1));
            $rows->push([
                'type' => 'monthly',
                'month' => $row->month,
                'revenue' => $row->revenue,
                'cogs' => $row->cogs,
                'expenses' => $this->data['totalExpenses'] / max($this->data['monthlyBreakdown']->count(), 1),
                'profit' => $profit,
            ]);
        }

        $rows->push([
            'type' => 'summary',
            'month' => 'TOTAL',
            'revenue' => $this->data['revenue'],
            'cogs' => $this->data['cogs'],
            'expenses' => $this->data['totalExpenses'],
            'profit' => $this->data['netProfit'],
        ]);

        return $rows;
    }

    public function headings(): array
    {
        return [
            'Periode',
            'Pendapatan',
            'Harga Pokok',
            'Biaya Operasional',
            'Laba Bersih',
        ];
    }

    public function map($row): array
    {
        return [
            $row['month'],
            $row['revenue'],
            $row['cogs'],
            $row['expenses'],
            $row['profit'],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $sheet->getHighestRow();

        return [
            1 => ['font' => ['bold' => true]],
            $lastRow => ['font' => ['bold' => true]],
        ];
    }
}
