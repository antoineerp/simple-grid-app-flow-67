
<?php
// Utility: index.html validation and patching

// Validates references in index.html and returns an array of booleans
function validate_index_references($content) {
    return [
        'has_js_reference'   => preg_match('/<script[^>]*src="\/assets\/[^"]*\.js"[^>]*>/i', $content),
        'has_css_reference'  => preg_match('/<link[^>]*href="\/assets\/[^"]*\.css"[^>]*>/i', $content),
        'has_src_reference'  => preg_match('/<script[^>]*src="\/src\/[^"]*"[^>]*>/i', $content),
    ];
}

// Patches index.html with latest assets, returns new content
function patch_index_html($content, $js_file = '', $css_file = '') {
    $new_content = $content;

    // Add CSS link if not exists or update existing one
    if ($css_file) {
        if (preg_match('/<link[^>]*href="\/assets\/[^"]*\.css"[^>]*>/i', $content)) {
            // Replace existing CSS link
            $new_content = preg_replace(
                '/<link[^>]*href="\/assets\/[^"]*\.css"[^>]*>/i',
                '<link rel="stylesheet" href="/assets/' . $css_file . '" />',
                $new_content
            );
        } else {
            // Add new CSS link before closing head tag
            $new_content = preg_replace(
                '/<\/head>/',
                '    <link rel="stylesheet" href="/assets/' . $css_file . '" />' . "\n" . '</head>',
                $new_content
            );
        }
    }

    // Replace or add JS reference
    if ($js_file) {
        if (preg_match('/<script[^>]*src="\/src\/[^"]*"[^>]*>/', $content)) {
            // Replace src/ reference with built JS
            $new_content = preg_replace(
                '/<script[^>]*src="\/src\/[^"]*"[^>]*>/',
                '<script type="module" src="/assets/' . $js_file . '">',
                $new_content
            );
        } else if (preg_match('/<script[^>]*src="\/assets\/[^"]*\.js"[^>]*>/i', $content)) {
            // Update existing JS reference
            $new_content = preg_replace(
                '/<script[^>]*src="\/assets\/[^"]*\.js"[^>]*>/i',
                '<script type="module" src="/assets/' . $js_file . '">',
                $new_content
            );
        } else {
            // Add new JS reference before closing body
            $new_content = preg_replace(
                '/<\/body>/',
                '    <script type="module" src="/assets/' . $js_file . '"></script>' . "\n" . '</body>',
                $new_content
            );
        }
    }

    return $new_content;
}

// Detect if we're in a hashed assets environment (Vite production build)
function is_hashed_environment() {
    $js_files = glob('../assets/*.js');
    foreach ($js_files as $file) {
        if (preg_match('/-[a-zA-Z0-9]{8,}\.js$/', $file)) {
            return true;
        }
    }
    return false;
}
