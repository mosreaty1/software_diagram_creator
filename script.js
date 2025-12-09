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
    // Split by line breaks, commas, periods, or semicolons
    const lines = requirements.split(/[\n;]/).map(line => line.trim()).filter(line => line);

    switch(diagramType) {
        case 'flowchart':
            return generateFlowchart(requirements, lines);
        case 'sequence':
            return generateSequenceDiagram(requirements, lines);
        case 'class':
            return generateClassDiagram(requirements, lines);
        case 'er':
            return generateERDiagram(requirements, lines);
        case 'state':
            return generateStateDiagram(requirements, lines);
        case 'gantt':
            return generateGanttChart(requirements, lines);
        default:
            return generateFlowchart(requirements, lines);
    }
}

function generateFlowchart(text, lines) {
    let mermaid = 'graph TD\n';
    const nodes = [];
    const connections = [];
    let nodeCounter = 0;

    // Clean and parse lines
    const steps = lines.map(line => {
        // Remove common bullet points and numbering
        return line.replace(/^[-•*\d+.)\]]\s*/, '').trim();
    }).filter(line => line.length > 0);

    // If no steps, create from sentences
    if (steps.length === 0) {
        steps.push(...text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 3));
    }

    let hasStart = false;
    let hasEnd = false;
    const nodeMap = new Map();

    steps.forEach((step, index) => {
        const lowerStep = step.toLowerCase();
        let nodeId = `N${nodeCounter++}`;
        let nodeType = 'rect'; // default rectangle
        let label = step;

        // Detect node types based on keywords
        if (lowerStep.match(/\b(start|begin|initial)\b/) && !hasStart) {
            nodeId = 'Start';
            nodeType = 'stadium';
            label = 'Start';
            hasStart = true;
        } else if (lowerStep.match(/\b(end|finish|complete|done|exit)\b/)) {
            nodeId = 'End';
            nodeType = 'stadium';
            label = 'End';
            hasEnd = true;
        } else if (lowerStep.match(/\b(if|check|verify|validate|is|are|does|can|should|whether)\b/) || lowerStep.includes('?')) {
            nodeType = 'diamond';
            label = step.replace(/[?]/g, '');
        } else if (lowerStep.match(/\b(error|fail|exception|invalid)\b/)) {
            nodeType = 'rect';
            label = step;
        }

        // Truncate long labels
        if (label.length > 50) {
            label = label.substring(0, 47) + '...';
        }

        nodeMap.set(index, { id: nodeId, type: nodeType, label: label });
    });

    // Generate node definitions
    nodeMap.forEach((node, index) => {
        let nodeDef = '';
        switch (node.type) {
            case 'stadium':
                nodeDef = `    ${node.id}([${node.label}])`;
                break;
            case 'diamond':
                nodeDef = `    ${node.id}{${node.label}}`;
                break;
            default:
                nodeDef = `    ${node.id}[${node.label}]`;
        }
        nodes.push(nodeDef);
    });

    // Generate connections
    const nodeArray = Array.from(nodeMap.values());
    for (let i = 0; i < nodeArray.length - 1; i++) {
        const current = nodeArray[i];
        const next = nodeArray[i + 1];

        if (current.type === 'diamond') {
            // Decision node - create Yes/No branches
            connections.push(`    ${current.id} -->|Yes| ${next.id}`);

            // Try to find an alternative path (error/no path)
            if (i + 2 < nodeArray.length) {
                const alt = nodeArray[i + 2];
                connections.push(`    ${current.id} -->|No| ${alt.id}`);
                connections.push(`    ${next.id} --> ${alt.id}`);
                i++; // Skip the next node since we already connected it
            }
        } else {
            connections.push(`    ${current.id} --> ${next.id}`);
        }
    }

    mermaid += nodes.join('\n') + '\n' + connections.join('\n');
    return mermaid;
}

