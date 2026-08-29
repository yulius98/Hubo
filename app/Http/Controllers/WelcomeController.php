<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        [$kategoris, $products] = Cache::remember('welcome.catalog', 300, function () {
            $kategoris = Kategori::query()->orderBy('kategori')->get(['id', 'kategori', 'gambar']);

            $products = Produk::query()
                ->with('kategori:id,kategori')
                ->where('stok', '>', 0)
                ->inRandomOrder()
                ->take(12)
                ->get();

            return [$kategoris, $products];
        });

        return Inertia::render('welcome', ['products' => $products, 'kategoris' => $kategoris]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
