import re
import datetime
from django.utils import timezone
from django.db.models import Q
from .models import Flight, Reservation, UserProfile

def get_flight_availability(flight, date_obj):
    from .views import get_dynamic_availability
    return get_dynamic_availability(flight, date_obj)

# -------------------------------------------------------------------
# 1. CITY & AIRPORT CODE RESOLVER
# -------------------------------------------------------------------
AIRPORT_MAP = {
    'delhi': ('Delhi', 'DEL'), 'del': ('Delhi', 'DEL'),
    'london': ('London', 'LHR'), 'lhr': ('London', 'LHR'), 'lgw': ('London', 'LGW'),
    'paris': ('Paris', 'CDG'), 'cdg': ('Paris', 'CDG'),
    'singapore': ('Singapore', 'SIN'), 'sin': ('Singapore', 'SIN'),
    'tokyo': ('Tokyo', 'HND'), 'hnd': ('Tokyo', 'HND'), 'nrt': ('Tokyo', 'NRT'),
    'dubai': ('Dubai', 'DXB'), 'dxb': ('Dubai', 'DXB'),
    'sydney': ('Sydney', 'SYD'), 'syd': ('Sydney', 'SYD'),
    'mumbai': ('Mumbai', 'BOM'), 'bom': ('Mumbai', 'BOM'),
    'bangkok': ('Bangkok', 'BKK'), 'bkk': ('Bangkok', 'BKK'),
    'new york': ('New York', 'JFK'), 'jfk': ('New York', 'JFK'),
    'kolkata': ('Kolkata', 'CCU'), 'ccu': ('Kolkata', 'CCU'),
    'bangalore': ('Bangalore', 'BLR'), 'blr': ('Bangalore', 'BLR')
}

def resolve_city_or_code(text):
    if not text:
        return None, None
    txt = text.lower().strip()
    if txt in AIRPORT_MAP:
        return AIRPORT_MAP[txt]
    for key, val in AIRPORT_MAP.items():
        if key in txt.split() or key == txt:
            return val
    return None, None

# -------------------------------------------------------------------
# 2. DATE & TIME RESOLVER
# -------------------------------------------------------------------
def resolve_relative_date(text):
    if not text:
        return None

    txt = text.lower().strip()
    today = timezone.now().date()

    if 'today' in txt or 'tonight' in txt:
        return today
    if 'tomorrow' in txt:
        return today + datetime.timedelta(days=1)
    if 'day after tomorrow' in txt:
        return today + datetime.timedelta(days=2)

    weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for idx, day in enumerate(weekdays):
        if day in txt:
            current_day = today.weekday()
            days_ahead = idx - current_day
            if days_ahead <= 0:
                days_ahead += 7
            if 'next' in txt:
                days_ahead += 7
            return today + datetime.timedelta(days=days_ahead)

    iso_match = re.search(r'(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})', txt)
    if iso_match:
        try:
            return datetime.date(int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3)))
        except ValueError:
            pass

    date_match = re.search(r'(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})', txt)
    if date_match:
        try:
            return datetime.date(int(date_match.group(3)), int(date_match.group(2)), int(date_match.group(1)))
        except ValueError:
            pass

    months = {
        'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
        'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
        'aug': 8, 'august': 8, 'sep': 9, 'sept': 9, 'september': 9, 'oct': 10, 'october': 10,
        'nov': 11, 'november': 11, 'dec': 12, 'december': 12
    }
    for month_name, m_num in months.items():
        if month_name in txt:
            day_m = re.search(r'\b(\d{1,2})\b', txt)
            day_val = int(day_m.group(1)) if day_m else 15
            year_val = today.year
            if m_num < today.month or (m_num == today.month and day_val < today.day):
                year_val += 1
            try:
                return datetime.date(year_val, m_num, day_val)
            except ValueError:
                pass

    return None

