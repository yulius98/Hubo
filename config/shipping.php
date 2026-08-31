<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Shipping Defaults
    |--------------------------------------------------------------------------
    |
    | Parameter bisnis untuk kalkulasi ongkir. Nilai ini dipakai simultan oleh
    | backend (verifikasi ongkir saat checkout) dan frontend (estimasi ongkir),
    | sehingga cukup diubah lewat env tanpa menyentuh kode.
    |
    */

    /*
    | Asumsi berat satuan produk (gram) untuk estimasi ongkir.
    */
    'unit_weight_gram' => (int) env('SHIPPING_UNIT_WEIGHT_GRAM', 500),

    /*
    | Kota tujuan default (ID kota RajaOngkir) saat menghitung estimasi ongkir.
    */
    'default_destination_city_id' => env('SHIPPING_DEFAULT_CITY_ID', '152'),

];
