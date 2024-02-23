<?php
// submit_form.php

// Validate and sanitize the input data
$productName = filter_input(INPUT_POST, 'productName', FILTER_SANITIZE_STRING);
$price = filter_input(INPUT_POST, 'price', FILTER_VALIDATE_FLOAT);
$contact = filter_input(INPUT_POST, 'contact', FILTER_SANITIZE_STRING);
$location = filter_input(INPUT_POST, 'location', FILTER_SANITIZE_STRING);

// Upload image and get the image file path
$imagePath = 'uploads/' . basename($_FILES['image']['name']);
move_uploaded_file($_FILES['image']['tmp_name'], $imagePath);

// Database connection
$host = 'localhost';
$username = 'your_username';
$password = 'your_password';
$database = 'agro_sell_db';

$conn = new mysqli($host, $username, $password, $database);
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Insert data into the database
$sql = "INSERT INTO products (productName, price, contact, location, image) VALUES (?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param('dssss', $productName, $price, $contact, $location, $imagePath); // 'd' for double/float
$result = $stmt->execute();
$stmt->close();

// Close database connection
$conn->close();

// Send response to the frontend
$response = ['message' => 'Form submitted successfully'];
echo json_encode($response);
?>
