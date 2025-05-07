# DiveLogger - Scuba Diving Log Web Application

DiveLogger is a web application designed for scuba diving enthusiasts to log, track, analyze, and share their diving experiences. This project demonstrates a potential GUI design and functionality for a scuba diving log platform.

## Project Overview

This project was created to present a design concept for a Scuba Diving Logger web application, focusing on the GUI and user experience. The application is built using vanilla HTML, CSS, and JavaScript, making it easy to run and evaluate without complex setup procedures.

## Features

- **Interactive Dive Maps**: View dive sites on interactive maps and log your own dives with precise GPS coordinates
- **Comprehensive Dive Logging**: Record detailed information about each dive including:
  - Dive site, date, and location
  - Depth, duration, and temperature
  - Equipment used
  - Marine life sightings
  - Visibility conditions
  - Dive buddies
  - Private notes and public sharing
  
- **Data Analysis**: Track diving statistics and progress
- **Social Features**: Share logs with dive buddies and the diving community
- **Privacy Controls**: Choose which logs to make public and which to keep private
- **User Profiles**: Manage personal information and diving qualifications

## Pages

1. **Home Page**: Features a map of dive sites, top dive locations, recently spotted marine life, and recently posted public dive logs
2. **My Logs Page**: View your previous dives with map visualization and filtering options
3. **New Log Page**: Detailed form to add a new dive log with all scuba-related information
4. **Share Page**: Control how your dive logs are shared with others
5. **Login/Register Page**: User authentication interface

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Maps**: Leaflet.js with OpenStreetMap and OpenSeaMap tiles
- **Icons**: Unicode emoji and Font Awesome references
- **Responsive Design**: Mobile-friendly layout using CSS Grid and Flexbox

## Setup Instructions

This is a static frontend prototype that can be viewed directly in a browser:

1. Clone the repository:
   ```
   git clone [repository-url]
   ```

2. Open the `index.html` file in your web browser

Alternatively, you can use a simple web server:

1. If you have Python installed:
   ```
   # Python 3
   python -m http.server
   
   # Python 2
   python -m SimpleHTTPServer
   ```

2. Open `http://localhost:8000` in your web browser

## Project Structure

```
divelogger/
├── index.html                # Home page
├── my-logs.html              # Personal logs page
├── new-log.html              # Add new log form
├── share.html                # Sharing settings page
├── login.html                # Login/Register page
├── public/
│   ├── css/
│   │   └── style.css         # Main stylesheet
│   ├── js/
│   │   ├── main.js           # Main JavaScript file
│   │   ├── map.js            # Map functionality
│   │   ├── my-logs-map.js    # My logs map
│   │   ├── new-log.js        # New log form scripts
│   │   ├── auth.js           # Authentication scripts
│   │   └── share.js          # Share page scripts
│   └── images/               # Image files (placeholders)
└── README.md                 # This file
```

## Notes for Implementation

This project is a frontend prototype. For a production application, you would need to:

1. Implement a backend server (e.g., Node.js, Django, Ruby on Rails)
2. Set up a database for storing user data and dive logs
3. Add user authentication
4. Implement API endpoints for data operations
5. Add proper error handling and validation
6. Optimize assets for production
7. Add comprehensive testing

## Ocean Theme

The application features an ocean-themed design with:
- Blue and teal color palette representing different ocean depths
- Clean, modern interface inspired by water and waves
- Intuitive layout focusing on maps and visual data representation
- Responsive design that works on mobile devices

## Placeholder Images

Note that this prototype uses placeholder references for images. In a production environment, you would replace these with actual images related to diving and marine life.

## License

This project is intended for educational purposes only.

## Contact

For any questions about this design concept, please contact [Your Contact Information]. 