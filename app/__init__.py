from flask import Flask
from flask import g


app = Flask(__name__)
app.config['DATABASE'] = 'app/locations.db'

from app import routes

app.register_blueprint(routes.bp)


@app.teardown_appcontext
def close_db(error):
    if hasattr(g, 'db'):
        g.db.close()
