# Software Diagram Generator

A beautiful, intuitive web application that transforms plain-text requirements into professional software diagrams. Built with HTML, CSS, JavaScript, and powered by Mermaid.js.

## Features

- **Multiple Diagram Types**: Support for 6 different diagram types
  - Flowcharts
  - Sequence Diagrams
  - Class Diagrams
  - ER Diagrams
  - State Diagrams
  - Gantt Charts

- **Intelligent Parsing**: Converts natural language requirements into diagram syntax
- **Real-time Generation**: Instant diagram creation from your descriptions
- **Export Options**: Download diagrams as PNG images
- **Code Access**: View and copy the generated Mermaid code
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations

## How to Use

1. **Select Diagram Type**: Choose the type of diagram you want to create
2. **Describe Requirements**: Enter your software requirements in plain English
3. **Generate**: Click the "Generate Diagram" button
4. **Download/Copy**: Export your diagram or copy the Mermaid code

## Quick Start

### Local Development

Simply open `index.html` in your web browser. No build process or dependencies required!

```bash
# Clone the repository
git clone https://github.com/mosreaty1/software_diagram_creator.git

# Navigate to the directory
cd software_diagram_creator

# Open in browser
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### GitHub Pages Deployment

This project is ready to deploy on GitHub Pages:

1. Go to your repository settings
2. Navigate to Pages section
3. Select the branch to deploy from
4. Your site will be available at `https://yourusername.github.io/software_diagram_creator/`

## Example Inputs

### Flowchart Example
```
User login process:
- Start
- User enters credentials
- Check if credentials are valid
- If valid, redirect to dashboard
- If invalid, show error message
- End
```

### Sequence Diagram Example
```
User authentication flow:
- User sends login request to Server
- Server validates credentials with Database
- Database returns validation result to Server
- Server sends authentication token to User
```

### Class Diagram Example
```
E-commerce System:
- User class has name, email, and password
- Product class has name, price, and description
- Order class has orderDate and totalAmount
- User places Order
- Order contains Product
```

## Technologies Used

- **HTML5**: Structure and layout
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Logic and interactivity
- **Mermaid.js**: Diagram rendering engine

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Project Structure

```
software_diagram_creator/
├── index.html          # Main HTML file
├── style.css           # Styles and theme
├── script.js           # Application logic
└── README.md           # Documentation
```

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Powered by [Mermaid.js](https://mermaid.js.org/)
- Designed for simplicity and ease of use

## Future Enhancements

- [ ] AI-powered requirement parsing
- [ ] More diagram types (mindmaps, pie charts, etc.)
- [ ] Diagram editing capabilities
- [ ] Save and load diagram templates
- [ ] Dark mode support
- [ ] Collaborative features

## Contact

For questions or feedback, please open an issue on GitHub.

---

Made with ❤️ for software developers and architects
