from flask_wtf import FlaskForm
from wtforms import StringField, DecimalField, TextAreaField, SelectField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Length, NumberRange

class ListingForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(max=100)])
    location = StringField('Location', validators=[DataRequired(), Length(max=100)])
    price = DecimalField('Price', validators=[DataRequired(), NumberRange(min=0)], places=2)
    description = TextAreaField('Description', validators=[DataRequired(), Length(max=500)])
    property_type = SelectField('Property Type', choices=[
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('commercial', 'Commercial')
    ], validators=[DataRequired()])
    contact = StringField('Contact Information', validators=[DataRequired(), Length(max=100)])
    is_premium = BooleanField('Premium Listing')
    submit = SubmitField('Submit')