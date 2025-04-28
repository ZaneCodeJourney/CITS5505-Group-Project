# Flask application entry file
from app import create_app, db
from app.models import User, Dive, Site, Review, Share
import click
from flask.cli import with_appcontext

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db, 
        'User': User, 
        'Dive': Dive, 
        'Site': Site, 
        'Review': Review, 
        'Share': Share
    }

@click.command('init-db')
@with_appcontext
def init_db_command():
    """Clear the existing data and create new tables."""
    db.create_all()
    click.echo('Initialized the database.')

if __name__ == '__main__':
    app.run(debug=True) 