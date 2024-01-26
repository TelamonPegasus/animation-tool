const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

let isDragging = false;
let draggedImage = null;
let initialX, lastX = 0;
let initialY, lastY = 0;

let image = null;
let scale = 1;

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
                    image = new Image();
                    image.src = e.target.result;
                    
                    image.onload = (e) => {
                        // Get the drop coordinates relative to the canvas
                        // const rect = canvas.getBoundingClientRect();
                        // const x = event.clientX - rect.left;
                        // const y = event.clientY - rect.top;

                        // Draw the image at the drop coordinates on the canvas
                        context.drawImage(image, 0, 0);
                    };
                };
            }
        }
    });

    const dragButton = document.getElementById('tool-drag');
    dragButton.addEventListener('click', () => {
        isDragging = !isDragging;
        if (isDragging) {
            canvas.addEventListener('mousedown', startDragging);
            canvas.addEventListener('mousemove', dragImage);
            canvas.addEventListener('mouseup', stopDragging);
        } else {
            canvas.removeEventListener('mousedown', startDragging);
            canvas.removeEventListener('mousemove', dragImage);
            canvas.removeEventListener('mouseup', stopDragging);
        }
    });

    const scaleButton = document.getElementById('tool-scale');
    scaleButton.addEventListener('click', () => {
        const scaling = parseFloat(prompt('Enter scaling value:'));
        drawScaledImage(scaling);
    });

    const rotateButton = document.getElementById('tool-rotation');
    rotateButton.addEventListener('click', () => {
        const rotation = parseFloat(prompt('Enter rotation value:'));
        rotateImage(rotation);
    })
});

function rotateImage(event) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    const radian = event * (Math.PI/180);
    context.save();
    context.translate(canvas.width/2, canvas.height/2);
    context.rotate(radian);
    context.drawImage(image, -image.width/2, -image.height/2);

    context.restore();
}

function drawScaledImage(event) {
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate the scaled dimensions of the image
    const scaledWidth = image.width * event;
    const scaledHeight = image.height * event;

    // Draw the image at the scaled dimensions on the canvas
    context.drawImage(image, lastX, lastY, scaledWidth, scaledHeight);
}

function startDragging(event) {
    initialX = event.clientX;
    initialY = event.clientY;
    draggedImage = context.getImageData(0, 0, canvas.width, canvas.height);
}
  
function dragImage(event) {
    if (isDragging && draggedImage) {
      const dx = event.clientX - initialX;
      const dy = event.clientY - initialY;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.putImageData(draggedImage, dx, dy);

      lastX = dx;
      lastY = dy;
    }
}
  
function stopDragging() {
    draggedImage = null;
}
