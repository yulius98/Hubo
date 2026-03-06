<?php

namespace Database\Seeders;

use App\Models\Kategori;
//use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class KategoriSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kategoris =[
            'Elektronik',
            'Komputer & Aksesoris',
            'Handphone & Aksesoris',
            'Pakaian Pria',
            'Sepatu Pria',
            'Tas Pria',
            'Aksesoris Fashiion',
            'Jam Tangan',
            'Kesehatan',
            'Hobi & Koleksi',
            'Makanan & Minuman',
            'Perawatan & Kecantikan',
            'Perlengkapan Rumah',
            'Pakaian Wanita',
            'Fashion Muslim',
            'Fashion Bayi & Anak',
            'Ibu & Bayi',
            'Sepatu Wanita',
            'Tas Wanita',
            'Otomotif',
        ];

        foreach ($kategoris as $kategori) {
            Kategori::updateOrCreate(
                [
                    'id_user' => 1,
                    'kategori' => $kategori
                ],
                [   'id_user' => 1,
                    'kategori' => $kategori
                ]
            );
        };
    }
}