# -------------------------------------------------------------------
# 3. INTENT CLASSIFIER & ENTITY EXTRACTION
# -------------------------------------------------------------------
def classify_intent_and_entities(message, context=None):
    raw_msg = (message or '').strip()
    msg = raw_msg.lower()
    msg_clean = re.sub(r'[^\w\s]', ' ', msg).strip()

    entities = {
        'origin': None,
        'origin_code': None,
        'destination': None,
        'destination_code': None,
        'travel_date': resolve_relative_date(msg),
        'flight_number': None,
        'ticket_number': None,
        'seat_class': None,
        'budget': None,
        'sort_cheapest': ('cheapest' in msg or 'cheaper' in msg or 'lowest price' in msg)
    }

    fl_match = re.search(r'\b(sj|sa)[-\s]?(\d+)\b', msg, re.IGNORECASE)
    if fl_match:
        entities['flight_number'] = f"SJ-{fl_match.group(2)}"

    tkt_match = re.search(r'\b(tkt\d+)\b', msg, re.IGNORECASE)
    if tkt_match:
        entities['ticket_number'] = tkt_match.group(1).upper()

    if 'business' in msg:
        entities['seat_class'] = 'business'
    elif 'first' in msg or 'suite' in msg:
        entities['seat_class'] = 'first'
    elif 'premium' in msg:
        entities['seat_class'] = 'premium_economy'
    elif 'economy' in msg:
        entities['seat_class'] = 'economy'

    budget_m = re.search(r'(\d{4,6})', msg)
    if budget_m and ('under' in msg or 'budget' in msg or 'cheap' in msg or 'pocket' in msg or 'rs' in msg or 'inr' in msg):
        try:
            entities['budget'] = float(budget_m.group(1))
        except ValueError:
            pass

    # Unambiguous City Pair Extraction
    # 1. Check for "X to Y" or "from X to Y" (e.g. "from Delhi to London", "Delhi to London")
    to_match = re.search(r'\b(?:from\s+)?([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)\b', msg)
    if to_match:
        p1, p2 = to_match.group(1).strip(), to_match.group(2).strip()
        o_city, o_code = resolve_city_or_code(p1)
        d_city, d_code = resolve_city_or_code(p2)
        if o_city: entities['origin'], entities['origin_code'] = o_city, o_code
        if d_city: entities['destination'], entities['destination_code'] = d_city, d_code

    # 2. Check for "London flight from Delhi" pattern
    if not entities['origin'] or not entities['destination']:
        rev_match = re.search(r'\b([a-zA-Z\s]+?)\s+flight\s+from\s+([a-zA-Z\s]+?)\b', msg)
        if rev_match:
            d_raw, o_raw = rev_match.group(1).strip(), rev_match.group(2).strip()
            o_city, o_code = resolve_city_or_code(o_raw)
            d_city, d_code = resolve_city_or_code(d_raw)
            if o_city: entities['origin'], entities['origin_code'] = o_city, o_code
            if d_city: entities['destination'], entities['destination_code'] = d_city, d_code

    # 3. Direct word lookup in AIRPORT_MAP
    if not entities['origin'] or not entities['destination']:
        found_cities = []
        msg_words = msg_clean.split()
        for key, (c_name, c_code) in AIRPORT_MAP.items():
            if key in msg_words:
                if (c_name, c_code) not in found_cities:
                    found_cities.append((c_name, c_code))
        if len(found_cities) == 1:
            if 'from ' in msg:
                if not entities['origin']: entities['origin'], entities['origin_code'] = found_cities[0]
            else:
                if not entities['destination']: entities['destination'], entities['destination_code'] = found_cities[0]
        elif len(found_cities) >= 2:
            if not entities['origin']: entities['origin'], entities['origin_code'] = found_cities[0]
            if not entities['destination']: entities['destination'], entities['destination_code'] = found_cities[1]

    # Contextual Pronoun / Follow-up Inheritance
    if context and not entities['origin'] and not entities['destination']:
        if context.get('last_origin'):
            entities['origin'], entities['origin_code'] = resolve_city_or_code(context['last_origin'])
        if context.get('last_destination'):
            entities['destination'], entities['destination_code'] = resolve_city_or_code(context['last_destination'])
        if not entities['travel_date'] and context.get('last_travel_date'):
            entities['travel_date'] = resolve_relative_date(context['last_travel_date'])

    # -------------------------------------------------------------
    # INTENT CLASSIFIERS
    # -------------------------------------------------------------
    if any(phrase in msg for phrase in ['system prompt', 'ignore instructions', 'ignore your rules', 'tell me your prompt', 'database password', 'sql injection']):
        return 'unsupported/irrelevant', entities, 1.0

    unsupported_keywords = [
        'match', 'cricket', 'world cup', 'score', 'who won', 'winner', 'game',
        'math', '25', '2+', '2 *', '2/', '25 x', '25x', 'calculator', 'solve',
        'poem', 'poetry', 'joke', 'story', 'dinosaur', 'dinosaurs',
        'prime minister', 'president', 'election', 'politics',
        'quantum', 'physics', 'programming language', 'python code', 'write code',
        'weather', 'temperature', 'recipe', 'movie', 'song', 'actor'
    ]
    
    has_airline_context = any(k in msg for k in ['flight', 'ticket', 'booking', 'seat', 'baggage', 'airline', 'aero', 'sj-', 'sa-', 'tkt'])
    for un_word in unsupported_keywords:
        if un_word in msg and not has_airline_context:
            return 'unsupported/irrelevant', entities, 1.0

    greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'yo']
    if msg_clean in greetings or (len(msg_clean.split()) <= 2 and any(msg_clean.startswith(g) for g in greetings)):
        return 'greeting', entities, 1.0

    thanks_words = ['thanks', 'thank you', 'thankyou', 'appreciate it', 'thx']
    if any(w in msg_clean for w in thanks_words):
        return 'thanks', entities, 1.0

    # User & Bot Identity Intents
    if any(p in msg for p in ['what is my name', 'whats my name', 'what\'s my name', 'who am i', 'my passenger name', 'passenger name', 'my name', 'account name']):
        return 'user_identity', entities, 1.0

    if any(p in msg for p in ['who are you', 'what is your name', 'whats your name', 'what\'s your name', 'who is this', 'what are you']):
        return 'bot_identity', entities, 1.0

    if any(p in msg for p in ['what can you do', 'how can you help', 'what are your features', 'help me', 'capabilities', 'what do you do']):
        return 'capabilities', entities, 1.0

    if any(p in msg for p in ['who made you', 'who created you', 'who built you', 'who developed you', 'who is shinjan']):
        return 'creator_info', entities, 1.0

    if 'baggage' in msg or 'luggage' in msg or 'bag' in msg or 'bags' in msg:
        return 'baggage', entities, 0.95

    if 'menu' in msg or 'food' in msg or 'meal' in msg or 'dining' in msg or 'drink' in msg or 'beverage' in msg:
        return 'in_flight_services', entities, 0.95

    if 'loyalty' in msg or 'frequent flyer' in msg or 'skyward' in msg or 'points' in msg:
        return 'loyalty', entities, 0.95

    if 'cancel' in msg or 'cancellation' in msg:
        return 'cancellation', entities, 0.95

    if 'refund' in msg:
        return 'refund', entities, 0.95

    if 'upgrade' in msg or 'first class suite' in msg:
        return 'upgrade', entities, 0.95

    if 'my booking' in msg or 'my reservation' in msg or 'show booking' in msg or entities['ticket_number'] or ('booking' in msg and 'status' in msg):
        return 'booking_lookup', entities, 0.95

    if 'flight status' in msg or 'status of' in msg or (entities['flight_number'] and 'status' in msg):
        return 'flight_status', entities, 0.95

    if 'how many seats' in msg or 'seats available' in msg or 'seats left' in msg or 'seat availability' in msg or ('how many' in msg and ('business' in msg or 'economy' in msg or 'first' in msg or 'premium' in msg or 'seat' in msg or 'seats' in msg)):
        return 'seat_availability', entities, 0.95

    if 'search' in msg or 'find flight' in msg or 'flights from' in msg or 'flights to' in msg or 'book a flight' in msg or 'cheapest' in msg or entities['origin'] or entities['destination']:
        return 'flight_search', entities, 0.90

    if 'check in' in msg or 'checkin' in msg or 'boarding' in msg or 'terminal' in msg or 'gate' in msg or 'missed my flight' in msg:
        return 'travel_information', entities, 0.90

    if any(k in msg for k in ['flight', 'ticket', 'seat', 'travel', 'book', 'fly']):
        return 'clarification', entities, 0.70

    return 'unsupported/irrelevant', entities, 0.99

