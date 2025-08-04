// src/components/shared/constants.js

export const CATEGORIES = [
  'Mainframe', 'Minicomputer', 'Microcomputer', 'Personal Computer',
  'Laptop', 'Server', 'Storage Device', 'Peripheral', 'Component',
  'Mobile Device', 'Media Player', 'Software', 'Documentation', 
  'Marketing', 'Book', 'Clothing', 'Other'
];

export const CONDITIONS = [
  'Mint', 'Excellent', 'Good', 'Working', 
  'Fair', 'Restored', 'Poor', 'For Parts'
];

export const TASK_STATUSES = ['To Do', 'In Progress', 'Complete', 'None'];

export const TASK_PRIORITIES = ['High', 'Medium', 'Low', 'None'];

export const getConditionColor = (condition) => {
  switch(condition) {
    case 'Mint':
    case 'Excellent':
      return 'bg-green-100 text-green-800';
    case 'Good':
    case 'Working':
      return 'bg-blue-100 text-blue-800';
    case 'Fair':
    case 'Restored':
      return 'bg-yellow-100 text-yellow-800';
    case 'Poor':
    case 'For Parts':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority) => {
  switch(priority) {
    case 'High': return 'text-red-600 bg-red-50';
    case 'Medium': return 'text-orange-600 bg-orange-50';
    case 'Low': return 'text-yellow-600 bg-yellow-50';
    case 'None': return 'text-gray-600 bg-gray-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};