function generateSequenceDiagram(text, lines) {
    let mermaid = 'sequenceDiagram\n';

    // Extract participants and interactions
    const participants = new Set();
    const interactions = [];
    const actionWords = ['send', 'sends', 'receive', 'receives', 'call', 'calls', 'return', 'returns',
                         'request', 'requests', 'respond', 'responds', 'query', 'queries', 'validate',
                         'validates', 'authenticate', 'authenticates', 'notify', 'notifies', 'to', 'from'];

    lines.forEach(line => {
        const cleaned = line.replace(/^[-•*\d+.)\]]\s*/, '').trim();
        if (!cleaned) return;

        const lowerLine = cleaned.toLowerCase();
        const words = cleaned.split(/\s+/);

        // Extract participants (capitalize words that aren't action words)
        words.forEach(word => {
            const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
            if (cleanWord.length > 2 && !actionWords.includes(cleanWord.toLowerCase())) {
                // Capitalize first letter
                const participant = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
                if (participants.size < 6) { // Limit to 6 participants
                    participants.add(participant);
                }
            }
        });

        // Parse interaction patterns
        let from = null, to = null, message = cleaned;

        // Pattern: "A sends/calls/requests to B"
        const pattern1 = cleaned.match(/^(\w+)\s+(sends?|calls?|requests?|validates?|queries?|notifies?)\s+(?:to\s+)?(\w+)/i);
        if (pattern1) {
            from = pattern1[1].charAt(0).toUpperCase() + pattern1[1].slice(1);
            to = pattern1[3].charAt(0).toUpperCase() + pattern1[3].slice(1);
            message = pattern1[2];
        }

        // Pattern: "A to B: message" or "A -> B"
        const pattern2 = cleaned.match(/^(\w+)\s+(?:to|->)\s+(\w+)[\s:]*(.*)$/i);
        if (!from && pattern2) {
            from = pattern2[1].charAt(0).toUpperCase() + pattern2[1].slice(1);
            to = pattern2[2].charAt(0).toUpperCase() + pattern2[2].slice(1);
            message = pattern2[3] || 'message';
        }

        interactions.push({ from, to, message: message.substring(0, 40) });
    });

    // Add participants
    const participantArray = Array.from(participants);
    participantArray.forEach(p => {
        mermaid += `    participant ${p}\n`;
    });

    // Add interactions
    interactions.forEach((interaction, index) => {
        let from = interaction.from || participantArray[index % participantArray.length];
        let to = interaction.to || participantArray[(index + 1) % participantArray.length];

        if (from && to && from !== to) {
            mermaid += `    ${from}->>${to}: ${interaction.message}\n`;
        }
    });

    // If no meaningful interactions, create a simple flow
    if (interactions.length === 0 && participantArray.length >= 2) {
        for (let i = 0; i < participantArray.length - 1; i++) {
            mermaid += `    ${participantArray[i]}->>${participantArray[i + 1]}: Request\n`;
            mermaid += `    ${participantArray[i + 1]}-->>${participantArray[i]}: Response\n`;
        }
    }

    return mermaid;
}

