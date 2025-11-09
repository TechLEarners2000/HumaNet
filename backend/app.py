from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# File paths for JSON data
ADMINS_FILE = '../src/lib/admins.json'
VOLUNTEERS_FILE = '../src/lib/volunteers.json'
REQUESTERS_FILE = '../src/lib/requesters.json'

def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return json.load(f)
    return []

def save_json(file_path, data):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role')
    phone = data.get('phone', '')

    # Check if user already exists
    if role == 'admin':
        users = load_json(ADMINS_FILE)
    elif role == 'volunteer':
        users = load_json(VOLUNTEERS_FILE)
    else:
        return jsonify({'error': 'Invalid role'}), 400

    if any(u['email'] == email for u in users):
        return jsonify({'error': 'Email already exists'}), 400

    # Create new user
    new_user = {
        'id': f"{role}-{int(datetime.now().timestamp())}",
        'name': name,
        'email': email,
        'password': password,
        'role': role,
        'verified': role != 'volunteer',  # Volunteers need verification
        'phone': phone,
        'location': None
    }

    if role == 'volunteer':
        new_user.update({
            'rating': 0,
            'available': True
        })

    users.append(new_user)
    save_json(ADMINS_FILE if role == 'admin' else VOLUNTEERS_FILE, users)

    # Return user without password
    user_response = {k: v for k, v in new_user.items() if k != 'password'}
    return jsonify(user_response), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    location = data.get('location')  # Optional location data

    # Check all user files
    for file_path in [ADMINS_FILE, VOLUNTEERS_FILE, REQUESTERS_FILE]:
        users = load_json(file_path)
        user = next((u for u in users if u['email'] == email and u['password'] == password), None)
        if user:
            # Update location if provided
            if location:
                user['location'] = location
                save_json(file_path, users)

            # Return user without password
            user_response = {k: v for k, v in user.items() if k != 'password'}
            return jsonify(user_response), 200

    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/users/volunteers', methods=['GET'])
def get_volunteers():
    volunteers = load_json(VOLUNTEERS_FILE)
    # Return only verified volunteers
    verified_volunteers = [v for v in volunteers if v.get('verified', False)]
    return jsonify(verified_volunteers), 200

@app.route('/api/users/requesters', methods=['GET'])
def get_requesters():
    requesters = load_json(REQUESTERS_FILE)
    return jsonify(requesters), 200

@app.route('/api/users/admins', methods=['GET'])
def get_admins():
    admins = load_json(ADMINS_FILE)
    return jsonify(admins), 200

@app.route('/api/help-requests', methods=['POST'])
def create_help_request():
    data = request.get_json()
    requester_id = data.get('requester_id')
    location = data.get('location')

    if not requester_id or not location:
        return jsonify({'error': 'Requester ID and location required'}), 400

    # Create help request
    help_request = {
        'id': f"request-{int(datetime.now().timestamp())}",
        'requester_id': requester_id,
        'location': location,
        'status': 'pending',
        'created_at': datetime.now().isoformat(),
        'assigned_volunteer': None
    }

    # Save to a help requests file (create if doesn't exist)
    help_requests = []
    HELP_REQUESTS_FILE = '../src/lib/help_requests.json'
    if os.path.exists(HELP_REQUESTS_FILE):
        with open(HELP_REQUESTS_FILE, 'r') as f:
            help_requests = json.load(f)

    help_requests.append(help_request)
    with open(HELP_REQUESTS_FILE, 'w') as f:
        json.dump(help_requests, f, indent=2)

    return jsonify(help_request), 201

@app.route('/api/help-requests/pending', methods=['GET'])
def get_pending_requests():
    HELP_REQUESTS_FILE = '../src/lib/help_requests.json'
    if not os.path.exists(HELP_REQUESTS_FILE):
        return jsonify([]), 200

    with open(HELP_REQUESTS_FILE, 'r') as f:
        help_requests = json.load(f)

    pending = [r for r in help_requests if r['status'] == 'pending']
    return jsonify(pending), 200

