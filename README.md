# Employee Portal System

A comprehensive employee management system for HR departments and employees.

## Features

### For Administrators
- **Employee Management**: Add, edit, view, and deactivate employee accounts
- **Leave Management**: Approve or reject leave requests with notes
- **Payslip Generation**: Create and manage employee payslips
- **Announcements**: Post company announcements with expiration dates
- **Reports**: Generate employee and payroll reports
- **Department Management**: Organize employees by departments

### For Employees
- **Profile Management**: View and edit personal information
- **Leave Requests**: Submit leave requests with pay type selection
- **Payslip Viewing**: View and download payslips (PDF)
- **Announcements**: Stay updated with company news
- **Dashboard**: View leave balance, recent payslips, and announcements

## Technology Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Router DOM for navigation
- Axios for API calls
- Heroicons for icons
- PDF generation

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- bcrypt for password hashing
- PDFKit for PDF generation
- Multer for file uploads
- XLSX for Excel processing

## Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/employee-portal.git
   cd employee-portal