
<?php
// Utility: Asset search, selection (main JS/CSS), and listing

// Returns latest asset by prefix (eg: 'main-' for JS, 'index-' for CSS)
function find_latest_asset($assets, $prefix) {
    $latest = '';
    $latest_time = 0;
    foreach ($assets as $file) {
        $filename = basename($file);
        if (strpos($filename, $prefix) === 0) {
            $file_time = filemtime($file);
            if ($file_time > $latest_time) {
                $latest_time = $file_time;
                $latest = $filename;
            }
        }
    }
    return [$latest, $latest_time];
}

// List all assets as HTML
function list_assets($assets) {
    $output = '';
    foreach ($assets as $file) {
        $output .= "<li>" . basename($file) . " (" . filesize($file) . " octets)</li>";
    }
    return $output;
}