@app.route('/api/help-requests/<request_id>/accept', methods=['POST'])
def accept_help_request(request_id):
    data = request.get_json()
    volunteer_id = data.get('volunteer_id')

    HELP_REQUESTS_FILE = '../src/lib/help_requests.json'
    if not os.path.exists(HELP_REQUESTS_FILE):
        return jsonify({'error': 'Request not found'}), 404

    with open(HELP_REQUESTS_FILE, 'r') as f:
        help_requests = json.load(f)

    req = next((r for r in help_requests if r['id'] == request_id), None)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    if req['status'] != 'pending':
        return jsonify({'error': 'Request already handled'}), 400

    req['status'] = 'accepted'
    req['assigned_volunteer'] = volunteer_id
    req['accepted_at'] = datetime.now().isoformat()

    with open(HELP_REQUESTS_FILE, 'w') as f:
        json.dump(help_requests, f, indent=2)

    return jsonify(req), 200

@app.route('/api/help-requests/<request_id>/decline', methods=['POST'])
def decline_help_request(request_id):
    data = request.get_json()
    volunteer_id = data.get('volunteer_id')

    HELP_REQUESTS_FILE = '../src/lib/help_requests.json'
    if not os.path.exists(HELP_REQUESTS_FILE):
        return jsonify({'error': 'Request not found'}), 404

    with open(HELP_REQUESTS_FILE, 'r') as f:
        help_requests = json.load(f)

    req = next((r for r in help_requests if r['id'] == request_id), None)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    if req['status'] != 'pending':
        return jsonify({'error': 'Request already handled'}), 400

    # Add volunteer to declined list
    if 'declined_by' not in req:
        req['declined_by'] = []
    if volunteer_id not in req['declined_by']:
        req['declined_by'].append(volunteer_id)

    # Check if all available volunteers have declined
    volunteers = load_json(VOLUNTEERS_FILE)
    available_volunteers = [v for v in volunteers if v.get('verified', False) and v.get('available', True)]
    all_declined = all(v['id'] in req['declined_by'] for v in available_volunteers)

    if all_declined:
        req['status'] = 'cancelled'
        req['cancelled_at'] = datetime.now().isoformat()
        req['cancel_reason'] = 'All volunteers declined'

    with open(HELP_REQUESTS_FILE, 'w') as f:
        json.dump(help_requests, f, indent=2)

    return jsonify(req), 200

@app.route('/api/help-requests/<request_id>/complete', methods=['POST'])
def complete_help_request(request_id):
    HELP_REQUESTS_FILE = '../src/lib/help_requests.json'
    if not os.path.exists(HELP_REQUESTS_FILE):
        return jsonify({'error': 'Request not found'}), 404

    with open(HELP_REQUESTS_FILE, 'r') as f:
        help_requests = json.load(f)

    req = next((r for r in help_requests if r['id'] == request_id), None)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    if req['status'] != 'accepted':
        return jsonify({'error': 'Request not accepted yet'}), 400

    req['status'] = 'completed'
    req['completed_at'] = datetime.now().isoformat()

    with open(HELP_REQUESTS_FILE, 'w') as f:
        json.dump(help_requests, f, indent=2)

    return jsonify(req), 200

@app.route('/api/help-requests/<request_id>/cancel', methods=['POST'])
def cancel_help_request(request_id):
    HELP_REQUESTS_FILE = '../src/lib/help_requests.json'
    if not os.path.exists(HELP_REQUESTS_FILE):
        return jsonify({'error': 'Request not found'}), 404

    with open(HELP_REQUESTS_FILE, 'r') as f:
        help_requests = json.load(f)

    req = next((r for r in help_requests if r['id'] == request_id), None)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    req['status'] = 'cancelled'
    req['cancelled_at'] = datetime.now().isoformat()

    with open(HELP_REQUESTS_FILE, 'w') as f:
        json.dump(help_requests, f, indent=2)

    return jsonify(req), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