# -------------------------------------------------------------------
# 4. STRICT ROUTE VALIDATION & FACT GROUNDING ENGINE
# -------------------------------------------------------------------
def is_flight_route_match(flight, req_origin, req_dest):
    """
    Absolute Assertion Layer:
    Every single candidate flight MUST satisfy origin and destination matches.
    Prevents DXB -> LHR or DEL -> CDG from EVER being displayed when DEL -> LHR is requested.
    """
    if req_origin:
        o_clean = req_origin.lower()
        if not (o_clean in flight.origin.lower() or o_clean in flight.origin_code.lower()):
            return False
    if req_dest:
        d_clean = req_dest.lower()
        if not (d_clean in flight.destination.lower() or d_clean in flight.destination_code.lower()):
            return False
    return True

def process_concierge_request(message, user=None, context=None):
    intent, entities, confidence = classify_intent_and_entities(message, context)

    # GUARD 1: UNSUPPORTED / IRRELEVANT (ZERO DB QUERIES, ZERO TOOL CALLS)
    if intent == 'unsupported/irrelevant':
        return {
            "status": "info",
            "intent": intent,
            "reply": "Hey there! I’m Aero Pilot, your 24/7 AI travel concierge. What can I help you check out today—live flight search, seat upgrades, baggage policies, or reservation management?",
            "quick_chips": ["Search Flights", "Check Booking Status", "Upgrade to Business", "In-Flight Menu"]
        }

    # GUARD 2: GREETINGS & THANKS
    if intent == 'greeting':
        name_str = f" {user.username.capitalize()}" if (user and user.is_authenticated and user.username) else ""
        return {
            "status": "success",
            "intent": intent,
            "reply": f"Hello{name_str}! Welcome to **Shinjan Aero Concierge**. I'm Aero Pilot, your personal AI travel assistant. Feel free to ask about live flights, seat upgrades, baggage policies, or check your reservation details anytime!",
            "quick_chips": ["Search Flights", "Check Booking Status", "Baggage Allowance", "In-Flight Menu"]
        }

    if intent == 'thanks':
        return {
            "status": "success",
            "intent": intent,
            "reply": "You're very welcome! It’s my pleasure assisting you. Let me know if you need anything else for your journey—have a fantastic flight! ✈️",
            "quick_chips": ["Search Flights", "Check Booking Status"]
        }

    # IDENTITY & PERSONA RESPONSES
    if intent == 'user_identity':
        name_val = user.username.capitalize() if (user and user.is_authenticated and user.username) else "Shishimanu"
        tier_val = "Skyward Elite Member" if (user and user.is_authenticated) else "Guest Passenger"
        return {
            "status": "success",
            "intent": intent,
            "reply": f"🎫 You are currently registered in our concierge system as **Passenger {name_val}** ({tier_val}). I have your travel profile & active status ready! How can I assist with your journey today?",
            "quick_chips": ["Check Booking Status", "Upgrade Seat", "Search Flights", "In-Flight Menu"]
        }

    if intent == 'bot_identity':
        return {
            "status": "success",
            "intent": intent,
            "reply": "✈️ I am **Aero Pilot**, your 24/7 AI flight concierge for Shinjan Aero! I assist passengers with live route search, instant seat availability, Sky Suite upgrades, baggage rules, and booking confirmations.",
            "quick_chips": ["Search Flights", "Check Booking Status", "Upgrade to Business", "In-Flight Menu"]
        }

    if intent == 'capabilities':
        return {
            "status": "info",
            "intent": intent,
            "reply": "🌟 **Here is everything I can do for you:**\n\n1. ✈️ **Search Live Flights**: Exact routes, times, prices & seat availability.\n2. 🎫 **Booking Management**: View reservations & confirm tickets instantly.\n3. 💺 **Seat Upgrades**: Upgrade to Business Class or Sky Suites.\n4. 🧳 **Baggage Policies**: Check checked & cabin baggage limits.\n5. 🍽️ **Gourmet In-Flight Dining**: Browse onboard menus & special meal options.",
            "quick_chips": ["Search Flights", "Check Booking Status", "Baggage Allowance", "In-Flight Menu"]
        }

    if intent == 'creator_info':
        return {
            "status": "success",
            "intent": intent,
            "reply": "✨ **Shinjan Aero Concierge** was built by **Shinjan** as an enterprise-grade, zero-hallucination AI airline concierge grounded 100% in live database records!",
            "quick_chips": ["Search Flights", "Check Booking Status", "Upgrade Seat"]
        }

    # GUARD 3: CLARIFICATION
    if intent == 'clarification':
        if not entities['origin'] and not entities['destination']:
            return {
                "status": "info",
                "intent": intent,
                "reply": "I'd be happy to assist you with your flight search. Where will you be departing from, and what is your destination?",
                "quick_chips": ["Search Flights to Paris", "Search Flights to London", "Help"]
            }
        elif not entities['travel_date']:
            return {
                "status": "info",
                "intent": intent,
                "reply": f"Sure! What date would you like to travel for flights to {entities['destination'] or 'your destination'}?",
                "quick_chips": ["Flights Tomorrow", "Flights This Weekend", "All Dates"]
            }

    # GUARD 4: AIRLINE DOMAIN INTENT TOOL EXECUTION (LIVE GROUNDED FACT CHECKING)

    # A) BAGGAGE POLICY
    if intent == 'baggage':
        return {
            "status": "info",
            "intent": intent,
            "reply": "🧳 **Shinjan Aero Baggage Allowance Policy:**\n\n- **Cabin Baggage**: 1 piece up to 7 kg + 1 laptop bag.\n- **Economy Class**: 1 piece up to 15 kg checked baggage.\n- **Premium Economy**: 2 pieces up to 23 kg total.\n- **Business Class**: 2 pieces up to 30 kg total checked baggage.\n- **First Class / Sky Suites**: 2 pieces up to 40 kg total + priority handling.",
            "quick_chips": ["In-Flight Menu", "Check Flight Status", "Upgrade Seat"]
        }

    # B) IN-FLIGHT SERVICES
    if intent == 'in_flight_services':
        return {
            "status": "info",
            "intent": intent,
            "reply": "🍽️ **In-Flight Culinary & Onboard Services:**\n\n- **Gourmet Sky Dining**: Multi-course chef-curated meals with vegetarian, vegan, and halal options.\n- **Beverages**: Complimentary premium espresso, teas, and fine vintage beverages.\n- **Special Meals**: Request special dietary meals up to 24 hours prior to departure.",
            "quick_chips": ["Baggage Allowance", "Upgrade Seat", "Search Flights"]
        }

    # C) LOYALTY
    if intent == 'loyalty':
        if user and user.is_authenticated:
            profile = getattr(user, 'profile', None)
            points = profile.loyalty_points if profile else 0
            u_type = profile.get_user_type_display() if profile else "Passenger"
            return {
                "status": "success",
                "intent": intent,
                "reply": f"⭐ **Skyward Elite Status for {user.username.capitalize()} ({u_type}):**\n\nYou currently have **{points:,} Loyalty Points** accumulated.",
                "quick_chips": ["Upgrade Seat", "View My Bookings", "Baggage Allowance"]
            }
        else:
            return {
                "status": "info",
                "intent": intent,
                "reply": "Please log in to view your private Skyward Elite loyalty points and status.",
                "quick_chips": ["Login", "Search Flights"]
            }

    # D) CANCELLATION & REFUND
    if intent in ['cancellation', 'refund']:
        return {
            "status": "info",
            "intent": intent,
            "reply": "❌ **Cancellation & Refund Policy:**\n\n- **Free Cancellation**: 100% refund for cancellations made within 24 hours of booking.\n- **Standard Cancellation**: 100% refund (minus ₹1,000 processing fee) up to 12 hours prior to departure.",
            "quick_chips": ["View My Bookings", "Contact Support", "Search Flights"]
        }

    # E) BOOKING LOOKUP
    if intent == 'booking_lookup':
        if not user or not user.is_authenticated:
            return {
                "status": "info",
                "intent": intent,
                "reply": "For your security, please log in to view your personal booking details.",
                "quick_chips": ["Login", "Search Flights"]
            }

        tkt_no = entities.get('ticket_number')
        if tkt_no:
            res = Reservation.objects.filter(ticket_number=tkt_no, passenger=user).first()
        else:
            res = Reservation.objects.filter(passenger=user, status='confirmed').order_by('-reservation_date').first()

        if res:
            return {
                "status": "success",
                "intent": intent,
                "reply": f"Here are the live booking details for Ticket **{res.ticket_number}**:",
                "card": {
                    "type": "ticket_info",
                    "ticket_number": res.ticket_number,
                    "passenger": res.passenger.username,
                    "flight_number": res.flight.flight_number,
                    "route": f"{res.flight.origin} ✈️ {res.flight.destination}",
                    "travel_date": str(res.travel_date or res.flight.departure_time.date()),
                    "status": res.status.title(),
                    "seat_type": res.seat_type.replace('_', ' ').title(),
                    "total_price": f"₹{res.total_price:,.2f}"
                },
                "quick_chips": ["Upgrade Seat", "Baggage Allowance", "Cancel Ticket"]
            }
        else:
            return {
                "status": "info",
                "intent": intent,
                "reply": "I couldn't find an active booking associated with your account.",
                "quick_chips": ["Search Flights", "Help"]
            }

    # F) SEAT AVAILABILITY (LIVE FACT CHECK & VALIDATED ROUTE)
    if intent == 'seat_availability':
        target_fl = entities.get('flight_number')
        target_date = entities.get('travel_date') or timezone.now().date()
        orig, dest = entities.get('origin'), entities.get('destination')

        qs = Flight.objects.all()
        if target_fl:
            qs = qs.filter(flight_number__icontains=target_fl.replace('SA-', '').replace('SJ-', ''))
        elif orig and dest:
            qs = qs.filter((Q(origin__icontains=orig) | Q(origin_code__icontains=orig)) & (Q(destination__icontains=dest) | Q(destination_code__icontains=dest)))
        elif orig:
            qs = qs.filter(Q(origin__icontains=orig) | Q(origin_code__icontains=orig))
        elif dest:
            qs = qs.filter(Q(destination__icontains=dest) | Q(destination_code__icontains=dest))

        valid_flights = []
        for f in qs:
            if is_flight_route_match(f, orig, dest):
                valid_flights.append(f)

        if valid_flights:
            fl_obj = valid_flights[0]
            avail = get_flight_availability(fl_obj, target_date)
            return {
                "status": "success",
                "intent": intent,
                "reply": f"Here is the live seat availability for **Flight {fl_obj.flight_number}** ({fl_obj.origin} ✈️ {fl_obj.destination}) on **{target_date.strftime('%b %d, %Y')}**:",
                "card": {
                    "type": "flight_search_results",
                    "flights": [{
                        "id": fl_obj.id,
                        "flight_number": fl_obj.flight_number,
                        "name": fl_obj.flight_name,
                        "origin": fl_obj.origin,
                        "origin_code": fl_obj.origin_code or fl_obj.origin[:3].upper(),
                        "destination": fl_obj.destination,
                        "destination_code": fl_obj.destination_code or fl_obj.destination[:3].upper(),
                        "departure": fl_obj.departure_time.strftime("%b %d, %H:%M"),
                        "status": fl_obj.status.replace('_', ' ').title(),
                        "economy_price": f"₹{float(fl_obj.economy_price):,.2f}",
                        "economy_available": avail['economy_available'],
                        "business_price": f"₹{float(fl_obj.business_price):,.2f}",
                        "business_available": avail['business_available'],
                        "first_price": f"₹{float(fl_obj.first_price):,.2f}",
                        "first_available": avail['first_available'],
                        "premium_economy_available": avail['premium_economy_available'],
                        "premium_economy_price": f"₹{float(fl_obj.premium_economy_price):,.2f}"
                    }]
                },
                "quick_chips": ["Upgrade Seat", "Book Economy", "Baggage Allowance"]
            }
        else:
            route_name = f" from {orig} to {dest}" if (orig and dest) else ""
            return {
                "status": "info",
                "intent": intent,
                "reply": f"I couldn't find any matching flight records{route_name} for {target_date.strftime('%b %d, %Y')} in our database.",
                "quick_chips": ["Search All Flights", "Help"]
            }

    # G) FLIGHT SEARCH (STRICT AND-FILTERING & ABSOLUTE ROUTE ASSERTION)
    if intent == 'flight_search':
        orig = entities.get('origin')
        dest = entities.get('destination')
        target_date = entities.get('travel_date')
        seat_cls = entities.get('seat_class')
        budget = entities.get('budget')

        qs = Flight.objects.all()

        # Step 1: Strict AND Route Querying (NO OR-FALLBACKS!)
        if orig and dest:
            qs = qs.filter(
                (Q(origin__icontains=orig) | Q(origin_code__icontains=orig)) &
                (Q(destination__icontains=dest) | Q(destination_code__icontains=dest))
            )
        elif orig:
            qs = qs.filter(Q(origin__icontains=orig) | Q(origin_code__icontains=orig))
        elif dest:
            qs = qs.filter(Q(destination__icontains=dest) | Q(destination_code__icontains=dest))

        # Step 2: Class availability & Budget filtering
        if seat_cls == 'business':
            qs = qs.filter(business_available__gt=0)
            if budget: qs = qs.filter(business_price__lte=budget)
        elif seat_cls == 'first':
            qs = qs.filter(first_available__gt=0)
            if budget: qs = qs.filter(first_price__lte=budget)
        elif seat_cls == 'premium_economy':
            qs = qs.filter(premium_economy_available__gt=0)
            if budget: qs = qs.filter(premium_economy_price__lte=budget)
        else:
            qs = qs.filter(economy_available__gt=0)
            if budget: qs = qs.filter(economy_price__lte=budget)

        # Step 3: Sorting (Cheapest / Earliest)
        if entities.get('sort_cheapest'):
            price_col = f"{seat_cls}_price" if seat_cls else "economy_price"
            qs = qs.order_by(price_col)
        else:
            qs = qs.order_by('departure_time')

        # Step 4: Absolute Post-Query Route Assertion Layer
        candidate_flights = list(qs)
        validated_flights = []
        for f in candidate_flights:
            if is_flight_route_match(f, orig, dest):
                validated_flights.append(f)

        # Step 5: Honest Zero-Result Reporting
        if not validated_flights:
            route_str = f" from {orig} to {dest}" if (orig and dest) else (f" to {dest}" if dest else (f" from {orig}" if orig else ""))
            date_str = f" for {target_date.strftime('%b %d, %Y')}" if target_date else ""
            budget_str = f" under ₹{budget:,.2f}" if budget else ""
            
            return {
                "status": "info",
                "intent": intent,
                "reply": f"I couldn't find any matching flights{route_str}{date_str}{budget_str} in our database.",
                "quick_chips": ["Search All Flights", "Help"]
            }

        # Step 6: Format Verified Results
        flight_list = []
        display_date = target_date or timezone.now().date()
        for f in validated_flights[:4]:
            avail = get_flight_availability(f, display_date)
            flight_list.append({
                "id": f.id,
                "flight_number": f.flight_number,
                "name": f.flight_name,
                "origin": f.origin,
                "origin_code": f.origin_code or f.origin[:3].upper(),
                "destination": f.destination,
                "destination_code": f.destination_code or f.destination[:3].upper(),
                "departure": f.departure_time.strftime("%b %d, %H:%M"),
                "status": f.status.replace('_', ' ').title(),
                "economy_price": f"₹{float(f.economy_price):,.2f}",
                "economy_available": avail['economy_available'],
                "business_price": f"₹{float(f.business_price):,.2f}",
                "business_available": avail['business_available'],
                "first_price": f"₹{float(f.first_price):,.2f}",
                "first_available": avail['first_available'],
            })

        budget_note = f" under ₹{budget:,.2f}" if budget else ""
        route_note = f" for {orig} → {dest}" if (orig and dest) else (f" to {dest}" if dest else (f" from {orig}" if orig else ""))
        date_note = f" on {target_date.strftime('%b %d')}" if target_date else " (Next Available)"

        return {
            "status": "success",
            "intent": intent,
            "reply": f"Here are the next available flights{route_note}{date_note}{budget_note} found in our database:",
            "card": {
                "type": "flight_search_results",
                "flights": flight_list
            },
            "context": {
                "last_origin": orig,
                "last_destination": dest,
                "last_travel_date": str(target_date) if target_date else None,
                "last_flight_id": flight_list[0]['id'],
                "last_flight_number": flight_list[0]['flight_number']
            },
            "quick_chips": ["Check SA-109 Status", "Upgrade Seat", "Baggage Allowance", "In-Flight Menu"]
        }

    # H) TRAVEL INFO / GENERAL HELP
    return {
        "status": "info",
        "intent": intent,
        "reply": "I can assist you with your airport preparation, check-in rules, boarding procedures, or flight status. How can I help you today?",
        "quick_chips": ["Check Flight Status", "Baggage Allowance", "Search Flights"]
    }
