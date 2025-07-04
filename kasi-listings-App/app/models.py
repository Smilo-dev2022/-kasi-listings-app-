from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Listing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    property_type = db.Column(db.String(50), nullable=False)
    contact = db.Column(db.String(100), nullable=False)
    is_premium = db.Column(db.Boolean, default=False)
    payment_status = db.Column(db.String(20), default='pending')  # For payment integration

    def __repr__(self):
        return f'<Listing {self.title}>'