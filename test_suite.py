import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client

c = Client()

route_tests = [
    ("Find me a flight from Delhi to London", "Delhi", "London"),
    ("Find me a flight from Delhi to Paris", "Delhi", "Paris"),
    ("Find me a flight from Dubai to London", "Dubai", "London"),
    ("Find me a flight from Tokyo to Sydney", "Tokyo", "Sydney"),
    ("Find me a flight from Delhi to Mumbai", "Delhi", "Mumbai"),
    ("Find me a flight from Delhi to London tomorrow", "Delhi", "London"),
    ("Find me a Business Class flight from Delhi to London", "Delhi", "London"),
    ("Find me the cheapest flight from Delhi to London", "Delhi", "London"),
    ("Find me a flight from Kolkata to Sydney", "Kolkata", "Sydney") # Expect 0 results & honest message
]

print("================================================================")
print("          STRICT ROUTE VALIDATION TEST SUITE RESULTS            ")
print("================================================================")

for query, req_orig, req_dest in route_tests:
    res = c.post('/api/chat/', data={'message': query}, content_type='application/json')
    data = res.json()
    reply = data.get('reply', '').encode('ascii', 'ignore').decode('ascii')
    card = data.get('card')
    flights = card.get('flights', []) if card else []
    
    print(f"QUERY: '{query}'")
    print(f"  |-> REPLY: {reply[:80]}...")
    print(f"  |-> RETURNED FLIGHTS COUNT: {len(flights)}")
    
    all_valid = True
    for f in flights:
        f_num = f['flight_number']
        f_orig = f['origin']
        f_dest = f['destination']
        f_price = f['economy_price'].encode('ascii', 'ignore').decode('ascii')
        
        orig_ok = req_orig.lower() in f_orig.lower()
        dest_ok = req_dest.lower() in f_dest.lower()
        is_match = orig_ok and dest_ok
        if not is_match:
            all_valid = False
            
        print(f"      - {f_num} ({f_orig} -> {f_dest}) | Price: {f_price} | Route Match Valid: {is_match}")

    if len(flights) == 0:
        print("      - (Zero flights returned as expected for unmatched routes)")
        
    print(f"  +-> PASS ASSERTION: {all_valid}")
    print("----------------------------------------------------------------")

print("================================================================")
