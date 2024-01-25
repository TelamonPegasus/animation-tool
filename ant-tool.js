const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
document.addEventListener('DOMContentLoaded', () => {
    
    // Handle drag over event for the canvas
    canvas.addEventListener('dragover', (event) => {
        event.preventDefault();
    });
  
    // Handle drop event for the canvas
    canvas.addEventListener('drop', (event) => {
        event.preventDefault();
        
        // Get the dropped files from the event
        const files = event.dataTransfer.files;
        
        // Process each dropped file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
    
            // Check if the dropped file is an image
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                // Read the image file as a data URL
                reader.readAsDataURL(file);
                
                // Handle the file load event
                reader.onload = (e) => {
                    const image = new Image();
                    image.src = e.target.result;
                    
                    // Get the drop coordinates relative to the canvas
                    const rect = canvas.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;

                    // Draw the image at the drop coordinates on the canvas
                    context.drawImage(image, x, y);
                };
            }
        }
    });
});