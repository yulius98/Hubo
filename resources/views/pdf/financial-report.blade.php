<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Keuangan</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; color: #333; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 5px; color: #1a1a1a; }
        .subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
        .summary-card .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-card .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
        .summary-card .value.positive { color: #059669; }
        .summary-card .value.negative { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
        tr:last-child td { border-bottom: 2px solid #e5e7eb; font-weight: bold; }
        .money { text-align: right; font-family: 'Courier New', monospace; }
        .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
    <h1>Laporan Keuangan</h1>
    <p class="subtitle">Periode: {{ $startDate }} s/d {{ $endDate }}</p>

    <div class="summary">
        <div class="summary-card">
            <div class="label">Pendapatan</div>
            <div class="value positive">Rp {{ number_format($revenue, 0, ',', '.') }}</div>
        </div>
        <div class="summary-card">
            <div class="label">Harga Pokok</div>
            <div class="value negative">Rp {{ number_format($cogs, 0, ',', '.') }}</div>
        </div>
        <div class="summary-card">
            <div class="label">Biaya Operasional</div>
            <div class="value negative">Rp {{ number_format($totalExpenses, 0, ',', '.') }}</div>
        </div>
        <div class="summary-card">
            <div class="label">Laba Bersih</div>
            <div class="value {{ $netProfit >= 0 ? 'positive' : 'negative' }}">Rp {{ number_format($netProfit, 0, ',', '.') }}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Periode</th>
                <th style="text-align:right">Pendapatan</th>
                <th style="text-align:right">Harga Pokok</th>
                <th style="text-align:right">Biaya</th>
                <th style="text-align:right">Laba</th>
            </tr>
        </thead>
        <tbody>
            @forelse($monthlyBreakdown as $row)
                @php
                    $rowExpenses = $totalExpenses / max($monthlyBreakdown->count(), 1);
                    $rowProfit = $row->revenue - $row->cogs - $rowExpenses;
                @endphp
                <tr>
                    <td>{{ $row->month }}</td>
                    <td class="money">Rp {{ number_format($row->revenue, 0, ',', '.') }}</td>
                    <td class="money">Rp {{ number_format($row->cogs, 0, ',', '.') }}</td>
                    <td class="money">Rp {{ number_format($rowExpenses, 0, ',', '.') }}</td>
                    <td class="money" style="color: {{ $rowProfit >= 0 ? '#059669' : '#dc2626' }}">
                        Rp {{ number_format($rowProfit, 0, ',', '.') }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align:center; color:#9ca3af;">Tidak ada data</td>
                </tr>
            @endforelse
            <tr>
                <td>TOTAL</td>
                <td class="money">Rp {{ number_format($revenue, 0, ',', '.') }}</td>
                <td class="money">Rp {{ number_format($cogs, 0, ',', '.') }}</td>
                <td class="money">Rp {{ number_format($totalExpenses, 0, ',', '.') }}</td>
                <td class="money" style="color: {{ $netProfit >= 0 ? '#059669' : '#dc2626' }}">
                    Rp {{ number_format($netProfit, 0, ',', '.') }}
                </td>
            </tr>
        </tbody>
    </table>

    <p class="footer">Dicetak pada {{ now()->format('d M Y H:i') }} &bull; Sistem Hubo</p>
</body>
</html>
