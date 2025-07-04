# kasi-listings-App

## Overview
Kasi Listings App is a rental application built with Flask that allows users to browse, create, and manage property listings. The application provides a user-friendly interface for both property owners and potential renters.

## Features
- User authentication and authorization
- Create, read, update, and delete property listings
- Premium listing options
- Responsive design with CSS styling

## Project Structure
```
kasi-listings-App
├── app
│   ├── __init__.py
│   ├── routes.py
│   ├── models.py
│   ├── forms.py
│   ├── static
│   │   └── style.css
│   └── templates
│       ├── base.html
│       ├── index.html
│       ├── listing_detail.html
│       └── create_listing.html
├── config.py
├── requirements.txt
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/kasi-listings-App.git
   ```
2. Navigate to the project directory:
   ```
   cd kasi-listings-App
   ```
3. Create a virtual environment:
   ```
   python -m venv venv
   ```
4. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```
5. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Configuration
Update the `config.py` file with your database URI and secret key.

## Running the Application
To run the application, use the following command:
```
flask run
```
The application will be accessible at `http://127.0.0.1:5000`.

## Usage
- Visit the home page to view available listings.
- Use the "Add Listing" button to create a new property listing.
- Click on a listing to view its details and premium options.

## License
This project is licensed under the MIT License.