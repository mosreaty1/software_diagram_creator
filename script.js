// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
    }
});

// Get DOM elements
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const exampleBtn = document.getElementById('exampleBtn');
const downloadBtn = document.getElementById('downloadBtn');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const userRequirements = document.getElementById('userRequirements');
const diagramOutput = document.getElementById('diagramOutput');
const mermaidCodeElement = document.getElementById('mermaidCode');
const codeSection = document.getElementById('codeSection');

// Event listeners
generateBtn.addEventListener('click', generateDiagram);
clearBtn.addEventListener('click', clearAll);
exampleBtn.addEventListener('click', loadExample);
downloadBtn.addEventListener('click', downloadDiagram);
copyCodeBtn.addEventListener('click', copyCode);

// Generate diagram based on user requirements
async function generateDiagram() {
    const requirements = userRequirements.value.trim();
    const diagramType = document.querySelector('input[name="diagramType"]:checked').value;

    if (!requirements) {
        alert('Please enter your requirements first!');
        return;
    }

    // Show loading state
    generateBtn.innerHTML = '<span class="loading"></span> Generating...';
    generateBtn.disabled = true;

    try {
        // Convert requirements to Mermaid syntax
        const mermaidCode = convertToMermaid(requirements, diagramType);

        // Display the code
        mermaidCodeElement.textContent = mermaidCode;
        codeSection.style.display = 'block';

        // Render the diagram
        await renderDiagram(mermaidCode);

        // Show action buttons
        downloadBtn.style.display = 'inline-block';
        copyCodeBtn.style.display = 'inline-block';

    } catch (error) {
        console.error('Error generating diagram:', error);
        diagramOutput.innerHTML = `
            <div style="color: #ef4444; text-align: center;">
                <p><strong>Error generating diagram</strong></p>
                <p>Please check your requirements and try again.</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
    } finally {
        generateBtn.innerHTML = 'Generate Diagram';
        generateBtn.disabled = false;
    }
}

// Convert plain text requirements to Mermaid syntax
function convertToMermaid(requirements, diagramType) {
    const lines = requirements.toLowerCase().split(/[,.\n]+/).map(line => line.trim()).filter(line => line);

    switch(diagramType) {
        case 'flowchart':
            return generateFlowchart(lines);
        case 'sequence':
            return generateSequenceDiagram(lines);
        case 'class':
            return generateClassDiagram(lines);
        case 'er':
            return generateERDiagram(lines);
        case 'state':
            return generateStateDiagram(lines);
        case 'gantt':
            return generateGanttChart(lines);
        default:
            return generateFlowchart(lines);
    }
}

function generateFlowchart(lines) {
    let mermaid = 'graph TD\n';
    let nodeId = 0;
    const nodes = [];

    // Parse requirements
    lines.forEach(line => {
        if (line.includes('start')) {
            nodes.push(`    A${nodeId}([Start])`);
            nodeId++;
        } else if (line.includes('end')) {
            nodes.push(`    Z([End])`);
        } else if (line.includes('if') || line.includes('check') || line.includes('valid')) {
            const label = line.substring(0, 40);
            nodes.push(`    D${nodeId}{${label}?}`);
            nodeId++;
        } else if (line.includes('error') || line.includes('fail')) {
            const label = line.substring(0, 40);
            nodes.push(`    E${nodeId}[${label}]`);
            nodeId++;
        } else if (line) {
            const label = line.substring(0, 40);
            nodes.push(`    B${nodeId}[${label}]`);
            nodeId++;
        }
    });

    // Add nodes
    mermaid += nodes.join('\n') + '\n';

    // Add connections
    for (let i = 0; i < nodes.length - 1; i++) {
        const currentNode = nodes[i].trim().split(/[\[\(\{]/)[0].trim();
        const nextNode = nodes[i + 1].trim().split(/[\[\(\{]/)[0].trim();

        if (currentNode.startsWith('D')) {
            mermaid += `    ${currentNode} -->|Yes| ${nextNode}\n`;
            if (i + 2 < nodes.length) {
                const afterNext = nodes[i + 2].trim().split(/[\[\(\{]/)[0].trim();
                mermaid += `    ${currentNode} -->|No| ${afterNext}\n`;
            }
        } else {
            mermaid += `    ${currentNode} --> ${nextNode}\n`;
        }
    }

    return mermaid;
}

function generateSequenceDiagram(lines) {
    let mermaid = 'sequenceDiagram\n';

    // Extract participants
    const participants = new Set();
    lines.forEach(line => {
        const words = line.split(/\s+/);
        words.forEach(word => {
            if (word.length > 3 && !['sends', 'receives', 'calls', 'returns', 'requests', 'responds'].includes(word)) {
                participants.add(word);
            }
        });
    });

    // Add participants
    Array.from(participants).slice(0, 5).forEach(p => {
        mermaid += `    participant ${p.charAt(0).toUpperCase() + p.slice(1)}\n`;
    });

    // Add interactions
    lines.forEach(line => {
        const parts = Array.from(participants);
        if (parts.length >= 2) {
            const from = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            const to = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
            const message = line.substring(0, 30);
            mermaid += `    ${from}->>${to}: ${message}\n`;
        }
    });

    return mermaid;
}

function generateClassDiagram(lines) {
    let mermaid = 'classDiagram\n';
    const classes = [];

    lines.forEach(line => {
        const words = line.split(/\s+/);
        words.forEach(word => {
            if (word.length > 3 && word.charAt(0).toUpperCase() === word.charAt(0)) {
                if (!classes.includes(word)) {
                    classes.push(word);
                }
            }
        });
    });

    // Add classes with attributes
    classes.forEach(className => {
        mermaid += `    class ${className} {\n`;

        lines.forEach(line => {
            if (line.includes(className.toLowerCase())) {
                if (line.includes('has') || line.includes('with')) {
                    const attributes = line.split(/has|with/)[1];
                    if (attributes) {
                        const attrs = attributes.split(/and|,/).map(a => a.trim());
                        attrs.forEach(attr => {
                            if (attr) {
                                mermaid += `        +${attr.substring(0, 20)}\n`;
                            }
                        });
                    }
                }
            }
        });

        mermaid += `        +getId()\n`;
        mermaid += `    }\n`;
    });

    // Add relationships
    if (classes.length >= 2) {
        for (let i = 0; i < classes.length - 1; i++) {
            mermaid += `    ${classes[i]} --> ${classes[i + 1]}\n`;
        }
    }

    return mermaid;
}

function generateERDiagram(lines) {
    let mermaid = 'erDiagram\n';
    const entities = [];

    // Extract entities
    lines.forEach(line => {
        const words = line.split(/\s+/);
        words.forEach(word => {
            if (word.length > 3 && !entities.includes(word.toUpperCase())) {
                entities.push(word.toUpperCase());
            }
        });
    });

    // Add entities with attributes
    entities.slice(0, 5).forEach(entity => {
        mermaid += `    ${entity} {\n`;
        mermaid += `        int id PK\n`;
        mermaid += `        string name\n`;
        mermaid += `        datetime created_at\n`;
        mermaid += `    }\n`;
    });

    // Add relationships
    if (entities.length >= 2) {
        mermaid += `    ${entities[0]} ||--o{ ${entities[1]} : contains\n`;
        if (entities.length >= 3) {
            mermaid += `    ${entities[1]} }o--|| ${entities[2]} : references\n`;
        }
    }

    return mermaid;
}

function generateStateDiagram(lines) {
    let mermaid = 'stateDiagram-v2\n';
    mermaid += '    [*] --> Start\n';

    const states = [];
    lines.forEach(line => {
        if (line && !line.includes('start') && !line.includes('end')) {
            const state = line.substring(0, 30).replace(/[^a-zA-Z0-9\s]/g, '');
            if (state.trim()) {
                states.push(state.trim());
            }
        }
    });

    // Add state transitions
    for (let i = 0; i < states.length; i++) {
        if (i === 0) {
            mermaid += `    Start --> ${states[i]}\n`;
        }
        if (i < states.length - 1) {
            mermaid += `    ${states[i]} --> ${states[i + 1]}\n`;
        } else {
            mermaid += `    ${states[i]} --> [*]\n`;
        }
    }

    return mermaid;
}

function generateGanttChart(lines) {
    let mermaid = 'gantt\n';
    mermaid += '    title Project Timeline\n';
    mermaid += '    dateFormat YYYY-MM-DD\n';
    mermaid += '    section Planning\n';

    lines.forEach((line, index) => {
        if (line) {
            const taskName = line.substring(0, 30);
            const duration = `${index + 1}d`;
            mermaid += `    ${taskName} :${duration}\n`;
        }
    });

    return mermaid;
}

// Render diagram using Mermaid
async function renderDiagram(mermaidCode) {
    const id = 'mermaid-' + Date.now();

    try {
        const { svg } = await mermaid.render(id, mermaidCode);
        diagramOutput.innerHTML = svg;
    } catch (error) {
        throw new Error('Failed to render diagram: ' + error.message);
    }
}

// Clear all inputs and outputs
function clearAll() {
    userRequirements.value = '';
    diagramOutput.innerHTML = `
        <div class="placeholder">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5,5"/>
                <text x="50" y="55" text-anchor="middle" fill="currentColor">Your diagram will appear here</text>
            </svg>
        </div>
    `;
    mermaidCodeElement.textContent = '';
    codeSection.style.display = 'none';
    downloadBtn.style.display = 'none';
    copyCodeBtn.style.display = 'none';
}

// Load example based on selected diagram type
function loadExample() {
    const diagramType = document.querySelector('input[name="diagramType"]:checked').value;

    const examples = {
        flowchart: 'User login process:\n- Start\n- User enters credentials\n- Check if credentials are valid\n- If valid, redirect to dashboard\n- If invalid, show error message\n- End',

        sequence: 'User authentication flow:\n- User sends login request to Server\n- Server validates credentials with Database\n- Database returns validation result to Server\n- Server sends authentication token to User\n- User stores token',

        class: 'E-commerce System:\n- User class has name, email, and password\n- Product class has name, price, and description\n- Order class has orderDate and totalAmount\n- User places Order\n- Order contains Product',

        er: 'Blog Database:\n- User entity\n- Post entity\n- Comment entity\n- Tag entity\n- User creates Post\n- Post has Comment',

        state: 'Order Processing States:\n- Order Placed\n- Payment Processing\n- Payment Confirmed\n- Order Shipped\n- Order Delivered\n- Order Completed',

        gantt: 'Software Development Project:\n- Requirements Gathering\n- System Design\n- Frontend Development\n- Backend Development\n- Testing\n- Deployment'
    };

    userRequirements.value = examples[diagramType] || examples.flowchart;
}

// Download diagram as PNG
async function downloadDiagram() {
    const svg = diagramOutput.querySelector('svg');
    if (!svg) {
        alert('No diagram to download!');
        return;
    }

    try {
        // Create a canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Get SVG dimensions
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        // Create image
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Download
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                link.download = 'diagram.png';
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(url);
            });
        };
        img.src = url;
    } catch (error) {
        console.error('Error downloading diagram:', error);
        alert('Error downloading diagram. Please try again.');
    }
}

// Copy Mermaid code to clipboard
async function copyCode() {
    const code = mermaidCodeElement.textContent;

    try {
        await navigator.clipboard.writeText(code);

        // Show success message
        const originalText = copyCodeBtn.textContent;
        copyCodeBtn.textContent = 'Copied!';
        copyCodeBtn.style.background = '#10b981';
        copyCodeBtn.style.color = 'white';

        setTimeout(() => {
            copyCodeBtn.textContent = originalText;
            copyCodeBtn.style.background = '';
            copyCodeBtn.style.color = '';
        }, 2000);
    } catch (error) {
        console.error('Error copying code:', error);
        alert('Error copying code. Please try again.');
    }
}
