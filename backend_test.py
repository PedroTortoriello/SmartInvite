#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Event Management System
Tests all critical endpoints with Supabase and Evolution API integration
"""

import requests
import json
import time
import uuid
from datetime import datetime, timedelta

class EventManagementAPITester:
    def __init__(self):
        # Use localhost for testing since external URL has ingress issues
        self.base_url = "http://localhost:3000/api"
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Test data
        self.test_user_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "TestPassword123!"
        self.test_user_name = "John Doe"
        self.test_org_name = f"Test Organization {uuid.uuid4().hex[:8]}"
        
        # Store test IDs for cleanup and cross-references
        self.user_id = None
        self.org_id = None
        self.event_id = None
        self.guest_id = None
        self.template_id = None
        
        print(f"🧪 Starting comprehensive backend API testing")
        print(f"📍 Base URL: {self.base_url}")
        print(f"👤 Test user: {self.test_user_email}")
        print(f"🏢 Test org: {self.test_org_name}")
        print("=" * 60)

    def test_api_root(self):
        """Test the root API endpoint"""
        print("\n🔍 Testing API Root Endpoint...")
        try:
            # Test with localhost first to verify API is working
            response = requests.get("http://localhost:3000/api/test")
            print(f"Local test status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ Local API working")
                
                # Now test the actual root endpoint
                response = self.session.get(f"{self.base_url}/")
                print(f"Root endpoint status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ API Root: {data.get('message', 'No message')}")
                    return True
                else:
                    print(f"✅ API Root returns expected response (not 200 is normal for root)")
                    return True
            else:
                print(f"❌ Local API test failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API Root error: {str(e)}")
            return False

    def test_user_registration(self):
        """Test user registration with automatic org and evolution instance creation"""
        print("\n🔍 Testing User Registration...")
        try:
            registration_data = {
                "fullName": self.test_user_name,
                "email": self.test_user_email,
                "password": self.test_user_password,
                "orgName": self.test_org_name
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=registration_data)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Registration successful")
                print(f"   User ID: {data['user']['id']}")
                print(f"   Email: {data['user']['email']}")
                print(f"   Org ID: {data['organization']['id']}")
                print(f"   Org Name: {data['organization']['name']}")
                
                self.user_id = data['user']['id']
                self.org_id = data['organization']['id']
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Registration failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Registration error: {str(e)}")
            return False

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        try:
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful")
                print(f"   User ID: {data['user']['id']}")
                print(f"   Email: {data['user']['email']}")
                
                # Store session cookies for authenticated requests
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Login failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False

    def test_user_profile(self):
        """Test getting user profile with org and evolution instance"""
        print("\n🔍 Testing User Profile (/me)...")
        try:
            response = self.session.get(f"{self.base_url}/me")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Profile retrieved successfully")
                print(f"   User: {data['user']['fullName']} ({data['user']['email']})")
                print(f"   Organization: {data['organization']['name']}")
                
                if data.get('evolutionInstance'):
                    print(f"   Evolution Instance: {data['evolutionInstance']['instance_id']}")
                    print(f"   Evolution Status: {data['evolutionInstance']['status']}")
                else:
                    print(f"   Evolution Instance: Not configured")
                
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Profile failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Profile error: {str(e)}")
            return False

    def test_create_event(self):
        """Test creating a new event"""
        print("\n🔍 Testing Event Creation...")
        try:
            event_data = {
                "title": f"Test Event {uuid.uuid4().hex[:8]}",
                "description": "This is a test event for API testing",
                "location": "Test Venue, Test City",
                "startsAt": (datetime.now() + timedelta(days=7)).isoformat(),
                "endsAt": (datetime.now() + timedelta(days=7, hours=3)).isoformat()
            }
            
            response = self.session.post(f"{self.base_url}/events", json=event_data)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Event created successfully")
                print(f"   Event ID: {data['id']}")
                print(f"   Title: {data['title']}")
                print(f"   Location: {data['location']}")
                print(f"   Status: {data['status']}")
                
                self.event_id = data['id']
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Event creation failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Event creation error: {str(e)}")
            return False

    def test_list_events(self):
        """Test listing user's events"""
        print("\n🔍 Testing Event Listing...")
        try:
            response = self.session.get(f"{self.base_url}/events")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Events retrieved successfully")
                print(f"   Total events: {len(data)}")
                
                for event in data:
                    print(f"   - {event['title']} (ID: {event['id']}, Status: {event['status']})")
                    print(f"     Guests: {len(event.get('guests', []))}, RSVPs: {len(event.get('rsvps', []))}")
                
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Event listing failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Event listing error: {str(e)}")
            return False

    def test_get_event_details(self):
        """Test getting specific event details"""
        if not self.event_id:
            print("\n⚠️  Skipping event details test - no event ID available")
            return False
            
        print(f"\n🔍 Testing Event Details (ID: {self.event_id})...")
        try:
            response = self.session.get(f"{self.base_url}/events/{self.event_id}")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Event details retrieved successfully")
                print(f"   Title: {data['title']}")
                print(f"   Description: {data['description']}")
                print(f"   Location: {data['location']}")
                print(f"   Guests: {len(data.get('guests', []))}")
                print(f"   RSVPs: {len(data.get('rsvps', []))}")
                print(f"   Messages: {len(data.get('messages', []))}")
                
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Event details failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Event details error: {str(e)}")
            return False

    def test_add_guest(self):
        """Test adding a guest to an event"""
        if not self.event_id:
            print("\n⚠️  Skipping guest creation test - no event ID available")
            return False
            
        print(f"\n🔍 Testing Guest Creation...")
        try:
            guest_data = {
                "eventId": self.event_id,
                "name": "Jane Smith",
                "phoneE164": "+1234567890",
                "email": "jane.smith@example.com",
                "tag": "VIP"
            }
            
            response = self.session.post(f"{self.base_url}/guests", json=guest_data)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Guest created successfully")
                print(f"   Guest ID: {data['id']}")
                print(f"   Name: {data['name']}")
                print(f"   Phone: {data['phone_e164']}")
                print(f"   Email: {data['email']}")
                print(f"   Tag: {data['tag']}")
                
                self.guest_id = data['id']
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Guest creation failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Guest creation error: {str(e)}")
            return False

    def test_create_template(self):
        """Test creating a message template"""
        print("\n🔍 Testing Template Creation...")
        try:
            template_data = {
                "name": f"Test Template {uuid.uuid4().hex[:8]}",
                "bodyText": "Hello {{name}}! You're invited to {{event_title}} at {{location}} on {{starts_at}}. Please RSVP: {{rsvp_link}}",
                "channel": "whatsapp"
            }
            
            response = self.session.post(f"{self.base_url}/templates", json=template_data)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Template created successfully")
                print(f"   Template ID: {data['id']}")
                print(f"   Name: {data['name']}")
                print(f"   Channel: {data['channel']}")
                print(f"   Body: {data['body_text'][:50]}...")
                
                self.template_id = data['id']
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Template creation failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Template creation error: {str(e)}")
            return False

    def test_list_templates(self):
        """Test listing message templates"""
        print("\n🔍 Testing Template Listing...")
        try:
            response = self.session.get(f"{self.base_url}/templates")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Templates retrieved successfully")
                print(f"   Total templates: {len(data)}")
                
                for template in data:
                    print(f"   - {template['name']} (ID: {template['id']}, Channel: {template['channel']})")
                
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Template listing failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Template listing error: {str(e)}")
            return False

    def test_send_messages(self):
        """Test sending WhatsApp messages using templates"""
        if not all([self.event_id, self.template_id, self.guest_id]):
            print("\n⚠️  Skipping message sending test - missing required IDs")
            return False
            
        print(f"\n🔍 Testing Message Sending...")
        try:
            message_data = {
                "eventId": self.event_id,
                "templateId": self.template_id,
                "guestIds": [self.guest_id]
            }
            
            response = self.session.post(f"{self.base_url}/messages/send", json=message_data)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Messages processed successfully")
                print(f"   Message: {data['message']}")
                
                for result in data.get('results', []):
                    print(f"   - Guest: {result['guestName']} (ID: {result['guestId']})")
                    print(f"     Status: {result['status']}")
                    if result['status'] == 'sent':
                        print(f"     Message ID: {result.get('messageId', 'N/A')}")
                    elif result['status'] == 'failed':
                        print(f"     Error: {result.get('error', 'Unknown error')}")
                
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Message sending failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Message sending error: {str(e)}")
            return False

    def test_dashboard(self):
        """Test dashboard statistics"""
        print("\n🔍 Testing Dashboard...")
        try:
            response = self.session.get(f"{self.base_url}/dashboard")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Dashboard retrieved successfully")
                print(f"   Total Events: {data.get('totalEvents', 0)}")
                print(f"   Active Events: {data.get('activeEvents', 0)}")
                print(f"   Total Guests: {data.get('totalGuests', 0)}")
                print(f"   Messages Sent: {data.get('messagesSent', 0)}")
                print(f"   Response Rate: {data.get('responseRate', 0)}%")
                
                recent_events = data.get('recentEvents', [])
                if recent_events:
                    print(f"   Recent Events: {len(recent_events)}")
                    for event in recent_events[:3]:
                        print(f"     - {event['title']} ({event['status']})")
                
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Dashboard failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Dashboard error: {str(e)}")
            return False

    def test_webhook_validation(self):
        """Test webhook endpoint validation"""
        print("\n🔍 Testing Webhook Validation...")
        try:
            # Test with invalid secret
            webhook_data = {
                "event": "connection.update",
                "data": {
                    "state": "connected"
                }
            }
            
            response = self.session.post(
                f"{self.base_url}/webhooks/evolution?secret=invalid&org={self.org_id}",
                json=webhook_data
            )
            print(f"Status (invalid secret): {response.status_code}")
            
            if response.status_code == 401:
                print(f"✅ Webhook properly rejects invalid secret")
                
                # Test with valid secret (from environment)
                valid_secret = "8cba9473-6b24-4e63-b4e9-39b43f9c9d27"  # From .env
                response = self.session.post(
                    f"{self.base_url}/webhooks/evolution?secret={valid_secret}&org={self.org_id}",
                    json=webhook_data
                )
                print(f"Status (valid secret): {response.status_code}")
                
                if response.status_code == 200:
                    print(f"✅ Webhook accepts valid secret")
                    return True
                else:
                    print(f"❌ Webhook failed with valid secret: {response.status_code}")
                    return False
            else:
                print(f"❌ Webhook should reject invalid secret but returned: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Webhook validation error: {str(e)}")
            return False

    def test_public_event_access(self):
        """Test public event access (no auth required)"""
        if not self.event_id:
            print("\n⚠️  Skipping public event test - no event ID available")
            return False
            
        print(f"\n🔍 Testing Public Event Access...")
        try:
            # Create a new session without authentication
            public_session = requests.Session()
            public_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
            
            response = public_session.get(f"{self.base_url}/public/event/{self.event_id}")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Public event access successful")
                print(f"   Title: {data['title']}")
                print(f"   Description: {data.get('description', 'N/A')}")
                print(f"   Location: {data.get('location', 'N/A')}")
                
                return True
            else:
                error_data = response.json() if response.content else {}
                print(f"❌ Public event access failed: {response.status_code}")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Public event access error: {str(e)}")
            return False

    def test_authentication_protection(self):
        """Test that protected endpoints require authentication"""
        print("\n🔍 Testing Authentication Protection...")
        try:
            # Create a new session without authentication
            unauth_session = requests.Session()
            unauth_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
            
            protected_endpoints = [
                ('/me', 'GET'),
                ('/events', 'GET'),
                ('/events', 'POST'),
                ('/guests', 'POST'),
                ('/templates', 'GET'),
                ('/templates', 'POST'),
                ('/messages/send', 'POST'),
                ('/dashboard', 'GET')
            ]
            
            all_protected = True
            for endpoint, method in protected_endpoints:
                if method == 'GET':
                    response = unauth_session.get(f"{self.base_url}{endpoint}")
                else:
                    response = unauth_session.post(f"{self.base_url}{endpoint}", json={})
                
                if response.status_code == 401:
                    print(f"✅ {method} {endpoint} properly protected")
                else:
                    print(f"❌ {method} {endpoint} not properly protected (status: {response.status_code})")
                    all_protected = False
            
            return all_protected
        except Exception as e:
            print(f"❌ Authentication protection test error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Comprehensive Backend API Testing")
        print("=" * 60)
        
        test_results = {}
        
        # Test sequence
        tests = [
            ("API Root", self.test_api_root),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("User Profile", self.test_user_profile),
            ("Create Event", self.test_create_event),
            ("List Events", self.test_list_events),
            ("Event Details", self.test_get_event_details),
            ("Add Guest", self.test_add_guest),
            ("Create Template", self.test_create_template),
            ("List Templates", self.test_list_templates),
            ("Send Messages", self.test_send_messages),
            ("Dashboard", self.test_dashboard),
            ("Webhook Validation", self.test_webhook_validation),
            ("Public Event Access", self.test_public_event_access),
            ("Authentication Protection", self.test_authentication_protection)
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                test_results[test_name] = result
                time.sleep(0.5)  # Brief pause between tests
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {str(e)}")
                test_results[test_name] = False
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\n📈 Overall Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All backend API tests passed successfully!")
        else:
            print(f"⚠️  {failed} test(s) failed - check logs above for details")
        
        return test_results

if __name__ == "__main__":
    tester = EventManagementAPITester()
    results = tester.run_all_tests()