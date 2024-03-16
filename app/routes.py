import sqlite3
from flask import Blueprint, render_template, current_app, g, jsonify
from app import app

bp = Blueprint('routes', __name__)


@app.route('/')
@app.route('/index')

def index():
    return render_template('index.html')

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/locations')
def locations():
    db = get_db()
    image_results = db.execute('SELECT * FROM image_results').fetchall()
    return jsonify([
        {
            'id': result['id'],
            'filename': result['filename'],
            'datetime': result['datetime'],
            'latitude': float(result['lat'].strip('\"')),
            'longitude': float(result['long'].strip('\"')),
            'result': result['result']
        } for result in image_results
    ])
