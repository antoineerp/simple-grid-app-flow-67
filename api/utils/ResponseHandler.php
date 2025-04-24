
<?php
class ResponseHandler {
    public static function success($data = null, $message = '', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }

    public static function error($message, $code = 400, $details = null) {
        http_response_code($code);
        $response = [
            'status' => 'error',
            'message' => $message
        ];
        if ($details) {
            $response['details'] = $details;
        }
        echo json_encode($response);
        exit;
    }
}
?>