function generateClassDiagram(text, lines) {
    let mermaid = 'classDiagram\n';
    const classMap = new Map();
    const relationships = [];

    lines.forEach(line => {
        const cleaned = line.replace(/^[-•*\d+.)\]]\s*/, '').trim();
        if (!cleaned) return;

        const lowerLine = cleaned.toLowerCase();

        // Extract class names (look for capitalized words or after "class" keyword)
        const classPattern = /\b([A-Z][a-zA-Z0-9]*)\b/g;
        const classKeywordPattern = /(\w+)\s+class/i;

        let match;
        while ((match = classPattern.exec(cleaned)) !== null) {
            const className = match[1];
            if (!classMap.has(className)) {
                classMap.set(className, { attributes: [], methods: [] });
            }
        }

        // Also check for explicit class declarations
        const keywordMatch = cleaned.match(classKeywordPattern);
        if (keywordMatch) {
            const className = keywordMatch[1].charAt(0).toUpperCase() + keywordMatch[1].slice(1);
            if (!classMap.has(className)) {
                classMap.set(className, { attributes: [], methods: [] });
            }
        }

        // Extract attributes (look for "has", "with", "contains")
        if (lowerLine.match(/\b(has|with|contains|includes)\b/)) {
            const parts = cleaned.split(/\b(has|with|contains|includes)\b/i);
            if (parts.length >= 3) {
                const classNamePart = parts[0].trim();
                const attributesPart = parts[2].trim();

                // Find class name
                const classMatch = classNamePart.match(/\b([A-Z][a-zA-Z0-9]*)\b/);
                if (classMatch) {
                    const className = classMatch[1];
                    if (!classMap.has(className)) {
                        classMap.set(className, { attributes: [], methods: [] });
                    }

                    // Extract attributes
                    const attrs = attributesPart.split(/\b(and|,)\b/).map(a => a.trim()).filter(a => a && a !== 'and' && a !== ',');
                    attrs.forEach(attr => {
                        const cleanAttr = attr.replace(/[^a-zA-Z0-9\s]/g, '').trim();
                        if (cleanAttr && cleanAttr.length > 0) {
                            classMap.get(className).attributes.push(cleanAttr);
                        }
                    });
                }
            }
        }

        // Extract relationships
        if (lowerLine.match(/\b(inherits|extends|implements)\b/)) {
            const match = cleaned.match(/(\w+)\s+(inherits|extends|implements)\s+(\w+)/i);
            if (match) {
                relationships.push({ from: match[1], to: match[3], type: 'inheritance' });
            }
        }

        if (lowerLine.match(/\b(has|contains|uses|owns)\b.*\b(one|many|multiple)\b/)) {
            const classes = Array.from(cleaned.matchAll(/\b([A-Z][a-zA-Z0-9]*)\b/g)).map(m => m[1]);
            if (classes.length >= 2) {
                relationships.push({ from: classes[0], to: classes[1], type: 'association' });
            }
        }
    });

    // If no classes found, extract common nouns
    if (classMap.size === 0) {
        const words = text.split(/\s+/);
        const commonClasses = ['User', 'Product', 'Order', 'Customer', 'Item', 'Service', 'Account', 'Payment'];
        words.forEach(word => {
            const cleaned = word.replace(/[^a-zA-Z]/g, '');
            const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
            if (cleaned.length > 3 && (cleaned[0] === cleaned[0].toUpperCase() || commonClasses.includes(capitalized))) {
                if (!classMap.has(capitalized) && classMap.size < 5) {
                    classMap.set(capitalized, { attributes: ['id', 'name', 'createdAt'], methods: [] });
                }
            }
        });
    }

    // Generate class definitions
    classMap.forEach((classData, className) => {
        mermaid += `    class ${className} {\n`;

        // Add attributes
        if (classData.attributes.length > 0) {
            classData.attributes.forEach(attr => {
                mermaid += `        +${attr}\n`;
            });
        } else {
            mermaid += `        +id\n`;
            mermaid += `        +name\n`;
        }

        // Add a method
        mermaid += `        +get${className}()\n`;
        mermaid += `    }\n`;
    });

    // Generate relationships
    if (relationships.length > 0) {
        relationships.forEach(rel => {
            if (classMap.has(rel.from) && classMap.has(rel.to)) {
                const arrow = rel.type === 'inheritance' ? ' <|-- ' : ' --> ';
                mermaid += `    ${rel.to}${arrow}${rel.from}\n`;
            }
        });
    } else {
        // Create default relationships
        const classArray = Array.from(classMap.keys());
        for (let i = 0; i < classArray.length - 1; i++) {
            mermaid += `    ${classArray[i]} --> ${classArray[i + 1]}\n`;
        }
    }

    return mermaid;
}

function generateERDiagram(text, lines) {
    let mermaid = 'erDiagram\n';
    const entities = new Map();
    const relationships = [];

    const stopWords = ['the', 'and', 'has', 'have', 'with', 'for', 'entity', 'table', 'database'];

    lines.forEach(line => {
        const cleaned = line.replace(/^[-•*\d+.)\]]\s*/, '').trim();
        if (!cleaned) return;

        const lowerLine = cleaned.toLowerCase();

        // Extract entity names (capitalized words or after "entity"/"table" keywords)
        const words = cleaned.split(/\s+/);
        words.forEach(word => {
            const cleanWord = word.replace(/[^a-zA-Z]/g, '');
            if (cleanWord.length > 2 && !stopWords.includes(cleanWord.toLowerCase())) {
                const entityName = cleanWord.toUpperCase();
                if (!entities.has(entityName) && entities.size < 6) {
                    entities.set(entityName, []);
                }
            }
        });

        // Extract relationships
        const relPatterns = [
            { regex: /(\w+)\s+(?:has|have|contains?)\s+(?:one|many|multiple)?\s*(\w+)/i, card: '||--o{' },
            { regex: /(\w+)\s+(?:belongs?\s+to)\s+(\w+)/i, card: '}o--||' },
            { regex: /(\w+)\s+(?:references?|links?\s+to)\s+(\w+)/i, card: '}o--||' }
        ];

        relPatterns.forEach(pattern => {
            const match = cleaned.match(pattern.regex);
            if (match) {
                const from = match[1].toUpperCase();
                const to = match[2].toUpperCase();
                if (from !== to) {
                    relationships.push({ from, to, cardinality: pattern.card, label: 'has' });
                }
            }
        });
    });

    // Generate entity definitions
    entities.forEach((attrs, entityName) => {
        mermaid += `    ${entityName} {\n`;
        mermaid += `        int id PK\n`;
        mermaid += `        string name\n`;
        mermaid += `        datetime created_at\n`;
        mermaid += `        datetime updated_at\n`;
        mermaid += `    }\n`;
    });

    // Generate relationships
    if (relationships.length > 0) {
        relationships.forEach(rel => {
            if (entities.has(rel.from) && entities.has(rel.to)) {
                mermaid += `    ${rel.from} ${rel.cardinality} ${rel.to} : "${rel.label}"\n`;
            }
        });
    } else {
        // Create default relationships
        const entityArray = Array.from(entities.keys());
        for (let i = 0; i < entityArray.length - 1; i++) {
            const card = i % 2 === 0 ? '||--o{' : '}o--||';
            mermaid += `    ${entityArray[i]} ${card} ${entityArray[i + 1]} : "relates to"\n`;
        }
    }

    return mermaid;
}

