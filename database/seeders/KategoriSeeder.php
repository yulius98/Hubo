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
        $gambars = [
            'storage/kategoris/elektronik.webp',
            'storage/kategoris/komputer-aksesoris.webp',
            'storage/kategoris/handphone-aksesoris.webp',
            'storage/kategoris/pakaian-pria.webp',
            'storage/kategoris/sepatu-pria.webp',
            'storage/kategoris/tas-pria.webp',
            'storage/kategoris/aksesoris-fashiion.webp',
            'storage/kategoris/jam-tangan.webp',
            'storage/kategoris/kesehatan.webp',
            'storage/kategoris/hobi-koleksi.webp',
            'storage/kategoris/makanan-minuman.webp',
            'storage/kategoris/perawatan-kecantikan.webp',
            'storage/kategoris/perlengkapan-rumah.webp',
            'storage/kategoris/pakaian-wanita.webp',
            'storage/kategoris/fashion-muslim.webp',
            'storage/kategoris/fashion-bayi-anak.webp',
            'storage/kategoris/ibu-bayi.webp',
            'storage/kategoris/sepatu-wanita.webp',
            'storage/kategoris/tas-wanita.webp',
            'storage/kategoris/otomotif.webp',
        ];
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

        foreach (array_combine($gambars, $kategoris) as $gambar => $kategori) {
            Kategori::updateOrCreate(
                [
                    'id_user' => 1,
                    'kategori' => $kategori,
                ],
                [
                    'id_user' => 1,
                    'gambar' => $gambar,
                    'kategori' => $kategori,
                ]
            );
        }

    }
}
