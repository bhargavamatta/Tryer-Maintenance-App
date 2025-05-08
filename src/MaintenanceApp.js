import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import _ from 'lodash';

const MaintenanceApp = () => {
  // State for application
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([
    'Floors', 
    'Trash', 
    'Bathrooms', 
    'Kitchen', 
    'Dusting', 
    'Windows', 
    'Maintenance'
  ]);
  const [assignments, setAssignments] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [comments, setComments] = useState({});
  const [notification, setNotification] = useState('');
  const [activeView, setActiveView] = useState('assignments');
  const [newEmployee, setNewEmployee] = useState('');
  const [newRole, setNewRole] = useState('');

  // Function to handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          Papa.parse(event.target.result, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              // Extract employee names from CSV
              const parsedEmployees = results.data.map(row => row.Name || row.Employee || row.EmployeeName || Object.values(row)[0]).filter(Boolean);
              setEmployees(parsedEmployees);
              showNotification('Employees loaded successfully!');
              generateAssignments(parsedEmployees, roles);
            }
          });
        } else {
          // Assume Excel
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          
          // Extract employee names
          const parsedEmployees = jsonData.map(row => row.Name || row.Employee || row.EmployeeName || Object.values(row)[0]).filter(Boolean);
          setEmployees(parsedEmployees);
          showNotification('Employees loaded successfully!');
          generateAssignments(parsedEmployees, roles);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        showNotification('Error parsing file. Please check format.');
      }
    };
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Generate random assignments
  const generateAssignments = (employeeList = employees, roleList = roles) => {
    if (employeeList.length === 0) {
      showNotification('Please add employees first!');
      return;
    }

    // Calculate how many weeks needed for full rotation
    const totalWeeks = Math.ceil((employeeList.length * roleList.length) / employeeList.length);
    
    // Create empty assignment structure for all weeks
    const newAssignments = Array(totalWeeks).fill().map(() => ({}));
    
    // For each role, create a shuffled queue of employees
    const employeeQueues = {};
    roleList.forEach(role => {
      // Create a shuffled queue for each role
      employeeQueues[role] = _.shuffle([...employeeList]);
    });
    
    // For each week
    for (let week = 0; week < totalWeeks; week++) {
      const weekAssignments = {};
      
      // Track assigned employees this week to avoid duplicates
      const assignedThisWeek = new Set();
      
      // First pass - try to assign roles
      roleList.forEach(role => {
        // Find an employee who isn't assigned this week and hasn't done this role
        for (let i = 0; i < employeeQueues[role].length; i++) {
          const candidate = employeeQueues[role][i];
          
          // Check if this employee is already assigned this week
          if (!assignedThisWeek.has(candidate)) {
            // Assign this employee to the role
            weekAssignments[role] = candidate;
            assignedThisWeek.add(candidate);
            
            // Remove from queue and add to back
            employeeQueues[role].splice(i, 1);
            employeeQueues[role].push(candidate);
            break;
          }
        }
      });
      
      // Second pass - fill any unassigned roles
      roleList.forEach(role => {
        if (!weekAssignments[role]) {
          // Find any unassigned employee
          for (let employee of employeeList) {
            if (!assignedThisWeek.has(employee)) {
              weekAssignments[role] = employee;
              assignedThisWeek.add(employee);
              break;
            }
          }
          
          // If still unassigned, just pick someone already assigned
          if (!weekAssignments[role]) {
            weekAssignments[role] = employeeList[0];
          }
        }
      });
      
      newAssignments[week] = weekAssignments;
    }
    
    setAssignments(newAssignments);
    setCurrentWeek(1);
    showNotification('Assignments generated successfully!');
  };

  // Add a new employee
  const addEmployee = () => {
    if (!newEmployee.trim()) return;
    if (employees.includes(newEmployee.trim())) {
      showNotification('This employee already exists!');
      return;
    }
    
    const updatedEmployees = [...employees, newEmployee.trim()];
    setEmployees(updatedEmployees);
    setNewEmployee('');
    
    // Regenerate assignments with new employee list
    generateAssignments(updatedEmployees, roles);
  };

  // Remove an employee
  const removeEmployee = (employeeToRemove) => {
    const updatedEmployees = employees.filter(emp => emp !== employeeToRemove);
    setEmployees(updatedEmployees);
    
    // Regenerate assignments with updated employee list
    generateAssignments(updatedEmployees, roles);
  };

  // Add a new role
  const addRole = () => {
    if (!newRole.trim()) return;
    if (roles.includes(newRole.trim())) {
      showNotification('This role already exists!');
      return;
    }
    
    const updatedRoles = [...roles, newRole.trim()];
    setRoles(updatedRoles);
    setNewRole('');
    
    // Regenerate assignments with new role list
    generateAssignments(employees, updatedRoles);
  };

  // Remove a role
  const removeRole = (roleToRemove) => {
    const updatedRoles = roles.filter(role => role !== roleToRemove);
    setRoles(updatedRoles);
    
    // Regenerate assignments with updated role list
    generateAssignments(employees, updatedRoles);
  };

  // Add or update a comment
  const updateComment = (week, role, comment) => {
    setComments(prev => {
      const key = `${week}-${role}`;
      return {
        ...prev,
        [key]: comment
      };
    });
  };

  // Get comment for a specific assignment
  const getComment = (week, role) => {
    const key = `${week}-${role}`;
    return comments[key] || '';
  };

  // Export to Excel
  const exportToExcel = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Create data for assignments
    const assignmentData = [];
    
    // Add header row
    const headerRow = ['Week', ...roles, 'Notes'];
    assignmentData.push(headerRow);
    
    // Add assignment rows
    assignments.forEach((weekAssignments, index) => {
      const weekNum = index + 1;
      const row = [weekNum];
      
      // Add assigned employee for each role
      roles.forEach(role => {
        row.push(weekAssignments[role] || '');
      });
      
      // Add notes column
      const weekNotes = Object.keys(comments)
        .filter(key => key.startsWith(`${weekNum}-`))
        .map(key => {
          const role = key.split('-')[1];
          return `${role}: ${comments[key]}`;
        })
        .join('\n');
      
      row.push(weekNotes);
      assignmentData.push(row);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(assignmentData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Assignments');
    
    // Add employees worksheet
    const employeeWs = XLSX.utils.aoa_to_sheet([['Employees'], ...employees.map(emp => [emp])]);
    XLSX.utils.book_append_sheet(wb, employeeWs, 'Employees');
    
    // Add roles worksheet
    const rolesWs = XLSX.utils.aoa_to_sheet([['Roles'], ...roles.map(role => [role])]);
    XLSX.utils.book_append_sheet(wb, rolesWs, 'Roles');
    
    // Write to file and trigger download
    XLSX.writeFile(wb, 'Maintenance_and_Cleaning_Schedule.xlsx');
    showNotification('File exported successfully!');
  };

  // Show notification message
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  // Navigate between weeks
  const goToWeek = (week) => {
    if (week < 1) week = 1;
    if (week > assignments.length) week = assignments.length;
    setCurrentWeek(week);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">Maintenance & Cleaning Task Rotation</h1>
        
        {/* Notification */}
        {notification && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
            {notification}
          </div>
        )}
        
        {/* Navigation Tabs */}
        <div className="flex mb-6 bg-white rounded-lg shadow overflow-hidden">
          <button 
            className={`px-4 py-3 font-medium ${activeView === 'assignments' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveView('assignments')}
          >
            Weekly Assignments
          </button>
          <button 
            className={`px-4 py-3 font-medium ${activeView === 'setup' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveView('setup')}
          >
            Setup
          </button>
        </div>
        
        {activeView === 'assignments' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Week {currentWeek} Assignments</h2>
              <div className="flex items-center">
                <button 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l"
                  onClick={() => goToWeek(currentWeek - 1)}
                  disabled={currentWeek === 1}
                >
                  Previous
                </button>
                <span className="bg-gray-100 py-2 px-4">
                  {currentWeek} of {assignments.length}
                </span>
                <button 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r"
                  onClick={() => goToWeek(currentWeek + 1)}
                  disabled={currentWeek === assignments.length}
                >
                  Next
                </button>
              </div>
            </div>
            
            {assignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-3 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="py-3 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="py-3 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {roles.map(role => {
                      const weekAssignments = assignments[currentWeek - 1] || {};
                      const assignedEmployee = weekAssignments[role] || 'Unassigned';
                      
                      return (
                        <tr key={role}>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {role}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {assignedEmployee}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            <textarea
                              className="w-full p-2 border rounded"
                              value={getComment(currentWeek, role)}
                              onChange={(e) => updateComment(currentWeek, role, e.target.value)}
                              placeholder="Add notes here..."
                              rows="2"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No assignments yet. Upload employee list or add employees to generate assignments.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Management */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Employee Management</h3>
                
                {/* Add Employee */}
                <div className="flex mb-4">
                  <input
                    type="text"
                    className="flex-grow p-2 border rounded-l"
                    placeholder="Enter employee name"
                    value={newEmployee}
                    onChange={(e) => setNewEmployee(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmployee()}
                  />
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r"
                    onClick={addEmployee}
                  >
                    Add
                  </button>
                </div>
                
                {/* Employee List */}
                <div className="border rounded bg-white overflow-y-auto max-h-60">
                  {employees.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {employees.map((employee, index) => (
                        <li key={index} className="flex justify-between items-center p-3">
                          <span>{employee}</span>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeEmployee(employee)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center p-4 text-gray-500">No employees added yet</p>
                  )}
                </div>
                
                {/* File Upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import Employees from File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload Excel or CSV file with employee names</p>
                </div>
              </div>
              
              {/* Role Management */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Role Management</h3>
                
                {/* Add Role */}
                <div className="flex mb-4">
                  <input
                    type="text"
                    className="flex-grow p-2 border rounded-l"
                    placeholder="Enter role name"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRole()}
                  />
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r"
                    onClick={addRole}
                  >
                    Add
                  </button>
                </div>
                
                {/* Role List */}
                <div className="border rounded bg-white overflow-y-auto max-h-60">
                  {roles.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {roles.map((role, index) => (
                        <li key={index} className="flex justify-between items-center p-3">
                          <span>{role}</span>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeRole(role)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center p-4 text-gray-500">No roles added yet</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-6 flex justify-center space-x-4">
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded"
                onClick={() => generateAssignments()}
              >
                Generate Assignments
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
                onClick={exportToExcel}
                disabled={assignments.length === 0}
              >
                Export to Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceApp;
