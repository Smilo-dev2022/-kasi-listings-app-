from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
import uuid
import hashlib
import urllib.parse

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///listings.db'
db = SQLAlchemy(app)

# PayFast Configuration (SANDBOX)
PAYFAST_MERCHANT_ID = '10000100'  # Sandbox ID
PAYFAST_MERCHANT_KEY = '46f0cd694581a'  # Sandbox Key
PAYFAST_URL = 'https://sandbox.payfast.co.za/eng/process'
PAYFAST_PASSPHRASE = ''  # Only for secure mode

class Listing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text, nullable=False)
    property_type = db.Column(db.String(20), nullable=False)
    contact = db.Column(db.String(50), nullable=False)
    is_premium = db.Column(db.Boolean, default=False)
    payment_status = db.Column(db.String(20), default='pending')  # New field

@app.route('/')
def home():
    premium_listings = Listing.query.filter_by(is_premium=True, payment_status='complete').all()
    regular_listings = Listing.query.filter_by(is_premium=False).all()
    return render_template('index.html', 
        premium_listings=premium_listings,
        regular_listings=regular_listings)

@app.route('/add-listing', methods=['GET', 'POST'])
def add_listing():
    if request.method == 'POST':
        is_premium = 'premium' in request.form
        
        new_listing = Listing(
            title=request.form['title'],
            location=request.form['location'],
            price=request.form['price'],
            description=request.form['description'],
            property_type=request.form['type'],
            contact=request.form['contact'],
            is_premium=is_premium
        )
        
        db.session.add(new_listing)
        db.session.commit()
        
        if is_premium:
            return redirect(url_for('premium_payment', listing_id=new_listing.id))
        
        flash('Listing added successfully!', 'success')
        return redirect(url_for('home'))
    
    return render_template('add_listing.html')

@app.route('/premium-payment/<int:listing_id>')
def premium_payment(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    return render_template('premium_payment.html', listing=listing)

@app.route('/initiate-payment/<int:listing_id>', methods=['POST'])
def initiate_payment(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    
    # Generate unique payment ID
    payment_id = str(uuid.uuid4())
    
    # PayFast parameters
    data = {
        'merchant_id': PAYFAST_MERCHANT_ID,
        'merchant_key': PAYFAST_MERCHANT_KEY,
        'return_url': url_for('payment_success', listing_id=listing.id, _external=True),
        'cancel_url': url_for('payment_cancel', listing_id=listing.id, _external=True),
        'notify_url': url_for('payment_notify', _external=True),
        'name_first': 'Listing',  # Replace with actual user data
        'name_last': 'Owner',
        'email_address': 'owner@example.com',
        'm_payment_id': payment_id,
        'amount': '20.00',
        'item_name': f'Premium Listing: {listing.title}',
        'item_description': f'Premium upgrade for {listing.title} in {listing.location}',
        'custom_int1': listing.id  # Store listing ID for IPN
    }
    
    # Generate signature if using passphrase
    if PAYFAST_PASSPHRASE:
        signature = generate_payfast_signature(data)
        data['signature'] = signature
    
    return render_template('payfast_redirect.html', data=data, payfast_url=PAYFAST_URL)

def generate_payfast_signature(data):
    """Generate PayFast signature for secure mode"""
    param_string = "&".join([f"{key}={urllib.parse.quote_plus(str(value))}" 
                           for key, value in sorted(data.items())])
    if PAYFAST_PASSPHRASE:
        param_string += f"&passphrase={urllib.parse.quote_plus(PAYFAST_PASSPHRASE)}"
    return hashlib.md5(param_string.encode()).hexdigest()

@app.route('/payment/success/<int:listing_id>')
def payment_success(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    listing.payment_status = 'complete'
    db.session.commit()
    return render_template('payment_success.html', listing=listing)

@app.route('/payment/cancel/<int:listing_id>')
def payment_cancel(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    listing.is_premium = False
    db.session.commit()
    return render_template('payment_cancel.html', listing=listing)

@app.route('/payment/notify', methods=['POST'])
def payment_notify():
    """PayFast Instant Payment Notification (IPN) handler"""
    # Verify the signature
    data = request.form.to_dict()
    signature = data.pop('signature', None)
    
    if PAYFAST_PASSPHRASE:
        generated_signature = generate_payfast_signature(data)
        if generated_signature != signature:
            return 'Invalid signature', 400
    
    # Process payment status
    payment_status = data.get('payment_status', '')
    listing_id = data.get('custom_int1', '')
    
    if payment_status == 'COMPLETE' and listing_id:
        listing = Listing.query.get(listing_id)
        if listing:
            listing.payment_status = 'complete'
            db.session.commit()
    
    return 'OK', 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)