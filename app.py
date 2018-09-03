from flask import Flask, render_template, request
import json

app = Flask(__name__)


@app.route('/')
def index():
    fo = open('list.json', 'r')
    json = fo.read()
    fo.close()
    return render_template('index.html', list_data=json)

@app.route('/save', methods=['POST'])
def save():
    json_str = json.dumps(request.get_json())
    fo = open('list.json', 'w')
    fo.write(json_str)
    fo.close()

    return ('', 204, None)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
