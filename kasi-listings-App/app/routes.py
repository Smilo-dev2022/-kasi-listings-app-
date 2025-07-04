from flask import render_template, request, redirect, url_for
from . import app
from .forms import ListingForm
from .models import Listing, db

@app.route('/')
def index():
    listings = Listing.query.all()
    return render_template('index.html', listings=listings)

@app.route('/create_listing', methods=['GET', 'POST'])
def create_listing():
    form = ListingForm()
    if form.validate_on_submit():
        new_listing = Listing(
            title=form.title.data,
            location=form.location.data,
            price=form.price.data,
            description=form.description.data,
            property_type=form.property_type.data,
            contact=form.contact.data,
            is_premium=form.is_premium.data
        )
        db.session.add(new_listing)
        db.session.commit()
        return redirect(url_for('index'))
    return render_template('create_listing.html', form=form)

@app.route('/listing/<int:listing_id>')
def listing_detail(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    return render_template('listing_detail.html', listing=listing)