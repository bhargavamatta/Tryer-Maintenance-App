# Maintenance and Cleaning Task Rotation App

This application helps you manage maintenance and cleaning tasks by randomly assigning roles to team members and rotating them so everyone experiences all responsibilities.

## Setup Instructions

### Prerequisites
- Node.js (version 14.x or higher)
- npm (comes with Node.js)

### Installation

1. **Unzip the file** to a directory of your choice

2. **Open a terminal/command prompt** and navigate to the project directory:
   ```
   cd path/to/maintenance-task-rotation
   ```

3. **Install dependencies**:
   ```
   npm install
   ```

4. **Start the development server**:
   ```
   npm start
   ```

5. **Access the application** by opening a web browser and navigating to:
   ```
   http://localhost:3000
   ```

## Usage Guide

### Adding Employees

There are two ways to add employees:

1. **Manual Entry**:
   - Go to the "Setup" tab
   - Enter employee names one by one in the "Enter employee name" field
   - Click "Add" after each name

2. **Import from File**:
   - Prepare an Excel (.xlsx, .xls) or CSV file with employee names
   - Go to the "Setup" tab
   - Click "Choose File" in the "Import Employees from File" section
   - Select your file and upload

### Managing Roles

1. **Default Roles**:
   - Floors
   - Trash
   - Bathrooms
   - Kitchen
   - Dusting
   - Windows
   - Maintenance

2. **Adding Custom Roles**:
   - Go to the "Setup" tab
   - Enter the role name in the "Enter role name" field
   - Click "Add"

3. **Removing Roles**:
   - Go to the "Setup" tab
   - Find the role you want to remove in the list
   - Click "Remove" next to it

### Generating Assignments

1. After adding employees and customizing roles, click "Generate Assignments"
2. The app will create a rotation schedule that ensures:
   - Roles are randomly assigned
   - Each employee will eventually perform every role
   - No employee is assigned multiple roles in the same week (when possible)

### Weekly Navigation

1. Use the "Previous" and "Next" buttons to navigate between weeks
2. The current week number and total weeks are displayed

### Adding Comments/Notes

1. Navigate to the week you want to add comments for
2. Find the role/assignment row
3. Enter notes in the text box in the "Notes" column

### Exporting to Excel

1. After setting up assignments and adding any notes, click "Export to Excel"
2. A file named "Maintenance_and_Cleaning_Schedule.xlsx" will be downloaded
3. The exported file contains:
   - An "Assignments" sheet with the weekly schedules and notes
   - An "Employees" sheet with all employee names
   - A "Roles" sheet with all role names

## Customization

To modify the application's appearance or functionality, edit the source code files:

- `MaintenanceApp.js` - Main application logic and UI
- `App.js` - Root React component
- `index.js` - Entry point

## Deployment

To deploy to production:

1. Build the optimized version:
   ```
   npm run build
   ```

2. The built files will be in the `build` directory
3. Upload these files to your web server or hosting service

For more specific deployment instructions, refer to the React documentation for [deployment options](https://create-react-app.dev/docs/deployment/).
