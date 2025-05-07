# Flask application entry file
from app import create_app, db
from app.models import User, Dive, Site, SharkWarning, Review, Share
import click

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db, 
        'User': User, 
        'Dive': Dive, 
        'Site': Site, 
        'Review': Review, 
        'Share': Share,
        'SharkWarning': SharkWarning
    }

@app.cli.command('init-db')
def init_db_command():
    """清除现有数据并创建新表。"""
    db.create_all()
    click.echo('已初始化数据库。')

@app.route('/test')
def test_route():
    return "Flask应用正在运行！"

if __name__ == '__main__':
    app.run(debug=True) 