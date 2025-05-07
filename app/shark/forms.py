from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, TextAreaField, SelectField, DateTimeLocalField, SubmitField
from wtforms.validators import DataRequired, Length, Optional

class SharkReportForm(FlaskForm):
    site_id = SelectField('Dive Site', validators=[DataRequired()], coerce=int)
    species = StringField('Shark Species', validators=[Optional(), Length(max=100)])
    size_estimate = StringField('Size Estimate', validators=[Optional(), Length(max=50)])
    sighting_time = DateTimeLocalField('Sighting Time', validators=[DataRequired()], format='%Y-%m-%dT%H:%M')
    severity = SelectField('Severity', choices=[
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk')
    ], validators=[DataRequired()])
    description = TextAreaField('Description', validators=[DataRequired(), Length(min=20, max=1000)])
    photo = FileField('Photo', validators=[Optional(), FileAllowed(['jpg', 'jpeg', 'png'], 'Images only!')])
    submit = SubmitField('Submit Warning') 