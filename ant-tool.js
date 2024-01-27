function generateUniqueId() {
    var timestamp = new Date().getTime().toString(36); // Convert timestamp to base36 string
    var randomString = Math.random().toString(36).substr(2, 5); // Generate random string

    return timestamp + randomString;
}

var tree = webix.ui({
    container: "panel-left",
    id: "img_tree",
    view: "tree",
    select: true,
    drag: true,
    select: true,
    data: [],
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let data = [];
let map = {};

let image_id = null;
let editing_mode = 'move';

// Define the onAfterDrop event handler
$$("img_tree").attachEvent("onAfterDrop", function (ctx) {
    data = this.serialize(); // Get the updated tree data
    console.log(data);
});

$$("img_tree").attachEvent("onItemClick", function (id) {
    image_id = id;
});

var translateX = 0;  // Translation along the x-axis
var translateY = 0;   // Translation along the y-axis
var rotationAngle = 0;  // Rotation angle in degrees
var scaleX = 1.0;        // Scaling factor along the x-axis
var scaleY = 1.0;      // Scaling factor along the y-axis

// Convert the rotation angle to radians
var rotationRad = rotationAngle * Math.PI / 180;

// Create the transformation matrix
var init_matrix = [
    [scaleX * Math.cos(rotationRad), scaleX * Math.sin(rotationRad), translateX],
    [-scaleY * Math.sin(rotationRad), scaleY * Math.cos(rotationRad), translateY],
    [0, 0, 1]
];

function multiplyMatrices(matrix1, matrix2) {
    var result = [];

    var rows1 = matrix1.length;
    var cols1 = matrix1[0].length;
    var cols2 = matrix2[0].length;

    for (var i = 0; i < rows1; i++) {
        result[i] = [];
        for (var j = 0; j < cols2; j++) {
            result[i][j] = 0;
            for (var k = 0; k < cols1; k++) {
                result[i][j] += matrix1[i][k] * matrix2[k][j];
            }
        }
    }

    return result;
}

const Translate = (matrix, x, y) => {
    matrix[0][2] += x;
    matrix[1][2] += y;
}

const Rotate = (matrix, rotation) => {
    // Update the rotation components of the matrix
    var cosAngle = Math.cos(rotation);
    var sinAngle = Math.sin(rotation);

    var tempA = matrix[0][0];
    var tempB = matrix[0][1];
    var tempC = matrix[1][0];
    var tempD = matrix[1][1];

    matrix[0][0] = tempA * cosAngle - tempB * sinAngle;
    matrix[0][1] = tempA * sinAngle + tempB * cosAngle;
    matrix[1][0] = tempC * cosAngle - tempD * sinAngle;
    matrix[1][1] = tempC * sinAngle + tempD * cosAngle;
}

const Scale = (matrix, scaleX, scaleY) => {
    matrix[0][0] *= scaleX;
    matrix[1][1] *= scaleY;
}

function transformPoint(matrix, x, y) {
    var transformedX = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2];
    var transformedY = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2];
    var transformedW = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2];

    return { x: transformedX / transformedW, y: transformedY / transformedW };
}

const render_tree = (data, matrix) => {
    data.map(d => {
        if (!map[d.id]) return;
        const { image, transition, scale, rotation } = map[d.id];

        var width = image.naturalWidth;
        var height = image.naturalHeight;

        const TM = [[...init_matrix[0]], [...init_matrix[1]], [...init_matrix[2]]];
        const SM = [[...init_matrix[0]], [...init_matrix[1]], [...init_matrix[2]]];
        const RM = [[...init_matrix[0]], [...init_matrix[1]], [...init_matrix[2]]];

        Translate(TM, -width / 2, -height / 2);
        Scale(SM, scale.x, scale.y);
        Rotate(RM, rotation.value);
        const M = multiplyMatrices(multiplyMatrices(RM, SM), TM);
        Translate(M, width / 2, height / 2);
        Translate(M, transition.x, transition.y);

        const VM = multiplyMatrices(matrix, M)

        // Draw the image at the drop coordinates on the canvas
        ctx.setTransform(VM[0][0], VM[1][0], VM[0][1], VM[1][1], VM[0][2], VM[1][2]);
        ctx.drawImage(image, 0, 0);
        ctx.setTransform(init_matrix);
        const p = [transformPoint(VM, 0, 0), transformPoint(VM, width, 0), transformPoint(VM, 0, height), transformPoint(VM, width, height)];

        if (d.id == image_id) {
            // Draw the rectangle
            // Set the stroke width and color
            ctx.lineWidth = 2;     // Set the stroke width to 2 pixels
            ctx.strokeStyle = "red";  // Set the stroke color to red

            ctx.beginPath();
            ctx.moveTo(p[0].x, p[0].y);
            ctx.lineTo(p[1].x, p[1].y);
            ctx.lineTo(p[3].x, p[3].y);
            ctx.lineTo(p[2].x, p[2].y);
            ctx.closePath();
            ctx.stroke();
        }

        if (d.data)
            render_tree(d.data, VM);
    })
}

