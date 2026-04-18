<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

Route::post('/upload', function (Request $request) {

    if (!$request->hasFile('pdfs')) {
        return response()->json(['error' => 'No files uploaded'], 400);
    }

    $files = $request->file('pdfs');

    $http = Http::timeout(300);

    foreach ($files as $file) {
        $http->attach(
            'files', // ✅ correct
            file_get_contents($file),
            $file->getClientOriginalName()
        );
    }

    $response = $http->post('http://127.0.0.1:8001/reconstruct/');


    return response()->json($response->json());
    // 🔥 FORCE DEBUG OUTPUT
    //return response()->json([
    //    'status' => $response->status(),
    //    'body' => $response->body(),
    //    'json' => $response->json()
    //]);
});