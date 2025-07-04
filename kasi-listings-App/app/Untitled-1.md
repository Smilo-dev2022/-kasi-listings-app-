{% extends "base.html" %}

{% block content %}
<div class="hero-section bg-light p-5 rounded text-center mb-4">
    <h1>Find Back Rooms & Flats in Your Kasi</h1>
    <p class="lead">Affordable rentals for locals</p>
    <div class="mt-4">
        <a href="{{ url_for('add_listing') }}" class="btn btn-primary btn-lg">Post Your Listing</a>
    </div>
</div>

{% if premium_listings %}
<h2 class="mt-5 border-bottom pb-2">Premium Listings</h2>
<div class="row mt-3">
    {% for listing in premium_listings %}
    <div class="col-md-4 mb-4">
        <div class="card h-100 border-warning">
            <div class="card-body">
                <span class="badge bg-warning float-end">Premium</span>
                <h5 class="card-title">{{ listing.title }}</h5>
                <h6 class="card-subtitle mb-2 text-muted">{{ listing.location }}</h6>
                <p class="card-text">{{ listing.description[:100] }}...</p>
                <p class="fw-bold">R{{ listing.price }}/month</p>
                <p class="text-muted">Contact: {{ listing.contact }}</p>
            </div>
        </div>
    </div>
    {% endfor %}
</div>
{% endif %}

<h2 class="mt-5 border-bottom pb-2">All Listings</h2>
<div class="row mt-3">
    {% for listing in regular_listings %}
    <div class="col-md-4 mb-4">
        <div class="card h-100">
            <div class="card-body">
                <h5 class="card-title">{{ listing.title }}</h5>
                <h6 class="card-subtitle mb-2 text-muted">{{ listing.location }}</h6>
                <p class="card-text">{{ listing.description[:100] }}...</p>
                <p class="fw-bold">R{{ listing.price }}/month</p>
                <p class="text-muted">Contact: {{ listing.contact }}</p>
            </div>
        </div>
    </div>
    {% else %}
    <div class="col-12">
        <div class="alert alert-info">No listings yet. Be the first to post!</div>
    </div>
    {% endfor %}
</div>
{% endblock %}