const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    render_tree(data, init_matrix);
}

setInterval(render, 1000 / 60);

document.addEventListener('DOMContentLoaded', () => {
    // Handle drag over event for the canvas
    canvas.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    canvas.addEventListener('mousedown', startDragging);
    canvas.addEventListener('mouseup', stopDragging);
    canvas.addEventListener('mousemove', dragImage);

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
                        e.preventDefault();
                        const value = prompt('Enter component name:');
                        const id = generateUniqueId();

                        map[id] = {
                            image,
                            transition: { x: 0, y: 0 },
                            scale: { x: 1.0, y: 1.0 },
                            rotation: { value: 0 }
                        };
                        const d = [{ id, value, data: [{ id: generateUniqueId(), value: "Image" }] }]

                        $$("img_tree").parse(d);

                        data.push(...d);
                    };
                };
            } else {
                alert("Please insert image.");
            }
        }
    });

    const dragButton = document.getElementById('tool-drag');
    dragButton.addEventListener('click', () => {
        editing_mode = 'move';
    });

    const scaleButton = document.getElementById('tool-scale');
    scaleButton.addEventListener('click', () => {
        editing_mode = 'scale';
    });

    const rotateButton = document.getElementById('tool-rotation');
    rotateButton.addEventListener('click', () => {
        editing_mode = 'rotate';
    });
});

let lastX;
let lastY;
let isDragging = false;

function startDragging(event) {
    if (image_id == null) return;
    lastX = event.clientX;
    lastY = event.clientY;
    isDragging = true;
}

const redo_data = {};

function redo(redo_id) {
    data = redo_data[redo_id].data;
    map = redo_data[redo_id].map;
}

function stopDragging() {
    if (isDragging && image_id != null) {
        isDragging = false;

        // Get the data URL representing the canvas image
        var screenshotDataUrl = canvas.toDataURL();

        // Create an image element
        var imgElement = document.createElement("img");

        // Set the source attribute of the image to the screenshot data URL
        imgElement.src = screenshotDataUrl;

        var redo_id = generateUniqueId();

        var new_map = {};
        _.map(map, (m, idx) => {
            const { image, transition, scale, rotation } = m;
            new_map[idx] = { image, transition: { ...transition }, scale: { ...scale }, rotation: { ...rotation } };
        })
        redo_data[redo_id] = { data: _.cloneDeep(data), map: new_map }

        // Add Redo function
        imgElement.addEventListener("click", () => redo(redo_id));

        // Get the div element
        var divElement = document.getElementById("thumbnails");

        // Append the image element to the div
        divElement.appendChild(imgElement);
    }
}

function dragImage(event) {
    if (image_id == null || !map[image_id]) return;
    if (isDragging) {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;

        var { transition, scale, rotation } = map[image_id]

        if (editing_mode == 'move') {
            transition.x += dx;
            transition.y += dy;
        }

        if (editing_mode == 'scale') {
            scale.x *= 1.0 + dx * 0.01;
            scale.y *= 1.0 + dy * 0.01;
        }

        if (editing_mode == 'rotate') {
            // Define the rotation angle in degrees
            var rotationAngle = dx * 0.5;
            // Convert the rotation angle to radians
            var rotationRad = rotationAngle * Math.PI / 180;
            // Set Rotation
            rotation.value += rotationRad
        }

        lastX = event.clientX;
        lastY = event.clientY;
    }
}