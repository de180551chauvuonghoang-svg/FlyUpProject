
const description = "QR   ORDER 21ca850478fa47df8b70d2a5b4b0dbd0- Ma GD ACSP/ VC749466";
const match = description.match(/ORDER\s+([a-fA-F0-9-]+)/i);

console.log("Original Description:", description);

if (match) {
    console.log("Captured Group (Raw):", match[1]);
    const checkoutId = match[1].replace(/-+$/, '').trim();
    console.log("Cleaned checkoutId:", checkoutId);
    console.log("Length:", checkoutId.length);
    
    // Check if it's a valid hex string of length 32
    const isValidHex32 = /^[a-fA-F0-9]{32}$/.test(checkoutId);
    console.log("Is 32-char Hex?", isValidHex32);
} else {
    console.log("No match found!");
}
