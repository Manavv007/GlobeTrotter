# Trip Calendar Feature

## Overview
The Trip Calendar feature provides users with a comprehensive view of all their trips (previous, ongoing, and upcoming) in both calendar and list formats. This feature allows users to easily visualize their travel schedule and manage their trips effectively.

## Features

### 1. Calendar View
- **Monthly Calendar Display**: Shows all trips on a monthly calendar grid
- **Color-coded Trip Status**: 
  - 🟢 Green: Completed trips
  - 🟠 Orange: Ongoing trips
  - 🔵 Blue: Planned trips
  - 🔴 Red: Cancelled trips
- **Interactive Date Selection**: Click on any date to view trips for that specific date
- **Today Highlighting**: Current date is highlighted with a blue ring
- **Trip Indicators**: Shows trip names directly on calendar days
- **Multiple Trip Display**: Shows up to 3 trips per day with "+X more" indicator for additional trips

### 2. List View
- **Comprehensive Trip List**: Displays all trips in a detailed list format
- **Trip Information**: Shows trip title, status, dates, destinations, travelers, and cost
- **Sorting and Filtering**: Filter by trip status and search by trip details
- **Quick Navigation**: Click on any trip to view detailed information

### 3. Navigation and Controls
- **Month Navigation**: Navigate between months using arrow buttons
- **Today Button**: Quick jump to current month and date
- **View Mode Toggle**: Switch between calendar and list views
- **Search Functionality**: Search trips by title, start place, or end place
- **Status Filtering**: Filter trips by status (All, Planned, Ongoing, Completed, Cancelled)

### 4. Trip Statistics
- **Overview Cards**: Display total trips, completed trips, ongoing trips, and planned trips
- **Real-time Updates**: Statistics update based on current filters

### 5. Trip Details Panel
- **Selected Date Information**: Shows all trips for the selected date
- **Quick Trip Access**: Click on any trip to view full details
- **Status Indicators**: Clear status badges for each trip

## Access Points

The calendar feature can be accessed from multiple locations throughout the application:

1. **Dashboard Navigation**: Calendar link in the main navigation bar
2. **Dashboard CTA**: "View Calendar" button in the main dashboard
3. **Plan Trip Page**: "View Calendar" button in the header
4. **Profile Page**: "View Calendar" button in the profile header
5. **Trip Details Page**: "Calendar" button in the trip details header

## Technical Implementation

### Frontend Components
- `TripCalendarPage.js`: Main calendar component
- `tripService.js`: Service for fetching trip data
- Route: `/calendar` (protected route)

### Backend Integration
- Uses existing `/api/profile/trips` endpoint
- Supports filtering by status and pagination
- Returns trip data with all necessary fields for calendar display

### Key Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Calendar updates when trip data changes
- **Performance Optimized**: Efficient rendering of large trip datasets
- **Accessibility**: Keyboard navigation and screen reader support

## Usage Instructions

### Viewing the Calendar
1. Navigate to the calendar page from any of the access points
2. The calendar will display the current month by default
3. Use the arrow buttons to navigate between months
4. Click the "Today" button to return to the current month

### Filtering Trips
1. Use the search bar to find specific trips by name or destination
2. Use the status filter dropdown to show only trips with specific statuses
3. Filters work in both calendar and list views

### Viewing Trip Details
1. In calendar view: Click on a trip indicator on any date
2. In list view: Click on any trip row
3. This will navigate to the detailed trip view

### Switching Views
1. Use the "Calendar" and "List" toggle buttons
2. Calendar view provides visual overview
3. List view provides detailed information

## Future Enhancements

Potential improvements for the calendar feature:

1. **Week View**: Add a weekly calendar view option
2. **Year View**: Add an annual overview
3. **Export Functionality**: Export calendar to external calendar applications
4. **Trip Creation**: Direct trip creation from calendar dates
5. **Reminders**: Trip reminder notifications
6. **Sharing**: Share calendar with other users
7. **Customization**: User-defined color schemes and preferences

## File Structure

```
frontend/src/
├── pages/
│   ├── TripCalendarPage.js          # Main calendar component
│   ├── DashboardPage.js             # Updated with calendar navigation
│   ├── PlanTripPage.js              # Updated with calendar button
│   ├── ProfilePage.js               # Updated with calendar button
│   └── TripDetailsPage.js           # Updated with calendar button
├── services/
│   └── tripService.js               # Updated with calendar methods
└── App.js                           # Updated with calendar route
```

## API Endpoints Used

- `GET /api/profile/trips` - Fetch all user trips for calendar display
- `GET /api/profile/trips/:tripId` - Fetch individual trip details
- `PUT /api/profile/trips/:tripId` - Update trip information
- `DELETE /api/profile/trips/:tripId` - Delete trip

## Dependencies

- React Router for navigation
- Lucide React for icons
- React Hot Toast for notifications
- Tailwind CSS for styling
- Axios for API calls
