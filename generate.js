const fs = require('fs');
const path = require('path');

// Ensure assets/images directory exists
const assetsDir = path.join(process.cwd(), 'assets');
const imagesDir = path.join(assetsDir, 'images');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
  console.log('Created assets directory');
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
  console.log('Created assets/images directory');
}

// Generate a very basic SVG icon with TL initials
const generateTruckingLogisticsIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#004d40"/>
  <text x="50%" y="50%" font-size="${size/4}" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">TL</text>
  <path d="M${size*0.2},${size*0.7} L${size*0.5},${size*0.7} L${size*0.6},${size*0.6} L${size*0.8},${size*0.6} L${size*0.8},${size*0.8} L${size*0.2},${size*0.8} Z" fill="#b0b0b0" />
  <circle cx="${size*0.3}" cy="${size*0.8}" r="${size*0.06}" fill="#333" />
  <circle cx="${size*0.7}" cy="${size*0.8}" r="${size*0.06}" fill="#333" />
</svg>`;
};

// Generate placeholder images
const files = [
  { name: 'icon.png', size: 1024 },
  { name: 'splash-icon.png', size: 200 },
  { name: 'favicon.png', size: 32 }
];

// Create an HTML file that will convert the SVG to PNG
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>SVG to PNG Converter</title>
</head>
<body>
  <div id="instructions">
    <h1>Generate Placeholder Images</h1>
    <p>This page will help you generate placeholder PNG images for your Expo app.</p>
    <p>Please follow these steps:</p>
    <ol>
      <li>Save these SVG files to your assets/images directory manually, then convert them to PNG format:</li>
    </ol>
    
    <div style="margin: 20px 0;">
      ${files.map(file => `
        <div style="margin-bottom: 20px;">
          <h3>${file.name} (${file.size}x${file.size})</h3>
          <div style="border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
            <pre>${generateTruckingLogisticsIcon(file.size).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
          <textarea rows="5" style="width: 100%;">${generateTruckingLogisticsIcon(file.size)}</textarea>
        </div>
      `).join('')}
    </div>
    
    <p>You can convert these SVGs to PNG using online tools like:</p>
    <ul>
      <li><a href="https://svgtopng.com/" target="_blank">svgtopng.com</a></li>
      <li><a href="https://convertio.co/svg-png/" target="_blank">convertio.co</a></li>
      <li>Or use a graphic editor like Sketch, Figma, or Photoshop</li>
    </ul>
  </div>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync(path.join(process.cwd(), 'generate-images.html'), html);
console.log('Created generate-images.html - open this file in your browser to get SVG code for your placeholder images');

// Create SVG files directly
files.forEach(file => {
  const svgContent = generateTruckingLogisticsIcon(file.size);
  const svgFilePath = path.join(imagesDir, file.name.replace('.png', '.svg'));
  fs.writeFileSync(svgFilePath, svgContent);
  console.log(`Created ${svgFilePath}`);
});

console.log('\nPlease convert the SVG files to PNG format and place them in the assets/images directory.');
console.log('You need to have these files before building your app:');
files.forEach(file => {
  console.log(`- assets/images/${file.name}`);
});