function generateStateDiagram(text, lines) {
    let mermaid = 'stateDiagram-v2\n';

    const states = [];
    const transitions = [];

    lines.forEach(line => {
        const cleaned = line.replace(/^[-•*\d+.)\]]\s*/, '').trim();
        if (!cleaned) return;

        const lowerLine = cleaned.toLowerCase();

        // Skip lines that just say "start" or "end"
        if (lowerLine === 'start' || lowerLine === 'begin') {
            return;
        }

        if (lowerLine === 'end' || lowerLine === 'finish') {
            return;
        }

        // Extract state names
        let stateName = cleaned.replace(/[^a-zA-Z0-9\s]/g, '').trim();

        // Look for transition keywords
        if (lowerLine.match(/\b(to|then|next|goes\s+to|transitions?\s+to|moves?\s+to|becomes?)\b/)) {
            const parts = cleaned.split(/\b(to|then|next|goes\s+to|transitions?\s+to|moves?\s+to|becomes?)\b/i);
            if (parts.length >= 3) {
                const from = parts[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
                const to = parts[2].replace(/[^a-zA-Z0-9\s]/g, '').trim();
                if (from && to) {
                    if (!states.includes(from)) states.push(from);
                    if (!states.includes(to)) states.push(to);
                    transitions.push({ from, to });
                    return;
                }
            }
        }

        // Otherwise, treat as a state
        if (stateName && stateName.length > 0 && !states.includes(stateName)) {
            states.push(stateName);
        }
    });

    // Start state
    mermaid += '    [*] --> ' + (states.length > 0 ? states[0] : 'Start') + '\n';

    // Add explicit transitions or create sequential flow
    if (transitions.length > 0) {
        transitions.forEach(t => {
            mermaid += `    ${t.from} --> ${t.to}\n`;
        });
    } else {
        for (let i = 0; i < states.length - 1; i++) {
            mermaid += `    ${states[i]} --> ${states[i + 1]}\n`;
        }
    }

    // End state
    if (states.length > 0) {
        mermaid += `    ${states[states.length - 1]} --> [*]\n`;
    }

    return mermaid;
}

function generateGanttChart(text, lines) {
    let mermaid = 'gantt\n';
    mermaid += '    title Project Timeline\n';
    mermaid += '    dateFormat YYYY-MM-DD\n';

    const sections = new Map();
    let currentSection = 'Tasks';

    lines.forEach((line, index) => {
        const cleaned = line.replace(/^[-•*\d+.)\]]\s*/, '').trim();
        if (!cleaned) return;

        const lowerLine = cleaned.toLowerCase();

        // Check for section keywords
        if (lowerLine.match(/\b(phase|section|stage|sprint|milestone)\b/)) {
            currentSection = cleaned.replace(/\b(phase|section|stage|sprint|milestone)\b:?\s*/i, '').trim();
            if (!sections.has(currentSection)) {
                sections.set(currentSection, []);
            }
        } else {
            // Add as a task
            if (!sections.has(currentSection)) {
                sections.set(currentSection, []);
            }
            sections.get(currentSection).push(cleaned);
        }
    });

    // If no sections found, create a default section
    if (sections.size === 0) {
        sections.set('Project Tasks', lines.map(l => l.replace(/^[-•*\d+.)\]]\s*/, '').trim()).filter(l => l));
    }

    // Generate Gantt chart
    let taskCounter = 0;
    sections.forEach((tasks, sectionName) => {
        mermaid += `    section ${sectionName}\n`;

        tasks.forEach((task, index) => {
            if (task) {
                const taskName = task.substring(0, 40);
                const duration = Math.max(3, Math.ceil(task.length / 10)); // Estimate duration based on task complexity
                const startDay = taskCounter * duration;

                mermaid += `    ${taskName} :${duration}d\n`;
                taskCounter++;
            }
        });
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
